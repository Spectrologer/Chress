import logger from '../core/logger.js';
import { fitTextToContainer } from './TextFitter.js';

export class MessageManager {
    constructor(game) {
        this.game = game;

        // UI elements
        this.messageLogOverlay = document.getElementById('messageLogOverlay');
        this.messageLogContent = document.getElementById('messageLogContent');
        this.closeMessageLogButton = document.getElementById('closeMessageLogButton');

        // UI state
        this.currentOverlayTimeout = null;
        // Typewriter state
        this.currentTypewriterInterval = null;
        this.typewriterSpeed = 28; // ms per character (tweakable)
        // Typing audio helpers
        this._typingAudioContext = null; // will reference SoundManager's audioContext when possible
        this._typingMasterGain = null;
        // Cache deterministic per-character voice parameter sets so each
        // character's blips stay consistent and distinctive.
        this._voiceCache = new Map(); // name -> voiceSettings
    // Current voice settings for the active dialogue (null when none)
    this._currentVoiceSettings = null;
        // Allow toggling the per-letter SFX
        this.typewriterSfxEnabled = true;
        this.noteIdCounter = 0;
        this.activeNotes = new Map(); // id -> timeoutId
    }

    setupMessageLogButton() {
        const messageLogButton = document.getElementById('message-log-button');
        if (messageLogButton) {
            // Desktop click
            messageLogButton.addEventListener('click', () => {
                this.handleMessageLogClick();
            });

            // Mobile / pointer
            messageLogButton.addEventListener('pointerdown', (e) => {
                try { e.preventDefault(); } catch (err) {}
                this.handleMessageLogClick();
            });
        }
    }

    handleMessageLogClick() {
        this.messageLogContent.innerHTML = '';
        if (this.game.messageLog.length === 0) {
            this.messageLogContent.innerHTML = '<p>No messages yet.</p>';
        } else {
            // Show newest messages first
            [...this.game.messageLog].reverse().forEach(msg => {
                const p = document.createElement('p');
                p.style.fontVariant = 'small-caps';
                p.style.fontWeight = 'bold';
                p.innerHTML = msg; // Use innerHTML to support messages with HTML tags
                this.messageLogContent.appendChild(p);
            });
        }
        this.messageLogOverlay.classList.add('show');
    }

    handlePenneInteractionMessage() {
        // Do not show the Penne message if a sign message is already displayed.
        if (this.game.displayingMessageForSign) {
            return;
        }

        const messageOverlay = document.getElementById('messageOverlay');
        // Show message even if another is showing, to allow it to take priority
        // when both Penne and squig are present.
        this.showOverlayMessage('<span class="character-name">Penne</span><br>Give me meat!', 'assets/fauna/lion.png');
    }

    hidePenneInteractionMessage() {
        const messageOverlay = document.getElementById('messageOverlay');
        // Hide the overlay, but only if a sign message isn't the one being displayed.
        if (messageOverlay && messageOverlay.classList.contains('show') && !this.game.displayingMessageForSign) {
            messageOverlay.classList.remove('show');
        }
    }

    showOverlayMessageSilent(text, imageSrc) {
        // Silent variant: do not run the typewriter effect
        this.showMessage(text, imageSrc, true, false, false, false);
    }

    showOverlayMessage(text, imageSrc, isPersistent = false, isLargeText = false, useTypewriter = true) {
        this.showMessage(text, imageSrc, true, isPersistent, isLargeText, useTypewriter);
    }

