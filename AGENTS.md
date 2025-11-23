# Codebase Guide

## Commands
- **Run Dev**: `npm run dev` (starts server and client concurrently)
- **Run Server**: `npm run server`
- **Run Client**: `npm run client`
- **Test**: No test framework detected.
- **Lint**: No linter detected.

## Architecture
- **Client**: Browser-based game using `pixi.js` for rendering and `parcel` for bundling.
  - Entry: `client/index.js`
  - Logic: `client/enemies.js`
- **Server**: Node.js WebSocket server using `ws`.
  - Entry: `server/index.js`
  - Handles player connections (`players` Map), movement updates, and bullet collisions.
- **Shared**: `shared/game.js` (Game logic shared between client/server).

## Code Style
- **Formatting**: 2-space indentation, semicolons used.
- **Client**: ES Modules (`import/export`).
- **Server**: CommonJS (`require`).
- **Conventions**:
  - Use `const`/`let`, avoid `var`.
  - WebSocket messages are JSON stringified objects with a `type` field (e.g., `{ type: 'move', ... }`).
