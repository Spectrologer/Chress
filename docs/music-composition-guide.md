# Music Composition Guide for Chesse

This guide explains how to compose and modify the procedural music in Chesse using the Strudel library.

## Overview

Chesse uses [Strudel](https://strudel.cc/) for procedural music generation. Strudel is a live coding music library that brings TidalCycles to JavaScript/TypeScript.

**Location**: `src/core/sound/MusicPatterns.ts`

## Architecture

- **MusicPatterns.ts** - Defines Pattern objects for each zone type (exploration + combat variants)
- **MusicController.ts** - Manages playback and zone/combat transitions
- **StrudelMusicManager.ts** - Handles Strudel scheduler and audio initialization
- **SoundManager.ts** - Listens to combat events and triggers music transitions

## Pattern Structure

Each music pattern follows this structure:

```typescript
export function createPatternName(): Pattern<any> {
    return stack(
        // Layer 1
        seq("c3", "eb3", "f3").note()
            .sound("sawtooth")
            .room(0.8)
            .gain(0.3)
            .lpf(800)
            .slow(4),

        // Layer 2
        seq("c4", "d4", "e4").note()
            .sound("triangle")
            .room(0.5)
            .gain(0.2)
            .slow(2)
    ).cpm(60);
}
```

## Core Strudel Concepts

### 1. Pattern Creation Functions

Import from `@strudel/core`:

```typescript
import { stack, seq, note, type Pattern } from '@strudel/core';
```

- **`stack(...patterns)`** - Plays multiple patterns simultaneously (layering)
- **`seq(...values)`** - Creates a sequence that plays values in order
- **`.note()`** - Converts note names to playable notes

### 2. Note Notation

Use standard note notation with octave numbers:

```typescript
seq("c3", "eb3", "f3", "ab3")  // C minor arpeggio in octave 3
seq("g4", "a4", "bb4", "c5")   // Notes in octave 4-5
```

**Note names**: `c`, `d`, `e`, `f`, `g`, `a`, `b`
**Accidentals**: `b` (flat), `#` (sharp)
**Octaves**: `0-8` (middle C is `c4`)

### 3. Rhythmic Variation

#### IMPORTANT: When using `seq().note()`, you CANNOT use mini-notation inside the note strings!

**❌ WRONG - This will cause "not a note" errors:**
```typescript
seq("c4*2", "d4", "e4*2").note()  // ERROR!
```

**✅ CORRECT - Manually repeat notes:**
```typescript
seq("c4", "c4", "d4", "e4", "e4").note()  // Works!
```

#### Using `.struct()` for rhythmic patterns:

```typescript
seq("c3", "eb3", "f3", "ab3").note()
    .struct("1*<1 2 1 1>")  // Cycles through different rhythms
```

The `<>` notation cycles through values on each repetition.

### 4. Sound Parameters

#### Oscillator Types
```typescript
.sound("sawtooth")   // Rich, buzzy sound (good for bass/pads)
.sound("triangle")   // Smooth, mellow (good for melody/bells)
.sound("sine")       // Pure tone (good for sub-bass)
.sound("square")     // Hollow, video-game-like
```

#### Audio Effects

```typescript
.room(0.95)          // Reverb amount (0-1, higher = more spacious)
.gain(0.3)           // Volume (0-1, typically 0.1-0.4 for layers)
.lpf(900)            // Low-pass filter cutoff frequency (Hz)
                     // Lower = darker/muddier, higher = brighter
.delay(0.5)          // Delay time
.pan(0.5)            // Stereo position (0=left, 0.5=center, 1=right)
```

#### Timing

```typescript
.slow(4)             // Slow down pattern by 4x (one cycle = 4 beats)
.fast(2)             // Speed up pattern by 2x
.cpm(60)             // Cycles per minute (tempo) - only on stack()
```

### 5. Layering Strategy

**Typical layer structure:**

1. **Bass** - Low notes (octaves 1-2), sawtooth, high room, low lpf (200-400)
2. **Harmony/Pads** - Mid notes (octaves 2-3), sawtooth, moderate room, mid lpf (800-1200)
3. **Melody** - Higher notes (octaves 4-5), triangle, lower room, higher lpf (1200-2000)
4. **Accents** - High sparkle notes (octaves 5-6), triangle, high room, high lpf (2000-3000)

**Example:**
```typescript
return stack(
    // Bass
    seq("c1", "g1", "f1", "eb1").note()
        .sound("sawtooth")
        .room(0.85)
        .gain(0.3)
        .lpf(250)
        .slow(4),

    // Mid harmony
    seq("c3", "eb3", "f3", "ab3").note()
        .sound("sawtooth")
        .room(0.95)
        .gain(0.2)
        .lpf(900)
        .slow(4),

    // Melody
    seq("g4", "c5", "eb5", "g5", "f5", "c5").note()
        .sound("triangle")
        .room(0.9)
        .gain(0.15)
        .lpf(1200)
        .slow(3)
).cpm(58);
```

## Making Music More Lively

### 1. Increase Tempo
```typescript
.cpm(52)  // Slow/atmospheric
.cpm(60)  // Moderate
.cpm(68)  // Lively/upbeat
.cpm(80)  // Fast/energetic
```

### 2. Add More Note Sequences

**Before (static):**
```typescript
seq("c3", "eb3", "f3", "ab3").note()
```

**After (more movement):**
```typescript
seq("c3", "eb3", "f3", "ab3", "g3", "f3", "eb3", "c3").note()
```

### 3. Create Rhythmic Interest with Repetition

```typescript
// Bouncy rhythm - double some beats
seq("c4", "c4", "d4", "e4", "e4", "g4", "f4", "f4").note()

// Driving pulse - accent certain notes
seq("c2", "g1", "g1", "f2", "eb2", "eb2", "ab1").note()
```

### 4. Add More Layers

Go from 2-3 layers to 4-5 layers for fuller sound:

```typescript
stack(
    // Layer 1: Bass
    // Layer 2: Harmony
    // Layer 3: Melody
    // Layer 4: Counter-melody
    // Layer 5: High sparkle/bells
)
```

### 5. Use Rhythmic Structures

```typescript
.struct("1*<1 2 1 1>")  // Cycles: 1 note, 2 notes, 1 note, 1 note per beat
```

## Common Pitfalls

### ❌ DO NOT use mini-notation in seq() note strings

```typescript
// WRONG - causes "not a note" error
seq("c4*2", "d4*3").note()
seq("c4 d4 e4").note()
seq("[c4, e4, g4]").note()
```

### ✅ DO manually write out notes or use separate patterns

```typescript
// CORRECT
seq("c4", "c4", "d4", "d4", "d4").note()

// Or use .struct() for rhythm
seq("c4", "d4", "e4").note().struct("1*<1 2 3>")
```

### Common Errors and Solutions

**Error: "not a note: 'c4*2'"**
- **Cause**: Using mini-notation inside seq().note()
- **Solution**: Manually repeat notes: `seq("c4", "c4")`

**Error: "Invalid argument"**
- **Cause**: Trying to use advanced functions like `.off()`, `.jux()`, `.ply()` as methods
- **Solution**: These are not available as methods in this version; use manual note repetition instead

## Musical Theory Tips

### Creating Mood

**Cave/Mysterious** (Minor key, slow, deep reverb):
```typescript
seq("c3", "eb3", "f3", "ab3").note()  // C minor
    .sound("sawtooth")
    .room(0.95)
    .lpf(900)
    .slow(4)
    .cpm(52)
```

**Peaceful/Welcoming** (Major key, moderate tempo, bright):
```typescript
seq("c3", "e3", "g3", "c4").note()  // C major
    .sound("triangle")
    .room(0.7)
    .lpf(1400)
    .slow(4)
    .cpm(68)
```

**Tense/Ominous** (Minor key, dissonance, mid-tempo):
```typescript
seq("c3", "eb3", "f#3", "g3", "ab3").note()  // C minor with tension
    .sound("sawtooth")
    .room(0.85)
    .lpf(1200)
    .slow(5)
    .cpm(64)
```

### Common Chord Progressions

**C Minor**: `c`, `eb`, `f`, `g`, `ab`, `bb`
**C Major**: `c`, `d`, `e`, `f`, `g`, `a`, `b`
**Pentatonic (versatile)**: `c`, `d`, `f`, `g`, `a`

## Combat Music System

The game automatically switches between exploration and combat music based on enemy presence.

### How It Works

1. **Enemy Detection**: SoundManager listens to combat events:
   - `enemy:spawned` - Enemy appears
   - `enemy:defeated` - Enemy is killed
   - `enemy:removed` - Enemy removed from zone
   - `enemies:cleared` - All enemies cleared
   - `enemies:replaced` - Enemy list replaced

2. **Automatic Switching**: When enemies are present, combat music plays. When all enemies are defeated, music returns to exploration mode.

3. **Pattern Pairs**: Each dimension has two music patterns:
   - **Exploration** (calm, atmospheric)
   - **Combat** (intense, faster tempo)

### Creating Combat Patterns

Combat versions should:
- **Increase tempo by 15-30%** (e.g., 60 CPM → 80 CPM)
- **Reduce .slow() values** (e.g., `.slow(4)` → `.slow(2)`)
- **Add more rhythmic drive** (faster bass, pulsing patterns)
- **Decrease reverb** (`.room()` values lower for tightness)
- **Increase intensity** (more layers, higher gains)
- **Maintain the zone's musical character** (same key, similar motifs)

**Example Pattern Pair:**

```typescript
// Exploration - Calm
export function createPeacefulPattern(): Pattern<any> {
    return stack(
        seq("c3", "g3", "a3", "f3").note()
            .sound("triangle")
            .room(0.7)
            .gain(0.2)
            .slow(4)
    ).cpm(68);
}

// Combat - Alert
export function createPeacefulCombatPattern(): Pattern<any> {
    return stack(
        seq("c3", "g3", "a3", "f3").note()
            .sound("triangle")
            .room(0.5)  // Less reverb
            .gain(0.26) // Louder
            .slow(2),   // Faster
        // Add driving bass layer
        seq("c2", "g2", "c2", "g2").note()
            .sound("sawtooth")
            .room(0.3)
            .gain(0.3)
            .slow(2)
    ).cpm(84);  // Faster tempo
}
```

## Current Music Patterns

### Zone Dimensions (0, 1, 2)

#### Dimension 2: Cave/Underground

**Exploration** - `createCavePattern()` (58 CPM)
- Mysterious, cavernous atmosphere
- 3 layers: melodic line, counter-melody, deep bass
- Heavy reverb, dark tones

**Combat** - `createCaveCombatPattern()` (78 CPM)
- Intense, urgent, dangerous
- 4 layers with fast arpeggios and pulsing danger motif
- Reduced reverb, driving rhythmic bass

#### Dimension 1: Peaceful Interior

**Exploration** - `createPeacefulPattern()` (68 CPM)
- Warm, welcoming, uplifting
- 4 layers: chords, lively melody, walking bass, bells
- Major tonality with bounce

**Combat** - `createPeacefulCombatPattern()` (84 CPM)
- Alert but controlled
- 4 layers with urgent melody and active accents
- Brisk tempo, maintained warmth

#### Dimension 0: Surface/Tension

**Exploration** - `createTensionPattern()` (72 CPM)
- Adventurous with determination
- 5 layers: heroic melody, bright accents, confident bass
- Mix of minor and major for complexity

**Combat** - `createTensionCombatPattern()` (88 CPM)
- Epic battle intensity
- 5 layers: powerful chords, epic melody, pounding rhythm, heavy bass
- Fast, energetic, triumphant

### Zone Levels (2, 3, 4)

#### Level 2: Woods

**Exploration** - `createWoodsPattern()` (62 CPM)
- Natural, mysterious forest atmosphere
- 4 layers: forest breeze, rustling leaves, earthy bass, bird accents
- D minor tonality, organic feel

**Combat** - `createWoodsCombatPattern()` (80 CPM)
- Hunt begins, urgent pursuit
- 4 layers with fast rustling intensity and alert calls
- Faster tempo, tighter reverb

#### Level 3: Wilds

**Exploration** - `createWildsPattern()` (58 CPM)
- Untamed, wild frontier feeling
- 4 layers: open spaces, wind-swept melody, primal bass, distant echoes
- G minor, vast and primal

**Combat** - `createWildsCombatPattern()` (82 CPM)
- Savage encounter
- 4 layers with fierce melody and wild intensity
- Pounding primal bass, aggressive

#### Level 4: Frontier

**Exploration** - `createFrontierPattern()` (66 CPM)
- Edge of the unknown, pioneering spirit
- 4 layers: pioneering progression, hope, steady march, distant promise
- A minor, hopeful yet uncertain

**Combat** - `createFrontierCombatPattern()` (86 CPM)
- Desperate survival
- 5 layers: desperate struggle, survival instinct, relentless drive, edge of danger, heavy foundation
- Fast-paced, intense survival mode

## Testing Your Music

1. Edit `src/core/sound/MusicPatterns.ts`
2. Save the file (hot reload will restart the music)
3. Test exploration music:
   - Dimension 0 (surface) = Tension pattern
   - Dimension 1 (interior) = Peaceful pattern
   - Dimension 2 (underground) = Cave pattern
4. Test combat music:
   - Move to a zone with enemies to hear combat version
   - Defeat all enemies to hear transition back to exploration music

## Example: Creating a New Pattern

```typescript
/**
 * Victory music - Triumphant and bright
 */
export function createVictoryPattern(): Pattern<any> {
    return stack(
        // Bright major chord progression
        seq("c4", "e4", "g4", "c5", "g4", "e4").note()
            .sound("triangle")
            .room(0.6)
            .gain(0.25)
            .lpf(1800)
            .slow(2),

        // Energetic melody
        seq("e5", "g5", "c6", "e6", "d6", "c6", "b5", "c6").note()
            .sound("triangle")
            .room(0.5)
            .gain(0.2)
            .lpf(2400)
            .slow(2),

        // Strong bass
        seq("c2", "c2", "g2", "c2", "c2", "g2").note()
            .sound("sawtooth")
            .room(0.3)
            .gain(0.35)
            .lpf(300)
            .slow(4)
    ).cpm(90);  // Fast and energetic
}
```

## Resources

- [Strudel Getting Started](https://strudel.cc/workshop/getting-started/)
- [Strudel Pattern Effects](https://strudel.cc/workshop/pattern-effects/)
- [Strudel REPL (for testing)](https://strudel.cc/)

## Version Notes

**Strudel Version**: 1.2.5 (as of this documentation)

The game uses `@strudel/core`, `@strudel/webaudio`, and `superdough` packages. The API may differ from examples found in the Strudel REPL, which supports more advanced mini-notation features.