    showMessage(text, imageSrc = null, useOverlay = false, isPersistent = false, isLargeText = false, useTypewriter = true) {
        const messageElementId = useOverlay ? 'messageOverlay' : 'messageBox';
        const messageElement = document.getElementById(messageElementId);
        logger.log(`showMessage called with text: "${text}", imageSrc: ${imageSrc}, useOverlay: ${useOverlay}, isPersistent: ${isPersistent}, isLargeText: ${isLargeText}`);
        let displayText = text;
        if (!displayText || displayText.trim() === '') {
            displayText = '[No message found for this note]';
            logger.warn('Note message is empty or undefined:', text);
        }
        if (messageElement) {
            logger.log(`${messageElementId} found, setting HTML content`);
            // Clear any existing overlay timeout
            if (this.currentOverlayTimeout) {
                clearTimeout(this.currentOverlayTimeout);
                this.currentOverlayTimeout = null;
            }

            // Use innerHTML to set content with image if provided. Wrap text
            // in `.dialogue-text` so styles are consistent across message types.
            if (imageSrc) {
                // Default thumbnail style: force a readable width while preserving aspect ratio
                let imgStyle = 'width: 128px; height: auto; max-height: 128px; display: block; margin: 0 auto 10px auto; image-rendering: pixelated;';
                // If this is the bow asset, rotate it 90deg CCW so it visually matches inventory orientation
                try {
                    if (typeof imageSrc === 'string' && imageSrc.toLowerCase().endsWith('/bow.png')) {
                        imgStyle += ' transform: rotate(-90deg); transform-origin: center center;';
                    }
                } catch (e) {}
                messageElement.innerHTML = `<img src="${imageSrc}" style="${imgStyle}"><div class="dialogue-text">${displayText}</div>`;
            } else {
                messageElement.innerHTML = `<div class="dialogue-text">${displayText}</div>`;
            }

            // Ensure dialogue text scales to fit in the overlay/panel on small devices
            try { fitTextToContainer(messageElement, { childSelector: '.dialogue-text', minFontSize: 12 }); } catch (e) {}

            // Add or remove the large-text class
            if (isLargeText) {
                messageElement.classList.add('large-text');
            } else {
                messageElement.classList.remove('large-text');
            }

            // Add a marker class for sign-specific styling (centering)
            messageElement.classList.add('show');
            messageElement.classList.add('sign-dialogue');
            logger.log("Message set and show class added");

            // Clear any existing typewriter interval before starting a new one
            if (this.currentTypewriterInterval) {
                clearInterval(this.currentTypewriterInterval);
                this.currentTypewriterInterval = null;
            }

            // Start typewriter animation for text nodes only when appropriate.
            // After typing completes, auto-hide (if requested) will be scheduled.
            // If typewriter is disabled (speed <= 0) or useTypewriter === false
            // we skip the animation and immediately schedule auto-hide.
            const scheduleAutoHide = () => {
                if (useOverlay && !isPersistent) {
                    // Start auto-hide 2s after typing completes
                    this.game.animationScheduler.createSequence()
                        .wait(2000)
                        .then(() => {
                            if (messageElement.classList.contains('show')) {
                                messageElement.classList.remove('show');
                                this.currentOverlayTimeout = null;
                                logger.log("Auto-hiding overlay message due to timeout.");
                            }
                        })
                        .start();
                }
            };

            // Only apply the typewriter if requested AND the message appears to be
            // character/dialogue text (we detect this by presence of a .character-name
            // element). Merchant/Barter windows use their own explicit typewriter
            // calls elsewhere, so most confirmations/instructions will pass
            // useTypewriter=false.
            try {
                const hasCharacterName = !!messageElement.querySelector && !!messageElement.querySelector('.character-name');
                if (useTypewriter && hasCharacterName && this.typewriterSpeed > 0) {
                    this._typewriter(messageElement, this.typewriterSpeed, scheduleAutoHide.bind(this));
                } else {
                    // No typewriter: ensure text is visible immediately, then schedule auto-hide
                    scheduleAutoHide.bind(this)();
                }
            } catch (e) {
                // Fallback to showing immediately
                scheduleAutoHide.bind(this)();
            }
        } else {
            logger.error(`${messageElementId} element not found`);
        }
    }

