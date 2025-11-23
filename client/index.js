// Entry point for Mystic Survival client (Pixi.js)

import * as PIXI from 'pixi.js';
import { Enemy, spawnEnemy } from './enemies.js';

// --- CONFIGURATION ---
const FRAME_WIDTH = 64; // Width of one sprite frame
const FRAME_HEIGHT = 64; // Height of one sprite frame
const SHEET_COLS = 4; // Columns in the sheet
const SHEET_ROWS = 2; // Rows in the sheet

// Use Parcel's URL handling to get the correct path to the asset
const playerSheetUrl = new URL('../assets/player_sheet.png', import.meta.url);

const app = new PIXI.Application({
  width: 800,
  height: 600,
  backgroundColor: 0x222222,
});
document.body.appendChild(app.view);

// Ensure pixel art scales crisply
PIXI.BaseTexture.defaultOptions.scaleMode = PIXI.SCALE_MODES.NEAREST;

// Initialize WebSocket connection
const ws = new WebSocket('ws://localhost:3000');
let localPlayerId = null;

ws.onopen = () => {
  console.log('Connected to server');
};

ws.onerror = error => {
  console.error('WebSocket error:', error);
};

ws.onclose = () => {
  console.log('Disconnected from server');
};

// Local enemies array
const enemies = [];

// Spawn enemies periodically
setInterval(() => {
  enemies.push(spawnEnemy(app));
}, 2000);

// --- PLAYER SETUP ---

// We hold the textures here once loaded
const playerTextures = {};
let isAssetsLoaded = false;

// Create the player sprite (initially a placeholder until art loads)
const player = new PIXI.Sprite(PIXI.Texture.WHITE);
player.width = 40;
player.height = 40;
player.tint = 0x00ff00; // Green placeholder tint
player.anchor.set(0.5); // Center the anchor for rotation/flipping
player.x = app.screen.width / 2;
player.y = app.screen.height / 2;
app.stage.addChild(player);

// Function to load and slice the sprite sheet
async function loadAssets() {
  try {
    const sheetTexture = await PIXI.Assets.load(playerSheetUrl.href);

    // Define the grid mapping based on your image
    // Row 0: South, SouthEast, East, NorthEast
    // Row 1: South(Alt), SouthWest, West, NorthWest
    const directionMap = [
      ['south', 'southEast', 'east', 'northEast'],
      ['south_alt', 'southWest', 'west', 'northWest'],
    ];

    for (let y = 0; y < SHEET_ROWS; y++) {
      for (let x = 0; x < SHEET_COLS; x++) {
        const rect = new PIXI.Rectangle(
          x * FRAME_WIDTH,
          y * FRAME_HEIGHT,
          FRAME_WIDTH,
          FRAME_HEIGHT
        );
        const frameTex = new PIXI.Texture(sheetTexture.baseTexture, rect);
        const dirName = directionMap[y][x];
        playerTextures[dirName] = frameTex;
      }
    }

    // Apply the default texture and reset dimensions
    player.texture = playerTextures['south'];
    player.tint = 0xffffff; // Remove green tint
    player.scale.set(1); // Reset scale (adjust if sprite is too small/big)

    // Optional: Scale up if the 64x64 sprite looks too small
    // player.scale.set(1.5);

    isAssetsLoaded = true;
    console.log('Player sprites loaded!');
  } catch (error) {
    console.error('Failed to load player sheet:', error);
  }
}

// Start loading assets immediately
loadAssets();

// --- INPUT & MOVEMENT ---

// Basic keyboard movement
const keys = {};
window.addEventListener('keydown', e => {
  keys[e.code] = true;
});
window.addEventListener('keyup', e => {
  keys[e.code] = false;
});

// Player facing direction (persists after key release)
let facingDirection = { dx: 0, dy: 1 }; // Default: facing down (South)

