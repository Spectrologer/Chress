/**
 * Music Patterns - Strudel Pattern objects for procedural game music
 */

import { note, s, stack, seq, type Pattern } from '@strudel/core';

/**
 * Cave/Underground music - Cavernous, mysterious with glimmer of hope
 */
export function createCavePattern(): Pattern<any> {
    return stack(
        // Main melodic line with rhythmic variation and harmony
        seq("c3", "eb3", "f3", "ab3").note()
            .sound("sawtooth")
            .room(0.95)
            .gain(0.13)
            .lpf(900)
            .slow(4)
            .struct("1*<1 2 1 1>"),  // Rhythmic variation - speed up on 2nd beat

        // Arpeggiated countermelody for movement
        seq("g4", "c5", "eb5", "g5", "f5", "c5").note()
            .sound("triangle")
            .room(0.9)
            .gain(0.1)
            .lpf(1200)
            .slow(3),

        // Deep bass with rhythmic pulse
        seq("c1", "g1", "f1", "eb1").note()
            .sound("sawtooth")
            .room(0.85)
            .gain(0.2)
            .lpf(250)
            .slow(4)
            .struct("1*<1 1 2 1>")  // Add pulse on 3rd beat
    ).cpm(58);  // Slightly faster tempo
}

/**
 * Peaceful interior music - Warm, welcoming
 * Extended 10-second loop with melodic variation
 */
export function createPeacefulPattern(): Pattern<any> {
    return stack(
        // Main melody - A D F A D F A C B G F G A D C E D (first phrase)

        // Variation melody - Extended phrase for more movement
        seq("a4", "d5", "f5", "a4", "d5", "f5", "a4", "c5", "b4", "g4", "f4", "g4", "a4", "d5", "c5", "e5", "d5", "f5", "e5", "d5", "c5", "a4", "g4", "f4", "e4", "d4").note()
            .sound("triangle")
            .room(0.6)
            .gain(0.18)
            .lpf(2100)
            .slow(8.5),


        // Bass line - warm foundation following the melody
        seq("d2", "a2", "d2", "f2", "a2", "f2", "c2", "g2", "e2", "a2", "d2", "c2", "e2", "d2").note()
            .sound("sawtooth")
            .gain(0.2)
            .room(0.5)
            .lpf(350)
            .slow(8),

        // Mid-range harmony - adds warmth
        seq("f3", "a3", "d4", "f3", "c4", "g3", "e3", "a3", "d4", "c4", "e4", "d4").note()
            .sound("triangle")
            .room(0.65)
            .gain(0.15)
            .lpf(1600)
            .slow(8.5),

       

        // Rhythmic pulse - gentle movement
        seq("d1", "a1", "f1", "c1", "g1", "e1", "a1", "d1").note()
            .sound("sawtooth")
            .gain(0.16)
            .room(0.6)
            .lpf(280)
            .slow(8),

        // Sub-bass warmth
        seq("d0", "a0", "f0", "c0", "g0", "e0").note()
            .sound("sine")
            .room(0.7)
            .gain(0.14)
            .lpf(200)
            .slow(8)
    ).cpm(68);  // Slightly faster, more upbeat tempo
}

/**
 * Tension/Surface music - Dreamy, welcoming Twin Peaks atmosphere
 * Extended 5-second loop with more melodic variation
 */
export function createTensionPattern(): Pattern<any> {
    return stack(
        // Warm jazzy chords - expanded progression with more chromatic movement
        seq("c3", "e3", "a3", "f3", "c3", "g3", "d3", "e3", "a3", "g3", "f3", "d3", "e3", "g3", "c3", "e3").note()
            .sound("triangle")
            .room(0.92)
            .gain(0.12)
            .lpf(1400)
            .slow(5),

        // Hopeful, nostalgic melody - more variation and movement
        seq("c4", "e4", "g4", "a4", "c5", "a4", "g4", "e4", "d4", "f4", "a4", "g4", "e4", "c4", "d4", "e4").note()
            .sound("triangle")
            .room(0.88)
            .gain(0.14)
            .lpf(1800)
            .slow(5),

        // Gentle bass - more rhythmic variation
        seq("c1", "g1", "c1", "g1", "a1", "g1", "f1", "e1", "c1", "g1").note()
            .sound("sawtooth")
            .room(0.82)
            .gain(0.17)
            .lpf(260)
            .slow(5),

        // Warm mid-range harmony - expanded with rhythmic interest
        seq("e3", "g3", "a3", "g3", "e3", "g3", "f3", "a3", "c4", "a3", "g3", "e3").note()
            .sound("triangle")
            .room(0.85)
            .gain(0.11)
            .lpf(1600)
            .slow(7.5),

        // Gentle rhythmic pulse - more variation and movement
        seq("c2", "e2", "g2", "e2", "d2", "f2", "a2", "f2", "e2", "g2").note()
            .sound("sawtooth")
            .room(0.8)
            .gain(0.1)
            .lpf(500)
            .slow(5),

        // New subtle bass harmony - warmth and richness
        seq("c0", "g0", "a0", "f0", "c0", "e0").note()
            .sound("sine")
            .room(0.75)
            .gain(0.12)
            .lpf(180)
            .slow(5)
    ).cpm(60);  //
}