    // Internal: typewriter effect that reveals text nodes inside the given
    // element one character at a time. Calls onComplete() when finished.
    _typewriter(element, speed, onComplete) {
        try {
            // Wrap onComplete so we can reset per-dialogue voice settings when typing ends
            const completeWrapper = () => {
                try { this._currentVoiceSettings = null; } catch (e) {}
                try { onComplete && onComplete(); } catch (e) {}
            };

            if (!speed || speed <= 0) {
                // No animation, just call complete
                completeWrapper();
                return;
            }

            // Collect text nodes in document order, but skip any text nodes that are
            // descendants of an element with class 'character-name' so character
            // names remain visible immediately.
            const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
            const textNodes = [];
            while (walker.nextNode()) {
                const node = walker.currentNode;
                // Skip empty or whitespace-only text nodes (these often come from
                // template literal indentation and can cause long invisible
                // typing delays when the typewriter reveals them character-by-character).
                if (!node || !node.textContent || node.textContent.trim().length === 0) continue;

                // Determine whether this text node is inside a .character-name element
                let parent = node.parentElement;
                let insideCharacterName = false;
                while (parent) {
                    try {
                        if (parent.classList && parent.classList.contains('character-name')) {
                            insideCharacterName = true;
                            break;
                        }
                    } catch (e) {}
                    parent = parent.parentElement;
                }

                // Only include nodes that are NOT inside a character-name element
                if (!insideCharacterName) {
                    textNodes.push(node);
                }
            }

            if (!textNodes.length) {
                onComplete && onComplete();
                return;
            }

            // Detect which character (if any) is speaking so we can
            // play per-letter SFX tuned to that character's voice/personality.
            try {
                const detectedName = this._detectCharacterNameForElement(element);
                if (detectedName) {
                    // Prefer an element-provided name if present
                    this._currentVoiceSettings = this._getVoiceSettingsForName(detectedName);
                } else {
                    // If an external caller already set _currentVoiceSettings (e.g. BarterWindow),
                    // do not overwrite it with null. Only clear if it was previously unset.
                    if (!this._currentVoiceSettings) {
                        this._currentVoiceSettings = null;
                    }
                }
            } catch (e) {
                // preserve any externally provided voice settings on error
            }

            // Trim leading whitespace from each node so typing starts with the
            // first visible glyph (prevents long runs of indentation characters
            // from being typed first).
            const originals = textNodes.map(n => n.textContent.replace(/^\s+/, ''));
            // Clear current text content to start typing
            textNodes.forEach(n => { n.textContent = ''; });

            let nodeIndex = 0;
            let charIndex = 0;

            // Tick function does one character and advances indices. We call it once
            // immediately so the first character appears without waiting for the
            // first interval tick, then schedule repeated ticks.
            const tick = () => {
                const node = textNodes[nodeIndex];
                const orig = originals[nodeIndex] || '';
                if (charIndex < orig.length) {
                    // Log when the very first character is inserted so we can
                    // measure the gap between overlay show and first glyph.
                    try {
                        if (nodeIndex === 0 && charIndex === 0) {
                            try { logger.log(`_typewriter firstChar -- ts=${(typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now()}`); } catch (e) {}
                        }
                    } catch (e) {}
                    const ch = orig.charAt(charIndex);
                    node.textContent += ch;
                    // Play per-character typing sound for certain characters/characters
                    try {
                        // Play per-character blip if we have voice settings for the current speaker
                        if (this.typewriterSfxEnabled && this._currentVoiceSettings) {
                            // Skip whitespace characters to avoid excessive ticks
                            if (ch && ch.trim().length > 0) {
                                this._playTypingBlip(this._currentVoiceSettings);
                            }
                        }
                    } catch (e) {}
                    charIndex++;
                    return false; // not finished
                }

                // Move to next node
                nodeIndex++;
                charIndex = 0;
                if (nodeIndex >= textNodes.length) {
                    return true; // finished
                }
                return false;
            };


            // Force layout so the overlay is painted/visible to the user before
            // we begin typing. This reduces perceived delay between the overlay
            // appearing and the first character.
            try { void element.getBoundingClientRect(); } catch (e) {}

            // Helper to start the repeating tick using requestAnimationFrame.
            // We call `tick()` once immediately so the first character appears
            // right away, then pace subsequent characters by `speed` ms using
            // an rAF loop. This reduces perceived latency compared to setInterval
            // and aligns updates with the browser paint loop.
            const startInterval = () => {
                // Call first tick immediately so user sees the first character
                // without waiting for the rAF loop to accumulate time.
                try {
                    const finishedNow = tick();
                    if (finishedNow) {
                        onComplete && onComplete();
                        return;
                    }
                } catch (err) {
                    onComplete && onComplete();
                    return;
                }

                // rAF-based scheduler
                let last = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
                const step = (now) => {
                    try {
                        if (!now) now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
                        const elapsed = now - last;
                        if (elapsed >= speed) {
                            last = now;
                            const finished = tick();
                            if (finished) {
                                if (this.currentTypewriterInterval) {
                                    cancelAnimationFrame(this.currentTypewriterInterval);
                                    this.currentTypewriterInterval = null;
                                }
                                onComplete && onComplete();
                                return;
                            }
                        }
                        this.currentTypewriterInterval = requestAnimationFrame(step);
                    } catch (err) {
                        if (this.currentTypewriterInterval) {
                            cancelAnimationFrame(this.currentTypewriterInterval);
                            this.currentTypewriterInterval = null;
                        }
                        onComplete && onComplete();
                    }
                };

                // Start the rAF loop
                try {
                    this.currentTypewriterInterval = requestAnimationFrame(step);
                } catch (err) {
                    // Fallback to setInterval if rAF isn't available
                    this.currentTypewriterInterval = setInterval(() => {
                        try {
                            const finished = tick();
                            if (finished) {
                                clearInterval(this.currentTypewriterInterval);
                                this.currentTypewriterInterval = null;
                                onComplete && onComplete();
                            }
                        } catch (err2) {
                            if (this.currentTypewriterInterval) {
                                clearInterval(this.currentTypewriterInterval);
                                this.currentTypewriterInterval = null;
                            }
                            onComplete && onComplete();
                        }
                    }, speed);
                }
            };

            // Use requestAnimationFrame when available so the browser paints the
            // overlay before we add the first character. If rAF isn't available
            // fall back to a 0ms timeout which still yields to the event loop.
            const scheduleStart = (cb) => {
                if (typeof requestAnimationFrame === 'function') {
                    requestAnimationFrame(cb);
                } else {
                    setTimeout(cb, 0);
                }
            };

            try {
                scheduleStart(() => {
                    try {
                        try { logger.log(`_typewriter scheduled start -- ts=${(typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now()}`); } catch (e) {}
                        const finishedImmediately = tick();
                        if (finishedImmediately) {
                            onComplete && onComplete();
                            return;
                        }
                        startInterval();
                    } catch (err) {
                        onComplete && onComplete();
                    }
                });
            } catch (err) {
                // Very defensive fallback: run tick immediately and start interval
                try {
                    const finishedImmediately = tick();
                    if (finishedImmediately) {
                        onComplete && onComplete();
                        return;
                    }
                    startInterval();
                } catch (err2) {
                    onComplete && onComplete();
                    return;
                }
            }
        } catch (e) {
            // On error, ensure we call onComplete so UI flow continues
            if (this.currentTypewriterInterval) {
                clearInterval(this.currentTypewriterInterval);
                this.currentTypewriterInterval = null;
            }
            onComplete && onComplete();
        }
    }

