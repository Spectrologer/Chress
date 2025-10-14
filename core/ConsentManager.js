// c:/Users/virgi/OneDrive/Desktop/Apps/Chress/ConsentManager.js

import logger from './logger.js';

export class ConsentManager {
    constructor(game) {
        this.game = game;
        this.consentKey = 'chress_gdpr_consent';
    }

    initialize() {
        // Delay the consent check to ensure UI managers are fully initialized
        setTimeout(() => {
            const consent = localStorage.getItem(this.consentKey);
            logger.log('Consent from localStorage:', consent);

            if (consent === 'true') {
                this.enableTracking();
            } else if (consent === null) {
                this.showConsentBanner();
            }
            // If consent is 'false' or not given, tracking remains disabled.
        }, 100);
    }

    showConsentBanner() {
        const html = `
            <div style="display: flex; align-items: center; justify-content: center; gap: 20px; margin-bottom: 20px;">
                <div style="text-align: center;">
                    <span class="character-name" style="font-size: 1.5em; display: block; margin-bottom: 5px;">Rune</span>
                    <img src="assets/fauna/runeface.png" alt="Rune" style="width: 96px; height: 96px; image-rendering: pixelated;">
                </div>
                <p style="margin: 0; font-size: 1.4em; text-align: left;">"I crave points... You will give me... Data points."<br><em style="font-size: 0.8em;">(Consent to tracking error messages?)</em></p>
            </div>
            <div style="display: flex; justify-content: center; gap: 20px;">
                <button id="consent-accept" style="background: linear-gradient(135deg, #CD853F, #B8860B); border: 2px solid #8B4513; color: #3A2418; padding: 10px 20px; font-family: 'Cinzel', serif; font-size: 1em; font-weight: 700; border-radius: 8px; cursor: pointer; text-transform: uppercase; letter-spacing: 1px;">Let Him Feast</button>
                <button id="consent-decline" style="background: linear-gradient(135deg, #CD853F, #B8860B); border: 2px solid #8B4513; color: #3A2418; padding: 10px 20px; font-family: 'Cinzel', serif; font-size: 1em; font-weight: 700; border-radius: 8px; cursor: pointer; text-transform: uppercase; letter-spacing: 1px;">Let Him Starve</button>
            </div>
        `;

        if (this.game.uiManager && typeof this.game.uiManager.showOverlayMessage === 'function') {
            this.game.uiManager.showOverlayMessage(html, null, true, true); // overlay, persistent
        } else {
            logger.error('UIManager.showOverlayMessage not available');
        }

        // Attach event listeners after a short delay to ensure the HTML is rendered
        setTimeout(() => {
            const acceptButton = document.getElementById('consent-accept');
            const declineButton = document.getElementById('consent-decline');
            if (acceptButton && declineButton) {
                acceptButton.addEventListener('click', () => this.handleConsent(true));
                declineButton.addEventListener('click', () => this.handleConsent(false));
            } else {
                logger.error('Consent buttons not found');
            }
        }, 10);
    }

    handleConsent(didConsent) {
        localStorage.setItem(this.consentKey, didConsent);
        if (this.game.uiManager && typeof this.game.uiManager.hideOverlayMessage === 'function') {
            this.game.uiManager.hideOverlayMessage(); // Hide the message overlay
        }

        if (didConsent) {
            this.enableTracking();
        }
    }

    enableTracking() {
        logger.log("User has consented to tracking. Initializing tracking services...");
        // Enable Sentry tracking if it exists
        if (typeof Sentry !== 'undefined' && Sentry.SDK_VERSION) {
            const client = Sentry.getCurrentHub().getClient();
            if (client) {
                client.getOptions().enabled = true;
            }
        }
    }

    forceShowConsentBanner() {
        this.showConsentBanner();
    }
}
