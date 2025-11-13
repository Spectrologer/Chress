/**
 * Music Patterns - Strudel Pattern objects for procedural game music
 */

import { note, stack, seq, type Pattern } from '@strudel/core';
// @ts-ignore - Strudel types are incomplete
import '@strudel/tonal';
// @ts-ignore - Strudel soundfonts for GM instruments
import '@strudel/soundfonts';

// Available GM brass/horn instruments:
// gm_trumpet, gm_trombone, gm_tuba, gm_muted_trumpet
// gm_french_horn, gm_brass_section, gm_synth_brass_1, gm_synth_brass_2

/**
 * Cave/Underground music - Cavernous, mysterious with glimmer of hope
 * Extended ambient loop with slow evolution
 */
export function createCavePattern(): Pattern<any> {
    return stack(
        // Main melodic line - bassoon for deep mysterious tones with variation
        seq("c3", "eb3", "f3", "ab3", "c3", "db3", "eb3", "gb3",
            "ab3", "f3", "eb3", "c3", "ab2", "c3", "eb3", "f3").note()
            .sound("gm_bassoon")
            .room(0.92)
            .gain(0.28)
            .lpf(1000)
            .slow(16),

        // Echoing atmosphere - celesta with sparse notes
        seq("c5", "eb5", "f5", "ab5", "c6", "ab5", "f5", "eb5").note()
            .sound("gm_celesta")
            .room(0.95)
            .gain(0.22)
            .lpf(2000)
            .slow(24),

        // Deep bass - contrabass very slow
        seq("c1", "c1", "g1", "f1", "eb1", "f1", "g1", "c1").note()
            .sound("gm_contrabass")
            .room(0.88)
            .gain(0.35)
            .lpf(300)
            .slow(12),

        // Dark pad - string ensemble sustained
        seq("c2", "eb2", "f2", "ab2", "c3", "ab2", "f2", "eb2").note()
            .sound("gm_string_ensemble_1")
            .room(0.92)
            .gain(0.24)
            .lpf(800)
            .slow(20),

        // Mysterious tones - choir aahs very sparse
        seq("eb3", "f3", "ab3", "c4", "eb4", "c4", "ab3", "f3").note()
            .sound("gm_choir_aahs")
            .room(0.95)
            .gain(0.18)
            .lpf(1200)
            .slow(28),

        // Ambient drips - vibraphone extremely sparse
        seq("c5", "eb5", "ab5").note()
            .sound("gm_vibraphone")
            .room(0.95)
            .gain(0.15)
            .slow(32),

        // Deep sub layer - tuba
        seq("c0", "eb0", "f0", "ab0").note()
            .sound("gm_tuba")
            .room(0.9)
            .gain(0.2)
            .lpf(150)
            .slow(24)
    ).cpm(48);  // Very slow, ambient tempo
}

/**
 * Peaceful interior music - Warm, welcoming
 * Extended ambient loop with gentle melodic variations
 */
