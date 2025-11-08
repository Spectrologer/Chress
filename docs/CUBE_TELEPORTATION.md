# Branch Teleportation System

## Overview

The branch teleportation system provides permanent bidirectional teleportation between two zones. When a player activates a branch, it creates a permanent link to a random destination 10 zones away (Chebyshev distance) on the surface.

## Features

- **10-Zone Teleportation**: Teleports exactly 10 zones away using Chebyshev distance (max of |dx|, |dy|)
- **Surface-Only Destinations**: Always teleports to dimension 0 (surface zones), never interiors or underground
- **Permanent Pairs**: Once activated, branches form a permanent bidirectional link that persists across game saves
- **Confirmation UI**: Click-to-confirm button prevents accidental teleportation
- **Interactive Environmental Object**: Branch is placed in the world at (5,5) in the museum (zone 0,0 interior)

## Implementation Details

### Core Components

#### GameWorld (src/core/GameWorld.ts)
- **partnerCubes**: `Map<string, PartnerCubeData>` - Stores pending partner branches to spawn in destination zones (note: variable name not changed for compatibility)
- **cubeLinkages**: `Map<string, ZoneCoordinates>` - Permanent bidirectional linkage map (persists across zone transitions and saves) (note: variable name not changed for compatibility)

#### Data Types
```typescript
interface ZoneCoordinates {
    x: number;
    y: number;
    dimension: number;
}

interface PartnerCubeData {
    x: number;
    y: number;
    dimension: number;
    originZone: ZoneCoordinates;
}
```

### Key Files

1. **src/managers/inventory/effects/SpecialEffects.ts**
   - `CubeEffect` class handles teleportation logic
   - Checks `cubeLinkages` map first for existing permanent links
   - Creates bidirectional linkages on first use
   - Zone key format: `"x,y:dimension"` for linkages

2. **src/managers/EnvironmentalInteractionManager.ts**
   - `handleCubeTap()` - Handles player clicking on cube
   - `forceInteractAt()` - Handles automatic interaction when pathfinding adjacent
   - Passes grid coordinates to CubeEffect via context

3. **src/managers/ZoneTreasureManager.ts**
   - `handlePartnerCubeSpawn()` - Spawns return cube when entering destination zone
   - Uses `partnerCubes` map with zone key format `"x,y"` (without dimension)

4. **src/ui/OverlayMessageHandler.ts**
   - `showWithButton()` - Displays confirmation overlay with clickable button

### Flow

1. **First Activation**:
   - Player taps branch in museum (0,0:1)
   - Confirmation button appears: "Activate branch and teleport 10 zones away?"
   - On confirm:
     - Random destination selected (10 zones away, surface only)
     - Creates entries in `partnerCubes` map for return branch spawning
     - Creates bidirectional entries in `cubeLinkages` map
     - Teleports player to destination

2. **Entering Destination Zone**:
   - `ZoneTreasureManager.handlePartnerCubeSpawn()` checks `partnerCubes` map
   - Spawns return branch with `originZone` data pointing to (0,0:1)
   - Removes entry from `partnerCubes` map

3. **Using Return Branch**:
   - Player taps branch at destination
   - Confirmation: "Teleport back to zone (0, 0)?"
   - Checks `cubeLinkages` map, finds link to (0,0:1)
   - Teleports back to museum

4. **Using Origin Branch Again**:
   - Player returns to museum (0,0:1)
   - Zone reloads branch tile from JSON (no `originZone` property)
   - **BUT** `cubeLinkages` map still contains permanent link
   - Finds destination in `cubeLinkages`, teleports to same location
   - Branches maintain permanent pair!

### Zone Key Formats

- **cubeLinkages**: `"x,y:dimension"` - Includes dimension for precise zone identification
- **partnerCubes**: `"x,y"` - No dimension suffix (matches ZoneManager key format)

### Save/Load

Branch linkages persist across saves via `GameWorld.getState()` and `GameWorld.setState()`:
- `partnerCubes` map serialized to `WorldState.partnerCubes` (note: variable name not changed for compatibility)
- `cubeLinkages` map serialized to `WorldState.cubeLinkages` (note: variable name not changed for compatibility)

## Configuration

### Museum Placement
- File: `static/boards/canon/museum.json`
- Position: `"5,5": "cube"` (note: tile type name not changed for compatibility)
- Dimension: 1 (interior)

### Item Registration
- File: `src/config/registrations/ItemRegistrations.ts`
- Type: `TILE_TYPES.CUBE` (110) (note: constant name not changed for compatibility)
- Not stackable, appears in radial menu
- Spawn weight: 0 (only manually placed)

### Assets
- Branch image: `static/assets/items/misc/branch.png`
- Rendering: `SimpleOverlayRenderStrategy` in `TileStrategyRegistry`

## Testing

To test:
1. Enter museum (0,0 interior)
2. Stand adjacent to branch at (5,5)
3. Tap branch → confirm
4. Verify teleport 10 zones away
5. Find spawned return branch
6. Use return branch → verify teleport back
7. Use origin branch again → verify teleports to same destination (permanent pair)

## Future Enhancements

- Multiple branch pairs throughout the world
- Named destinations
- Branch crafting/placement by player
- Visual effects for teleportation
- Sound effects