        // Lightweight detection: extract the character name (if any) from the
        // element by looking for a `.character-name` element. Returns the
        // trimmed name string (as-is) or null.
        _detectCharacterNameForElement(element) {
            try {
                if (!element) return null;
                const nameEl = element.querySelector && element.querySelector('.character-name');
                if (!nameEl) return null;
                const txt = (nameEl.textContent || '').trim();
                return txt.length ? txt : null;
            } catch (e) {
                return null;
            }
        }

        // Generate deterministic voice/settings based on the character name.
        // This maps a name -> base frequency, oscillator types, filter center, and peak gain.
        // The mapping is deterministic so the same NPC always sounds similar.
        _getVoiceSettingsForName(name) {
            try {
                if (!name) return null;
                const n = (name || '').toString();
                // simple hash: sum of char codes
                let hash = 0;
                for (let i = 0; i < n.length; i++) {
                    hash = (hash * 31 + n.charCodeAt(i)) >>> 0;
                }

                // Known special-cases (give certain NPCs distinct personality tuning)
                const lower = n.trim().toLowerCase();
                if (lower === 'crayn' || lower.indexOf('crayn') !== -1) {
                    return {
                        name: 'Crayn',
                        base: 120, // intentionally low but characteristic
                        wave1: 'sawtooth',
                        wave2: 'sine',
                        bandMul: 1.6,
                        peak: 0.18
                    };
                }

                // Merchant-friendly boost: if the name contains 'merchant' or 'shop'
                if (lower.indexOf('merchant') !== -1 || lower.indexOf('shop') !== -1 || lower.indexOf('vendor') !== -1) {
                    const base = 90 + (hash % 80); // relatively low, warm
                    return {
                        name: n,
                        base: base,
                        wave1: (['sawtooth','triangle','square','sine'][hash % 4]),
                        wave2: (['sine','triangle','sawtooth','square'][(hash >> 2) % 4]),
                        bandMul: 1.5 + ((hash % 20) / 100),
                        peak: 0.16 + ((hash % 20) / 200)
                    };
                }

                // Generic mapping: spread base freq across ~80-240Hz
                const base = 80 + (hash % 160);
                const waveChoices = ['sine','triangle','sawtooth','square'];
                const wave1 = waveChoices[hash % waveChoices.length];
                const wave2 = waveChoices[(hash >> 3) % waveChoices.length];
                const peak = 0.08 + ( (hash % 80) / 400 ); // 0.08 - ~0.28
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
        _ensureTypingAudio() {
            try {
                // Prefer using the game's SoundManager audioContext if available
                if (!this._typingAudioContext) {
                    if (this.game && this.game.soundManager && this.game.soundManager.audioContext) {
                        this._typingAudioContext = this.game.soundManager.audioContext;
                    } else if (this.game && this.game.soundManager && typeof this.game.soundManager.resumeAudioContext === 'function') {
                        // Try to resume/create shared AudioContext (may require user gesture)
                        try { this.game.soundManager.resumeAudioContext(); } catch (e) {}
                        if (this.game.soundManager.audioContext) this._typingAudioContext = this.game.soundManager.audioContext;
                    }
                }

                if (!this._typingAudioContext && typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)) {
                    try {
                        this._typingAudioContext = new (window.AudioContext || window.webkitAudioContext)();
                    } catch (e) {}
                }

                if (this._typingAudioContext && !this._typingMasterGain) {
                    try {
                        this._typingMasterGain = this._typingAudioContext.createGain();
                        // Increase typing blip master gain so per-letter SFX are
                        // more audible compared to other UI sounds.
                        // Global SFX toggles still apply.
                        this._typingMasterGain.gain.value = 1.6;
                        this._typingMasterGain.connect(this._typingAudioContext.destination);
                    } catch (e) {
                        this._typingMasterGain = null;
                    }
                }
            } catch (e) {}
        }

        // Play a short, characterful blip for per-letter typing sound.
        // Accepts optional voiceSettings (from _getVoiceSettingsForName) to tune pitch/timbre.
        _playTypingBlip(voiceSettings) {
            try {
                if (!this.typewriterSfxEnabled) return;
                // Respect global SFX setting if SoundManager exists
                if (this.game && this.game.soundManager && this.game.soundManager.sfxEnabled === false) return;

                this._ensureTypingAudio();
                const ctx = this._typingAudioContext;
                const master = this._typingMasterGain;
                if (!ctx || !master) return;

                const now = ctx.currentTime;

                // Primary and harmonic oscillators
                const o1 = ctx.createOscillator();
                const o2 = ctx.createOscillator();
                const merger = ctx.createGain();
                const band = ctx.createBiquadFilter();
                const g = ctx.createGain();

                // Derive parameters either from voiceSettings or generate defaults
                // Merge provided voiceSettings with deterministic cached ones.
                const vs = voiceSettings || {};
                // If a cached derived set exists for this name, use it.
                let derived = null;
                try {
                    if (vs && vs.name && this._voiceCache.has(vs.name)) {
                        derived = this._voiceCache.get(vs.name);
                    }
                } catch (e) { derived = null; }

                // If no derived cache, build one deterministically from vs.name or vs.base
                if (!derived) {
                    // Create a small deterministic seed from the name or base
                    const seedStr = (vs && vs.name) ? vs.name : ('' + (vs.base || Math.floor(Math.random()*1000)));
                    let seed = 0;
                    for (let i = 0; i < seedStr.length; i++) seed = (seed * 131 + seedStr.charCodeAt(i)) >>> 0;

                    const pick = (arr) => arr[seed % arr.length];
                    const rand = (min, max) => {
                        // deterministic pseudo-random based on seed
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
                        // Make per-voice masterGain default closer to 1.0 so voices
                        // are louder by default; small negative/positive jitter
                        // keeps variety while increasing audibility.
                        masterGain: (typeof vs.masterGain === 'number') ? vs.masterGain : (1.0 + rand(-0.25, 0.6))
                    };

                    try { if (derived && derived.name) this._voiceCache.set(derived.name, derived); } catch (e) {}
                }

                // Use derived settings now
                const wave1 = derived.wave1;
                const wave2 = derived.wave2;
                const base = derived.base;
                const harmonicRatio = derived.harmonicRatio || 1.9;
                const detune = (Math.random() * derived.detuneRange) - (derived.detuneRange/2);
                const bandMul = derived.bandMul;
                const peak = derived.peak;

                try { o1.type = wave1; } catch (e) {}
                try { o2.type = wave2; } catch (e) {}

                // Debug: log when a blip is played and which voice settings are used
                try {
                    if (typeof console !== 'undefined' && console.debug) {
                        const dbgName = (vs && vs.name) ? vs.name : (voiceSettings ? voiceSettings.name : 'unknown');
                        console.debug && console.debug(`_playTypingBlip: playing blip for`, dbgName, 'base=', base, 'peak=', peak.toFixed ? peak.toFixed(3) : peak);
                    }
                } catch (e) {}

                o1.frequency.setValueAtTime(base, now);
                o2.frequency.setValueAtTime(base * 1.9 + detune, now);

                // Bandpass to make it vowel-ish and less harsh
                try { band.type = 'bandpass'; } catch (e) {}
                // Use deterministic-ish band center and Q tuned to the voice
                band.frequency.setValueAtTime(base * bandMul + (Math.random() * 18 - 9), now);
                band.Q.setValueAtTime(3 + (Math.random() * 3), now);

                // Starting gain, quick attack, short decay. Peak scaled by voice settings
                g.gain.setValueAtTime(0.001 + (peak * 0.002), now);
                // quick attack -> larger peak (use per-voice attack)
                try { g.gain.linearRampToValueAtTime((peak) * derived.masterGain, now + derived.attack); } catch (e) {}
                // decay (use per-voice decay)
                try { g.gain.exponentialRampToValueAtTime(0.00005, now + derived.decay); } catch (e) {}

                // Wire graph: o1+o2 -> merger -> band -> g -> optional panner -> master
                o1.connect(merger);
                o2.connect(merger);
                merger.connect(band);
                band.connect(g);

                // Optional per-voice stereo placement for extra distinctiveness
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

                // Start and stop quickly
                try { o1.start(now); o2.start(now); } catch (e) {}
                // Stop times slightly vary but within per-voice decay window
                try { o1.stop(now + Math.max(0.06, derived.decay * 0.8)); o2.stop(now + Math.max(0.06, derived.decay * 0.8)); } catch (e) {}

                // Occasional small pitch shift for subtle liveliness (rare)
                if (Math.random() < 0.03) {
                    try { o1.frequency.setValueAtTime(base * (0.85 + Math.random() * 0.3), now + 0.02); } catch (e) {}
                }
            } catch (e) {
                // swallow errors so typing doesn't break
            }
        }

    hideOverlayMessage() {
        // If it's a persistent charge confirmation message, don't hide it automatically
        if (this.game.pendingCharge) {
            return;
        }

        const messageOverlay = document.getElementById('messageOverlay');
        if (messageOverlay && messageOverlay.classList.contains('show')) {
            messageOverlay.classList.remove('show');
            // Remove any sign-specific styling when hiding the overlay
            try { messageOverlay.classList.remove('sign-dialogue'); } catch (e) {}
            logger.log("Hiding overlay message.");
        }
        if (this.currentOverlayTimeout) {
            clearTimeout(this.currentOverlayTimeout);
            this.currentOverlayTimeout = null;
        }
    }

    showSignMessage(text, imageSrc, name = null) {
        const messageElement = document.getElementById('messageOverlay');
        if (messageElement) {
            // Clear any existing overlay timeout to prevent auto-hiding sign messages
            if (this.currentOverlayTimeout) {
                clearTimeout(this.currentOverlayTimeout);
                this.currentOverlayTimeout = null;
            }

            // Set content for sign message (persistent until clicked again)
                if (name && imageSrc) {
                // NPC dialogue with name and portrait
                messageElement.innerHTML = `
                    <span class="character-name" style="font-size: 1.5em; margin-bottom: 10px; display:block; text-align:center;">${name}</span>
                    <div class="barter-portrait-container large-portrait" style="margin: 0 auto 10px auto; text-align:center;">
                        <img src="${imageSrc}" class="barter-portrait">
                    </div>
                    <div class="dialogue-text" style="text-align:center;">${text}</div>`;
            } else if (imageSrc) {
                // Apply same bow-rotation logic for sign messages
                let imgStyle = 'width: 128px; height: auto; max-height: 128px; display: block; margin: 0 auto 10px auto; image-rendering: pixelated;';
                try {
                    if (typeof imageSrc === 'string' && imageSrc.toLowerCase().endsWith('/bow.png')) {
                        imgStyle += ' transform: rotate(-90deg); transform-origin: center center;';
                    }
                } catch (e) {}
                messageElement.innerHTML = `<img src="${imageSrc}" style="${imgStyle}"><div class="dialogue-text" style="text-align:center;">${text}</div>`;
            } else {
                messageElement.innerHTML = `<div class="dialogue-text" style="text-align:center;">${text}</div>`;
            }

            messageElement.classList.add('show');
            // Debug timing: log when the overlay is shown for sign messages
            try {
                const t = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
                logger.log(`Sign message shown: ${text} -- ts=${t}`);
            } catch (e) {
                logger.log(`Sign message shown: ${text}`);
            }

            // Signs do not use the typewriter effect — show text immediately.
            // Clear any existing typewriter so sign text isn't interleaved with
            // a previous typing animation, but do NOT start a new one.
            try {
                if (this.currentTypewriterInterval) {
                    try { clearInterval(this.currentTypewriterInterval); } catch (e) {}
                    try { cancelAnimationFrame(this.currentTypewriterInterval); } catch (e) {}
                    this.currentTypewriterInterval = null;
                }
            } catch (e) {}
        }
    }

    // Add a small note card to the stacked note container.
    // text: HTML/text content; imageSrc: optional thumbnail; timeout: ms to auto-hide (default 2000)
    addNoteToStack(text, imageSrc = null, timeout = 2000) {
        try {
            const container = document.getElementById('noteStack');
            if (!container) return null;

            const id = `note-${++this.noteIdCounter}`;
            const card = document.createElement('div');
            card.className = 'note-card';
            card.id = id;

            if (imageSrc) {
                const img = document.createElement('img');
                img.className = 'note-thumb';
                img.src = imageSrc;
                img.alt = '';
                card.appendChild(img);
            }

            const textNode = document.createElement('div');
            textNode.className = 'note-text';
            textNode.innerHTML = text;
            card.appendChild(textNode);

            // Insert at top so newest notes are at top of stack
            container.insertBefore(card, container.firstChild);

            // Force reflow then animate in
            void card.offsetWidth;
            card.classList.add('show');

            // Auto-remove after timeout
            const removeFn = () => {
                card.classList.remove('show');
                // After transition, remove from DOM
                setTimeout(() => {
                    if (card.parentNode) card.parentNode.removeChild(card);
                    this.activeNotes.delete(id);
                }, 260);
            };

            const tId = setTimeout(removeFn, timeout);
            this.activeNotes.set(id, tId);

            // Allow manual click to dismiss sooner
            card.addEventListener('click', () => {
                const existing = this.activeNotes.get(id);
                if (existing) clearTimeout(existing);
                removeFn();
            });

            return id;
        } catch (e) {
            logger.error('Failed to add note to stack', e);
            return null;
        }
    }

    // Remove a note by id (if still active)
    removeNoteFromStack(id) {
        if (!id) return;
        const timeoutId = this.activeNotes.get(id);
        if (timeoutId) clearTimeout(timeoutId);
        const el = document.getElementById(id);
        if (el) {
            el.classList.remove('show');
            setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 260);
        }
        this.activeNotes.delete(id);
    }

