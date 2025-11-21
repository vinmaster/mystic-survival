// Simple enemy spawning and rendering for MVP
import * as PIXI from 'pixi.js';

// Enemy logic

export class Enemy {
  constructor(x, y, app) {
    this.sprite = PIXI.Sprite.from(PIXI.Texture.WHITE);
    this.sprite.width = 30;
    this.sprite.height = 30;
    this.sprite.tint = 0xff0000;
    this.sprite.x = x;
    this.sprite.y = y;
    if (app) app.stage.addChild(this.sprite);
  }
  moveToward(player) {
    const dx = player.x - this.sprite.x;
    const dy = player.y - this.sprite.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 0) {
      this.sprite.x += (dx / dist) * 2;
      this.sprite.y += (dy / dist) * 2;
    }
  }
}

export function spawnEnemy(app) {
  // Spawn at random edge
  const edge = Math.floor(Math.random() * 4);
  let x, y;
  if (edge === 0) {
    x = 0;
    y = Math.random() * app.screen.height;
  } else if (edge === 1) {
    x = app.screen.width;
    y = Math.random() * app.screen.height;
  } else if (edge === 2) {
    x = Math.random() * app.screen.width;
    y = 0;
  } else {
    x = Math.random() * app.screen.width;
    y = app.screen.height;
  }
  return new Enemy(x, y, app);
}