app.ticker.add(() => {
  // Calculate movement direction
  let dx = 0,
    dy = 0;
  if (keys['ArrowUp'] || keys['KeyW']) dy -= 1;
  if (keys['ArrowDown'] || keys['KeyS']) dy += 1;
  if (keys['ArrowLeft'] || keys['KeyA']) dx -= 1;
  if (keys['ArrowRight'] || keys['KeyD']) dx += 1;

  // Update facing direction when movement keys are pressed
  if (dx !== 0 || dy !== 0) {
    // Normalize direction for 8-way movement logic
    const mag = Math.sqrt(dx * dx + dy * dy);
    facingDirection.dx = dx / mag;
    facingDirection.dy = dy / mag;

    // --- SPRITE DIRECTION UPDATE ---
    if (isAssetsLoaded) {
      updatePlayerSprite(dx, dy);
    }
  }

  // Apply movement
  const speed = 5;
  if (keys['ArrowUp'] || keys['KeyW']) player.y -= speed;
  if (keys['ArrowDown'] || keys['KeyS']) player.y += speed;
  if (keys['ArrowLeft'] || keys['KeyA']) player.x -= speed;
  if (keys['ArrowRight'] || keys['KeyD']) player.x += speed;

  // Bound player to screen
  // (Adjusted for anchor being in the center 0.5)
  player.x = Math.max(player.width / 2, Math.min(player.x, app.screen.width - player.width / 2));
  player.y = Math.max(player.height / 2, Math.min(player.y, app.screen.height - player.height / 2));
});

function updatePlayerSprite(dx, dy) {
  // Simple logic to map -1, 0, 1 directions to string keys
  // Note: Your sheet lacks a straight "North", so we use NorthEast/NorthWest or hold previous.
  // We will map based on the 8 compass points.

  let dirKey = 'south';

  if (dy > 0) {
    // Moving Down
    if (dx > 0) dirKey = 'southEast';
    else if (dx < 0) dirKey = 'southWest';
    else dirKey = 'south';
  } else if (dy < 0) {
    // Moving Up
    if (dx > 0) dirKey = 'northEast';
    else if (dx < 0) dirKey = 'northWest';
    else dirKey = 'northEast'; // Fallback for straight North (missing sprite)
  } else if (dx !== 0) {
    // Horizontal only
    if (dx > 0) dirKey = 'east';
    else if (dx < 0) dirKey = 'west';
  }

  if (playerTextures[dirKey]) {
    player.texture = playerTextures[dirKey];
  }
}

// --- SHOOTING LOGIC ---
let bullets = [];
// Weapon unlocks and upgrades
const weapons = [
  { name: 'pistol', damage: 1, fireRate: 10 },
  { name: 'shotgun', damage: 3, fireRate: 25, unlockScore: 100 },
  { name: 'smg', damage: 2, fireRate: 5, unlockScore: 250 },
  { name: 'rocket', damage: 10, fireRate: 60, unlockScore: 500 },
];
let currentWeapon = weapons[0];

function unlockWeapons() {
  for (let i = weapons.length - 1; i > 0; i--) {
    if (playerScore >= (weapons[i].unlockScore || 0)) {
      currentWeapon = weapons[i];
      break;
    }
  }
}

function shootBullet() {
  unlockWeapons();
  const bullet = PIXI.Sprite.from(PIXI.Texture.WHITE);
  bullet.width = 8;
  bullet.height = 8;
  bullet.tint = 0xffff00;

  // Start bullet at player center
  bullet.x = player.x;
  bullet.y = player.y;

  // Direction: use player's facing direction
  bullet.vx = facingDirection.dx * 10;
  bullet.vy = facingDirection.dy * 10;
  bullet.damage = currentWeapon.damage;
  app.stage.addChild(bullet);
  bullets.push(bullet);
  // Send bullet to server
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'bullet', x: bullet.x, y: bullet.y, damage: bullet.damage }));
  }
}
window.addEventListener('keydown', e => {
  if (e.code === 'Space') shootBullet();
});

app.ticker.add(() => {
  bullets.forEach((bullet, i) => {
    bullet.x += bullet.vx;
    bullet.y += bullet.vy;
    // Remove if out of bounds
    if (
      bullet.x < 0 ||
      bullet.x > app.screen.width ||
      bullet.y < 0 ||
      bullet.y > app.screen.height
    ) {
      app.stage.removeChild(bullet);
      bullets.splice(i, 1);
    }
  });
});

// Basic HUD for health and score
let playerHealth = 100;
let playerScore = 0;
const style = new PIXI.TextStyle({ fill: '#fff', fontSize: 18 });
const hud = new PIXI.Text('', style);
hud.x = 10;
hud.y = 10;
app.stage.addChild(hud);

function updateHUD() {
  hud.text = `Health: ${playerHealth}  Score: ${playerScore}  Weapon: ${currentWeapon.name}`;
}