export function createPeacefulPattern(): Pattern<any> {
    return stack(
        // Main melody - warm flute with extended phrasing
        seq("a4", "d5", "f5", "a4", "d5", "f5", "a4", "c5", "b4", "g4", "f4", "g4",
            "a4", "d5", "c5", "e5", "d5", "f5", "e5", "d5", "c5", "a4", "g4", "f4",
            "e4", "d4", "f4", "a4", "d5", "c5", "a4", "g4", "f4", "e4", "f4", "d4").note()
            .sound("gm_flute")
            .room(0.7)
            .gain(0.12)
            .lpf(2200)
            .slow(18),

        // Bass line - warm acoustic bass slow and steady
        seq("d2", "d2", "a2", "d2", "f2", "a2", "f2", "c2", "g2", "e2", "a2", "d2", "c2", "e2", "d2", "a1").note()
            .sound("gm_acoustic_bass")
            .gain(0.35)
            .room(0.6)
            .lpf(400)
            .slow(16),

        // Mid-range harmony - acoustic guitar arpeggios
        seq("f3", "a3", "d4", "f4", "a4", "f4", "d4", "a3",
            "c4", "g3", "e3", "g3", "a3", "d4", "c4", "e4", "d4", "a3").note()
            .sound("gm_acoustic_guitar_nylon")
            .room(0.7)
            .gain(0.28)
            .slow(20),

        // Gentle accompaniment - vibraphone sparse
        seq("d4", "a4", "f4", "d4", "c4", "g4", "e4", "c4").note()
            .sound("gm_vibraphone")
            .room(0.75)
            .gain(0.24)
            .slow(24),

        // String warmth - cello sustained
        seq("d2", "a2", "f2", "d2", "c2", "g2", "e2", "a2", "d2", "f2", "a2", "d3").note()
            .sound("gm_cello")
            .gain(0.28)
            .room(0.7)
            .lpf(800)
            .slow(16),

        // Soft chimes - tubular bells very sparse
        seq("d5", "a5", "f5", "d5").note()
            .sound("gm_tubular_bells")
            .room(0.85)
            .gain(0.2)
            .slow(28),

        // Ambient pad - choir aahs
        seq("d3", "f3", "a3", "d4").note()
            .sound("gm_choir_aahs")
            .room(0.8)
            .gain(0.18)
            .lpf(1400)
            .slow(32)
    ).cpm(62);  // Slower, more ambient tempo
}

/**
 * Tension/Surface music - Home surface theme
 * Calm forest village ambience with gentle pastoral strings and woodwinds
 * Peaceful, natural atmosphere for a safe haven
 */
export function createTensionPattern(): Pattern<any> {
    return stack(
        // Gentle violin melody - pastoral, wandering through the forest
        seq("d5", "a4", "f4", "a4", "d5", "e5", "f5", "e5",
            "d5", "c5", "a4", "f4", "e4", "f4", "a4", "d5",
            "c5", "a4", "g4", "a4", "c5", "d5", "e5", "f5").note()
            .sound("gm_violin")
            .gain(0.28)
            .room(0.75)
            .lpf(1800)
            .slow(24),

        // Soft viola harmony - warm middle voice
        seq("f3", "d3", "a3", "f3", "d3", "a3", "c4", "a3",
            "f3", "g3", "a3", "d4").note()
            .sound("gm_viola")
            .gain(0.24)
            .room(0.78)
            .lpf(1400)
            .slow(28),

        // Tender cello - gentle bass line
        seq("d2", "a2", "d3", "a2", "f2", "c3", "f2", "c3",
            "g2", "d3", "a2", "e3", "d2", "a2", "f2", "d2").note()
            .sound("gm_cello")
            .gain(0.26)
            .room(0.72)
            .lpf(600)
            .slow(32),

        // Breathy flute - bird-like calls
        seq("a5", "f5", "d5", "f5", "a5", "d6", "c6", "a5",
            "f5", "e5", "d5", "a4").note()
            .sound("gm_flute")
            .gain(0.22)
            .room(0.85)
            .lpf(2400)
            .slow(36),

        // Warm clarinet - soft woodwind pad
        seq("f4", "a4", "d5", "a4", "f4", "e4", "g4", "e4",
            "d4", "f4", "a4", "c5").note()
            .sound("gm_clarinet")
            .gain(0.2)
            .room(0.82)
            .lpf(1600)
            .slow(40),

        // Delicate harp - gentle plucks
        seq("d4", "f4", "a4", "d5", "a4", "f4",
            "c4", "e4", "g4", "c5", "g4", "e4").note()
            .sound("gm_orchestral_harp")
            .gain(0.18)
            .room(0.8)
            .slow(20),

        // Soft acoustic guitar - village warmth
        seq("d3", "a3", "f3", "d3", "c3", "g3", "e3", "c3").note()
            .sound("gm_acoustic_guitar_nylon")
            .gain(0.16)
            .room(0.7)
            .slow(32),

        // Peaceful oboe - distant pastoral melody
        seq("a4", "d5", "f5", "e5", "d5", "c5", "a4", "g4",
            "f4", "a4", "d5", "c5").note()
            .sound("gm_oboe")
            .gain(0.19)
            .room(0.88)
            .lpf(1700)
            .slow(44),

        // Gentle pizzicato - soft accents
        seq("d4", "a4", "f4", "d4", "c4", "g4", "e4", "c4").note()
            .sound("gm_pizzicato_strings")
            .gain(0.15)
            .room(0.68)
            .slow(24),

        // Soft string ensemble pad - ambient warmth
        seq("d3", "f3", "a3", "d4").note()
            .sound("gm_string_ensemble_1")
            .gain(0.22)
            .room(0.85)
            .lpf(1200)
            .slow(48),

        // Very soft glockenspiel - occasional sparkle
        seq("d6", "a5", "f5", "d5").note()
            .sound("gm_glockenspiel")
            .gain(0.12)
            .room(0.82)
            .slow(56)
    ).cpm(58); // Calm, peaceful tempo
}

