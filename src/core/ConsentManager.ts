import { logger } from './logger';

interface UIManager {
  showOverlayMessage?(html: string, duration: number | null, isPersistent: boolean, isLargeText: boolean): void;
  hideOverlayMessage?(): void;
}

interface GameInstance {
  uiManager?: UIManager;
  [key: string]: unknown;
}

// Declare Sentry global for TypeScript
interface SentrySDK {
  SDK_VERSION?: string;
  getCurrentHub(): {
    getClient(): {
      getOptions(): { enabled: boolean };
    } | null;
  };
}

declare global {
  const Sentry: SentrySDK;
}

export class ConsentManager {
  private game: GameInstance;
  private consentKey: string;

  constructor(game: GameInstance) {
    this.game = game;
    this.consentKey = 'chesse_gdpr_consent';
  }

  initialize(): void {
    // Delay the consent check to ensure UI managers are fully initialized
    setTimeout(() => {
      const consent = localStorage.getItem(this.consentKey);

      if (consent === 'true') {
        this.enableTracking();
      } else if (consent === null) {
        this.showConsentBanner();
      }
      // If consent is 'false' or not given, tracking remains disabled.
    }, 100);
  }

  showConsentBanner(): void {
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

  handleConsent(didConsent: boolean): void {
    localStorage.setItem(this.consentKey, String(didConsent));
    if (this.game.uiManager && typeof this.game.uiManager.hideOverlayMessage === 'function') {
      this.game.uiManager.hideOverlayMessage(); // Hide the message overlay
    }

    if (didConsent) {
      this.enableTracking();
    }
  }

  enableTracking(): void {
    logger.log("User has consented to tracking. Initializing tracking services...");
    // Enable Sentry tracking if it exists
    if (typeof Sentry !== 'undefined' && Sentry.SDK_VERSION) {
      const client = Sentry.getCurrentHub().getClient();
      if (client) {
        client.getOptions().enabled = true;
      }
    }
  }

  forceShowConsentBanner(): void {
    this.showConsentBanner();
  }
}
