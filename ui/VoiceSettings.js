// VoiceSettings.js
// Helpers for voice settings, audio context, and typing SFX for MessageManager

// Generate deterministic voice/settings based on the character name.
export function getVoiceSettingsForName(name) {
    try {
        if (!name) return null;
        const n = (name || '').toString();
        // simple hash: sum of char codes
        let hash = 0;
        for (let i = 0; i < n.length; i++) {
            hash = (hash * 31 + n.charCodeAt(i)) >>> 0;
        }
        const lower = n.trim().toLowerCase();
        if (lower === 'crayn' || lower.indexOf('crayn') !== -1) {
            return {
                name: 'Crayn',
                base: 120,
                wave1: 'sawtooth',
                wave2: 'sine',
                bandMul: 1.6,
                peak: 0.18
            };
        }
        if (lower.indexOf('merchant') !== -1 || lower.indexOf('shop') !== -1 || lower.indexOf('vendor') !== -1) {
            const base = 90 + (hash % 80);
            return {
                name: n,
                base: base,
                wave1: (['sawtooth','triangle','square','sine'][hash % 4]),
                wave2: (['sine','triangle','sawtooth','square'][(hash >> 2) % 4]),
                bandMul: 1.5 + ((hash % 20) / 100),
                peak: 0.16 + ((hash % 20) / 200)
            };
        }
        const base = 80 + (hash % 160);
        const waveChoices = ['sine','triangle','sawtooth','square'];
        const wave1 = waveChoices[hash % waveChoices.length];
        const wave2 = waveChoices[(hash >> 3) % waveChoices.length];
        const peak = 0.08 + ( (hash % 80) / 400 );
        const bandMul = 1.4 + ((hash % 30) / 100);
        return {
            name: n,
            base: base,
            wave1: wave1,
            wave2: wave2,
            bandMul: bandMul,
            peak: peak
        };
    } catch (e) {
        return null;
    }
}

// Ensure we have an AudioContext and a small master gain for typing blips.
export function ensureTypingAudio(manager) {
    try {
        if (!manager._typingAudioContext) {
            if (manager.game && manager.game.soundManager && manager.game.soundManager.audioContext) {
                manager._typingAudioContext = manager.game.soundManager.audioContext;
            } else if (manager.game && manager.game.soundManager && typeof manager.game.soundManager.resumeAudioContext === 'function') {
                try { manager.game.soundManager.resumeAudioContext(); } catch (e) {}
                if (manager.game.soundManager.audioContext) manager._typingAudioContext = manager.game.soundManager.audioContext;
            }
        }
        if (!manager._typingAudioContext && typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)) {
            try {
                manager._typingAudioContext = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) {}
        }
        if (manager._typingAudioContext && !manager._typingMasterGain) {
            try {
                manager._typingMasterGain = manager._typingAudioContext.createGain();
                manager._typingMasterGain.gain.value = 1.6;
                manager._typingMasterGain.connect(manager._typingAudioContext.destination);
            } catch (e) {
                manager._typingMasterGain = null;
            }
        }
    } catch (e) {}
}