/**
 * Cave Combat music - Intense, urgent, dangerous
 */
export function createCaveCombatPattern(): Pattern<any> {
    return stack(
        // Aggressive melodic line - trombone
        seq("c3", "eb3", "f3", "ab3", "g3", "f3", "eb3", "c3").note()
            .sound("gm_trombone")
            .room(0.6)
            .gain(0.42)
            .lpf(1300)
            .slow(2),

        // Fast arpeggios for intensity - violin
        seq("g4", "c5", "eb5", "g5", "f5", "eb5", "c5", "g4", "c5", "eb5", "g5", "c6").note()
            .sound("gm_violin")
            .room(0.5)
            .gain(0.38)
            .lpf(1800)
            .slow(2),

        // Driving rhythmic bass - tuba
        seq("c1", "c1", "g1", "c1", "c1", "f1", "c1", "c1").note()
            .sound("gm_tuba")
            .room(0.4)
            .gain(0.48)
            .lpf(350)
            .slow(2),

        // Pulsing danger motif - cello
        seq("c2", "c2", "eb2", "c2", "f2", "c2", "g2", "c2").note()
            .sound("gm_cello")
            .room(0.3)
            .gain(0.4)
            .lpf(450)
            .slow(1),

        // Dark percussion - timpani
        seq("c1", "c1", "g1", "f1").note()
            .sound("gm_timpani")
            .room(0.5)
            .gain(0.35)
            .slow(2),

        // Ominous brass - French horn
        seq("c2", "eb2", "f2", "ab2").note()
            .sound("gm_french_horn")
            .room(0.6)
            .gain(0.36)
            .lpf(1100)
            .slow(3)
    ).cpm(78);  // Fast, intense tempo
}

/**
 * Peaceful Combat music - Alert but controlled
 */
export function createPeacefulCombatPattern(): Pattern<any> {
    return stack(
        // Alert chord progression - clarinet
        seq("c3", "e3", "g3", "c3", "d3", "f3", "a3", "d3").note()
            .sound("gm_clarinet")
            .room(0.5)
            .gain(0.4)
            .lpf(1700)
            .slow(2),

        // Urgent melody - violin
        seq("c4", "d4", "e4", "g4", "a4", "g4", "e4", "d4", "e4", "g4", "a4", "c5").note()
            .sound("gm_violin")
            .room(0.4)
            .gain(0.42)
            .lpf(1900)
            .slow(2),

        // Rhythmic bass drive - cello
        seq("c2", "g2", "c2", "g2", "c2", "a2", "c2", "g2").note()
            .sound("gm_cello")
            .room(0.3)
            .gain(0.42)
            .lpf(600)
            .slow(2),

        // Active accent layer - glockenspiel
        seq("e5", "g5", "c6", "e6", "d6", "c6", "g5", "e5").note()
            .sound("gm_glockenspiel")
            .room(0.6)
            .gain(0.35)
            .lpf(2800)
            .slow(3),

        // Urgent brass - trumpet
        seq("c3", "g3", "e3", "d3").note()
            .sound("gm_trumpet")
            .room(0.5)
            .gain(0.38)
            .lpf(1600)
            .slow(2),

        // Rhythmic pulse - timpani
        seq("c1", "g1", "c1", "d1").note()
            .sound("gm_timpani")
            .room(0.5)
            .gain(0.3)
            .slow(2)
    ).cpm(84);  // Brisk, alert tempo
}

