/**
 * Music Patterns - Strudel Pattern objects for procedural game music
 * LEGEND OF ZELDA INSPIRED THEMES
 *
 * IMPORTANT - AI CODING ASSISTANT NOTES:
 *
 * 1. seq() SYNTAX: Use comma-separated notes, NOT space-separated strings!
 *    ✅ CORRECT:   seq("g4", "a4", "b4", "c5").note()
 *    ❌ INCORRECT: seq("g4 a4 b4 c5").note()
 *
 * 2. GM INSTRUMENT NAMES: Use the correct Strudel soundfont naming:
 *    ✅ CORRECT:   "gm_piano", "gm_flute", "gm_acoustic_bass"
 *    ❌ INCORRECT: "gm_acoustic_grand_piano", "piano", "flute"
 *
 * 3. RESTS WITH GM SOUNDFONTS: Use mini() notation for rests with "~"!
 *    ✅ CORRECT:   mini("c4 ~ e4 ~ g4").sound("gm_piano").note()
 *    ✅ CORRECT:   mini("c4 e4 ~ g4 ~ c5").sound("gm_flute").note()
 *    ❌ INCORRECT: seq("c4", "~", "d4").sound("gm_piano") - seq() doesn't support rests
 *
 *    Mini notation features:
 *    - Rests: "~" for silence
 *    - Space-separated notes: "c4 e4 g4" instead of seq("c4", "e4", "g4")
 *    - Subdivisions: "c4 [e4 g4]" plays e4 and g4 twice as fast
 *    - Alternatives: "<c4 e4 g4>" cycles through options each repetition
 *
 * 4. AVAILABLE GM INSTRUMENTS (partial list):
 *    - Piano: gm_piano
 *    - Strings: gm_violin, gm_viola, gm_cello, gm_contrabass, gm_string_ensemble_1
 *    - Woodwinds: gm_flute, gm_oboe, gm_clarinet, gm_bassoon, gm_piccolo, gm_english_horn
 *    - Brass: gm_trumpet, gm_trombone, gm_tuba, gm_french_horn, gm_brass_section
 *    - Percussion: gm_timpani, gm_xylophone, gm_glockenspiel, gm_vibraphone, gm_marimba
 *    - Others: gm_acoustic_bass, gm_acoustic_guitar_nylon, gm_acoustic_guitar_steel,
 *              gm_choir_aahs, gm_music_box, gm_celesta, gm_harmonica, gm_orchestral_harp
 * 
 * 5. The tone is a mix of wacky and self serious. If you change a track, you also need to change its
 * accompanying combat track to match the new mood and style.
 */

import { note, stack, seq, type Pattern } from '@strudel/core';
// @ts-ignore - Strudel types are incomplete
import '@strudel/tonal';
// @ts-ignore - Strudel soundfonts for GM instruments
import '@strudel/soundfonts';
// @ts-ignore - Strudel mini for convenient notation with rests
import { mini } from '@strudel/mini';

/**
 * Home Combat music - Zelda-inspired battle theme
 * Heroic trumpet with driving bass
 */
export function createHomeCombatPattern(): Pattern<any> {
    return stack(
        // Main heroic melody - Trumpet
        seq("g4 b4 d5 g5 f5 e5 d5 b4").note()
            .sound("gm_trumpet")
            .gain(0.40)
            .room(0.70)
            .lpf(1500)
            .slow(8),

        // Driving bass heartbeat
        seq("g1", "g1", "d2", "g1", "g1", "d2").note()
            .sound("gm_tuba")
            .gain(0.32)
            .room(0.65)
            .lpf(280)
            .slow(6),

        // String rhythm underneath
        seq("g3", "d4", "b3", "g3", "g3", "b3", "d4", "g4").note()
            .sound("gm_string_ensemble_1")
            .gain(0.28)
            .room(0.70)
            .lpf(550)
            .slow(5)
    ).cpm(76);
}

/**
 * Cave/Underground music - Zelda dungeon theme
 * Mysterious flute with ethereal shimmer and rolling rhythmic drums
 */
