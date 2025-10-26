
import logger from '../core/logger.js';
import { fitTextToContainer } from './TextFitter.js';
import { Sign } from './Sign.js';
import { TypewriterEffect } from './TypewriterEffect.js';
import { getVoiceSettingsForName, ensureTypingAudio, playTypingBlip } from './VoiceSettings.js';
import { NoteStack } from './NoteStack.js';
import { RegionNotification } from './RegionNotification.js';
import { eventBus } from '../core/EventBus.js';
import { EventTypes } from '../core/EventTypes.js';
import { safeCall } from '../utils/SafeServiceCall.js';

export class MessageManager {
    constructor(game) {
        this.game = game;

        // UI elements
        this.messageOverlay = document.getElementById('messageOverlay');
        this.messageLogOverlay = document.getElementById('messageLogOverlay');
        this.messageLogContent = document.getElementById('messageLogContent');
        this.closeMessageLogButton = document.getElementById('closeMessageLogButton');

        // Close overlay on tap
        this.messageOverlay.addEventListener('pointerdown', () => {
            // Only if showing
            if (!this.messageOverlay.classList.contains('show')) return;

            if (this.game.displayingMessageForSign) {
                Sign.hideMessageForSign(this.game);
            }
        });

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

    // Note stack
    this.noteStack = new NoteStack();
    // Region notification
    this.regionNotification = new RegionNotification(this.game);

    // Set up event listeners
    this.setupEventListeners();
    }