/**
 * Surface Combat music - Alert but still warm and hopeful
 */
export function createTensionCombatPattern(): Pattern<any> {
    return stack(
        // Energized chords - French horn with urgency
        seq("c3", "e3", "a3", "f3", "c3", "g3", "d3", "e3").note()
            .sound("gm_french_horn")
            .room(0.7)
            .gain(0.4)
            .lpf(1800)
            .slow(2),

        // Determined melody - trumpet hopeful and urgent
        seq("c4", "e4", "g4", "a4", "c5", "d5", "c5", "a4", "g4", "e4", "g4", "e4").note()
            .sound("gm_trumpet")
            .room(0.75)
            .gain(0.42)
            .lpf(2100)
            .slow(3),

        // Driving bass - tuba confident rhythm
        seq("c1", "c1", "g1", "g1", "c1", "c1", "a1", "g1").note()
            .sound("gm_tuba")
            .room(0.55)
            .gain(0.45)
            .lpf(380)
            .slow(2),

        // Bright shimmer - glockenspiel heroic sparkle
        seq("c5", "e5", "g5", "c6", "d6", "c6", "g5", "e5").note()
            .sound("gm_glockenspiel")
            .room(0.8)
            .gain(0.38)
            .lpf(3000)
            .slow(3),

        // Warm urgency layer - violin encouraging
        seq("e3", "g3", "a3", "c4", "a3", "g3").note()
            .sound("gm_violin")
            .room(0.65)
            .gain(0.36)
            .lpf(1900)
            .slow(3),

        // Strong foundation - timpani
        seq("c1", "g1", "c1", "g1").note()
            .sound("gm_timpani")
            .room(0.65)
            .gain(0.32)
            .slow(4),

        // Confident pulse - cello
        seq("c2", "e2", "g2", "e2").note()
            .sound("gm_cello")
            .room(0.5)
            .gain(0.35)
            .lpf(700)
            .slow(2),

        // Heroic brass - brass section
        seq("c3", "g3", "e3", "a3").note()
            .sound("gm_brass_section")
            .room(0.6)
            .gain(0.36)
            .lpf(1700)
            .slow(3)
    ).cpm(78);  // Upbeat and encouraging
}

/**
 * Woods music - Natural, mysterious forest atmosphere
 * Extended ambient forest soundscape
 */