/**
 * Cave Combat music - Intense, urgent, dangerous
 */
export function createCaveCombatPattern(): Pattern<any> {
    return stack(
        // Aggressive melodic line with rapid movement
        seq("c3", "eb3", "f3", "ab3", "g3", "f3", "eb3", "c3").note()
            .sound("sawtooth")
            .room(0.6)
            .gain(0.18)
            .lpf(1200)
            .slow(2)
            .struct("1*<1 2 2 1>"),

        // Fast arpeggios for intensity
        seq("g4", "c5", "eb5", "g5", "f5", "eb5", "c5", "g4", "c5", "eb5", "g5", "c6").note()
            .sound("triangle")
            .room(0.5)
            .gain(0.14)
            .lpf(1600)
            .slow(2),

        // Driving rhythmic bass
        seq("c1", "c1", "g1", "c1", "c1", "f1", "c1", "c1").note()
            .sound("sawtooth")
            .room(0.4)
            .gain(0.23)
            .lpf(300)
            .slow(2),

        // Pulsing danger motif
        seq("c2", "c2", "eb2", "c2", "f2", "c2", "g2", "c2").note()
            .sound("sawtooth")
            .room(0.3)
            .gain(0.2)
            .lpf(400)
            .slow(1)
    ).cpm(78);  // Fast, intense tempo
}

/**
 * Peaceful Combat music - Alert but controlled
 */
export function createPeacefulCombatPattern(): Pattern<any> {
    return stack(
        // Alert chord progression
        seq("c3", "e3", "g3", "c3", "d3", "f3", "a3", "d3").note()
            .sound("triangle")
            .room(0.5)
            .gain(0.17)
            .lpf(1600)
            .slow(2),

        // Urgent melody
        seq("c4", "d4", "e4", "g4", "a4", "g4", "e4", "d4", "e4", "g4", "a4", "c5").note()
            .sound("triangle")
            .room(0.4)
            .gain(0.2)
            .lpf(1800)
            .slow(2),

        // Rhythmic bass drive
        seq("c2", "g2", "c2", "g2", "c2", "a2", "c2", "g2").note()
            .sound("sawtooth")
            .room(0.3)
            .gain(0.2)
            .lpf(500)
            .slow(2),

        // Active accent layer
        seq("e5", "g5", "c6", "e6", "d6", "c6", "g5", "e5").note()
            .sound("triangle")
            .room(0.6)
            .gain(0.12)
            .lpf(2600)
            .slow(3)
    ).cpm(84);  // Brisk, alert tempo
}

/**
 * Surface Combat music - Alert but still warm and hopeful
 */
export function createTensionCombatPattern(): Pattern<any> {
    return stack(
        // Energized chords - major tonality with urgency
        seq("c3", "e3", "a3", "f3", "c3", "g3", "d3", "e3").note()
            .sound("triangle")
            .room(0.7)
            .gain(0.16)
            .lpf(1700)
            .slow(2),

        // Determined melody - hopeful but urgent
        seq("c4", "e4", "g4", "a4", "c5", "d5", "c5", "a4", "g4", "e4", "g4", "e4").note()
            .sound("triangle")
            .room(0.75)
            .gain(0.18)
            .lpf(2000)
            .slow(3),

        // Driving bass - confident rhythm
        seq("c1", "c1", "g1", "g1", "c1", "c1", "a1", "g1").note()
            .sound("sawtooth")
            .room(0.55)
            .gain(0.2)
            .lpf(320)
            .slow(2),

        // Bright shimmer - heroic sparkle
        seq("c5", "e5", "g5", "c6", "d6", "c6", "g5", "e5").note()
            .sound("triangle")
            .room(0.8)
            .gain(0.13)
            .lpf(2800)
            .slow(3),

        // Warm urgency layer - encouraging
        seq("e3", "g3", "a3", "c4", "a3", "g3").note()
            .sound("triangle")
            .room(0.65)
            .gain(0.14)
            .lpf(1800)
            .slow(3),

        // Strong foundation
        seq("c0", "g0", "c0", "g0").note()
            .sound("sine")
            .room(0.65)
            .gain(0.16)
            .lpf(200)
            .slow(4),

        // Confident pulse
        seq("c2", "e2", "g2", "e2").note()
            .sound("sawtooth")
            .room(0.5)
            .gain(0.15)
            .lpf(600)
            .slow(2)
    ).cpm(78);  // Upbeat and encouraging
}