// Play a short, characterful blip for per-letter typing sound.
// Accepts optional voiceSettings (from getVoiceSettingsForName) to tune pitch/timbre.
export function playTypingBlip(manager, voiceSettings) {
    try {
        if (!manager.typewriterSfxEnabled) return;
        if (manager.game && manager.game.soundManager && manager.game.soundManager.sfxEnabled === false) return;
        ensureTypingAudio(manager);
        const ctx = manager._typingAudioContext;
        const master = manager._typingMasterGain;
        if (!ctx || !master) return;
        const now = ctx.currentTime;
        const o1 = ctx.createOscillator();
        const o2 = ctx.createOscillator();
        const merger = ctx.createGain();
        const band = ctx.createBiquadFilter();
        const g = ctx.createGain();
        const vs = voiceSettings || {};
        let derived = null;
        try {
            if (vs && vs.name && manager._voiceCache && manager._voiceCache.has(vs.name)) {
                derived = manager._voiceCache.get(vs.name);
            }
        } catch (e) { derived = null; }
        if (!derived) {
            const seedStr = (vs && vs.name) ? vs.name : ('' + (vs.base || Math.floor(Math.random()*1000)));
            let seed = 0;
            for (let i = 0; i < seedStr.length; i++) seed = (seed * 131 + seedStr.charCodeAt(i)) >>> 0;
            const pick = (arr) => arr[seed % arr.length];
            const rand = (min, max) => {
                seed = (seed * 1664525 + 1013904223) >>> 0;
                const r = (seed % 1000) / 1000;
                return min + r * (max - min);
            };
            const waveChoices = ['sine','triangle','sawtooth','square'];
            const base = (typeof vs.base === 'number') ? vs.base : Math.round(70 + (seed % 200));
            derived = {
                name: (vs && vs.name) ? vs.name : 'unknown',
                base: base,
                wave1: vs.wave1 || pick(waveChoices),
                wave2: vs.wave2 || pick(waveChoices),
                bandMul: (typeof vs.bandMul === 'number') ? vs.bandMul : (1.2 + rand(0, 1.2)),
                peak: (typeof vs.peak === 'number') ? vs.peak : (0.06 + rand(0, 0.26)),
                harmonicRatio: (typeof vs.harmonicRatio === 'number') ? vs.harmonicRatio : (1.7 + rand(-0.12, 0.4)),
                detuneRange: (typeof vs.detuneRange === 'number') ? vs.detuneRange : Math.max(6, Math.round(rand(6, 18))),
                pan: typeof vs.pan === 'number' ? vs.pan : (rand(-0.5, 0.5)),
                attack: (typeof vs.attack === 'number') ? vs.attack : (0.004 + rand(0, 0.008)),
                decay: (typeof vs.decay === 'number') ? vs.decay : (0.09 + rand(0, 0.06)),
                masterGain: (typeof vs.masterGain === 'number') ? vs.masterGain : (1.0 + rand(-0.25, 0.6))
            };
            try { if (derived && derived.name && manager._voiceCache) manager._voiceCache.set(derived.name, derived); } catch (e) {}
        }
        const wave1 = derived.wave1;
        const wave2 = derived.wave2;
        const base = derived.base;
        const harmonicRatio = derived.harmonicRatio || 1.9;
        const detune = (Math.random() * derived.detuneRange) - (derived.detuneRange/2);
        const bandMul = derived.bandMul;
        const peak = derived.peak;
        try { o1.type = wave1; } catch (e) {}
        try { o2.type = wave2; } catch (e) {}
        o1.frequency.setValueAtTime(base, now);
        o2.frequency.setValueAtTime(base * 1.9 + detune, now);
        try { band.type = 'bandpass'; } catch (e) {}
        band.frequency.setValueAtTime(base * bandMul + (Math.random() * 18 - 9), now);
        band.Q.setValueAtTime(3 + (Math.random() * 3), now);
        g.gain.setValueAtTime(0.001 + (peak * 0.002), now);
        try { g.gain.linearRampToValueAtTime((peak) * derived.masterGain, now + derived.attack); } catch (e) {}
        try { g.gain.exponentialRampToValueAtTime(0.00005, now + derived.decay); } catch (e) {}
        o1.connect(merger);
        o2.connect(merger);
        merger.connect(band);
        band.connect(g);
        let finalNode = g;
        try {
            if (typeof ctx.createStereoPanner === 'function') {
                const p = ctx.createStereoPanner();
                p.pan.setValueAtTime((derived && typeof derived.pan === 'number') ? derived.pan : 0, now);
                g.connect(p);
                finalNode = p;
            }
        } catch (e) {}
        finalNode.connect(master);
        try { o1.start(now); o2.start(now); } catch (e) {}
        try { o1.stop(now + Math.max(0.06, derived.decay * 0.8)); o2.stop(now + Math.max(0.06, derived.decay * 0.8)); } catch (e) {}
        if (Math.random() < 0.03) {
            try { o1.frequency.setValueAtTime(base * (0.85 + Math.random() * 0.3), now + 0.02); } catch (e) {}
        }
    } catch (e) {}
}