export function createWoodsPattern(): Pattern<any> {
    return stack(
        // Forest breeze melody - gentle English horn with longer phrases
        seq("d3", "f3", "a3", "d4", "c4", "a3", "f3", "d3",
            "e3", "g3", "a3", "c4", "d4", "c4", "a3", "g3",
            "f3", "a3", "d4", "f4", "e4", "d4", "c4", "a3").note()
            .sound("gm_english_horn")
            .room(0.88)
            .gain(0.26)
            .lpf(1400)
            .slow(24),

        // Rustling leaves - pizzicato strings sparse and varied
        seq("f4", "a4", "d5", "f5", "e5", "d5", "a4", "f4",
            "g4", "a4", "c5", "e5", "d5", "c5", "a4", "g4").note()
            .sound("gm_pizzicato_strings")
            .room(0.78)
            .gain(0.28)
            .slow(16),

        // Earthy bass - contrabass very slow
        seq("d2", "d2", "a2", "d2", "f2", "a2", "f2", "d2").note()
            .sound("gm_contrabass")
            .room(0.7)
            .gain(0.32)
            .lpf(450)
            .slow(20),

        // Bird-like accents - flute sparse calls
        seq("a5", "d6", "f6", "a5", "f6", "d6", "a5", "f5").note()
            .sound("gm_flute")
            .room(0.92)
            .gain(0.22)
            .lpf(2500)
            .slow(28),

        // Gentle woodwind atmosphere - clarinet sustained
        seq("f3", "a3", "c4", "f4", "e4", "c4", "a3", "f3").note()
            .sound("gm_clarinet")
            .room(0.85)
            .gain(0.2)
            .lpf(1600)
            .slow(32),

        // Soft mallet percussion - marimba very sparse
        seq("d4", "f4", "a4", "d5", "a4", "f4").note()
            .sound("gm_marimba")
            .room(0.75)
            .gain(0.18)
            .slow(36),

        // Ambient pad - choir aahs
        seq("d3", "f3", "a3", "d4").note()
            .sound("gm_choir_aahs")
            .room(0.9)
            .gain(0.16)
            .lpf(1300)
            .slow(40)
    ).cpm(56);  // Slower, more ambient
}

/**
 * Woods Combat music - Hunt begins
 */
export function createWoodsCombatPattern(): Pattern<any> {
    return stack(
        // Urgent forest pursuit - French horn
        seq("d3", "f3", "a3", "d4", "c4", "a3", "g3", "f3", "d3", "f3", "a3", "c4").note()
            .sound("gm_french_horn")
            .room(0.6)
            .gain(0.4)
            .lpf(1600)
            .slow(2),

        // Fast rustling intensity - violin tremolo
        seq("f4", "a4", "d5", "f5", "e5", "d5", "c5", "a4").note()
            .sound("gm_violin")
            .room(0.5)
            .gain(0.38)
            .lpf(2100)
            .slow(2),

        // Driving bass - tuba
        seq("d2", "d2", "a2", "d2", "d2", "f2", "d2", "d2").note()
            .sound("gm_tuba")
            .room(0.4)
            .gain(0.42)
            .lpf(500)
            .slow(2),

        // Alert calls - piccolo
        seq("a5", "d6", "f6", "a6", "g6", "f6").note()
            .sound("gm_piccolo")
            .room(0.6)
            .gain(0.35)
            .lpf(3000)
            .slow(3),

        // Rhythmic drive - timpani
        seq("d1", "d1", "a1", "d1").note()
            .sound("gm_timpani")
            .room(0.5)
            .gain(0.3)
            .slow(2),

        // Urgent strings - cello
        seq("d2", "a2", "f2", "d2").note()
            .sound("gm_cello")
            .room(0.55)
            .gain(0.35)
            .lpf(800)
            .slow(2)
    ).cpm(80);
}

/**
 * Wilds music - Adventurous exploration, exciting discovery
 * Extended ambient exploration with more space
 */