// Update score and health on enemy kill
function checkBulletEnemyCollisions() {
  bullets.forEach((bullet, bi) => {
    enemies.forEach((enemy, ei) => {
      const dx = bullet.x - enemy.sprite.x;
      const dy = bullet.y - enemy.sprite.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 20) {
        enemy.sprite.health = (enemy.sprite.health || 3) - bullet.damage;
        if (enemy.sprite.health <= 0) {
          app.stage.removeChild(enemy.sprite);
          enemies.splice(ei, 1);
          playerScore += 10;
          updateHUD();
        }
        app.stage.removeChild(bullet);
        bullets.splice(bi, 1);
      }
    });
  });
}

app.ticker.add(() => {
  checkBulletEnemyCollisions();
  updateHUD();
  // Move enemies toward player
  enemies.forEach(enemy => enemy.moveToward(player));
});

// Enemy damages player on contact
function checkEnemyPlayerCollisions() {
  enemies.forEach((enemy, ei) => {
    const dx = player.x - enemy.sprite.x;
    const dy = player.y - enemy.sprite.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 30) {
      playerHealth -= 1;
      if (playerHealth <= 0) {
        playerHealth = 0;
        hud.text = 'Game Over!';
        app.ticker.stop();
      }
      updateHUD();
    }
  });
}

app.ticker.add(() => {
  checkEnemyPlayerCollisions();
});

// Power-ups and pickups
const pickups = [];
function spawnPickup() {
  const types = ['health', 'ammo', 'boost'];
  const type = types[Math.floor(Math.random() * types.length)];
  const pickup = PIXI.Sprite.from(PIXI.Texture.WHITE);
  pickup.width = 20;
  pickup.height = 20;
  pickup.x = Math.random() * app.screen.width;
  pickup.y = Math.random() * app.screen.height;
  pickup.tint = type === 'health' ? 0x00ffff : type === 'ammo' ? 0xff00ff : 0xffff00;
  pickup.type = type;
  app.stage.addChild(pickup);
  pickups.push(pickup);
}
setInterval(spawnPickup, 8000);

function checkPlayerPickupCollisions() {
  pickups.forEach((pickup, pi) => {
    const dx = player.x - pickup.x;
    const dy = player.y - pickup.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 30) {
      if (pickup.type === 'health') playerHealth = Math.min(playerHealth + 30, 100);
      if (pickup.type === 'ammo') playerScore += 20;
      if (pickup.type === 'boost') currentWeapon.fireRate = Math.max(currentWeapon.fireRate - 3, 2);
      app.stage.removeChild(pickup);
      pickups.splice(pi, 1);
      updateHUD();
    }
  });
}

app.ticker.add(() => {
  checkPlayerPickupCollisions();
});

// Multiplayer support: connect to server and sync player position
// Server-synced enemies
let serverEnemies = [];
function updateServerEnemies(enemies) {
  // Remove old enemy sprites
  if (window.enemySprites) {
    window.enemySprites.forEach(sprite => app.stage.removeChild(sprite));
  }
  window.enemySprites = [];
  serverEnemies = enemies;
  enemies.forEach(enemy => {
    const sprite = PIXI.Sprite.from(PIXI.Texture.WHITE);
    sprite.width = 30;
    sprite.height = 30;
    sprite.tint = 0xff0000;
    sprite.x = enemy.x;
    sprite.y = enemy.y;
    window.enemySprites.push(sprite);
    app.stage.addChild(sprite);
  });
}

// Listen for server enemy updates
ws.onmessage = event => {
  const data = JSON.parse(event.data);
  if (data.type === 'enemies') {
    updateServerEnemies(data.enemies);
  }
  if (data.type === 'welcome') {
    localPlayerId = data.id;
  }
  if (data.type === 'players') {
    updateOtherPlayers(data.players);
  }
};

// Other players
let otherPlayers = {};
function updateOtherPlayers(players) {
  Object.keys(otherPlayers).forEach(id => {
    app.stage.removeChild(otherPlayers[id]);
  });
  otherPlayers = {};
  players.forEach(p => {
    if (p.id !== localPlayerId) {
      constPk = PIXI.Sprite.from(PIXI.Texture.WHITE);
      sprite.width = 40;
      sprite.height = 40;
      sprite.tint = 0x0000ff;
      sprite.x = p.x;
      sprite.y = p.y;
      app.stage.addChild(sprite);
      otherPlayers[p.id] = sprite;
    }
  });
}

// Send local player position to server
app.ticker.add(() => {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'move', x: player.x, y: player.y }));
  }
});