    setupEventListeners() {
        // Listen for UI show message events
        eventBus.on(EventTypes.UI_SHOW_MESSAGE, (data) => {
            const { text, imageSrc, isPersistent, isLargeText, useTypewriter } = data;
            this.showOverlayMessage(text, imageSrc, isPersistent, isLargeText, useTypewriter);
        });
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
    // Use TypewriterEffect for typewriter animation
    _typewriter(element, speed, onComplete) {
        try {
            // Detect which character (if any) is speaking so we can play per-letter SFX
            const detectedName = this._detectCharacterNameForElement(element);
            if (detectedName) {
                this._currentVoiceSettings = getVoiceSettingsForName(detectedName);
            } else if (!this._currentVoiceSettings) {
                this._currentVoiceSettings = null;
            }
            // Stop any previous interval
            if (this.currentTypewriterInterval) {
                const stopped = safeCall(this.currentTypewriterInterval, 'stop');
                if (!stopped) {
                    clearInterval(this.currentTypewriterInterval);
                }
                this.currentTypewriterInterval = null;
            }
            // Use the new TypewriterEffect
            const effect = new TypewriterEffect({
                speed,
                onChar: (ch) => {
                    if (this.typewriterSfxEnabled && this._currentVoiceSettings) {
                        if (ch && ch.trim().length > 0) {
                            playTypingBlip(this, this._currentVoiceSettings);
                        }
                    }
                },
                onComplete: () => {
                    this._currentVoiceSettings = null;
                    onComplete && onComplete();
                }
            });
            effect.start(element);
            this.currentTypewriterInterval = effect;
        } catch (e) {
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

    showSignMessage(text, imageSrc, name = null, buttonText = null) {
        const messageElement = document.getElementById('messageOverlay');
        if (messageElement) {
            // Clear any existing overlay timeout to prevent auto-hiding sign messages
            if (this.currentOverlayTimeout) {
                clearTimeout(this.currentOverlayTimeout);
                this.currentOverlayTimeout = null;
            }

            // Determine button text based on NPC name or default
            let btnText = buttonText;
            if (!btnText) {
                if (name) {
                    // NPC-specific button text
                    const nameLower = name.toLowerCase();
                    if (nameLower === 'crayn') {
                        btnText = 'Okay...';
                    } else if (nameLower === 'forge') {
                        btnText = 'Right...';
                    } else {
                        btnText = 'Got it';
                    }
                } else {
                    // Signs get "True"
                    btnText = 'True';
                }
            }

            // Set content for sign message (persistent until clicked again)
                if (name && imageSrc) {
                // NPC dialogue with name and portrait
                messageElement.innerHTML = /*html*/`
                    <span class="character-name" style="font-size: 1.5em; margin-bottom: 10px; display:block; text-align:center;">${name}</span>
                    <div class="barter-portrait-container large-portrait" style="margin: 0 auto 10px auto; text-align:center;">
                        <img src="${imageSrc}" class="barter-portrait">
                    </div>
                    <div class="dialogue-text" style="text-align:center;">${text}</div>
                    <div id="dialogue-button-container" style="text-align: center; margin-top: 20px; display: none;">
                        <button class="dialogue-close-button" style="padding: 8px 16px; font-size: 1.2em; cursor: pointer; background-color: #8B4513; color: white; border: 2px solid #654321; border-radius: 5px;">${btnText}</button>
                    </div>`;
            } else if (imageSrc) {
                // Apply same bow-rotation logic for sign messages
                let imgStyle = 'width: 128px; height: auto; max-height: 128px; display: block; margin: 0 auto 10px auto; image-rendering: pixelated;';
                try {
                    if (typeof imageSrc === 'string' && imageSrc.toLowerCase().endsWith('/bow.png')) {
                        imgStyle += ' transform: rotate(-90deg); transform-origin: center center;';
                    }
                } catch (e) {}
                messageElement.innerHTML = /*html*/`<img src="${imageSrc}" style="${imgStyle}"><div class="dialogue-text" style="text-align:center;">${text}</div>
                    <div id="dialogue-button-container" style="text-align: center; margin-top: 20px;">
                        <button class="dialogue-close-button" style="padding: 8px 16px; font-size: 1.2em; cursor: pointer; background-color: #8B4513; color: white; border: 2px solid #654321; border-radius: 5px;">${btnText}</button>
                    </div>`;
            } else {
                messageElement.innerHTML = /*html*/`<div class="dialogue-text" style="text-align:center;">${text}</div>
                    <div id="dialogue-button-container" style="text-align: center; margin-top: 20px;">
                        <button class="dialogue-close-button" style="padding: 8px 16px; font-size: 1.2em; cursor: pointer; background-color: #8B4513; color: white; border: 2px solid #654321; border-radius: 5px;">${btnText}</button>
                    </div>`;
            }

            // Attach event listener to the Okay button
            try {
                const closeButton = messageElement.querySelector('.dialogue-close-button');
                if (closeButton) {
                    closeButton.addEventListener('click', () => {
                        Sign.hideMessageForSign(this.game);
                    });
                }
            } catch (e) {}

            messageElement.classList.add('show');
            // Debug timing: log when the overlay is shown for sign messages
            try {
                const t = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
                logger.log(`Sign message shown: ${text} -- ts=${t}`);
            } catch (e) {
                logger.log(`Sign message shown: ${text}`);
            }

            // For NPC dialogues (when name is provided), use typewriter effect. For signs, show immediately.
            try {
                if (name && this.typewriterSpeed > 0) {
                    const hasCharacterName = !!messageElement.querySelector && !!messageElement.querySelector('.character-name');
                    if (hasCharacterName) {
                        this._typewriter(messageElement, this.typewriterSpeed, () => {
                            // Show the button after typing completes
                            const buttonContainer = messageElement.querySelector('#dialogue-button-container');
                            if (buttonContainer) {
                                buttonContainer.style.display = 'block';
                            }
                        });
                    }
                }
            } catch (e) {
                // Fall back to showing immediately
            }

            // Clear any existing typewriter for signs or if condition not met
            if (!name || !this.typewriterSpeed > 0) {
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
    }

    // Add a small note card to the stacked note container.
    // text: HTML/text content; imageSrc: optional thumbnail; timeout: ms to auto-hide (default 2000)
    addNoteToStack(text, imageSrc = null, timeout = 2000) {
        return this.noteStack.addNoteToStack(text, imageSrc, timeout);
    }

    // Remove a note by id (if still active)
    removeNoteFromStack(id) {
        this.noteStack.removeNoteFromStack(id);
    }

    showRegionNotification(zoneX, zoneY) {
        this.regionNotification.showRegionNotification(zoneX, zoneY);
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
