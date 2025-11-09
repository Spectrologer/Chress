import { eventBus } from '@core/EventBus';
import { EventTypes } from '@core/EventTypes';
import { logger } from '@core/logger';

export interface Position {
    x: number;
    y: number;
}

export interface ZoneInfo {
    x: number;
    y: number;
    dimension: number;
    depth: number;
    portType?: string;
}

export interface ZoneUpdate {
    x?: number;
    y?: number;
    dimension?: number;
    depth?: number;
    portType?: string;
}

/**
 * PlayerPositionFacade - Position and zone management for player
 *
 * Handles:
 * - Player position (x, y coordinates)
 * - Movement and walkability
 * - Zone coordinates and transitions
 * - Dimension management (surface, interior, underground)
 * - Underground depth tracking
 *
 * @example
 * const positionFacade = new PlayerPositionFacade(player);
 * positionFacade.setPosition(5, 3);
 * positionFacade.setUndergroundDepth(2);
 */
export class PlayerPositionFacade {
    private player: any;

    constructor(player: any) {
        if (!player) {
            throw new Error('PlayerPositionFacade requires a valid player instance');
        }
        this.player = player;
    }

    // ========================================
    // POSITION OPERATIONS
    // ========================================

    /**
     * Get player position as object
     */
    getPosition(): Position {
        return this.player.getPosition();
    }

    /**
     * Set player position with validation and events
     */
    setPosition(x: number, y: number, emitEvent: boolean = true): void {
        this.player.setPosition(x, y, emitEvent);
    }

    /**
     * Get X coordinate
     */
    getX(): number {
        return this.player.x;
    }

    /**
     * Get Y coordinate
     */
    getY(): number {
        return this.player.y;
    }

    /**
     * Get last position (for interpolation/animation)
     */
    getLastPosition(): Position {
        return { x: this.player.lastX, y: this.player.lastY };
    }

    /**
     * Update last position (for animation tracking)
     */
    setLastPosition(x: number, y: number): void {
        this.player.lastX = x;
        this.player.lastY = y;
    }

    /**
     * Check if a tile is walkable from current position
     */
    isWalkable(x: number, y: number, grid: any[][], fromX: number = -1, fromY: number = -1): boolean {
        return this.player.isWalkable(x, y, grid, fromX, fromY);
    }

    /**
     * Move player to target position
     */
    move(x: number, y: number, grid: any[][], onZoneTransition: () => void): any {
        return this.player.move(x, y, grid, onZoneTransition);
    }

    /**
     * Ensure player is on a valid position
     */
    ensureValidPosition(grid: any[][]): void {
        this.player.ensureValidPosition(grid);
    }

    // ========================================
    // ZONE & DIMENSION OPERATIONS
    // ========================================

    /**
     * Get current zone information (returns a copy)
     */
    getCurrentZone(): ZoneInfo {
        return this.player.getCurrentZone();
    }

    /**
     * Set current zone coordinates
     */
    setCurrentZone(x: number, y: number): void {
        this.player.setCurrentZone(x, y);
    }

    /**
     * Get zone dimension (0=surface, 1=interior, 2=underground)
     */
    getZoneDimension(): number {
        return this.player.currentZone?.dimension ?? 0;
    }

    /**
     * Set zone dimension with validation
     */
    setZoneDimension(dimension: number): void {
        if (![0, 1, 2, 3].includes(dimension)) {
            logger.warn(`PlayerPositionFacade: Invalid dimension ${dimension}, must be 0, 1, 2, or 3`);
            return;
        }
        if (!this.player.currentZone) {
            this.player.currentZone = { x: 0, y: 0, dimension: 0, depth: 0 };
        }
        this.player.currentZone.dimension = dimension;

        // Emit zone changed event
        eventBus.emit(EventTypes.ZONE_CHANGED, this.getCurrentZone());
    }

    /**
     * Get underground depth (atomic with zone depth)
     */
    getUndergroundDepth(): number {
        return this.player.undergroundDepth ?? 0;
    }

    /**
     * Set underground depth (keeps currentZone.depth in sync)
     * IMPORTANT: This maintains consistency between undergroundDepth and currentZone.depth
     */
    setUndergroundDepth(depth: number): void {
        if (typeof depth !== 'number' || depth < 0) {
            logger.warn(`PlayerPositionFacade: Invalid depth ${depth}, must be non-negative number`);
            return;
        }

        // Keep both properties in sync
        this.player.undergroundDepth = depth;
        if (!this.player.currentZone) {
            this.player.currentZone = { x: 0, y: 0, dimension: 0, depth: 0 };
        }
        this.player.currentZone.depth = depth;

        logger.debug(`PlayerPositionFacade: Set underground depth to ${depth}`);
    }

    /**
     * Get zone port type
     */
    getPortType(): string | undefined {
        return this.player.currentZone?.portType;
    }

    /**
     * Set zone port type
     */
    setPortType(portType: string): void {
        if (!this.player.currentZone) {
            this.player.currentZone = { x: 0, y: 0, dimension: 0, depth: 0 };
        }
        this.player.currentZone.portType = portType;
    }

    /**
     * Atomically update zone state (prevents drift between related properties)
     */
    updateZoneState(zoneUpdate: ZoneUpdate): void {
        const { x, y, dimension, depth, portType } = zoneUpdate;

        if (!this.player.currentZone) {
            this.player.currentZone = { x: 0, y: 0, dimension: 0, depth: 0 };
        }

        // Atomic update - all or nothing
        if (x !== undefined) this.player.currentZone.x = x;
        if (y !== undefined) this.player.currentZone.y = y;
        if (dimension !== undefined) this.player.currentZone.dimension = dimension;
        if (depth !== undefined) {
            this.player.currentZone.depth = depth;
            this.player.undergroundDepth = depth; // Keep in sync
        }
        if (portType !== undefined) this.player.currentZone.portType = portType;

        // Emit zone change event
        eventBus.emit(EventTypes.ZONE_CHANGED, this.getCurrentZone());
    }

    /**
     * Mark a zone as visited
     */
    markZoneVisited(zoneKey: string): void {
        if (this.player.markZoneVisited) {
            this.player.markZoneVisited(zoneKey);
        }
    }

    /**
     * Trigger zone transition lifecycle
     */
    onZoneTransition(): void {
        if (this.player.onZoneTransition) {
            this.player.onZoneTransition();
        }
    }
}

export default PlayerPositionFacade;