/**
 * Woods music - Natural, mysterious forest atmosphere
 */
export function createWoodsPattern(): Pattern<any> {
    return stack(
        // Forest breeze melody
        seq("d3", "f3", "a3", "d4", "c4", "a3", "f3", "d3").note()
            .sound("triangle")
            .room(0.85)
            .gain(0.14)
            .lpf(1300)
            .slow(4),

        // Rustling leaves - higher register
        seq("f4", "a4", "d5", "f5", "e5", "d5", "a4", "f4").note()
            .sound("triangle")
            .room(0.75)
            .gain(0.12)
            .lpf(1900)
            .slow(3),

        // Earthy bass
        seq("d2", "a2", "d2", "f2").note()
            .sound("sawtooth")
            .room(0.6)
            .gain(0.17)
            .lpf(400)
            .slow(4),

        // Bird-like accents
        seq("a5", "d6", "f6", "a5").note()
            .sound("triangle")
            .room(0.9)
            .gain(0.09)
            .lpf(2500)
            .slow(8)
    ).cpm(62);
}

/**
 * Woods Combat music - Hunt begins
 */
export function createWoodsCombatPattern(): Pattern<any> {
    return stack(
        // Urgent forest pursuit
        seq("d3", "f3", "a3", "d4", "c4", "a3", "g3", "f3", "d3", "f3", "a3", "c4").note()
            .sound("triangle")
            .room(0.6)
            .gain(0.18)
            .lpf(1500)
            .slow(2),

        // Fast rustling intensity
        seq("f4", "a4", "d5", "f5", "e5", "d5", "c5", "a4").note()
            .sound("triangle")
            .room(0.5)
            .gain(0.16)
            .lpf(2000)
            .slow(2),

        // Driving bass
        seq("d2", "d2", "a2", "d2", "d2", "f2", "d2", "d2").note()
            .sound("sawtooth")
            .room(0.4)
            .gain(0.21)
            .lpf(500)
            .slow(2),

        // Alert calls
        seq("a5", "d6", "f6", "a6", "g6", "f6").note()
            .sound("triangle")
            .room(0.6)
            .gain(0.12)
            .lpf(2800)
            .slow(3)
    ).cpm(80);
}

/**
 * Wilds music - Adventurous exploration, exciting discovery
 */
export function createWildsPattern(): Pattern<any> {
    return stack(
        // Adventurous ascending melody - exploration theme
        seq("g3", "bb3", "d4", "f4", "g4", "a4", "bb4", "d5", "f5", "g5", "a5", "bb5").note()
            .sound("triangle")
            .room(0.85)
            .gain(0.16)
            .lpf(1600)
            .slow(3),

        // Exciting rhythmic harmony - forward momentum
        seq("g3", "bb3", "d4", "g3", "a3", "d4", "f4", "a3").note()
            .sound("triangle")
            .room(0.75)
            .gain(0.14)
            .lpf(1400)
            .slow(2),

        // Driving adventurous bass - propulsive energy
        seq("g1", "g1", "d2", "g1", "g1", "a1", "bb1", "d2").note()
            .sound("sawtooth")
            .room(0.65)
            .gain(0.2)
            .lpf(380)
            .slow(2),

        // Sparkling discovery accents - wonder and excitement
        seq("d5", "g5", "bb5", "d6", "f6", "g6", "bb6", "d7").note()
            .sound("triangle")
            .room(0.9)
            .gain(0.12)
            .lpf(2600)
            .slow(4),

        // Mid-range excitement layer - adventure calls
        seq("bb3", "d4", "f4", "g4", "a4", "bb4", "d5", "f5").note()
            .sound("triangle")
            .room(0.8)
            .gain(0.12)
            .lpf(1800)
            .slow(3),

        // Pulsing adventure rhythm
        seq("g2", "g2", "d3", "bb2", "g2", "a2", "bb2", "d3").note()
            .sound("sawtooth")
            .room(0.7)
            .gain(0.16)
            .lpf(550)
            .slow(2)
    ).cpm(72);  // Upbeat, adventurous tempo
}