export function createWildsPattern(): Pattern<any> {
    return stack(
        // Adventurous ascending melody - oboe exploration theme with variation
        seq("g3", "bb3", "d4", "f4", "g4", "a4", "bb4", "d5",
            "f5", "g5", "a5", "bb5", "a5", "g5", "f5", "d5",
            "bb4", "g4", "f4", "d4", "bb3", "g3", "a3", "bb3").note()
            .sound("gm_oboe")
            .room(0.88)
            .gain(0.3)
            .lpf(1700)
            .slow(24),

        // Exciting rhythmic harmony - acoustic guitar more sparse
        seq("g3", "bb3", "d4", "g3", "a3", "d4", "f4", "a3",
            "bb3", "d4", "f4", "bb4", "a4", "f4", "d4", "bb3").note()
            .sound("gm_acoustic_guitar_steel")
            .room(0.78)
            .gain(0.28)
            .lpf(1500)
            .slow(16),

        // Driving adventurous bass - acoustic bass slower
        seq("g1", "g1", "d2", "g1", "g1", "a1", "bb1", "d2",
            "g1", "bb1", "d2", "f2", "d2", "bb1", "g1", "d2").note()
            .sound("gm_acoustic_bass")
            .room(0.7)
            .gain(0.35)
            .lpf(420)
            .slow(20),

        // Sparkling discovery accents - glockenspiel sparse
        seq("d5", "g5", "bb5", "d6", "f6", "g6", "bb6", "d7",
            "bb6", "g6", "f6", "d6").note()
            .sound("gm_glockenspiel")
            .room(0.92)
            .gain(0.28)
            .lpf(2800)
            .slow(32),

        // Mid-range excitement layer - clarinet sustained
        seq("bb3", "d4", "f4", "g4", "a4", "bb4", "d5", "f5",
            "d5", "bb4", "g4", "f4").note()
            .sound("gm_clarinet")
            .room(0.85)
            .gain(0.26)
            .lpf(1900)
            .slow(28),

        // Pulsing adventure rhythm - xylophone sparse
        seq("g4", "d5", "bb4", "g4", "a4", "bb4", "d5", "f5").note()
            .sound("gm_xylophone")
            .room(0.75)
            .gain(0.22)
            .slow(16),

        // Warm horn layer - sustained
        seq("g3", "bb3", "d4", "f4", "g4", "f4", "d4", "bb3").note()
            .sound("gm_french_horn")
            .room(0.8)
            .gain(0.24)
            .lpf(1400)
            .slow(36)
    ).cpm(64);  // Slower, more ambient exploration
}

/**
 * Wilds Combat music - Thrilling battle, heroic adventure
 */
export function createWildsCombatPattern(): Pattern<any> {
    return stack(
        // Heroic battle melody - trumpet fanfare
        seq("g3", "bb3", "d4", "f4", "g4", "a4", "bb4", "d5").note()
            .sound("gm_trumpet")
            .room(0.6)
            .gain(0.45)
            .lpf(1900)
            .slow(2),

        // Fast adventurous runs - violin
        seq("g4", "bb4", "d5", "f5", "g5", "a5", "bb5", "d6", "f6", "g6", "a6", "bb6").note()
            .sound("gm_violin")
            .room(0.55)
            .gain(0.4)
            .lpf(2400)
            .slow(2),

        // Driving powerful bass - tuba
        seq("g1", "g1", "d2", "g1", "g1", "a1", "bb1", "d2").note()
            .sound("gm_tuba")
            .room(0.45)
            .gain(0.48)
            .lpf(450)
            .slow(1.5),

        // Triumphant high accents - piccolo
        seq("d6", "g6", "bb6", "d7", "f7", "g7", "bb7", "d8").note()
            .sound("gm_piccolo")
            .room(0.65)
            .gain(0.38)
            .lpf(3200)
            .slow(2.5),

        // Mid-range heroic harmony - French horn
        seq("bb3", "d4", "f4", "g4", "a4", "bb4", "d5", "f5").note()
            .sound("gm_french_horn")
            .room(0.55)
            .gain(0.4)
            .lpf(2000)
            .slow(2),

        // Powerful rhythmic drive - trombone
        seq("g2", "g2", "d3", "bb2", "g2", "a2", "bb2", "d3").note()
            .sound("gm_trombone")
            .room(0.5)
            .gain(0.42)
            .lpf(700)
            .slow(1.5),

        // Epic percussion - timpani
        seq("g1", "d2", "g1", "bb1").note()
            .sound("gm_timpani")
            .room(0.55)
            .gain(0.35)
            .slow(2),

        // Brass power - trombone section
        seq("g2", "bb2", "d3", "f3").note()
            .sound("gm_brass_section")
            .room(0.6)
            .gain(0.38)
            .lpf(1600)
            .slow(2)
    ).cpm(88);  // Fast, thrilling tempo
}

