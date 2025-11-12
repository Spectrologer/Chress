# Hardcoded Zone Data & Custom Board Conflict Analysis

## Quick Summary

The custom board system and hardcoded zone data are **well-designed with no critical conflicts**. Custom boards take precedence via early return pattern.

---

## 1. Hardcoded Zone Data Locations

### Zone Level Constants (src/core/constants/zones.ts)

- HOME_RADIUS: 2 (always level 1)
- WOODS_RADIUS: 8 (level 2)
- WILDS_RADIUS: 16 (level 3)
- Zone (0,0) **always has level=1**

### Home Zone (0,0) Specializations

**BaseZoneHandler.js line 24:**

```javascript
this.isHomeZone = zoneX === 0 && zoneY === 0;
```

**Used in:**

- StructureGenerator.js: Adds house, sign, Grate ONLY at (0,0)
- SurfaceHandler.js: Skips random features for home zone
- UndergroundHandler.js: Avoids stairs down at home zone
- ConnectionManager.js: Randomizes exits at (0,0)

**Structures at (0,0):**

- House: (2-5, 3-5)
- Sign: (2,5) with message
- Grate: (2, 3-4)

### NPC Hardcoding

- penne.json: zone "0,0"
- squig.json: zone "0,0"
- Mapped to "home_interior" or "home_underground" in NPCLoader.js

---

## 2. Custom Board System

### Registration (BoardRegistrations.js)

```javascript
boardLoader.registerBoard(0, 0, 0, "zero", "canon"); // Surface
boardLoader.registerBoard(0, 0, 1, "museum", "canon"); // Interior
boardLoader.registerBoard(0, 0, 2, "well", "canon"); // Underground
```

### Loading Order (ZoneGenerator.js lines 66-82)

```javascript
// BOARD CHECK FIRST - if found, return immediately
if (boardLoader.hasBoard(zoneX, zoneY, dimension)) {
  const boardData = boardLoader.getBoardSync();
  if (boardData) {
    return boardLoader.convertBoardToGrid(boardData); // EARLY RETURN
  }
}
// Only procedural generation if NO custom board
```

**Key Point:** Custom boards SHORT-CIRCUIT procedural generation.

---

## 3. Identified Conflicts

### Conflict 1: Board Overrides Procedural Generation

**Severity:** HIGH (intentional)

- If board loaded, procedural code never runs
- House/sign/Grate generation skipped for (0,0)
- **This is CORRECT** - boards meant to replace generation
- **Mitigation:** Working as designed

### Conflict 2: Hardcoded NPC Zones

**Severity:** MEDIUM

- Penne/Squig hardcoded to zone "0,0"
- NPCs spawned separately from board generation
- If custom board lacks valid spawn points, NPCs fail silently
- **Risk:** No validation that NPCs successfully place
- **Recommendation:** Add NPC spawn validation

### Conflict 3:textbox at Fixed Coordinate (2,5)

**Severity:** MEDIUM (mitigated)

- StructureGenerator.addSign() hardcodes (2,5) for (0,0)
- Code never runs if board loaded (early return)
- **Risk:** Low due to current architecture
- **Mitigation:**textbox interaction is coordinate-agnostic

### Conflict 4: Zone Level with Custom Boards

**Severity:** LOW

- Zone level always 1 for (0,0) regardless of board
- Boards are static; don't use zone-level spawning
- **Risk:** Minimal
- **Status:** No conflict

### Conflict 5:textbox Interaction Coordinates

**Severity:** NONE
-textbox handler uses tile data, not hardcoded positions

- Works with anytextbox location in board
- **Status:** No conflict

---

## 4. Execution Flow

### Dimension 0 (Surface - "zero" board)

1. registerAllContent() called
2. registerBoards() registers "zero" for (0,0,0)
3. boardLoader.preloadAllBoards() loads "zero.json"
4. ZoneGenerator.generateZone(0, 0, 0) called
5. boardLoader.hasBoard() returns true
6. Custom board returned → **EARLY RETURN**
7. Procedural generation skipped
8. Board structure rendered

### Dimension 1 & 2

- Same flow for (0,0,1) "museum" and (0,0,2) "well"
- NPCManager spawns Penne/Squig after board loads

---

## 5. Key Files Interaction

