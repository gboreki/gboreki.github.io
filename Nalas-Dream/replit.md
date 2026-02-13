# Nala's Dream

## Overview
A dog-themed Space Invaders clone built with pure vanilla HTML5 Canvas and JavaScript. A chihuahua named Nala defends her turf from waves of invading dog toys by shooting bone-shaped treats.

## Project Architecture
- **index.html** - Main HTML page with canvas and overlay UI
- **style.css** - Game styling (dark theme, arcade-style UI)
- **server.py** - Simple Python HTTP server for local development (port 5000)
- **js/** - JavaScript game modules:
  - `constants.js` - Game configuration values (speeds, sizes, enemy types, pillow config)
  - `assets.js` - Image asset loader with automatic background removal
  - `audio.js` - Web Audio API sound effects
  - `player.js` - Player (chihuahua) class with movement and shooting
  - `enemies.js` - Enemy and EnemyManager classes with movement patterns
  - `pillow.js` - Pillow shield class (moves above player, absorbs 3 hits per wave)
  - `waves.js` - Wave configuration system
  - `game.js` - Main game loop, collision detection, scoring, UI management
  - `main.js` - Entry point, menu system, event handlers
- **assets/images/** - Game sprite images (PNG files):
  - `chihuahua.png` - Player character
  - `bone-treat.png` - Player projectile
  - `chew-toy.png` - Enemy type 1
  - `ball.png` - Enemy type 2
  - `stuffed-animal.png` - Enemy type 3
  - `rubber-ducky.png` - Enemy type 4
  - `sock.png` - Enemy type 5 / nemesis
  - `enemy-projectile.png` - Enemy bullet
  - `pillow.png` - Pillow shield

## Game Features
- 5 enemy types with unique movement patterns (standard, zigzag, sway, bounce, aggressive)
- All enemies can shoot projectiles; fire rate starts low and increases each wave
- Progressive wave system: waves 1-5 introduce one enemy type each, then mixed waves
- Pillow shield that moves left/right above the player, absorbs 3 hits per wave before breaking, resets each wave
- Score tracking with localStorage-based high scores (top 10)
- Lives system with invincibility frames
- Particle effects on enemy destruction
- Screen shake on player hit
- Sound effects via Web Audio API
- Automatic background removal for sprite images

## Technical Notes
- Zero server dependencies for game logic - runs entirely in the browser
- Python HTTP server is only for serving static files during development
- All assets are separate PNG files in assets/images/ for easy replacement
- Images should maintain cute cartoonish style

## Recent Changes
- Renamed game to "Nala's Dream"
- All enemies now shoot projectiles with progressive fire rate scaling per wave
- Added pillow shield that moves above the player (3 hits per wave before breaking)
- Increased sprite sizes and added transparent background processing