/**
 * Frontier music - Edge of the unknown, pioneering spirit
 * Extended atmospheric journey with vast space
 */
export function createFrontierPattern(): Pattern<any> {
    return stack(
        // Pioneering progression - French horn with extended melodic arc
        seq("a3", "c4", "e4", "a4", "g4", "e4", "c4", "a3",
            "g3", "a3", "c4", "e4", "d4", "c4", "a3", "g3",
            "a3", "c4", "e4", "g4", "a4", "g4", "e4", "c4").note()
            .sound("gm_french_horn")
            .room(0.85)
            .gain(0.28)
            .lpf(1600)
            .slow(28),

        // Hope on the horizon - flute sparse and distant
        seq("e4", "a4", "c5", "e5", "d5", "c5", "a4", "e4",
            "g4", "a4", "c5", "d5", "e5", "d5", "c5", "a4").note()
            .sound("gm_flute")
            .room(0.78)
            .gain(0.26)
            .lpf(1900)
            .slow(24),

        // Steady march forward - cello slow and deliberate
        seq("a2", "e2", "a2", "c3", "a2", "e2", "a2", "g2",
            "a2", "c3", "e3", "a3", "e3", "c3", "a2", "e2").note()
            .sound("gm_cello")
            .room(0.65)
            .gain(0.32)
            .lpf(500)
            .slow(20),

        // Distant promise - glockenspiel very sparse
        seq("a5", "c6", "e6", "a6", "g6", "e6", "c6", "a5").note()
            .sound("gm_glockenspiel")
            .room(0.92)
            .gain(0.24)
            .lpf(2600)
            .slow(36),

        // Warm strings - viola sustained
        seq("e3", "a3", "c4", "e4", "d4", "c4", "a3", "e3").note()
            .sound("gm_viola")
            .room(0.8)
            .gain(0.24)
            .lpf(1400)
            .slow(32),

        // Gentle accompaniment - harp extremely sparse
        seq("a3", "e4", "a4", "c5", "e5", "a5").note()
            .sound("gm_orchestral_harp")
            .room(0.88)
            .gain(0.22)
            .slow(40),

        // Deep foundation - contrabass
        seq("a1", "e2", "a2", "c3").note()
            .sound("gm_contrabass")
            .room(0.75)
            .gain(0.28)
            .lpf(350)
            .slow(32)
    ).cpm(58);  // Slower, more vast and atmospheric
}

/**
 * Frontier Combat music - Desperate survival
 */
export function createFrontierCombatPattern(): Pattern<any> {
    return stack(
        // Desperate struggle - trumpet
        seq("a3", "c4", "e4", "a4", "g4", "f4", "e4", "c4").note()
            .sound("gm_trumpet")
            .room(0.5)
            .gain(0.43)
            .lpf(1800)
            .slow(2),

        // Survival instinct - violin
        seq("e4", "a4", "c5", "e5", "d5", "c5", "b4", "a4", "c5", "e5", "a5", "c6").note()
            .sound("gm_violin")
            .room(0.4)
            .gain(0.4)
            .lpf(2200)
            .slow(2),

        // Relentless drive - tuba
        seq("a2", "a2", "e2", "a2", "a2", "c3", "a2", "a2").note()
            .sound("gm_tuba")
            .room(0.3)
            .gain(0.46)
            .lpf(600)
            .slow(1.5),

        // Edge of danger - piccolo
        seq("a5", "c6", "e6", "a6", "g6", "e6", "c6", "a5").note()
            .sound("gm_piccolo")
            .room(0.5)
            .gain(0.38)
            .lpf(3100)
            .slow(2),

        // Heavy foundation - timpani
        seq("a1", "a1", "e1", "a1").note()
            .sound("gm_timpani")
            .room(0.4)
            .gain(0.35)
            .slow(3),

        // Urgent brass - trombone
        seq("a2", "e3", "c3", "a2").note()
            .sound("gm_trombone")
            .room(0.45)
            .gain(0.4)
            .lpf(900)
            .slow(2),

        // Driving strings - cello
        seq("a1", "e2", "a2", "c3").note()
            .sound("gm_cello")
            .room(0.4)
            .gain(0.38)
            .lpf(700)
            .slow(2)
    ).cpm(86);
}

