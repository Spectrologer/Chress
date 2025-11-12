# Custom Zones

This directory contains custom zone files created with the zone editor tool.

## Quick Start

### 1. Create a Zone

Open `tools/zone-editor.html` in your web browser to design custom zones:

1. Select **Terrain Layer** or **Feature Layer**
2. Choose or add custom values (grass, water, wall, exit, tombstone, etc.)
3. Click cells to paint
4. Export to JSON when done
5. Save the file to this `zones/custom/` directory

### 2. Load in Game

Open the game console and use:

```javascript
loadzone("your_zone_name")
```

For example, to load the example zone:

```javascript
loadzone("example_zone")
```

### 3. Reload After Editing

If you modify a zone file, reload it with:

```javascript
reloadzone("your_zone_name")
```

## Zone File Format

Custom zones are JSON files with this structure:

```json
{
  "name": "zone_name",
  "size": [8, 8],
  "terrain": [
    "grass", "grass", "water", ...
  ],
  "features": {
    "0,0": "wall",
    "3,7": "exit",
    "5,2": "tombstone"
  },
  "metadata": {
    "description": "Optional description",
    "tags": ["tag1", "tag2"]
  }
}
```

### Terrain Array

- 64 elements (8x8 grid)
- Row-major order: `[row0col0, row0col1, ..., row7col7]`
- Values: grass, water, stone, sand, floor, etc.
- Can use any string value - unrecognized types default to floor

### Features Object

- Coordinate-based: `"x,y": "feature_name"`
- Features overlay terrain
- Values: wall, exit, shack, grate, bomb, heart, etc.
- **Special PORT format**: Use `port_stairup`, `port_stairdown`, `port_interior`, `port_grate` for transition tiles
- Can use any string value - unrecognized types are logged but ignored

## Extensibility

You can use **any terrain or feature name** in the zone editor, even if it's not implemented yet:

- `"tombstone"` - might not render yet, but the data is there
- `"puddle"` - same thing
- `"boss_spawn"` - you decide what this means later
- `"exit_up"`, `"exit_down"` - directional exits

When these features get implemented in the game, they'll automatically work with your existing zone files!

## Recognized Values

### Currently Implemented Terrain Types
- floor
- grass
- water

### Currently Implemented Features

**Structures:**
- wall, exit, house, shack, grate, table, pitfall

**Ports (Transitions):**
- port_stairup, port_stairdown, port_interior, port_grate

**Decorations:**
- shrubbery, deadtree, well, rock, sign

**Items:**
- hammer, axe, shovel, bow, bishop_spear, horse_icon, book_of_time_travel
- bomb, heart, note, food

**Characters:**
- penne, squig, nib, rune, mark, gouge, crayn, felt, forge, axelotl

**Statues:**
- lizardy_statue, lizardo_statue, lizardeaux_statue, zard_statue, lazerd_statue, lizord_statue
- bomb_statue, spear_statue, bow_statue, horse_statue, book_statue, shovel_statue

**Tip:** Check [core/constants/tiles.js](../core/constants/tiles.js) → `TILE_TYPES` for the complete list.

## Examples

See `example_zone.json` in this folder for a simple working example with:
- Grass terrain
- Central water pool
- Walls at corners
- Exit at bottom center

For **real game zones**, see the `tools/` folder which contains exported zones from actual game coordinates (0,0) at different dimensions. Use `exportzone()` command to extract your own zones!

## Tips

1. **Start simple** - Use the Fill All Terrain button to quickly set a base terrain
2. **Layer features** - Features override terrain, so you can put walls on grass
3. **Use descriptive names** - Future you will thank you
4. **Add metadata** - Descriptions and tags help organize your zones
5. **Test often** - Load zones frequently during design to see how they look
6. **Version control friendly** - JSON files work great with git

## Console Commands

```javascript
// Load a zone
loadzone("puzzle_room_1")

// Reload from disk (after editing)
reloadzone("puzzle_room_1")

// See loaded zones
loadzone() // Shows usage and loaded zones
```

## Future Features to Plan For

When designing zones, you might want to leave space for:
- Enemy spawn points
- Item spawn locations
- Trigger zones
- Puzzle elements
- Story elements
- Interactive objects

Use descriptive feature names like `"spawn_enemy_1"`, `"trigger_door"`, etc. even if they don't work yet!