    showRegionNotification(zoneX, zoneY) {
        const regionNotification = document.getElementById('regionNotification');
        if (!regionNotification) return;

        // Generate region name based on zone coordinates
        const regionName = this.generateRegionName(zoneX, zoneY);

        // Show the notification
        regionNotification.textContent = regionName;
        regionNotification.classList.add('show');

        // Auto-hide after short duration (2 seconds) using AnimationScheduler
        this.game.animationScheduler.createSequence()
            .wait(2000)
            .then(() => {
                regionNotification.classList.remove('show');
            })
            .start();
    }

    generateRegionName(zoneX, zoneY) {
        // Determine region category based on distance from origin
        const distance = Math.max(Math.abs(zoneX), Math.abs(zoneY));

        if (distance <= 2) return 'Home';
        else if (distance <= 8) return 'Woods';
        else if (distance <= 16) return 'Wilds';
        else return 'Frontier';
    }

    addMessageToLog(message) {
        let coordinates = null;
        // Color coordinates in dark green and extract them for the overlay message
        const coloredMessage = message.replace(/\((-?\d+),\s*(-?\d+)\)/g, (match, x, y) => {
            if (!coordinates) { // Only capture the first set of coordinates for the message
                coordinates = match;
            }
            return `<span style="color: darkgreen">${match}</span>`;
        });
        // Only add if not already in the log
        if (!this.game.messageLog.includes(coloredMessage)) {
            this.game.messageLog.push(coloredMessage);
        }

        // If coordinates were found in the message, show a temporary overlay message
        if (coordinates) {
            // Coordinate confirmation: show immediately without typewriter
            this.showOverlayMessage(`Coordinates ${coordinates} added to log.`, null, false, false, false);
        }
    }

    setupCloseMessageLogHandler() {
        this.closeMessageLogButton.addEventListener('click', () => {
            this.messageLogOverlay.classList.remove('show');
            this.game.gameLoop();
        });
    }
}
