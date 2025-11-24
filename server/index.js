// Basic Node.js server for Mystic Survival
const http = require('http');
const WebSocket = require('ws');

const server = http.createServer();
const wss = new WebSocket.Server({ server });

// Multiplayer support: track connected players and broadcast positions
const players = new Map();
let nextId = 1;

wss.on('connection', ws => {
  const id = nextId++;
  players.set(id, { id, x: 400, y: 300 });
  ws.send(JSON.stringify({ type: 'welcome', id }));

  ws.on('message', message => {
    try {
      const data = JSON.parse(message);
      if (data.type === 'move') {
        const player = players.get(id);
        if (player) {
          player.x = data.x;
          player.y = data.y;
        }
      }
      if (data.type === 'bulletHit') {
        // Client detected collision, server processes damage
        const enemyIndex = enemies.findIndex(e => e.id === data.enemyId);
        if (enemyIndex !== -1) {
          const enemy = enemies[enemyIndex];
          enemy.health -= data.damage || 1;
          if (enemy.health <= 0) {
            enemies.splice(enemyIndex, 1);
            // Notify the player who killed the enemy
            ws.send(JSON.stringify({ type: 'enemyKilled', score: 10 }));
          }
        }
      }
    } catch (e) {}
  });

  ws.on('close', () => {
    players.delete(id);
  });
});

setInterval(() => {
  const playerList = Array.from(players.values());
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: 'players', players: playerList }));
    }
  });
}, 100);

// Server-side enemy spawning and broadcast
const enemies = [];
function spawnEnemy() {
  // Spawn at random edge
  const edge = Math.floor(Math.random() * 4);
  let x, y;
  if (edge === 0) {
    x = 0;
    y = Math.random() * 600;
  } else if (edge === 1) {
    x = 800;
    y = Math.random() * 600;
  } else if (edge === 2) {
    x = Math.random() * 800;
    y = 0;
  } else {
    x = Math.random() * 800;
    y = 600;
  }
  enemies.push({ x, y, health: 3, id: Date.now() + Math.random() });
}

function anyPlayerAlive() {
  // A player is alive if they exist and are not marked as dead
  for (const player of players.values()) {
    if (!player.dead) return true;
  }
  return false;
}

setInterval(() => {
  // Only spawn enemies if there are players and any are alive
  if (players.size > 0 && anyPlayerAlive()) {
    spawnEnemy();
  }
}, 2000);

// Enemy speed constant (matches client)
// Client moves at 2 pixels/frame at ~60fps = 120 pixels/second
// Server moves every 100ms, so: 120 pixels/second * 0.1 seconds = 12 pixels per update
const ENEMY_SPEED = 2; // pixels per 100ms update (equivalent to 2 pixels/frame at 60fps)

function moveEnemies() {
  enemies.forEach(enemy => {
    // Move toward closest player
    let closest = null;
    let minDist = Infinity;
    players.forEach(p => {
      const dx = p.x - enemy.x;
      const dy = p.y - enemy.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDist) {
        minDist = dist;
        closest = p;
      }
    });
    if (closest) {
      const dx = closest.x - enemy.x;
      const dy = closest.y - enemy.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 0) {
        enemy.x += (dx / dist) * ENEMY_SPEED;
        enemy.y += (dy / dist) * ENEMY_SPEED;
      }
    }
  });
}
setInterval(moveEnemies, 100);

// Broadcast enemies to clients
setInterval(() => {
  const playerList = Array.from(players.values());
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: 'players', players: playerList }));
      client.send(JSON.stringify({ type: 'enemies', enemies }));
    }
  });
}, 100);

server.listen(3000, () => {
  console.log('Mystic Survival server running on port 3000');
});