export function createCavePattern(): Pattern<any> {
    return stack(
     
        // Gentle bass foundation - Extended with rests via reduced sequence and slower tempo
        seq("c2", "c2", "g2", "c2", "e2", "c2", "g2", "bb1", "c2", "e2").note()
            .sound("gm_acoustic_bass")
            .room(0.85)
            .gain(0.18)
            .lpf(350)
            .slow(24),

        // Deep rolling kick drums - Dynamic timpani with breathing room and syncopation
        seq("c1", "c1", "g1", "c1", "g1", "c1", "c1", "g1", "c1", "g1", 
            "c1", "g1", "g1", "c1", "c1", "g1", "c1", "g1", "g1", "c1").note()
            .sound("gm_timpani")
            .room(0.55)
            .gain(0.12)
            .lpf(180)
            .slow(3),

        // Mid-range snare roll - Xylophone with sparse texture and breathing space
        seq("g3", "c4", "g3", "c4", "g3", "c4", "c4", "g3", "c4", "g3").note()
            .sound("gm_xylophone")
            .room(1.60)
            .gain(0.20)
            .lpf(3500)
            .slow(3.5)
    ).cpm(80);
}

/**
 * Peaceful interior music - Zelda safe haven theme
 * Warm flute with gentle support
 */
export function createPeacefulPattern(): Pattern<any> {
    return stack(
        // Gentle flute melody
        seq("a4", "c5", "e5", "a5", "e5", "c5", "a4", "g4").note()
            .sound("gm_flute")
            .room(0.72)
            .gain(0.16)
            .lpf(2100)
            .slow(16),

        // Steady bass foundation
        seq("a2", "a2", "e3", "a2", "d3", "a2", "e3", "a2").note()
            .sound("gm_acoustic_bass")
            .gain(0.32)
            .room(0.65)
            .lpf(380)
            .slow(14),

        // Warm guitar arpeggios
        seq("a3", "c4", "e4", "a4", "e4", "c4").note()
            .sound("gm_acoustic_guitar_nylon")
            .room(0.70)
            .gain(0.24)
            .slow(18)
    ).cpm(60);
}

/**
 * Home Surface music - Zelda overworld theme
 * Classic adventure with flute and light accompaniment
 */
export function createHomePattern(): Pattern<any> {
    return stack(
        // Main iconic theme - Flute
        seq("g4", "a4", "d5", "g5", "d5", "a4",
            "a4", "b4", "e5", "a5", "e5", "b4").note()
            .sound("gm_flute")
            .gain(0.12)
            .room(0.85)
            .lpf(1300)
            .slow(12),

        // Bass heartbeat
        seq("g1", "g1", "d2", "g1", "g1", "d2").note()
            .sound("gm_contrabass")
            .gain(0.16)
            .room(0.80)
            .lpf(260)
            .slow(18),

        // Light string accompaniment
        seq("g3", "d4", "g4", "d4", "g3", "a3", "e4", "a4").note()
            .sound("gm_string_ensemble_1")
            .gain(0.14)
            .room(0.82)
            .lpf(450)
            .slow(14)
    ).cpm(56);
}

/**
 * Cave Combat music - Zelda dungeon boss battle
 * Mysterious but energetic violin with pounding drums
 */
export function createCaveCombatPattern(): Pattern<any> {
    return stack(
        // Energetic violin melody
        seq("c4", "e4", "g4", "c5", "g5", "e5", "c5", "g4").note()
            .sound("gm_violin")
            .room(0.60)
            .gain(0.42)
            .lpf(1600)
            .slow(2),

        // Driving bass
        seq("c1", "c1", "g1", "c1", "c1", "g1").note()
            .sound("gm_tuba")
            .room(0.50)
            .gain(0.40)
            .lpf(380)
            .slow(1.8),

        // Ethereal accent
        seq("e5", "g5", "c6", "e6", "g6", "e6").note()
            .sound("gm_vibraphone")
            .room(0.65)
            .gain(0.28)
            .slow(2.2),

        // Pounding drums - Faster, heavier rhythm
        seq("c1", "c1", "g1", "c1", "g1", "c1", "g1", "c1", "c1", "g1").note()
            .sound("gm_timpani")
            .room(0.55)
            .gain(0.36)
            .lpf(200)
            .slow(2)
    ).cpm(86);
}

/**
 * Peaceful Combat music - Alert but controlled
 * Clarinet melody with moderate intensity
 */
export function createPeacefulCombatPattern(): Pattern<any> {
    return stack(
        // Alert clarinet melody
        seq("a3", "c4", "e4", "a4", "g4", "e4", "c4", "a3").note()
            .sound("gm_clarinet")
            .room(0.55)
            .gain(0.40)
            .lpf(1600)
            .slow(2),

        // Rhythmic bass support
        seq("a2", "e3", "a2", "e3", "c3", "a2", "e3", "a2").note()
            .sound("gm_cello")
            .room(0.48)
            .gain(0.34)
            .lpf(550)
            .slow(2),

        // Bright accent layer
        seq("e5", "a5", "c6", "e6", "c6", "a5").note()
            .sound("gm_glockenspiel")
            .room(0.65)
            .gain(0.30)
            .lpf(2600)
            .slow(2.5)
    ).cpm(82);
}

