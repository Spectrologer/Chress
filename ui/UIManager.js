import logger from '../core/logger.js';
import { MessageManager } from './MessageManager.js';
import { PanelManager } from './PanelManager.js';
import { PlayerStatsUI } from './PlayerStatsUI.js';
import { Sign } from './Sign.js';
import { MiniMap } from './MiniMap.js';

export class UIManager {
    constructor(game) {
        this.game = game;

        // Sub-managers
        this.messageManager = new MessageManager(game);
        this.panelManager = new PanelManager(game);
        this.playerStatsUI = new PlayerStatsUI(game);
        this.miniMap = new MiniMap(game);
        this.miniMap.setupEvents(); // Set up minimap expansion events

        // Setup handlers
        this.messageManager.setupMessageLogButton();
    }

    setupMessageLogButton() {
        this.messageManager.setupMessageLogButton();
    }

    updatePlayerPosition() {
        const pos = this.game.player.getPosition();
        // document.getElementById('player-pos').textContent = `${pos.x}, ${pos.y}`;

        // When the player moves, close any open contextual windows.
        this.panelManager.hideBarterWindow();
        this.panelManager.hideStatueInfoWindow();
        Sign.hideMessageForSign(this.game); // Also hide sign messages
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
            } else if (zone.dimension === 2) {
                // Underground dimension
                const dist = Math.max(Math.abs(zone.x), Math.abs(zone.y));
                let zoneLevel = 1;
                if (dist <= 2) zoneLevel = 1;
                else if (dist <= 8) zoneLevel = 2;
                else if (dist <= 16) zoneLevel = 3;
                else zoneLevel = 4;

                const totalDiscoveries = this.game.player.getVisitedZones().size;
                const spentDiscoveries = this.game.player.spentDiscoveries || 0;
                const availableDiscoveries = totalDiscoveries - spentDiscoveries;
                mapInfo.innerHTML = `<span style="font-variant: small-caps; font-weight: bold; font-size: 1.1em; padding: 4px 8px;">Z-${zoneLevel}, ${zone.x},${zone.y}<br>DISCOVERIES: ${availableDiscoveries}</span>`;
            } else {
                const totalDiscoveries = this.game.player.getVisitedZones().size;
                const spentDiscoveries = this.game.player.spentDiscoveries || 0;
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
        this.playerStatsUI.updatePlayerStats();

        // Update points on the main player card
        const pointsValueElement = document.querySelector('.player-points .points-value');
        if (pointsValueElement) {
            pointsValueElement.textContent = this.game.player.getPoints();
        }
    }



    hideOverlayMessage() {
        this.messageManager.hideOverlayMessage();
    }

    showSignMessage(text, imageSrc, name = null) {
        this.messageManager.showSignMessage(text, imageSrc, name);
    }

    showRegionNotification(zoneX, zoneY) {
        this.messageManager.showRegionNotification(zoneX, zoneY);
    }

    generateRegionName(zoneX, zoneY) {
        return this.messageManager.generateRegionName(zoneX, zoneY);
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

    showOverlayMessage(text, imageSrc, isPersistent = false, isLargeText = false) {
        this.messageManager.showOverlayMessage(text, imageSrc, isPersistent, isLargeText);
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
