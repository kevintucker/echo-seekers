# echo-seekers
Quest to tame your dragon empathy AI based game
# 🎮 Echo Seekers: Twilight Restoration

A rich 3D open-world fantasy adventure game built with **Three.js** in a **buildless ESM environment**. Explore a magical twilight realm, complete quests, discover a thriving village, and restore ancient magic to the world. I used yteDance and Tripo API for the assets and AI-native interactive worlds.

![Game Banner](https://img.shields.io/badge/Three.js-0.160.0-blue) ![Status](https://img.shields.io/badge/Status-Active-success) ![License](https://img.shields.io/badge/License-MIT-green)

## ✨ Features

### 🏰 Complete Village System
- **10+ Detailed Buildings** including taverns, smithies, bakeries, chapels, libraries, and more
- **Animated Elements** - windmill sails, waving flags, flickering forge fires, bobbing boats
- **20+ Discoverable Locations** tracked with visual progress map
- **Market Economy** with 7 merchants, 50+ items, gold currency, and equipment system
- **Dynamic Day/Night Cycle** with street lamps and atmospheric lighting

### 🎯 Quest & Progression Systems
- **Visual Quest Log** with active objectives tracker
- **5 Village Exploration Quests** with proximity-based auto-discovery
- **3 Core Adventure Quests** - Echo collection, dragon observation, portal secrets
- **Real-time Notification Popups** for location discoveries and objective completion
- **Experience & Leveling System** with progress bars

### 🐉 Living World
- **4 Flying Dragons** with AI pathfinding and feeding mechanics
- **Dragon Friendship System** with level progression and riding (Level 3+)
- **20 Fireflies** with particle effects
- **50+ Animated Trees** swaying in the wind
- **NPCs** - Elves, gnomes, town crier, and quest givers
- **Wildlife** - Animated palomino horse with idle behaviors

### 🎨 Character & Customization
- **Animated Adventurer Character** with 24+ animations
- **Team System** with 6 preset color schemes
- **Character Customization Panel** with RGB color pickers
- **Emote System** (G, H, J, K keys)
- **Equipment System** with visible stat bonuses

### 🏛️ Notable Landmarks
- **Castle Dawnspire** - Majestic fortress with towers and battlements
- **The Golden Flagon Tavern** - 2-story Tudor inn with outdoor seating
- **Ironheart Smithy** - Working forge with animated bellows
- **Stonemill Windmill** - Rotating sails and grain storage
- **Sentinel Tower** - 15-unit watchtower with waving flag
- **Harbor Dock** - Pier with bobbing rowboat
- **Market Square** - 4 colorful merchant stalls with fountain
- **Meadow Cottage & Stable** - Complete with animated horse

### 🎮 Gameplay Features
- **WASD Movement** with camera-relative controls
- **Dash & Jump** mechanics (SHIFT/SPACE)
- **Third-person Camera** with mouse rotation
- **Inventory System** (50 slots, stacking, rarity tiers)
- **Merchant Trading** (buy/sell with 50% resale value)
- **Reputation System** with faction rewards
- **Dialogue Choices** affecting NPC relationships
- **Combo System** with XP multipliers

### 🌍 World Features
- **200×200 Terrain** with grass texture
- **Twilight Skybox** with atmospheric fog
- **Mystical Portals** with particle effects
- **Ancient Ruins** scattered throughout
- **Cobblestone Paths** connecting all major locations
- **Water Features** - streams, wells, docks
- **Decorations** - benches, barrels, crates, flower planters, signposts

## 🚀 Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Local web server (see below)

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/kevintucker/echo-seekers.git
cd echo-seekers
```

2. **Start a local web server:**

**Option A - Python:**
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

**Option B - Node.js:**
```bash
npx serve
```

**Option C - VS Code:**
Install the "Live Server" extension and click "Go Live"

3. **Open in browser:**
Navigate to `http://localhost:8000` (or the port your server uses)

### Why a Local Server?
This game uses ES modules which require a web server due to CORS restrictions. You cannot simply open `index.html` directly in your browser.

## 🎮 Controls

### Movement
- **WASD** - Move character
- **SHIFT** - Dash/Sprint
- **SPACE** - Jump
- **Mouse** - Rotate camera

### Interactions
- **E** - Talk to NPCs / Collect echoes
- **F** - Feed dragons
- **R** - Ride dragon (requires Level 3+ friendship)

### Emotes
- **G** - Wave emote
- **H** - Dance emote
- **J** - Cheer emote
- **K** - Bow emote

### UI Panels
- **Q** - Toggle Quest Log
- **I** - Toggle Inventory
- **M** - Open Merchant (when near shop)
- **ESC** - Close dialogs

## 📁 Project Structure

```
echo-seekers/
├── index.html              # Main HTML file with UI elements and styles
├── main.js                 # Game initialization and main loop
├── sceneSetup.js          # Three.js scene configuration
├── environment.js         # Terrain, skybox, lighting
├── player.js              # Player model loading and animations
├── rosieControls.js       # Movement and camera controls
├── questSystem.js         # Quest tracking and UI
├── npcSystem.js           # NPC dialogue and interactions
├── echoSystem.js          # Magical echo collectibles
├── dragonNPC.js           # Dragon AI and behaviors
├── dragonFeeding.js       # Dragon friendship mechanics
├── buildings.js           # Cottage, castle, stable
├── townBuildings.js       # Complete village system (1,500+ lines)
├── merchantInventory.js   # Economy and trading system
├── worldPopulation.js     # NPCs, trees, fireflies
├── inventorySystem.js     # Player inventory management
├── reputationSystem.js    # Faction reputation tracking
├── dialogueChoiceSystem.js # Branching dialogue
├── customizationSystem.js # Character appearance
├── teamSystem.js          # Multiplayer team colors
├── gameplayEnhancements.js # Score and combo systems
├── footstepSystem.js      # Audio/visual footsteps
└── README.md              # This file
```

## 🛠️ Technical Details

### Architecture
- **Buildless ESM** - No webpack, no babel, pure ES modules
- **Three.js 0.160.0, ByteDance, Tripo** - Modern 3D rendering
- **Importmaps** - CDN-based module resolution
- **Zero Dependencies** - No npm install required

### Performance
- **Shadow mapping** with PCFSoftShadowMap
- **Optimized geometry** with buffer pooling
- **LOD considerations** for distant objects
- **Efficient particle systems** for effects

### Code Quality
- Modular class-based architecture
- Clear separation of concerns
- Event-driven systems
- Extensive inline documentation

## 🎨 Asset Credits

### 3D Models
- **Adventurer Character** - Mixamo/Adobe
- **Architecture & Props** - Procedurally generated geometry

### Textures
- Skybox - Custom gradient system
- Terrain - Procedural grass pattern

All game code is original and written specifically for this project.

## 🗺️ Roadmap

### Current Features (v1.0)
- ✅ Complete village with 10+ buildings
- ✅ Quest system with 8 quests
- ✅ Merchant economy with 50+ items
- ✅ Dragon friendship and riding
- ✅ Visual quest tracking UI
- ✅ Location discovery notifications

### Planned Features
- 🔄 More quests and storylines
- 🔄 Combat system
- 🔄 Crafting mechanics
- 🔄 Additional NPCs with unique personalities
- 🔄 Weather system
- 🔄 Save/load functionality
- 🔄 Multiplayer support
- 🔄 Sound effects and music
- 🔄 Mobile touch controls
- 🔄 Additional villages and regions

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/AmazingFeature`)
3. **Commit your changes** (`git commit -m 'Add some AmazingFeature'`)
4. **Push to the branch** (`git push origin feature/AmazingFeature`)
5. **Open a Pull Request**

### Contribution Guidelines
- Follow existing code style and architecture
- Test your changes thoroughly
- Update documentation as needed
- Keep commits focused and descriptive

## 🐛 Known Issues

- Dragon pathing occasionally clips through terrain
- Market stall discovery can trigger multiple times
- Performance may vary on lower-end devices
- Some animations may not sync perfectly

## 📝 License

This project is licensed under the MIT License - see below for details:

```
MIT License

Copyright (c) 2024 [Your Name]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## 🙏 Acknowledgments

- **Three.js Team ByteDance Tripo ** - For the incredible 3D library
- **Rosebud AI** - For the development platform
- **ByteDance & Tripo  ** - For API intergrations with game assets and AI models

## 📧 Contact

- **GitHub Issues** - For bug reports and feature requests
- **Discussions** - For questions and community chat

## 🎮 Screenshots

> Add screenshots of your game here showing:
> - Village overview
> - Quest log UI
> - Dragon riding
> - Merchant interface
> - Character customization

---

**⚡ Built with passion using modern web technologies | No build step required | Pure JavaScript magic ✨**