/**
 * Museum music - Casual elevator/Pokémon Center style
 * Gentle, soothing atmosphere with simple melodic patterns
 * Calming background music for relaxation
 */
export function createMuseumPattern(): Pattern<any> {
    return stack(
        // Simple, friendly flute melody - Pokémon Center style
        seq("d5", "a4", "f4", "g4", "a4", "d5", "e5", "f5").note()
            .sound("gm_flute")
            .gain(0.32)
            .room(0.65)
            .lpf(2000)
            .slow(4),

        // Warm acoustic guitar arpeggios - gentle picking
        seq("d3", "f3", "a3", "d4", "a3", "f3").note()
            .sound("gm_acoustic_guitar_nylon")
            .gain(0.28)
            .room(0.6)
            .slow(3),

        // Soft bass line - simple walking pattern
        seq("d2", "d2", "a2", "f2", "g2", "a2").note()
            .sound("gm_acoustic_bass")
            .gain(0.3)
            .room(0.5)
            .lpf(400)
            .slow(6),

        // Gentle electric piano chords - warm and comforting
        seq("d4", "f4", "a4").note()
            .sound("gm_electric_piano_1")
            .gain(0.26)
            .room(0.7)
            .slow(8),

        // Soothing vibraphone - soft accents
        seq("a4", "f4", "d4", "f4", "a4", "d5").note()
            .sound("gm_vibraphone")
            .gain(0.24)
            .room(0.75)
            .slow(6),

        // Bright glockenspiel - cheerful sparkles
        seq("d6", "a5", "f5", "a5").note()
            .sound("gm_glockenspiel")
            .gain(0.22)
            .room(0.7)
            .slow(8),

        // Soft string pad - comforting background
        seq("d3", "a3", "f3").note()
            .sound("gm_string_ensemble_1")
            .gain(0.2)
            .room(0.75)
            .lpf(1200)
            .slow(12)
    ).cpm(72); // Gentle, relaxed tempo
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
        if (dimensionOrLevel === 11) return createTensionCombatPattern(); // Home (surface)
        if (dimensionOrLevel === 12) return createWoodsCombatPattern(); // Woods
        if (dimensionOrLevel === 13) return createWildsCombatPattern(); // Wilds
        if (dimensionOrLevel === 14) return createFrontierCombatPattern(); // Frontier

        // Dimensions
        if (dimensionOrLevel === 0) return createTensionCombatPattern(); // Surface (fallback)
        if (dimensionOrLevel === 1) return createPeacefulCombatPattern(); // Interior
        if (dimensionOrLevel === 2) return createCaveCombatPattern(); // Underground

        // Default: surface/tension
        return createTensionCombatPattern();
    }

    // Non-combat music
    // Zone levels (offset by 10)
    if (dimensionOrLevel === 11) return createTensionPattern(); // Home (surface)
    if (dimensionOrLevel === 12) return createWoodsPattern(); // Woods
    if (dimensionOrLevel === 13) return createWildsPattern(); // Wilds
    if (dimensionOrLevel === 14) return createFrontierPattern(); // Frontier

    // Dimensions
    if (dimensionOrLevel === 0) return createTensionPattern(); // Surface (fallback)
    if (dimensionOrLevel === 1) return createPeacefulPattern(); // Interior
    if (dimensionOrLevel === 2) return createCavePattern(); // Underground

    // Default: surface/tension
    return createTensionPattern();
}
