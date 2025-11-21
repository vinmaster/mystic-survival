// Shared game data structures for Mystic Survival

class Player {
  constructor(id, name) {
    this.id = id;
    this.name = name;
    this.x = 0;
    this.y = 0;
    this.health = 100;
    this.weapon = 'pistol';
    this.kills = 0;
    this.multiplier = 1;
  }
}

class Enemy {
  constructor(type, x, y) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.health = type === 'tank' ? 200 : type === 'fast' ? 50 : 100;
  }
}

class Weapon {
  constructor(name, damage, fireRate) {
    this.name = name;
    this.damage = damage;
    this.fireRate = fireRate;
  }
}

module.exports = { Player, Enemy, Weapon };