/**
 * Woods Surface music - Zelda forest overworld
 * Peaceful forest with oboe and minimal accompaniment
 */
export function createWoodsPattern(): Pattern<any> {
    return stack(
        // Forest melody - Oboe
        seq("d4", "f4", "a4", "d5", "c5", "a4", "f4", "d4").note()
            .sound("gm_oboe")
            .room(0.88)
            .gain(0.26)
            .lpf(1500)
            .slow(18),

        // String ensemble forest rustling
        seq("d3", "a3", "f3", "d3", "e3", "b3", "g3", "e3").note()
            .sound("gm_string_ensemble_1")
            .room(0.82)
            .gain(0.22)
            .lpf(600)
            .slow(16),

        // Contrabass earth tone
        seq("d2", "d2", "a2", "d2", "e2", "b2").note()
            .sound("gm_contrabass")
            .room(0.75)
            .gain(0.28)
            .lpf(400)
            .slow(18)
    ).cpm(54);
}

/**
 * Woods Combat music - Forest battle
 * French horn with driving bass
 */
export function createWoodsCombatPattern(): Pattern<any> {
    return stack(
        // Urgent forest pursuit - French horn
        seq("d3", "f3", "a3", "d4", "a3", "f3", "d3", "e3").note()
            .sound("gm_french_horn")
            .room(0.60)
            .gain(0.40)
            .lpf(1500)
            .slow(2),

        // Driving bass
        seq("d2", "d2", "a2", "d2", "d2", "a2").note()
            .sound("gm_tuba")
            .room(0.50)
            .gain(0.38)
            .lpf(450)
            .slow(2),

        // Cello urgency
        seq("d2", "a2", "f2", "d2", "e2", "b2").note()
            .sound("gm_cello")
            .room(0.52)
            .gain(0.32)
            .lpf(700)
            .slow(2)
    ).cpm(78);
}

/**
 * Wilds music - Zelda badlands exploration
 * Bold oboe with rhythmic guitar
 */
export function createWildsPattern(): Pattern<any> {
    return stack(
        // Exotic exploration melody - Oboe
        seq("g3", "bb3", "d4", "g4", "f4", "d4", "bb3", "g3").note()
            .sound("gm_oboe")
            .room(0.85)
            .gain(0.28)
            .lpf(1400)
            .slow(20),

        // Exotic rhythm - Guitar
        seq("g3", "bb3", "d4", "g3", "a3", "c4", "e4", "a3").note()
            .sound("gm_acoustic_guitar_steel")
            .room(0.75)
            .gain(0.26)
            .lpf(1600)
            .slow(16),

        // Strong bass foundation
        seq("g1", "bb1", "d2", "g1", "a1", "c2").note()
            .sound("gm_acoustic_bass")
            .room(0.70)
            .gain(0.30)
            .lpf(400)
            .slow(18)
    ).cpm(62);
}

/**
 * Wilds Combat music - Thrilling boss battle
 * Epic trumpet with powerful bass
 */
export function createWildsCombatPattern(): Pattern<any> {
    return stack(
        // Heroic trumpet fanfare
        seq("g3", "bb3", "d4", "g4", "bb4", "d5", "g5").note()
            .sound("gm_trumpet")
            .room(0.60)
            .gain(0.44)
            .lpf(1800)
            .slow(1.5),

        // Powerful bass drive
        seq("g1", "g1", "d2", "g1", "a1", "e2", "g1", "g1").note()
            .sound("gm_tuba")
            .room(0.50)
            .gain(0.44)
            .lpf(400)
            .slow(1.5),

        // Mid-range heroic
        seq("bb3", "d4", "g4", "a4", "c5").note()
            .sound("gm_french_horn")
            .room(0.58)
            .gain(0.36)
            .lpf(1600)
            .slow(1.8)
    ).cpm(86);
}

/**
 * Frontier music - Zelda final area theme
 * Mysterious with expansive French horn
 */
