import type { IGame } from '../core/GameContext';
import { MessageManager } from './MessageManager';
import { PanelManager } from './PanelManager';
import { PlayerStatsUI } from './PlayerStatsUI';
import { Sign } from './Sign';
import { MiniMap } from './MiniMap';
import { UIEventCoordinator } from './UIEventCoordinator';
import { eventBus } from '../core/EventBus';
import { EventTypes } from '../core/EventTypes';
import { EventListenerManager } from '../utils/EventListenerManager';

interface Player {
    getPosition(): { x: number; y: number };
    getCurrentZone(): { x: number; y: number; dimension: number };
    getPoints(): number;
    getVisitedZones(): Set<string>;
    getSpentDiscoveries(): number;
    undergroundDepth?: number;
    isDead(): boolean;
}

export class UIManager {
    private game: IGame;
    public messageManager: MessageManager;
    public panelManager: PanelManager;
    public playerStatsUI: PlayerStatsUI;
    public miniMap: MiniMap;
    private eventCoordinator: UIEventCoordinator;
    private eventManager: EventListenerManager;

    constructor(game: IGame) {
        this.game = game;
        this.eventManager = new EventListenerManager();

        // Managers
        this.messageManager = new MessageManager(game);
        this.panelManager = new PanelManager(game);
        this.playerStatsUI = new PlayerStatsUI(game);
        this.miniMap = new MiniMap(game);
        this.miniMap.setupEvents(); // Minimap expansion

        // UI Event Coordinator - centralizes event-driven UI updates
        this.eventCoordinator = new UIEventCoordinator(game, this.messageManager, this.panelManager);

        // Event listeners
        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        // Player stats
        eventBus.on(EventTypes.PLAYER_STATS_CHANGED, () => {
            eventBus.emit(EventTypes.UI_UPDATE_STATS, {});
        });

        // Enemy defeated
        eventBus.on(EventTypes.ENEMY_DEFEATED, () => {
            eventBus.emit(EventTypes.UI_UPDATE_STATS, {});
        });

        // Treasure found
        eventBus.on(EventTypes.TREASURE_FOUND, (data: any) => {
            this.addMessageToLog(data.message);
            eventBus.emit(EventTypes.UI_UPDATE_STATS, {});
        });

        // Game reset
        eventBus.on(EventTypes.GAME_RESET, (data: any) => {
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
            const pointsValueElement = document.querySelector<HTMLElement>('.player-points .points-value');
            if (pointsValueElement) {
                pointsValueElement.textContent = String(this.game.player.getPoints());
            }
        });
    }

    updatePlayerPosition(): void {
        const pos = this.game.player.getPosition();
        // document.getElementById('player-pos').textContent = `${pos.x}, ${pos.y}`;

        // Close contextual windows on move
        this.panelManager.hideBarterWindow();
        this.panelManager.hideStatueInfoWindow();
        Sign.hideMessageForSign(this.game as any); // Hide signs too
    }

    updateZoneDisplay(): void {
        const zone = this.game.player.getCurrentZone();
        // document.getElementById('current-zone').textContent = `${zone.x}, ${zone.y}`;
        this.miniMap.renderZoneMap();

        // Map info below minimap
        const mapInfo = document.getElementById('map-info');
        if (mapInfo) {
            if (zone.x === 0 && zone.y === 0 && zone.dimension === 1) {
                // Museum special case
                mapInfo.innerHTML = `<span style="font-variant: small-caps; font-weight: bold; font-size: 1.1em; padding: 4px 8px;">Museum</span>`;
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

    renderZoneMap(): void {
        this.miniMap.renderZoneMap();
    }

    updatePlayerStats(): void {
        // Emit event
        eventBus.emit(EventTypes.UI_UPDATE_STATS, {});
    }



    hideOverlayMessage(): void {
        this.messageManager.hideOverlayMessage();
    }

    showSignMessage(text: string, imageSrc: string, name: string | null = null, buttonText: string | null = null): void {
        this.messageManager.showSignMessage(text, imageSrc, name, buttonText);
    }

    showRegionNotification(zoneX: number, zoneY: number): void {
        this.messageManager.showRegionNotification(zoneX, zoneY);
    }

    generateRegionName(zoneX: number, zoneY: number): string {
        return this.messageManager.regionNotification.generateRegionName(zoneX, zoneY);
    }

    addMessageToLog(message: string): void {
        this.messageManager.addMessageToLog(message);
    }

    handlePenneInteractionMessage(): void {
        this.messageManager.handlePenneInteractionMessage();
    }

    hidePenneInteractionMessage(): void {
        this.messageManager.hidePenneInteractionMessage();
    }

    showOverlayMessageSilent(text: string, imageSrc: string): void {
        this.messageManager.showOverlayMessageSilent(text, imageSrc);
    }

    showOverlayMessage(text: string, imageSrc: string, isPersistent: boolean = false, isLargeText: boolean = false, useTypewriter: boolean = true): void {
        this.messageManager.showOverlayMessage(text, imageSrc, isPersistent, isLargeText, useTypewriter);
    }

    showGameOverScreen(): void {
        const overlay = document.getElementById('game-over-overlay');
        const zonesDiscovered = document.getElementById('zones-discovered');
        if (zonesDiscovered) {
            zonesDiscovered.textContent = String(this.game.player.getVisitedZones().size);
        }
        if (overlay) {
            overlay.style.display = 'flex';
        }
    }

    hideGameOverScreen(): void {
        const overlay = document.getElementById('game-over-overlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }

    setupGameOverHandler(): void {
        const restartButton = document.getElementById('restart-button');
        if (restartButton) {
            this.eventManager.add(restartButton, 'click', () => {
                this.hideGameOverScreen();
                this.game.resetGame();
                // Restart loop (player alive)
                this.game.gameLoop();
            });
        }
    }

    setupBarterHandlers(): void {
        this.panelManager.setupBarterHandlers();
    }



    showBarterWindow(npcType: string): void {
        this.panelManager.showBarterWindow(npcType);
    }

    hideBarterWindow(): void {
        this.panelManager.hideBarterWindow();
    }

    confirmTrade(): void {
        this.panelManager.confirmTrade();
    }

    showStatueInfo(statueType: string): void {
        this.panelManager.showStatueInfo(statueType);
    }

    hideStatueInfoWindow(): void {
        this.panelManager.hideStatueInfoWindow();
    }

    showStatsPanel(): void {
        this.panelManager.showStatsPanel();
    }

    hideStatsPanel(): void {
        this.panelManager.hideStatsPanel();
    }

    isStatsPanelOpen(): boolean {
        return this.panelManager.isStatsPanelOpen();
    }

    /**
     * Cleanup all event listeners
     * Call this when destroying the UIManager instance
     */
    cleanup(): void {
        this.eventManager.cleanup();
    }
}
