import logger from '../core/logger.js';

export class MessageManager {
    constructor(game) {
        this.game = game;

        // UI elements
        this.messageLogOverlay = document.getElementById('messageLogOverlay');
        this.messageLogContent = document.getElementById('messageLogContent');
        this.closeMessageLogButton = document.getElementById('closeMessageLogButton');

        // UI state
        this.currentOverlayTimeout = null;
    }

    setupMessageLogButton() {
        const messageLogButton = document.getElementById('message-log-button');
        if (messageLogButton) {
            // Desktop click
            messageLogButton.addEventListener('click', () => {
                this.handleMessageLogClick();
            });

            // Mobile touch
            messageLogButton.addEventListener('touchstart', (e) => {
                e.preventDefault();
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
        this.showMessage(text, imageSrc, true, false);
    }

    showOverlayMessage(text, imageSrc, isPersistent = false, isLargeText = false) {
        this.showMessage(text, imageSrc, true, isPersistent, isLargeText);
    }

    showMessage(text, imageSrc = null, useOverlay = false, isPersistent = false, isLargeText = false) {
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

            // Use innerHTML to set content with image if provided
            if (imageSrc) {
                messageElement.innerHTML = `<img src="${imageSrc}" style="width: 128px; height: 128px; display: block; margin: 0 auto 10px auto; image-rendering: pixelated;">${displayText}`;
            } else {
                messageElement.innerHTML = displayText;
            }

            // Add or remove the large-text class
            if (isLargeText) {
                messageElement.classList.add('large-text');
            } else {
                messageElement.classList.remove('large-text');
            }

            messageElement.classList.add('show');
            logger.log("Message set and show class added");

            // Auto-hide overlay messages after 2 seconds if not persistent
            if (useOverlay && !isPersistent) {
                // Use AnimationScheduler for timeout management
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
        } else {
            logger.error(`${messageElementId} element not found`);
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
            // Set content for sign message (persistent until clicked again)
            if (name && imageSrc) {
                // NPC dialogue with name and portrait
                messageElement.innerHTML = `
                    <span class="character-name" style="font-size: 1.5em; margin-bottom: 10px;">${name}</span>
                    <div class="barter-portrait-container large-portrait" style="margin: 0 auto 10px auto;">
                        <img src="${imageSrc}" class="barter-portrait">
                    </div>
                    ${text}`;
            } else if (imageSrc) {
                messageElement.innerHTML = `<img src="${imageSrc}" style="width: 128px; height: 128px; display: block; margin: 0 auto 10px auto; image-rendering: pixelated;">${text}`;
            } else {
                messageElement.innerHTML = text;
            }

            messageElement.classList.add('show');
            logger.log(`Sign message shown: ${text}`);
        }
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
            this.showOverlayMessage(`Coordinates ${coordinates} added to log.`);
        }
    }

    setupCloseMessageLogHandler() {
        this.closeMessageLogButton.addEventListener('click', () => {
            this.messageLogOverlay.classList.remove('show');
            this.game.gameLoop();
        });
    }
}