export function createFrontierPattern(): Pattern<any> {
    return stack(
        // Epic frontier journey - French horn
        seq("a3", "c4", "e4", "a4", "g4", "e4", "c4", "a3").note()
            .sound("gm_french_horn")
            .room(0.82)
            .gain(0.28)
            .lpf(1400)
            .slow(26),

        // Mysterious flute echoes
        seq("e4", "a4", "c5", "e5", "d5", "c5", "a4", "e4").note()
            .sound("gm_flute")
            .room(0.85)
            .gain(0.22)
            .lpf(1800)
            .slow(22),

        // Deliberate cello march
        seq("a2", "e3", "a3", "c3", "b2", "f3", "a3").note()
            .sound("gm_cello")
            .room(0.70)
            .gain(0.28)
            .lpf(500)
            .slow(18)
    ).cpm(56);
}

/**
 * Frontier Combat music - Final heroic battle
 * Ultimate challenge with trumpet and trombone
 */
export function createFrontierCombatPattern(): Pattern<any> {
    return stack(
        // Ultimate trumpet call
        seq("a3", "c4", "e4", "a4", "g4", "e4", "c4", "a3").note()
            .sound("gm_trumpet")
            .room(0.58)
            .gain(0.42)
            .lpf(1700)
            .slow(2),

        // Powerful relentless bass
        seq("a2", "e3", "a3", "c3", "a2", "e3").note()
            .sound("gm_tuba")
            .room(0.50)
            .gain(0.42)
            .lpf(500)
            .slow(1.5),

        // Brass finale
        seq("a2", "e3", "c3", "a2", "c3", "e3").note()
            .sound("gm_trombone")
            .room(0.55)
            .gain(0.36)
            .lpf(800)
            .slow(2)
    ).cpm(84);
}

/**
 * Museum music - Zelda treasure/shop theme
 * Grand with music box and celesta
 */
export function createMuseumPattern(): Pattern<any> {
    return stack(
        // Grand museum main theme - Music box
        seq("c5", "e5", "g5", "c6", "e6", "c6", "g5", "e5",
            "d5", "f5", "a5", "d6", "f6", "d6", "a5", "f5").note()
            .sound("gm_music_box")
            .gain(0.26)
            .room(0.78)
            .lpf(2000)
            .slow(4),

        // Harmonic bells - Celesta
        seq("e5", "g5", "c6", "e6", "g6", "e6", "c6", "g5").note()
            .sound("gm_celesta")
            .gain(0.22)
            .room(0.82)
            .lpf(2400)
            .slow(5),

        // Deep bass heritage
        seq("c2", "g2", "d2", "a1", "e2", "b1").note()
            .sound("gm_acoustic_bass")
            .gain(0.26)
            .room(0.65)
            .lpf(320)
            .slow(3)
    ).cpm(56);
}

/**
 * Get music pattern for zone dimension or level
 * @param dimensionOrLevel - Zone dimension (0=surface, 1=interior, 2=underground) or zone level offset (11=home, 12=woods, 13=wilds, 14=frontier)
 * @param combat - Whether combat music should play
 * @returns Strudel Pattern object
 *
 * Note: Surface zones pass zone level + 10 (11-14) to distinguish from dimensions (0-2).
 * Interior/underground zones pass dimension directly (1 or 2).
 */
export function getMusicPatternForDimension(dimensionOrLevel: number, combat: boolean = false): Pattern<any> {
    if (combat) {
        // Zone levels (offset by 10)
        if (dimensionOrLevel === 11) return createHomeCombatPattern(); // Home
        if (dimensionOrLevel === 12) return createWoodsCombatPattern(); // Woods
        if (dimensionOrLevel === 13) return createWildsCombatPattern(); // Wilds
        if (dimensionOrLevel === 14) return createFrontierCombatPattern(); // Frontier

        // Dimensions
        if (dimensionOrLevel === 0) return createHomeCombatPattern(); // Surface (fallback for home)
        if (dimensionOrLevel === 1) return createPeacefulCombatPattern(); // Interior
        if (dimensionOrLevel === 2) return createCaveCombatPattern(); // Underground

        // Default: home/tension
        return createHomeCombatPattern();
    }

    // Non-combat music
    // Zone levels (offset by 10)
    if (dimensionOrLevel === 11) return createHomePattern(); // Home (surface)
    if (dimensionOrLevel === 12) return createWoodsPattern(); // Woods
    if (dimensionOrLevel === 13) return createWildsPattern(); // Wilds
    if (dimensionOrLevel === 14) return createFrontierPattern(); // Frontier

    // Dimensions
    if (dimensionOrLevel === 0) return createHomePattern(); // Surface (fallback)
    if (dimensionOrLevel === 1) return createPeacefulPattern(); // Interior
    if (dimensionOrLevel === 2) return createCavePattern(); // Underground
    
    // Default: home
    return createHomePattern();
}
