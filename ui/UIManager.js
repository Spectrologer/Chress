import logger from '../core/logger.js';
import { MessageManager } from './MessageManager.js';
import { PanelManager } from './PanelManager.js';
import { PlayerStatsUI } from './PlayerStatsUI.js';
import { Sign } from './Sign.js';
import { MiniMap } from './MiniMap.js';
import { UIEventCoordinator } from './UIEventCoordinator.js';
import { eventBus } from '../core/EventBus.js';
import { EventTypes } from '../core/EventTypes.js';

export class UIManager {
    constructor(game) {
        this.game = game;

        // Managers
        this.messageManager = new MessageManager(game);
        this.panelManager = new PanelManager(game);
        this.playerStatsUI = new PlayerStatsUI(game);
        this.miniMap = new MiniMap(game);
        this.miniMap.setupEvents(); // Minimap expansion

        // UI Event Coordinator - centralizes event-driven UI updates
        this.eventCoordinator = new UIEventCoordinator(game, this.messageManager, this.panelManager);

        // Handlers
        this.messageManager.setupMessageLogButton();

        // Event listeners
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Player stats
        eventBus.on(EventTypes.PLAYER_STATS_CHANGED, () => {
            eventBus.emit(EventTypes.UI_UPDATE_STATS, {});
        });

        // Enemy defeated
        eventBus.on(EventTypes.ENEMY_DEFEATED, () => {
            eventBus.emit(EventTypes.UI_UPDATE_STATS, {});
        });

        // Treasure found
        eventBus.on(EventTypes.TREASURE_FOUND, (data) => {
            this.addMessageToLog(data.message);
            eventBus.emit(EventTypes.UI_UPDATE_STATS, {});
        });

        // Game reset
        eventBus.on(EventTypes.GAME_RESET, (data) => {
            this.updatePlayerPosition();
            this.updateZoneDisplay();
            eventBus.emit(EventTypes.UI_UPDATE_STATS, {});
        });

        // Zone changed
        eventBus.on(EventTypes.ZONE_CHANGED, () => {
            this.updateZoneDisplay();
        });

        // Player moved
        eventBus.on(EventTypes.PLAYER_MOVED, () => {
            this.updatePlayerPosition();
        });

        // Update points display
        eventBus.on(EventTypes.UI_UPDATE_STATS, () => {
            // Update player card points
            const pointsValueElement = document.querySelector('.player-points .points-value');
            if (pointsValueElement) {
                pointsValueElement.textContent = this.game.player.getPoints();
            }
        });
    }

    setupMessageLogButton() {
        this.messageManager.setupMessageLogButton();
    }

    updatePlayerPosition() {
        const pos = this.game.player.getPosition();
        // document.getElementById('player-pos').textContent = `${pos.x}, ${pos.y}`;

        // Close contextual windows on move
        this.panelManager.hideBarterWindow();
        this.panelManager.hideStatueInfoWindow();
        Sign.hideMessageForSign(this.game); // Hide signs too
    }

    updateZoneDisplay() {
        const zone = this.game.player.getCurrentZone();
        // document.getElementById('current-zone').textContent = `${zone.x}, ${zone.y}`;
        this.miniMap.renderZoneMap();

        // Map info below minimap
        const mapInfo = document.getElementById('map-info');
        if (mapInfo) {
            if (zone.x === 0 && zone.y === 0 && zone.dimension === 1) {
                // Woodcutter's Club special case
                mapInfo.innerHTML = `<span style="font-variant: small-caps; font-weight: bold; font-size: 1.1em; padding: 4px 8px;">Woodcutter's Club</span>`;
            } else if (zone.dimension === 2) {
                // Underground
                // Display depth (z-1, z-2, ...)
                const depth = this.game.player.undergroundDepth || 1;
                const totalDiscoveries = this.game.player.getVisitedZones().size;
                const spentDiscoveries = this.game.player.getSpentDiscoveries() || 0;
                const availableDiscoveries = totalDiscoveries - spentDiscoveries;
                mapInfo.innerHTML = `<span style="font-variant: small-caps; font-weight: bold; font-size: 1.1em; padding: 4px 8px;">Z-${depth}, ${zone.x},${zone.y}<br>DISCOVERIES: ${availableDiscoveries}</span>`;
            } else {
                const totalDiscoveries = this.game.player.getVisitedZones().size;
                const spentDiscoveries = this.game.player.getSpentDiscoveries() || 0;
                const availableDiscoveries = totalDiscoveries - spentDiscoveries;
                const dimensionText = zone.dimension === 1 ? 'Interior' : '';
                mapInfo.innerHTML = `<span style="font-variant: small-caps; font-weight: bold; font-size: 1.1em; padding: 4px 8px;">${zone.x}, ${zone.y}${dimensionText}<br>DISCOVERIES: ${availableDiscoveries}</span>`;
            }
        }
    }

    renderZoneMap() {
        this.miniMap.renderZoneMap();
    }

    updatePlayerStats() {
        // Emit event
        eventBus.emit(EventTypes.UI_UPDATE_STATS, {});
    }



    hideOverlayMessage() {
        this.messageManager.hideOverlayMessage();
    }

    showSignMessage(text, imageSrc, name = null, buttonText = null) {
        this.messageManager.showSignMessage(text, imageSrc, name, buttonText);
    }

    showRegionNotification(zoneX, zoneY) {
        this.messageManager.showRegionNotification(zoneX, zoneY);
    }

    generateRegionName(zoneX, zoneY) {
        return this.messageManager.regionNotification.generateRegionName(zoneX, zoneY);
    }

    addMessageToLog(message) {
        this.messageManager.addMessageToLog(message);
    }

    handleLionInteractionMessage() {
        this.messageManager.handleLionInteractionMessage();
    }

    hidePenneInteractionMessage() {
        this.messageManager.hidePenneInteractionMessage();
    }

    showOverlayMessageSilent(text, imageSrc) {
        this.messageManager.showOverlayMessageSilent(text, imageSrc);
    }

    showOverlayMessage(text, imageSrc, isPersistent = false, isLargeText = false, useTypewriter = true) {
        this.messageManager.showOverlayMessage(text, imageSrc, isPersistent, isLargeText, useTypewriter);
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
            // Restart loop (player alive)
            this.game.gameLoop();
        });
    }

    setupCloseMessageLogHandler() {
        this.messageManager.setupCloseMessageLogHandler();
    }

    setupBarterHandlers() {
        this.panelManager.setupBarterHandlers();
    }



    showBarterWindow(npcType) {
        this.panelManager.showBarterWindow(npcType);
    }

    hideBarterWindow() {
        this.panelManager.hideBarterWindow();
    }

    confirmTrade() {
        this.panelManager.confirmTrade();
    }

    showStatueInfo(statueType) {
        this.panelManager.showStatueInfo(statueType);
    }

    hideStatueInfoWindow() {
        this.panelManager.hideStatueInfoWindow();
    }

    showStatsPanel() {
        this.panelManager.showStatsPanel();
    }

    hideStatsPanel() {
        this.panelManager.hideStatsPanel();
    }

    isStatsPanelOpen() {
        return this.panelManager.isStatsPanelOpen();
    }


}
