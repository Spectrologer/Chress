# Strudel Music Integration Guide

This document explains how to create music patterns using Strudel with General MIDI soundfonts in this project.

## Overview

The project uses [Strudel](https://strudel.cc/) for procedural music generation with real General MIDI orchestral instruments loaded from the `@strudel/soundfonts` package.

## Architecture

### Key Files

- **[MusicPatterns.ts](../src/core/sound/MusicPatterns.ts)** - Contains all music pattern definitions
- **[StrudelMusicManager.ts](../src/core/sound/StrudelMusicManager.ts)** - Manages Strudel playback and initialization
- **[MusicController.ts](../src/core/sound/MusicController.ts)** - High-level music control and zone-based music selection

### Required Setup

1. **Install packages:**
   ```bash
   npm install @strudel/core @strudel/tonal @strudel/webaudio @strudel/soundfonts superdough
   ```

2. **Import and initialize in StrudelMusicManager.ts:**
   ```typescript
   import { repl, type Pattern } from '@strudel/core';
   import { getAudioContext, webaudioOutput, initAudioOnFirstClick } from '@strudel/webaudio';
   import { registerSynthSounds } from 'superdough';
   import { registerSoundfonts } from '@strudel/soundfonts';

   // During initialization:
   await initAudioOnFirstClick();
   await registerSynthSounds();
   registerSoundfonts(); // Critical: registers all GM instruments
   ```

## Strudel Pattern Syntax

### Basic Pattern Creation

```typescript
import { note, s, stack, seq, type Pattern } from '@strudel/core';

export function createMyPattern(): Pattern<any> {
    return stack(
        // Layer 1: Melody
        seq("c4", "e4", "g4", "c5").note()
            .sound("gm_piano")
            .gain(0.5)
            .room(0.6)
            .slow(4),

        // Layer 2: Bass
        seq("c2", "g2").note()
            .sound("gm_contrabass")
            .gain(0.4)
            .slow(2)
    ).cpm(120); // Cycles per minute (tempo)
}
```

### Key Concepts

#### Pattern Functions

- **`note()`** - Creates a melodic pattern from note names (e.g., "c4", "d#5", "bb3")
- **`s()`** - Creates a pattern from sound/sample names (e.g., "bd", "hh", "perc")
- **`stack()`** - Layers multiple patterns to play simultaneously
- **`seq()`** - Creates a sequence that plays notes in order

#### Pattern Methods

- **`.sound("instrument_name")`** - Sets the sound source (required for `.note()` patterns with GM instruments)
- **`.s("instrument_name")`** - Alternative shorthand for sound selection (used in Strudel REPL)
- **`.gain(0-1)`** - Sets volume (0 = silent, 1 = maximum)
- **`.room(0-1)`** - Adds reverb/space effect (0 = dry, 1 = very wet)
- **`.lpf(frequency)`** - Low-pass filter (cuts high frequencies above the value)
- **`.hpf(frequency)`** - High-pass filter (cuts low frequencies below the value)
- **`.delay(0-1)`** - Adds echo/delay effect
- **`.slow(n)`** - Makes pattern play n times slower
- **`.fast(n)`** - Makes pattern play n times faster
- **`.cpm(n)`** - Sets tempo in cycles per minute (only on root pattern)

## Mini-Notation vs API Patterns

### ⚠️ Important Syntax Differences

**Strudel REPL** (like strudel.cc) supports advanced mini-notation:
- `~` for rests
- `< >` for alternation
- `[ ]` for grouping
- Direct `.s()` method usage

**Our TypeScript API** has limitations:
- `~` rests **DO NOT WORK** with GM soundfonts in `.note()` patterns
- Mini-notation like `< >` and `[ ]` must be avoided
- Use `.sound()` instead of `.s()` for instruments
- Use `s()` function directly for percussion

### Translation Example

**Strudel REPL pattern:**
```javascript
note("<~ a4 ~ d4 ~ g4 ~ f4>")
    .s("gm_pizzicato_strings")
    .gain(0.45)
```

**Our TypeScript API equivalent:**
```typescript
// Option 1: Skip rests, let .slow() create spacing
seq("a4", "d4", "g4", "f4").note()
    .sound("gm_pizzicato_strings")
    .gain(0.45)
    .slow(8)

// Option 2: Use longer sequences without explicit rests
seq("a4", "a4", "d4", "d4", "g4", "g4", "f4", "f4").note()
    .sound("gm_pizzicato_strings")
    .gain(0.45)
    .slow(4)
```

## Available General MIDI Instruments

### Accessing GM Instruments

All GM instruments use the `gm_` prefix. Use with `.sound()`:

```typescript
seq("c4", "e4", "g4").note()
    .sound("gm_instrument_name")
```

### Complete GM Instrument List

#### Piano (0-7)
- `gm_piano` / `gm_acoustic_piano`
- `gm_bright_acoustic_piano`
- `gm_electric_grand_piano`
- `gm_honky_tonk_piano`
- `gm_epiano1` (Electric Piano 1)
- `gm_epiano2` (Electric Piano 2)
- `gm_harpsichord`
- `gm_clavinet`

#### Chromatic Percussion (8-15)
- `gm_celesta`
- `gm_glockenspiel`
- `gm_music_box`
- `gm_vibraphone`
- `gm_marimba`
- `gm_xylophone`
- `gm_tubular_bells`
- `gm_dulcimer`

#### Organ (16-23)
- `gm_drawbar_organ`
- `gm_percussive_organ`
- `gm_rock_organ`
- `gm_church_organ`
- `gm_reed_organ`
- `gm_accordion`
- `gm_harmonica`
- `gm_tango_accordion`

#### Guitar (24-31)
- `gm_acoustic_guitar_nylon`
- `gm_acoustic_guitar_steel`
- `gm_electric_guitar_jazz`
- `gm_electric_guitar_clean`
- `gm_electric_guitar_muted`
- `gm_overdriven_guitar`
- `gm_distortion_guitar`
- `gm_guitar_harmonics`

#### Bass (32-39)
- `gm_acoustic_bass`
- `gm_electric_bass_finger`
- `gm_electric_bass_pick`
- `gm_fretless_bass`
- `gm_slap_bass_1`
- `gm_slap_bass_2`
- `gm_synth_bass_1`
- `gm_synth_bass_2`

#### Strings (40-47)
- `gm_violin`
- `gm_viola`
- `gm_cello`
- `gm_contrabass`
- `gm_tremolo_strings`
- `gm_pizzicato_strings`
- `gm_orchestral_harp`
- `gm_timpani`

#### Ensemble (48-55)
- `gm_string_ensemble_1`
- `gm_string_ensemble_2`
- `gm_synth_strings_1`
- `gm_synth_strings_2`
- `gm_choir_aahs`
- `gm_voice_oohs`
- `gm_synth_voice`
- `gm_orchestra_hit`

#### Brass (56-63)
- `gm_trumpet`
- `gm_trombone`
- `gm_tuba`
- `gm_muted_trumpet`
- `gm_french_horn`
- `gm_brass_section`
- `gm_synth_brass_1`
- `gm_synth_brass_2`

#### Reed (64-71)
- `gm_soprano_sax`
- `gm_alto_sax`
- `gm_tenor_sax`
- `gm_baritone_sax`
- `gm_oboe`
- `gm_english_horn`
- `gm_bassoon`
- `gm_clarinet`

#### Pipe (72-79)
- `gm_piccolo`
- `gm_flute`
- `gm_recorder`
- `gm_pan_flute`
- `gm_blown_bottle`
- `gm_shakuhachi`
- `gm_whistle`
- `gm_ocarina`

#### Synth Lead (80-87)
- `gm_lead_1_square`
- `gm_lead_2_sawtooth`
- `gm_lead_3_calliope`
- `gm_lead_4_chiff`
- `gm_lead_5_charang`
- `gm_lead_6_voice`
- `gm_lead_7_fifths`
- `gm_lead_8_bass_lead`

#### Synth Pad (88-95)
- `gm_pad_1_new_age`
- `gm_pad_2_warm`
- `gm_pad_3_polysynth`
- `gm_pad_4_choir`
- `gm_pad_5_bowed`
- `gm_pad_6_metallic`
- `gm_pad_7_halo`
- `gm_pad_8_sweep`

#### Synth Effects (96-103)
- `gm_fx_1_rain`
- `gm_fx_2_soundtrack`
- `gm_fx_3_crystal`
- `gm_fx_4_atmosphere`
- `gm_fx_5_brightness`
- `gm_fx_6_goblins`
- `gm_fx_7_echoes`
- `gm_fx_8_sci_fi`

#### Ethnic (104-111)
- `gm_sitar`
- `gm_banjo`
- `gm_shamisen`
- `gm_koto`
- `gm_kalimba`
- `gm_bag_pipe`
- `gm_fiddle`
- `gm_shanai`

#### Percussive (112-119)
- `gm_tinkle_bell`
- `gm_agogo`
- `gm_steel_drums`
- `gm_woodblock`
- `gm_taiko_drum`
- `gm_melodic_tom`
- `gm_synth_drum`
- `gm_reverse_cymbal`

#### Sound Effects (120-127)
- `gm_guitar_fret_noise`
- `gm_breath_noise`
- `gm_seashore`
- `gm_bird_tweet`
- `gm_telephone_ring`
- `gm_helicopter`
- `gm_applause`
- `gm_gunshot`

### Percussion Samples

Use with `s()` function (not `.note()`):

- `bd` - Bass drum (kick)
- `sd` - Snare drum
- `hh` - Hi-hat (closed)
- `oh` - Open hi-hat
- `cp` - Clap
- `perc` - Percussion

Use `bd:0`, `bd:1`, `hh:3`, etc. to select variations.

## Example: Home Surface Theme

Here's the reference implementation for the home surface theme.

### Original Strudel REPL Pattern

```javascript
setcpm(58) // Gentle wandering pace

stack(
  // Warm, curious horn melody
  note(`
    <
      [d4 ~ f4 ~] [~ a4 ~ g4] [~ ~ bb4 ~] [~ a4 ~ ~]
      [f4 ~ g4 ~] [~ a4 ~ ~] [~ d5 ~ c5] [~ ~ a4 ~]
      [g4 ~ bb4 ~] [~ d5 ~ ~] [c5 ~ a4 ~] [~ g4 ~ f4]
      [d4 ~ ~ f4] [~ e4 ~ ~] [~ ~ d4 ~] [~ ~ ~ ~]
    >
  `)
    .s("gm_french_horn")
    .gain(0.3)
    .room(0.7)
    .delay(0.3)
    .slow(8),

  // Playful pizzicato accents
  note("<~ a4 ~ d4 ~ g4 ~ f4 ~ a4 ~ bb4 ~ g4 ~ f4>")
    .s("gm_pizzicato_strings")
    .gain(0.45)
    .room(0.4)
    .speed(1.2)
    .slow(4),

  // Warm pad strings
  note("<d3 f3 bb3 a3>")
    .chord("<m M M M>")
    .s("gm_string_ensemble_1")
    .gain(0.35)
    .lpf(1500)
    .room(0.75)
    .slow(8),

  // Whimsical glockenspiel sparkles
  note("<~ ~ d5 ~ ~ a5 ~ ~ ~ f5 ~ ~ ~ g5 ~ ~>")
    .s("gm_glockenspiel")
    .gain(0.4)
    .room(0.6)
    .delay(0.25)
    .slow(2),

  // Bouncy bassline
  note("<d2 ~ d3 ~ f2 ~ f3 ~ bb2 ~ bb3 ~ a2 ~ a3 ~>")
    .s("gm_contrabass")
    .gain(0.4)
    .room(0.5)
    .slow(4),

  // Quirky marimba rhythm
  note("~ ~ [d4 f4] ~ ~ [a4 d4] ~")
    .s("gm_marimba")
    .gain(0.25)
    .room(0.5),

  // Gentle woodwind counter-melody
  note("<~ ~ [a4 g4] ~ ~ [d5 c5] ~ ~ ~ [f4 e4] ~ ~ ~ [g4 f4] ~>")
    .s("gm_flute")
    .gain(0.45)
    .room(0.6)
    .slow(2),

  // Soft timpani pulse
  s("~ ~ ~ bd:3 ~ ~ ~ ~ ~ ~ ~ bd:3 ~ ~ ~ ~")
    .gain(0.25)
    .room(0.7)
    .slow(2),

  // Occasional chime
  note("~ ~ ~ ~ ~ ~ d5 ~")
    .s("gm_tubular_bells")
    .gain(0.25)
    .room(0.8)
    .delay(0.5),

  // Light cymbal atmosphere
  s("~ ~ ~ ~ ~ ~ ~ hh:7")
    .gain(0.2)
    .room(0.8)
    .hpf(4000)
)
```

### TypeScript API Implementation

```typescript
export function createMuseumPattern(): Pattern<any> {
    return stack(
        // Warm, curious horn melody - flowing, sparse phrases
        // Original has rests (~), so we extract just the notes
        seq("d4", "f4", "a4", "g4", "bb4", "a4", "f4", "g4", "a4", "d5", "c5", "a4",
            "g4", "bb4", "d5", "c5", "a4", "g4", "f4", "d4", "f4", "e4", "d4").note()
            .sound("gm_french_horn")
            .gain(0.26)
            .room(0.75)
            .lpf(1300)
            .slow(8), // Slower to compensate for missing rests

        // Playful pizzicato accents
        seq("a4", "d4", "g4", "f4", "a4", "bb4", "g4", "f4").note()
            .sound("gm_pizzicato_strings")
            .gain(0.38)
            .room(0.45)
            .slow(8),

        // Warm pad strings - sustained chord progression
        seq("d3", "f3", "bb3", "a3").note()
            .sound("gm_string_ensemble_1")
            .gain(0.28)
            .lpf(1500)
            .room(0.8)
            .slow(8),

        // Whimsical glockenspiel sparkles
        seq("d5", "a5", "f5", "g5").note()
            .sound("gm_glockenspiel")
            .gain(0.32)
            .room(0.65)
            .slow(4),

        // Bouncy bassline - walking pattern
        seq("d2", "d3", "f2", "f3", "bb2", "bb3", "a2", "a3").note()
            .sound("gm_contrabass")
            .gain(0.33)
            .lpf(420)
            .room(0.55)
            .slow(8),

        // Quirky marimba rhythm
        seq("d4", "a4").note()
            .sound("gm_marimba")
            .gain(0.2)
            .room(0.5)
            .slow(4),

        // Gentle woodwind counter-melody
        seq("a4", "d5", "f4", "g4").note()
            .sound("gm_flute")
            .gain(0.38)
            .lpf(1700)
            .room(0.65)
            .slow(4),

        // Soft bass drum pulse - use simple s() for percussion
        s("bd").gain(0.18).room(0.75).slow(8),

        // Occasional chime
        seq("d5").note()
            .sound("gm_tubular_bells")
            .gain(0.2)
            .room(0.85)
            .slow(8),

        // Light hi-hat atmosphere
        s("hh").gain(0.16).room(0.8).slow(8)
    ).cpm(58);
}
```

### Key Translation Points

1. **Rests (`~`)** - Remove them and adjust `.slow()` values to create spacing
2. **Alternation (`< >`)** - Convert to `seq()` with explicit notes
3. **Grouping (`[ ]`)** - Flatten into sequential notes
4. **`.s()` method** - Change to `.sound()` for instruments
5. **Percussion patterns** - Use simple `s("bd")` without mini-notation
6. **Tempo** - Use `.cpm(n)` on the root `stack()` call

## Best Practices

### 1. Volume Balance

- Keep individual `.gain()` values between 0.15-0.45
- Total gain from all layers shouldn't exceed ~2.5-3.0
- Drums/percussion: 0.15-0.25
- Bass: 0.3-0.4
- Melody: 0.25-0.4
- Pads/strings: 0.25-0.35
- Accents/sparkles: 0.15-0.3

### 2. Reverb/Space

- Light reverb: 0.3-0.5 (percussion, pizzicato)
- Medium reverb: 0.5-0.7 (melody, brass, woodwinds)
- Heavy reverb: 0.7-0.9 (pads, ambient sounds)

### 3. Filters

- Bass instruments: `.lpf(200-500)` to keep them tight
- Mid-range: `.lpf(1000-1800)` for clarity
- High sparkles: No LPF, or use `.hpf(2000-5000)` for air
- Warm pads: `.lpf(1200-1600)` for mellowness

### 4. Layering & Timing

- Use different `.slow()` values to create polyrhythms
- Typical structure:
  - Melody: `.slow(8)` (slowest, most exposed)
  - Harmony: `.slow(8)` (sustained chords)
  - Counter-melody: `.slow(4)` (twice as fast)
  - Bass: `.slow(4-8)` (foundation)
  - Accents: `.slow(2-4)` (adds movement)
  - Percussion: `.slow(4-8)` (sparse groove)

### 5. Tempo Guidelines

- Peaceful/Ambient: 50-65 CPM
- Walking/Exploration: 65-75 CPM
- Active/Tense: 75-90 CPM
- Combat/Intense: 90-120 CPM

## Troubleshooting

### Issue: "sound gm_instrument not found"

**Cause:** `registerSoundfonts()` wasn't called during initialization.

**Fix:** Ensure StrudelMusicManager calls `registerSoundfonts()` in `initializeAudio()`:

```typescript
// Register GM soundfonts
registerSoundfonts();
```

### Issue: "not a note: '~'"

**Cause:** Using rest character `~` with GM soundfonts.

**Fix:** Remove rests and use `.slow()` to create spacing:

```typescript
// DON'T:
seq("c4", "~", "e4", "~").note()

// DO:
seq("c4", "e4").note().slow(2)
```

### Issue: Sounds are too loud/quiet

**Cause:** GM instruments load at varying volumes.

**Fix:** Adjust `.gain()` values per instrument. Test and iterate:

```typescript
// Start with conservative gains
.gain(0.25) // Then adjust up/down by 0.05-0.1
```

### Issue: Music sounds harsh

**Cause:** Instruments playing in conflicting frequency ranges.

**Fix:** Use filters to separate instruments:

```typescript
// Bass: keep low
.lpf(400)

// Melody: mid-range
.lpf(1600)

// Sparkles: keep high
.hpf(2000)
```

## Testing Your Patterns

1. **Listen in isolation** - Comment out other layers to hear each instrument clearly
2. **Check balance** - No single instrument should dominate
3. **Test looping** - Patterns should loop smoothly without awkward transitions
4. **Verify memory** - GM soundfonts load on-demand; first playback may have latency

## NPC Typewriter Blips with Strudel

### Overview

NPCs can use Strudel patterns for their typewriter sound effects, allowing for rich, musical character voices using GM instruments instead of basic oscillator synthesis.

### Configuration

Add a `strudelPattern` configuration to the NPC's JSON file under the `audio` section:

```json
{
  "id": "felt",
  "name": "Felt",
  "audio": {
    "strudelPattern": {
      "enabled": true,
      "type": "melodic",
      "notes": ["e5", "g5", "a5", "c6", "b5", "a5", "g5", "e5"],
      "sound": "gm_flute",
      "gain": 0.42,
      "room": 0.4,
      "lpf": 2400,
      "attack": 0.005,
      "decay": 0.08,
      "rhythmVariation": [1.0, 0.9, 1.1, 1.0, 0.95, 1.05, 1.0, 0.9]
    }
  }
}
```

### Pattern Configuration Options

- **`enabled`** (boolean) - Set to `true` to use Strudel for this character
- **`type`** ("melodic" | "percussive") - Pattern type
- **`notes`** (string[]) - Array of Strudel note names (e.g., "e5", "g5", "c6")
  - Each character press cycles through this pattern
  - Pattern loops when it reaches the end
- **`sound`** (string) - GM instrument name (e.g., "gm_flute", "gm_glockenspiel")
- **`gain`** (number, 0-1) - Volume level (optional, default: 0.4)
- **`room`** (number, 0-1) - Reverb amount (optional, default: 0.4)
- **`lpf`** (number) - Low-pass filter frequency in Hz (optional)
- **`attack`** (number) - Attack time in seconds (optional, default: 0.005)
- **`decay`** (number) - Decay time in seconds (optional, default: 0.08)
- **`rhythmVariation`** (number[]) - Timing multipliers for each note (optional)
  - Values < 1.0 make the blip shorter/faster
  - Values > 1.0 make the blip longer/slower

### Character Voice Examples

#### Felt - Cheerful, Sing-Songy Flute
```json
{
  "sound": "gm_flute",
  "notes": ["e5", "g5", "a5", "c6", "b5", "a5", "g5", "e5"],
  "gain": 0.42,
  "room": 0.4,
  "lpf": 2400,
  "rhythmVariation": [1.0, 0.9, 1.1, 1.0, 0.95, 1.05, 1.0, 0.9]
}
```
Creates an ascending-descending melodic pattern with slight rhythm bounce.

#### Merchant - Friendly Glockenspiel
```json
{
  "sound": "gm_glockenspiel",
  "notes": ["c5", "e5", "g5", "c6"],
  "gain": 0.45,
  "room": 0.5,
  "lpf": 2800
}
```
Bright, sparkly ascending pattern perfect for friendly merchants.

#### Mysterious NPC - Marimba
```json
{
  "sound": "gm_marimba",
  "notes": ["d4", "f4", "g4", "bb4", "a4", "g4"],
  "gain": 0.35,
  "room": 0.6,
  "lpf": 1800,
  "rhythmVariation": [1.0, 1.1, 0.9, 1.05, 0.95, 1.0]
}
```
Wooden, contemplative tones with subtle rhythm variation.

#### Authoritative Character - Bassoon
```json
{
  "sound": "gm_bassoon",
  "notes": ["c3", "e3", "g3", "c4"],
  "gain": 0.4,
  "room": 0.5,
  "lpf": 1200,
  "decay": 0.12
}
```
Deep, authoritative voice with longer decay.

### Recommended Instruments for Dialogue

#### High-Pitched Characters
- `gm_flute` - Light, airy, cheerful
- `gm_piccolo` - Very high, energetic
- `gm_glockenspiel` - Sparkly, bell-like
- `gm_celesta` - Magical, twinkling
- `gm_xylophone` - Woody, bright

#### Mid-Range Characters
- `gm_marimba` - Warm, wooden
- `gm_vibraphone` - Smooth, jazzy
- `gm_clarinet` - Smooth, friendly
- `gm_english_horn` - Warm, mysterious

#### Low-Pitched Characters
- `gm_bassoon` - Deep, authoritative
- `gm_cello` - Rich, expressive
- `gm_contrabass` - Very deep, serious
- `gm_french_horn` - Noble, warm

### Implementation Details

The typewriter system checks for Strudel patterns in this priority order:

1. **Strudel Pattern** (if `strudelPattern.enabled` is true)
2. **Melodic Pattern** (Web Audio API with melodic sequences)
3. **Procedural Voice** (Web Audio API with random synthesis)

When a Strudel pattern is detected:
- Each character typed triggers one note from the pattern
- The pattern index advances with each character
- Rhythm variations are applied if configured
- The pattern loops automatically when it reaches the end
- The same Strudel audio context is shared with background music

### Technical Notes

- Strudel typewriter blips use the same audio engine as background music
- First blip may have slight latency while GM instruments load
- Patterns are non-blocking and won't interfere with dialogue flow
- Falls back gracefully if Strudel is unavailable

## Additional Resources

- [Strudel Official Site](https://strudel.cc/)
- [Strudel Documentation](https://strudel.cc/learn/)
- [TidalCycles (Strudel's inspiration)](https://tidalcycles.org/)
- [General MIDI Specification](https://en.wikipedia.org/wiki/General_MIDI)

---

**Created:** 2025-11-13
**Last Updated:** 2025-11-13
**Version:** 1.1.0
