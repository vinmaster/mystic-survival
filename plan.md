# Mystic Survival Game Plan

## Overview
A multiplayer browser game inspired by "Boxhead 2Play". Players fight waves of enemies, unlock weapons, and upgrade abilities. Built with Node.js (backend/server) and Pixi.js (frontend/graphics).

## Core Features
- Multiplayer support (real-time, browser-based)
- Directional player movement (WASD or arrow keys)
- Enemies spawn from map edges and pursue players
- Weapon system: start with pistol, unlock more via kill multiplier
- Weapon upgrades and new weapons on achieving kill milestones
- Score and kill multiplier system
- Power-ups and pickups (health, ammo, temporary boosts)
- Game map with obstacles and cover
- Responsive UI and HUD (health, ammo, score, multiplier)

## Architecture
- **Frontend:** Pixi.js for rendering, input handling, UI
- **Backend:** Node.js server for multiplayer logic, enemy spawning, player state sync
- **Networking:** WebSockets for real-time communication
- **Game Loop:** Server authoritative, client prediction for smooth controls

## Game Flow
1. Player joins game lobby, selects character
2. Game starts, player spawns with pistol
3. Enemies spawn from map edges at intervals
4. Player moves, shoots, and kills enemies
5. Kill multiplier increases with consecutive kills
6. New weapons/unlocks/upgrades granted at multiplier milestones
7. Power-ups spawn randomly
8. Game ends on player death or team defeat

## Weapons & Upgrades
- Pistol (default)
- Shotgun (unlock at multiplier X)
- SMG (unlock at multiplier Y)
- Rocket Launcher (unlock at multiplier Z)
- Upgrades: fire rate, damage, reload speed, ammo capacity

## Enemy Types
- Basic zombie (slow, weak)
- Fast zombie (quick, low health)
- Tank zombie (slow, high health)
- Ranged enemy (shoots projectiles)

## Milestones
1. MVP: Single player, basic movement, shooting, enemy spawning
2. Multiplayer: Real-time sync, multiple players, scoreboards
3. Weapons: Unlocks, upgrades, switching
4. Power-ups: Health, ammo, boosts
5. Advanced enemies: Types, behaviors
6. Polish: UI, sound, effects, balancing

## Key Files/Directories
- `/client` - Pixi.js frontend
- `/server` - Node.js backend
- `/shared` - Common game logic/data
- `/assets` - Sprites, sounds
- `/README.md` - Project overview
- `/plan.md` - Game plan and milestones

## Conventions
- Use event-driven architecture for game state updates
- Keep game logic server-authoritative for fairness
- Use modular code for weapons, enemies, and player abilities

---
This plan will guide initial development and future iterations. Update as features are added or changed.