/**
 * Wilds Combat music - Thrilling battle, heroic adventure
 */
export function createWildsCombatPattern(): Pattern<any> {
    return stack(
        // Heroic battle melody - exciting and bold
        seq("g3", "bb3", "d4", "f4", "g4", "a4", "bb4", "d5").note()
            .sound("triangle")
            .room(0.6)
            .gain(0.21)
            .lpf(1700)
            .slow(2),

        // Fast adventurous runs - excitement and danger
        seq("g4", "bb4", "d5", "f5", "g5", "a5", "bb5", "d6", "f6", "g6", "a6", "bb6").note()
            .sound("triangle")
            .room(0.55)
            .gain(0.18)
            .lpf(2200)
            .slow(2),

        // Driving powerful bass - heroic foundation
        seq("g1", "g1", "d2", "g1", "g1", "a1", "bb1", "d2").note()
            .sound("sawtooth")
            .room(0.45)
            .gain(0.23)
            .lpf(420)
            .slow(1.5),

        // Triumphant high accents - victory calls
        seq("d6", "g6", "bb6", "d7", "f7", "g7", "bb7", "d8").note()
            .sound("triangle")
            .room(0.65)
            .gain(0.14)
            .lpf(3000)
            .slow(2.5),

        // Mid-range heroic harmony - courage and determination
        seq("bb3", "d4", "f4", "g4", "a4", "bb4", "d5", "f5").note()
            .sound("triangle")
            .room(0.55)
            .gain(0.17)
            .lpf(1900)
            .slow(2),

        // Powerful rhythmic drive
        seq("g2", "g2", "d3", "bb2", "g2", "a2", "bb2", "d3").note()
            .sound("sawtooth")
            .room(0.5)
            .gain(0.2)
            .lpf(650)
            .slow(1.5)
    ).cpm(88);  // Fast, thrilling tempo
}

/**
 * Frontier music - Edge of the unknown, pioneering spirit
 */
export function createFrontierPattern(): Pattern<any> {
    return stack(
        // Pioneering progression
        seq("a3", "c4", "e4", "a4", "g4", "e4", "c4", "a3").note()
            .sound("triangle")
            .room(0.8)
            .gain(0.15)
            .lpf(1500)
            .slow(4),

        // Hope on the horizon
        seq("e4", "a4", "c5", "e5", "d5", "c5", "a4", "e4").note()
            .sound("triangle")
            .room(0.7)
            .gain(0.14)
            .lpf(1800)
            .slow(3),

        // Steady march forward
        seq("a2", "e2", "a2", "c3", "a2", "e2").note()
            .sound("sawtooth")
            .room(0.5)
            .gain(0.18)
            .lpf(450)
            .slow(4),

        // Distant promise
        seq("a5", "c6", "e6", "a6").note()
            .sound("triangle")
            .room(0.9)
            .gain(0.1)
            .lpf(2400)
            .slow(8)
    ).cpm(66);
}

/**
 * Frontier Combat music - Desperate survival
 */
export function createFrontierCombatPattern(): Pattern<any> {
    return stack(
        // Desperate struggle
        seq("a3", "c4", "e4", "a4", "g4", "f4", "e4", "c4").note()
            .sound("triangle")
            .room(0.5)
            .gain(0.19)
            .lpf(1700)
            .slow(2),

        // Survival instinct
        seq("e4", "a4", "c5", "e5", "d5", "c5", "b4", "a4", "c5", "e5", "a5", "c6").note()
            .sound("triangle")
            .room(0.4)
            .gain(0.18)
            .lpf(2100)
            .slow(2),

        // Relentless drive
        seq("a2", "a2", "e2", "a2", "a2", "c3", "a2", "a2").note()
            .sound("sawtooth")
            .room(0.3)
            .gain(0.22)
            .lpf(550)
            .slow(1.5),

        // Edge of danger
        seq("a5", "c6", "e6", "a6", "g6", "e6", "c6", "a5").note()
            .sound("triangle")
            .room(0.5)
            .gain(0.14)
            .lpf(2900)
            .slow(2),

        // Heavy foundation
        seq("a1", "a1", "e1", "a1").note()
            .sound("sawtooth")
            .room(0.4)
            .gain(0.21)
            .lpf(280)
            .slow(3)
    ).cpm(86);
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
