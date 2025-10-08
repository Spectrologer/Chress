import logger from './logger.js';

export class UIManager {
    constructor(game) {
        this.game = game;

        // UI elements
        this.messageLogOverlay = document.getElementById('messageLogOverlay');
        this.messageLogContent = document.getElementById('messageLogContent');
        this.closeMessageLogButton = document.getElementById('closeMessageLogButton');

        // Barter UI elements
        this.barterOverlay = document.getElementById('barterOverlay');
        this.barterNPCName = document.getElementById('barterNPCName');
        this.barterNPCPortrait = document.getElementById('barterNPCPortrait');
        this.barterNPCMessage = document.getElementById('barterNPCMessage');
        this.confirmBarterButton = document.getElementById('confirmBarterButton');
        this.cancelBarterButton = document.getElementById('cancelBarterButton');

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

    updatePlayerPosition() {
        const pos = this.game.player.getPosition();
        // document.getElementById('player-pos').textContent = `${pos.x}, ${pos.y}`;
    }

    updateZoneDisplay() {
        const zone = this.game.player.getCurrentZone();
        // document.getElementById('current-zone').textContent = `${zone.x}, ${zone.y}`;
        this.renderZoneMap();

        // Update map info below the minimap
        const mapInfo = document.getElementById('map-info');
        if (mapInfo) {
            const zonesDiscovered = this.game.player.getVisitedZones().size;
            mapInfo.innerHTML = `<span style="font-variant: small-caps; font-weight: bold; font-size: 1.1em; padding: 4px 8px;">${zone.x}, ${zone.y}<br>DISCOVERED: ${zonesDiscovered}</span>`;
        }
    }

    updateProgressBar(barId, currentValue, maxValue) {
        const percentage = (currentValue / maxValue) * 100;
        const barElement = document.getElementById(barId);
        if (barElement) {
            barElement.style.width = `${percentage}%`;
        }
    }

    updatePlayerStats() {
        // Update thirst and hunger bars
        this.updateProgressBar('thirst-progress', this.game.player.getThirst(), 50);
        this.updateProgressBar('hunger-progress', this.game.player.getHunger(), 50);

        // Update heart display
        const hearts = document.querySelectorAll('.heart-icon');
        hearts.forEach((heart, index) => {
            if (index < this.game.player.getHealth()) {
                heart.style.opacity = '1';
                heart.style.filter = 'none'; // Full visibility for full hearts
            } else {
                heart.style.opacity = '0.3';
                heart.style.filter = 'grayscale(100%)'; // Dimmed for lost hearts
            }
        });

        // Update inventory display
        this.game.inventoryManager.updateInventoryDisplay();
    }

    renderZoneMap() {
        // Get actual canvas size from CSS (responsive)
        const mapSize = Math.min(this.game.mapCanvas.width, this.game.mapCanvas.height);
        // Calculate zone size for better visibility: aim for 8-9 zones visible with larger tiles
        const zoneSize = Math.max(18, Math.min(28, Math.floor(mapSize / 8.5)));
        const centerX = mapSize / 2;
        const centerY = mapSize / 2;

        // Clear the map with a parchment-like background
        this.game.mapCtx.fillStyle = '#E6D3A3';  // Warm parchment tone
        this.game.mapCtx.fillRect(0, 0, mapSize, mapSize);

        // Calculate visible range around current zone
        const range = 5; // Show 5 zones in each direction
        const currentZone = this.game.player.getCurrentZone();

        for (let dy = -range; dy <= range; dy++) {
            for (let dx = -range; dx <= range; dx++) {
                const zoneX = currentZone.x + dx;
                const zoneY = currentZone.y + dy;

                const mapX = centerX + dx * zoneSize - zoneSize / 2;
                const mapY = centerY + dy * zoneSize - zoneSize / 2;

                // Determine zone color with parchment-friendly palette
                let color = '#C8B99C'; // Unexplored - darker parchment tone
                if (this.game.player.hasVisitedZone(zoneX, zoneY)) {
                    color = '#B8860B'; // Visited - darker gold
                }
                if (zoneX === currentZone.x && zoneY === currentZone.y) {
                    color = '#CD853F'; // Current - warm brown/gold
                }

                // Draw zone square
                this.game.mapCtx.fillStyle = color;
                this.game.mapCtx.fillRect(mapX, mapY, zoneSize - 2, zoneSize - 2);

                // Draw border with aged ink color
                this.game.mapCtx.strokeStyle = '#8B4513';  // Saddle brown for ink effect
                this.game.mapCtx.lineWidth = 1;
                this.game.mapCtx.strokeRect(mapX, mapY, zoneSize - 2, zoneSize - 2);

                // Draw coordinates for current zone
                if (zoneX === currentZone.x && zoneY === currentZone.y) {
                    this.game.mapCtx.fillStyle = '#2F1B14';  // Dark brown for text
                    this.game.mapCtx.font = 'bold 9px serif';  // Slightly larger and serif font
                    this.game.mapCtx.textAlign = 'center';
                    this.game.mapCtx.fillText(`${zoneX},${zoneY}`, mapX + zoneSize / 2, mapY + zoneSize / 2 + 3);
                }
            }
        }

        // Draw center crosshairs with aged ink color
        this.game.mapCtx.strokeStyle = '#8B4513';  // Matching the border color
        this.game.mapCtx.lineWidth = 2;  // Slightly thicker for visibility
        this.game.mapCtx.beginPath();
        this.game.mapCtx.moveTo(centerX - 6, centerY);
        this.game.mapCtx.lineTo(centerX + 6, centerY);
        this.game.mapCtx.moveTo(centerX, centerY - 6);
        this.game.mapCtx.lineTo(centerX, centerY + 6);
        this.game.mapCtx.stroke();
    }

    handleLionInteractionMessage() {
        // Do not show the lion message if a sign message is already displayed.
        if (this.game.displayingMessageForSign) {
            return;
        }

        const messageOverlay = document.getElementById('messageOverlay');
        // Show message even if another is showing, to allow it to take priority
        // when both lion and squig are present.
        this.showOverlayMessage('<span class="character-name">Penne</span><br>Give me meat!', 'Images/fauna/lion.png');
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

    showOverlayMessage(text, imageSrc) {
        this.showMessage(text, imageSrc, true, false);
    }

    showMessage(text, imageSrc = null, useOverlay = false, persistent = false) {
        const messageElementId = useOverlay ? 'messageOverlay' : 'messageBox';
        const messageElement = document.getElementById(messageElementId);
        logger.log(`showMessage called with text: "${text}", imageSrc: ${imageSrc}, useOverlay: ${useOverlay}, persistent: ${persistent}`);
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
                messageElement.innerHTML = `<img src="${imageSrc}" style="width: 64px; height: 64px; display: block; margin: 0 auto 10px auto; image-rendering: pixelated;">${displayText}`;
            } else {
                messageElement.textContent = displayText;
            }
            messageElement.classList.add('show');
            logger.log("Message set and show class added");

            // Auto-hide overlay messages after 2 seconds if not persistent
            if (useOverlay && !persistent) {
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

    showSignMessage(text, imageSrc) {
        const messageElement = document.getElementById('messageOverlay');
        if (messageElement) {
            // Set content for sign message (persistent until clicked again)
            if (imageSrc) {
                messageElement.innerHTML = `<img src="${imageSrc}" style="width: 64px; height: 64px; display: block; margin: 0 auto 10px auto; image-rendering: pixelated;">${text}`;
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
        this.confirmBarterButton.addEventListener('click', () => {
            this.confirmTrade();
        });
        this.cancelBarterButton.addEventListener('click', () => {
            this.hideBarterWindow();
            this.game.gameLoop();
        });
    }

    showBarterWindow(npcType) {
        let name, portrait, message, requiredItem, requiredItemImg, receivedItemImg;
        if (npcType === 'lion') {
            name = 'Penne';
            portrait = 'Images/fauna/lionface.png';
            message = 'Give me meat!';
            requiredItem = 'Food/meat';
            requiredItemImg = 'Images/Food/meat/meat.png';
            receivedItemImg = 'Images/items/water.png';
        } else if (npcType === 'squig') {
            name = 'Squig';
            portrait = 'Images/fauna/squigface.png';
            message = 'I\'m nuts for nuts!';
            requiredItem = 'Food/nut';
            requiredItemImg = 'Images/Food/nut/nut.png';
            receivedItemImg = 'Images/items/water.png';
        } else {
            return;
        }

        this.barterNPCName.textContent = name;
        this.barterNPCPortrait.src = portrait;
        this.barterNPCMessage.textContent = message;

        // Build the visual exchange UI
        const barterExchange = document.getElementById('barterExchange');
        if (barterExchange) {
            barterExchange.innerHTML = `
                <img src="${requiredItemImg}" alt="Required Item" class="barter-exchange-item">
                <span class="barter-exchange-arrow">→</span>
                <img src="${receivedItemImg}" alt="Received Item" class="barter-exchange-item">
            `;
        }
        this.currentNPCType = npcType;
        this.barterOverlay.classList.add('show');

        // Disable confirm button if player cannot trade
        const foodType = this.currentNPCType === 'lion' ? 'Food/meat' : 'Food/nut';
        const canTrade = this.game.player.inventory.some(item => item.type === 'food' && item.foodType.startsWith(foodType));
        this.confirmBarterButton.disabled = !canTrade;
    }

    hideBarterWindow() {
        this.barterOverlay.classList.remove('show');
    }

    confirmTrade() {
        const foodType = this.currentNPCType === 'lion' ? 'Food/meat' : 'Food/nut';
        const index = this.game.player.inventory.findIndex(item => item.type === 'food' && item.foodType.startsWith(foodType));
        if (index >= 0) {
            this.game.player.inventory.splice(index, 1);
            this.game.player.inventory.push({ type: 'water' });
            this.game.updatePlayerStats();
            this.hideBarterWindow();
            // Do not call game.gameLoop() here to avoid interrupting game flow; let the existing loop continue
        } else {
            // No matching item found, perhaps show a message, but for now, just hide the window
            this.hideBarterWindow();
            // Still step forward to the next game tick
        }
    }

    setupAttackRangeToggle() {
        const button = document.getElementById('toggle-attack-range-button');
        if (button) {
            button.addEventListener('click', () => {
                this.game.toggleEnemyAttackRanges();
            });
        }
    }
}