```
BoardRegistrations.js
  → registerBoards()
    → boardLoader.registerBoard(0,0,*,...)

ContentRegistrations.js
  → registerAllContent()
    → registerBoards()
    → boardLoader.preloadAllBoards()

ZoneGenerator.js
  → generateZone(zoneX, zoneY, dimension)
    → If boardLoader.hasBoard(): return convertBoardToGrid() [EARLY RETURN]
    → Else: handleSurface/Interior/Underground()
      → StructureGenerator.addHouse/addSign/addGrate()

BaseZoneHandler.js
  → isHomeZone = (zoneX === 0 && zoneY === 0)
    → Used to modify generation behavior

NPCLoader.js
  → If zone "0,0": map to "home_interior" or "home_underground"

EnvironmentalInteractionManager.js
  → handleSignTap() is coordinate-agnostic
    → Works with anytextbox location
```

---

## 6. Actual Conflict Scenarios

### Scenario 1: Board Load Failure

- If "zero" board JSON fails to load
- boardLoader.getBoardSync() returns null
- Code checks: if (boardData) → falls through
- Procedural generation provides fallback
- **Result:** SAFE
- **Status:** Mitigated by null check (line 68-69)

### Scenario 2:textbox in Custom Board

- Custom "zero" board includestextbox in JSON
- Board system placestextbox correctly
  -textbox handler works (coordinate-agnostic)
- **Result:** Works correctly
- **Status:** No conflict

### Scenario 3: NPC Spawn in Custom Interior

- Custom "museum" board has different layout
- Penne/Squig try to spawn
- If no valid spawn tiles, NPCs fail silently
- **Result:** Missing NPCs in custom layout
- **Status:** REAL RISK
- **Recommendation:** Add NPC spawn validation

### Scenario 4: Grate Expectation

- Procedural adds Grate at (2,3-4)
- Custom board might not include Grate
- No game code requires Grate
- **Result:** No conflict
- **Status:** Safe

---

## 7. Data Structure

**Custom Boards Include:**

- Complete grid and terrain
- Terrain textures by coordinate
- Overlay textures (decorations)
- Features at specific coordinates (items, ports, exits)
- Rotations for terrain pieces
- Player spawn position
- Optional items/NPCs in features

**Procedural Generation Adds:**

- Grid and terrain types
- Features (house, well, structures)
- NPCs and statues
- Items based on zone level
- Enemies based on zone level
- Exits to adjacent zones

---

## 8. Recommendations

### HIGH PRIORITY

1. **Validate Board Loading**

   - Location: src/core/ZoneGenerator.js or GameInitializer.js
   - Ensure "zero", "museum", "well" boards load successfully
   - Risk: Silent failure with fallback generation

2. **Add NPC Spawn Validation**
   - Location: src/managers/NPCManager.js
   - Validate NPCs successfully spawn in custom zones
   - Risk: Missing NPCs without warning

### MEDIUM PRIORITY

3. **Document Custom Board Specifications**

   - Create CUSTOM_BOARD_SPEC.md
   - Specify required features, NPC spawn points, coordinate system

4. **Add Board Loading Logs**
   - Location: src/core/ZoneGenerator.js
   - Log which board loaded, fallback decisions

### LOW PRIORITY

5. **Refactor Hardcoded Checks**
   - Replace `zoneX === 0 && zoneY === 0` with zone name constants
   - Improve maintainability for future changes

---

## 9. Summary Table

| Feature      | Hardcoded   | Custom Board | Conflict? | Resolution     |
| ------------ | ----------- | ------------ | --------- | -------------- |
| Zone Level   | Level 1     | Inherits     | No        | Works OK       |
| House        | (2-5,3-5)   | In JSON      | No        | Board wins     |
| textbox      | (2,5)       | In JSON      | No        | Board wins     |
| Grate        | (2,3-4)     | In JSON      | No        | Board wins     |
| NPCs         | Zone 0,0    | Separate     | MAYBE     | Add validation |
| Enemies      | Level-based | Not in board | No        | N/A            |
| Exits        | Randomized  | In JSON      | No        | Board wins     |
| Interactions | Agnostic    | Agnostic     | No        | N/A            |

---

## 10. Conclusion

**Status: No Critical Conflicts**

✓ Custom board system well-designed
✓ Early return prevents interference
✓ Fallback to procedural if board not loaded
✓ Clear separation of concerns
✓ NPC spawning works independently

⚠ Minor concerns:

- No validation that NPCs spawn in custom layouts
- No warning if canonical boards fail to load
- Limited documentation on board requirements

**Recommendation:** Keep current architecture; add validation and documentation improvements.
