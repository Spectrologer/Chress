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
            <span class="character-name">Rune</span>
            <div class="barter-portrait-container small-consent-portrait">
                <img src="assets/fauna/runeface.png" class="barter-portrait">
            </div>
            "I crave points... You will give me... Data points."<br><em>(Consent to tracking error messages?)</em>
            <div class="consent-buttons">
                <button id="consent-accept" class="consent-button">Let Him Feast</button>
                <button id="consent-decline" class="consent-button">Let Him Starve</button>
            </div>
        `;

        if (this.game.uiManager && typeof this.game.uiManager.showOverlayMessage === 'function') {
            this.game.uiManager.showOverlayMessage(html, null, true, false); // overlay, persistent, NOT large text
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
