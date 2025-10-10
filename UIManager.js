import logger from './logger.js';
import { BarterWindow } from './BarterWindow.js';
import { StatueInfoWindow } from './StatueInfoWindow.js';
import { PlayerStatsUI } from './PlayerStatsUI.js';
import { MiniMap } from './MiniMap.js';

export class UIManager {
    constructor(game) {
        this.game = game;

        // UI elements
        this.messageLogOverlay = document.getElementById('messageLogOverlay');
        this.messageLogContent = document.getElementById('messageLogContent');
        this.closeMessageLogButton = document.getElementById('closeMessageLogButton');
        this.statsPanelOverlay = document.getElementById('statsPanelOverlay');

        // Setup stats panel close on outside click
        this.setupStatsPanelHandlers();

        // UI state
        this.currentOverlayTimeout = null;
        this.statsPanelOpen = false;

        // Sub-managers
        this.barterWindow = new BarterWindow(game);
        this.statueInfoWindow = new StatueInfoWindow(game);
        this.playerStatsUI = new PlayerStatsUI(game);
        this.miniMap = new MiniMap(game);
        this.miniMap.setupEvents(); // Set up minimap expansion events
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

    updatePlayerPosition() {
        const pos = this.game.player.getPosition();
        // document.getElementById('player-pos').textContent = `${pos.x}, ${pos.y}`;
    }

    updateZoneDisplay() {
        const zone = this.game.player.getCurrentZone();
        // document.getElementById('current-zone').textContent = `${zone.x}, ${zone.y}`;
        this.miniMap.renderZoneMap();

        // Update map info below the minimap
        const mapInfo = document.getElementById('map-info');
        if (mapInfo) {
            if (zone.x === 0 && zone.y === 0 && zone.dimension === 1) {
                // Special case for the Woodcutter's Club
                mapInfo.innerHTML = `<span style="font-variant: small-caps; font-weight: bold; font-size: 1.1em; padding: 4px 8px;">Woodcutter's Club</span>`;
            } else {
                const zonesDiscovered = this.game.player.getVisitedZones().size;
                const dimensionText = zone.dimension === 1 ? 'Interior' : '';
                mapInfo.innerHTML = `<span style="font-variant: small-caps; font-weight: bold; font-size: 1.1em; padding: 4px 8px;">${zone.x}, ${zone.y}${dimensionText}<br>DISCOVERED: ${zonesDiscovered}</span>`;
            }
        }
    }

    renderZoneMap() {
        this.miniMap.renderZoneMap();
    }

    updatePlayerStats() {
        this.playerStatsUI.updatePlayerStats();

        // Update points on the main player card
        const pointsValueElement = document.querySelector('.player-points .points-value');
        if (pointsValueElement) {
            pointsValueElement.textContent = this.game.player.getPoints();
        }
    }



    handleLionInteractionMessage() {
        // Do not show the lion message if a sign message is already displayed.
        if (this.game.displayingMessageForSign) {
            return;
        }

        const messageOverlay = document.getElementById('messageOverlay');
        // Show message even if another is showing, to allow it to take priority
        // when both lion and squig are present.
        this.showOverlayMessage('<span class="character-name">Penne</span><br>Give me meat!', 'images/fauna/lion.png');
    }

    hideLionInteractionMessage() {
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
                messageElement.textContent = displayText;
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
                this.currentOverlayTimeout = setTimeout(() => {
                    if (messageElement.classList.contains('show')) {
                        messageElement.classList.remove('show');
                        this.currentOverlayTimeout = null;
                        logger.log("Auto-hiding overlay message due to timeout.");
                    }
                }, 2000);
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

        // Auto-hide after short duration (2 seconds)
        setTimeout(() => {
            regionNotification.classList.remove('show');
        }, 2000);
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

    showGameOverScreen() {
        const overlay = document.getElementById('game-over-overlay');
        const zonesDiscovered = document.getElementById('zones-discovered');
        zonesDiscovered.textContent = this.game.player.getVisitedZones().size;
        overlay.style.display = 'flex';
    }

    hideGameOverScreen() {
        const overlay = document.getElementById('game-over-overlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }

    setupGameOverHandler() {
        document.getElementById('restart-button').addEventListener('click', () => {
            this.hideGameOverScreen();
            this.game.resetGame();
            // Restart the game loop since the player is no longer dead
            this.game.gameLoop();
        });
    }

    setupCloseMessageLogHandler() {
        this.closeMessageLogButton.addEventListener('click', () => {
            this.messageLogOverlay.classList.remove('show');
            this.game.gameLoop();
        });
    }

    setupBarterHandlers() {
        this.barterWindow.setupBarterHandlers();
        this.statueInfoWindow.setupStatueInfoHandlers();
    }

    setupStatsPanelHandlers() {
        if (this.statsPanelOverlay) {
            // Close panel when clicking outside (on overlay background)
            this.statsPanelOverlay.addEventListener('click', () => this.hideStatsPanel());
            this.statsPanelOverlay.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.hideStatsPanel();
            });

            // Prevent closing when clicking inside the panel
            const statsPanel = this.statsPanelOverlay.querySelector('.stats-panel');
            if (statsPanel) {
                statsPanel.addEventListener('click', (e) => e.stopPropagation());
                statsPanel.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                });
            }
        }
    }

    showBarterWindow(npcType) {
        this.barterWindow.showBarterWindow(npcType);
    }

    hideBarterWindow() {
        this.barterWindow.hideBarterWindow();
    }

    confirmTrade() {
        this.barterWindow.confirmTrade();
    }

    showStatueInfo(statueType) {
        this.statueInfoWindow.showStatueInfo(statueType);
    }

    hideStatueInfoWindow() {
        this.statueInfoWindow.hideStatueInfoWindow();
    }

    showStatsPanel() {
        if (this.statsPanelOverlay) {
            // Update stats content
            const statsContent = document.querySelector('.stats-main-content .stats-info p');
            const enemiesCaptured = this.game.defeatedEnemies ? this.game.defeatedEnemies.size : 0;
            const playerPoints = this.game.player.getPoints();
            statsContent.innerHTML = `
                Enemies Captured: ${enemiesCaptured}<br>
                <div style="display: flex; align-items: center; margin-top: 8px;">
                    <img src="images/items/points.png" alt="Points" style="width: 24px; height: 24px; margin-right: 8px; image-rendering: pixelated;">
                    Points: ${playerPoints}
                </div>`;

            this.statsPanelOverlay.classList.add('show');
            this.statsPanelOpen = true;
        }
    }

    hideStatsPanel() {
        if (this.statsPanelOverlay) {
            this.statsPanelOverlay.classList.remove('show');
            this.statsPanelOpen = false;
        }
    }

    isStatsPanelOpen() {
        return this.statsPanelOpen;
    }


}
