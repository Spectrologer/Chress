import { BaseItemEffect, type ItemEffectContext, type ItemEffectResult, type Game } from './BaseItemEffect';
import { TILE_TYPES } from '@core/constants/index';
import { TextBox } from '@ui/textbox';
import { logger } from '@core/logger';
import { eventBus } from '@core/EventBus';
import { EventTypes } from '@core/EventTypes';
import { isAdjacent } from '@core/utils/DirectionUtils';
import type { InventoryItem, ShovelItem, NoteItem, BookOfTimeTravelItem, FischersCubeItem, TeleportBranchItem } from '../ItemMetadata';
import { DIMENSION_CONSTANTS } from '@core/constants/gameplay';
import { MultiTileHandler } from '@renderers/MultiTileHandler';
import type { GridManager } from '@renderers/types';

/**
 * Special effects - Shovel, Note, Book of Time Travel, Fischer's Cube, Teleport Branch
 */

export class ShovelEffect extends BaseItemEffect {
    apply(game: Game, item: InventoryItem, context: ItemEffectContext = {}): ItemEffectResult {
        const { targetX, targetY } = context;

        // If no target specified, enter shovel mode for selection
        if (targetX === undefined || targetY === undefined) {
            game.shovelMode = true;
            game.activeShovel = item;
            this._showMessage(game, 'Click an adjacent tile to dig a hole.', null, true, false);
            return { consumed: false, success: true };
        }

        if (!game.player || !game.grid) {
            return { consumed: false, success: false };
        }

        // Validate target position
        const playerPos = game.player.getPosition();
        const dx = Math.abs(targetX - playerPos.x);
        const dy = Math.abs(targetY - playerPos.y);

        if (!isAdjacent(dx, dy)) {
            this._showMessage(game, "You must dig in an adjacent tile!", null, false, false);
            return { consumed: false, success: false };
        }

        if (game.grid[targetY]?.[targetX] !== TILE_TYPES.FLOOR) {
            this._showMessage(game, "You can only dig on an empty floor tile.", null, false, false);
            return { consumed: false, success: false };
        }

        const enemiesAtPos = game.enemies ? game.enemies.filter((e: any) => e.x === targetX && e.y === targetY) : [];
        if (enemiesAtPos.length > 0) {
            this._showMessage(game, "Cannot dig under an enemy!", null, false, false);
            return { consumed: false, success: false };
        }

        // Dig the hole
        game.grid[targetY][targetX] = TILE_TYPES.PORT;

        // Start enemy turns
        if (typeof game.startEnemyTurns === 'function') {
            game.startEnemyTurns();
        }

        return { consumed: true, uses: 1, success: true };
    }
}

export class NoteEffect extends BaseItemEffect {
    apply(game: Game, item: InventoryItem, context: ItemEffectContext = {}): ItemEffectResult {
        if (!game.player) {
            return { consumed: false, success: false };
        }

        // Use map note to reveal distant location
        const currentZone = game.player.getCurrentZone();
        this._useMapNote(game, currentZone.x, currentZone.y);

        // Hide overlay and show note message
        if (typeof game.hideOverlayMessage === 'function') {
            game.hideOverlayMessage();
        }

        const noteMessageText = 'Coordinates revealed! Added to message log.';

        if (game.uiManager && game.uiManager.messageManager &&
            typeof game.uiManager.messageManager.addNoteToStack === 'function') {
            game.uiManager.messageManager.addNoteToStack(noteMessageText, 'assets/items/misc/note.png', 2000);
        } else if (game.animationScheduler) {
            (game as any).displayingMessageForSign = { message: noteMessageText };
            (game as any).showSignMessage(noteMessageText, 'assets/items/misc/note.png');
            game.animationScheduler.createSequence()
                .wait(2000)
                .then(() => {
                    if ((game as any).displayingMessageForSign && (game as any).displayingMessageForSign.message === noteMessageText) {
                        TextBox.hideMessageForSign(game as any);
                    }
                })
                .start();
        }

        return { consumed: true, quantity: 1, success: true };
    }

    private _useMapNote(game: Game, zoneX: number, zoneY: number): void {
        if (!game.player) return;

        const currentZone = game.player.getCurrentZone();
        const visited = game.player.getVisitedZones();

        // Notes reveal locations: 70% surface (dimension 0), 30% underground (dimension 2 z-1)
        const targetDimension = Math.random() < 0.7 ? 0 : 2;
        const isUnderground = targetDimension === 2;

        const candidates: Array<{ x: number; y: number; distance: number }> = [];
        for (let cZoneX = currentZone.x - 50; cZoneX <= currentZone.x + 50; cZoneX++) {
            for (let cZoneY = currentZone.y - 50; cZoneY <= currentZone.y + 50; cZoneY++) {
                const zoneKey = `${cZoneX},${cZoneY}`;
                if (!visited.has(zoneKey) && !(game as any).specialZones?.has(zoneKey)) {
                    const distance = Math.max(Math.abs(cZoneX - currentZone.x), Math.abs(cZoneY - currentZone.y));
                    if (distance >= 5 && distance <= 15) {
                        candidates.push({ x: cZoneX, y: cZoneY, distance });
                    }
                }
            }
        }

        if (candidates.length === 0) return;

        const selected = candidates[Math.floor(Math.random() * candidates.length)];
        const zoneKey = `${selected.x},${selected.y}`;

        const availableFoodAssets = (game as any).availableFoodAssets || [];
        const treasurePool = [
            () => ({ type: TILE_TYPES.FOOD, foodType: availableFoodAssets[Math.floor(Math.random() * availableFoodAssets.length)] }),
            () => TILE_TYPES.WATER,
            () => TILE_TYPES.BOMB,
            () => ({ type: TILE_TYPES.BOW, uses: 3 }),
            () => ({ type: TILE_TYPES.HORSE_ICON, uses: 3 }),
            () => ({ type: TILE_TYPES.BOOK_OF_TIME_TRAVEL, uses: 3 }),
            () => ({ type: TILE_TYPES.BISHOP_SPEAR, uses: 3 })
        ];

        // Underground locations get more treasures (6 instead of 4)
        const treasureCount = isUnderground ? 6 : 4;
        const treasures: any[] = [];
        for (let i = 0; i < treasureCount; i++) {
            const getRandomTreasure = treasurePool[Math.floor(Math.random() * treasurePool.length)];
            treasures.push(getRandomTreasure());
        }

        (game as any).specialZones?.set(zoneKey, treasures);
        game.player?.markZoneVisited(selected.x, selected.y, targetDimension);

        // Play sound for underground treasure
        if (isUnderground && game.audioManager) {
            game.audioManager.playSound('point');
        }

        const treasureType = isUnderground ? 'Secret Treasure' : 'Secret Stash';
        if (game.uiManager && typeof game.uiManager.addMessageToLog === 'function') {
            game.uiManager.addMessageToLog(`${treasureType} located at (${selected.x}, ${selected.y})!`);
        }

        eventBus.emit(EventTypes.UI_UPDATE_STATS, {});

        if (game.uiManager && typeof game.uiManager.renderZoneMap === 'function') {
            game.uiManager.renderZoneMap();
        }
    }
}

export class BookOfTimeTravelEffect extends BaseItemEffect {
    apply(game: Game, item: InventoryItem, context: ItemEffectContext = {}): ItemEffectResult {
        // Debug logging (keep for compatibility)
        if ((window as any).inventoryDebugMode) {
            logger.debug('[ITEM.EFFECT] book use - BEFORE decrement', { uses: (item as BookOfTimeTravelItem).uses });
            try {
                throw new Error('ITEM.EFFECT book decrement stack');
            } catch (e) {
                logger.debug((e as Error).stack);
            }
        }

        // Show visual feedback
        eventBus.emit(EventTypes.UI_SHOW_MESSAGE, {
            text: 'Reading from the Book of Time Travel...<br>Time passes.',
            imageSrc: 'assets/items/misc/book.png',
            isPersistent: true,
            isLargeText: false,
            useTypewriter: false
        });

        // Pass one turn (allow enemies to move)
        if (typeof game.startEnemyTurns === 'function') {
            game.startEnemyTurns();
        }

        if ((window as any).inventoryDebugMode) {
            logger.debug('[ITEM.EFFECT] book use - AFTER effect', { uses: (item as BookOfTimeTravelItem).uses });
        }

        return { consumed: true, uses: 1, success: true };
    }
}

export class FischersCubeEffect extends BaseItemEffect {
    /**
     * Helper to check if a tile is immovable
     * Handles both simple number tiles and object tiles (e.g., { type: TILE_TYPES.PORT, portKind: 'grate' })
     */
    private isImmovableTile(tile: any, immovableTiles: readonly number[]): boolean {
        if (tile === null || tile === undefined) {
            return false;
        }

        // Handle object tiles (e.g., { type: TILE_TYPES.PORT, portKind: 'grate' })
        if (typeof tile === 'object' && 'type' in tile) {
            return immovableTiles.includes(tile.type);
        }

        // Handle simple number tiles
        if (typeof tile === 'number') {
            return immovableTiles.includes(tile);
        }

        return false;
    }

    apply(game: Game, item: InventoryItem, context: ItemEffectContext = {}): ItemEffectResult {
        if (!game.player || !game.grid) {
            return { consumed: false, success: false };
        }

        // Show visual feedback
        eventBus.emit(EventTypes.UI_SHOW_MESSAGE, {
            text: 'Fischer\'s Cube swirls the zone...<br>Everything shifts!',
            imageSrc: 'assets/environment/doodads/cube.png',
            isPersistent: true,
            isLargeText: false,
            useTypewriter: false
        });

        // Immovable tiles that should NOT be shuffled
        const IMMOVABLE_TILES = [
            TILE_TYPES.WALL,
            TILE_TYPES.EXIT,
            TILE_TYPES.GRASS, // Grass is decorative background
            TILE_TYPES.FLOOR, // Floor is the empty space
            TILE_TYPES.PORT   // PORT includes holes, doors, grates - keep all of them in place
        ];

        // Collect all movable entities and tiles with their positions
        const entities: Array<{ x: number; y: number; tileType: any; isPlayer?: boolean; isEnemy?: boolean; isNPC?: boolean }> = [];

        // Collect player position
        const playerPos = game.player.getPosition();
        entities.push({ x: playerPos.x, y: playerPos.y, tileType: 'PLAYER', isPlayer: true });

        // Collect enemies
        if (game.enemies && Array.isArray(game.enemies)) {
            game.enemies.forEach((enemy: any) => {
                entities.push({ x: enemy.x, y: enemy.y, tileType: 'ENEMY', isEnemy: true });
            });
        }

        // Collect NPCs (check for various NPC properties on game object)
        const npcArrays = [
            (game as any).npcs,
            (game as any).merchants,
            (game as any).tutorialNPCs
        ];

        npcArrays.forEach(npcArray => {
            if (npcArray && Array.isArray(npcArray)) {
                npcArray.forEach((npc: any) => {
                    if (npc && typeof npc.x === 'number' && typeof npc.y === 'number') {
                        entities.push({ x: npc.x, y: npc.y, tileType: npc, isNPC: true });
                    }
                });
            }
        });

        // Create a GridManager adapter for MultiTileHandler
        const gridManager: GridManager = {
            getTile: (x: number, y: number) => {
                if (y >= 0 && y < game.grid!.length && x >= 0 && x < game.grid![y].length) {
                    return game.grid![y][x];
                }
                return undefined;
            }
        };

        // Collect all other movable tiles from the grid
        for (let y = 0; y < game.grid.length; y++) {
            for (let x = 0; x < (game.grid[y]?.length || 0); x++) {
                const tile = game.grid[y]?.[x];

                // Skip immovable tiles and positions already accounted for (player/enemies/NPCs)
                if (this.isImmovableTile(tile, IMMOVABLE_TILES)) {
                    continue;
                }

                // Check if this tile is part of a multi-tile structure
                // Skip multi-tile structures: HOUSE (4x3), WELL (2x2), DEADTREE (2x2), SHACK (3x3)
                // Get the tile type (handle both number and object tiles)
                const tileType = typeof tile === 'object' && 'type' in tile ? tile.type : tile;
                const isPartOfHouse = tileType === TILE_TYPES.HOUSE && MultiTileHandler.findHousePosition(x, y, gridManager) !== null;
                const isPartOfWell = tileType === TILE_TYPES.WELL && MultiTileHandler.findWellPosition(x, y, gridManager) !== null;
                const isPartOfDeadTree = tileType === TILE_TYPES.DEADTREE && MultiTileHandler.findDeadTreePosition(x, y, gridManager) !== null;
                const isPartOfShack = tileType === TILE_TYPES.SHACK && MultiTileHandler.findShackPosition(x, y, gridManager) !== null;

                if (isPartOfHouse || isPartOfWell || isPartOfDeadTree || isPartOfShack) {
                    continue;
                }

                // Check if this position is already accounted for
                const alreadyTracked = entities.some(e => e.x === x && e.y === y);
                if (!alreadyTracked && tile !== TILE_TYPES.FLOOR) {
                    entities.push({ x, y, tileType: tile });
                }
            }
        }

        if (entities.length === 0) {
            this._showMessage(game, 'Nothing to shuffle!', null, false, false);
            return { consumed: false, success: false };
        }

        // Get all positions (only positions that were occupied by movable entities/tiles)
        // Filter out positions that are on immovable tiles (entities standing on PORTs, etc.)
        const positions = entities
            .map(e => ({ x: e.x, y: e.y }))
            .filter(pos => {
                const tileAtPos = game.grid![pos.y][pos.x];
                // Allow this position if the tile is movable OR if it's FLOOR (entity standing on empty space)
                const isImmovable = this.isImmovableTile(tileAtPos, IMMOVABLE_TILES);
                return !isImmovable || tileAtPos === TILE_TYPES.FLOOR;
            });

        // Also filter entities to match the valid positions
        const validEntities = entities.filter((e) => {
            const tileAtPos = game.grid![e.y][e.x];
            const isImmovable = this.isImmovableTile(tileAtPos, IMMOVABLE_TILES);
            return !isImmovable || tileAtPos === TILE_TYPES.FLOOR;
        });

        // Fisher-Yates shuffle of positions
        for (let i = positions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [positions[i], positions[j]] = [positions[j], positions[i]];
        }

        // Clear old positions on grid (everything except walls/exits/grass)
        validEntities.forEach(entity => {
            if (!entity.isPlayer && !entity.isEnemy && !entity.isNPC && game.grid) {
                game.grid![entity.y][entity.x] = TILE_TYPES.FLOOR;
            }
        });

        // Apply shuffled positions
        validEntities.forEach((entity, index) => {
            const newPos = positions[index];

            if (entity.isPlayer && game.player) {
                // Move player
                game.player!.x = newPos.x;
                game.player!.y = newPos.y;
            } else if (entity.isEnemy) {
                // Find the enemy and update its position
                const enemy = game.enemies?.find((e: any) => e.x === entity.x && e.y === entity.y);
                if (enemy) {
                    enemy.x = newPos.x;
                    enemy.y = newPos.y;
                }
            } else if (entity.isNPC) {
                // Update NPC position
                const npc = entity.tileType;
                if (npc) {
                    npc.x = newPos.x;
                    npc.y = newPos.y;
                }
            } else {
                // Place tile at new position
                game.grid![newPos.y][newPos.x] = entity.tileType;
            }
        });

        // Start enemy turns
        if (typeof game.startEnemyTurns === 'function') {
            game.startEnemyTurns();
        }

        return { consumed: true, uses: 1, success: true };
    }
}

export class TeleportBranchEffect extends BaseItemEffect {
    apply(game: Game, item: InventoryItem, context: ItemEffectContext = {}): ItemEffectResult {
        if (!game.player) {
            return { consumed: false, success: false };
        }
        const teleportBranchItem = item as TeleportBranchItem;
        const currentZone = game.player.getCurrentZone();

        // Check if this cube has a permanent linkage first
        const currentZoneKey = `${currentZone.x},${currentZone.y}:${currentZone.dimension}`;
        const linkedDestination = game.cubeLinkages.get(currentZoneKey) || null;

        // If this teleport branch has a partner (either from item data or from linkage map), teleport to the partner's location
        if (teleportBranchItem.originZone || linkedDestination) {
            const destination = linkedDestination || teleportBranchItem.originZone!;
            const targetX = destination.x;
            const targetY = destination.y;
            const targetDimension = destination.dimension || DIMENSION_CONSTANTS.SURFACE;

            // Show message
            eventBus.emit(EventTypes.UI_SHOW_MESSAGE, {
                text: 'The cube glows and teleports you back!',
                imageSrc: 'assets/environment/doodads/cube.png',
                isPersistent: false,
                isLargeText: false,
                useTypewriter: false
            });

            // Set the player's dimension before transitioning
            game.player!.setCurrentZone(targetX, targetY, targetDimension);

            // Teleport to the origin zone
            game.transitionToZone?.(targetX, targetY, 'teleport', game.player!.x, game.player!.y);

            // Remove this return cube from inventory after use
            return { consumed: true, quantity: 1, success: true };
        }

        // This is an origin cube with no linkage yet - create a partner cube and teleport 10 zones away
        // ALWAYS teleport to dimension 0 (surface), never to interiors or underground
        const targetDimension = DIMENSION_CONSTANTS.SURFACE;

        // Find a valid zone exactly 10 zones away (Chebyshev distance)
        const candidates: Array<{ x: number; y: number }> = [];

        // Generate all positions that are exactly 10 zones away on the surface
        for (let dx = -10; dx <= 10; dx++) {
            for (let dy = -10; dy <= 10; dy++) {
                const distance = Math.max(Math.abs(dx), Math.abs(dy));
                if (distance === 10) {
                    const targetX = currentZone.x + dx;
                    const targetY = currentZone.y + dy;
                    // Add to candidates (all will be surface zones)
                    candidates.push({ x: targetX, y: targetY });
                }
            }
        }

        if (candidates.length === 0) {
            this._showMessage(game, 'The cube fizzles... nowhere to teleport!', null, false, false);
            return { consumed: false, success: false };
        }

        // Select a random candidate
        const target = candidates[Math.floor(Math.random() * candidates.length)];

        // Store partner cube data in game state to be spawned in the target zone
        // Use zone key format without dimension to match ZoneManager's key format
        const zoneKey = `${target.x},${target.y}`;
        game.partnerCubes.set(zoneKey, {
            x: target.x,
            y: target.y,
            dimension: targetDimension,
            originZone: {
                x: currentZone.x,
                y: currentZone.y,
                dimension: currentZone.dimension
            }
        });

        // Store permanent cube linkage data that persists across zone transitions
        // Create bidirectional linkage between the two cubes
        const originKey = `${currentZone.x},${currentZone.y}:${currentZone.dimension}`;
        const targetKey = `${target.x},${target.y}:${targetDimension}`;

        game.cubeLinkages.set(originKey, {
            x: target.x,
            y: target.y,
            dimension: targetDimension
        });
        game.cubeLinkages.set(targetKey, {
            x: currentZone.x,
            y: currentZone.y,
            dimension: currentZone.dimension
        });

        // Show message
        eventBus.emit(EventTypes.UI_SHOW_MESSAGE, {
            text: `The branch activates! Teleporting to zone (${target.x}, ${target.y})...`,
            imageSrc: 'assets/items/misc/branch.png',
            isPersistent: false,
            isLargeText: false,
            useTypewriter: false
        });

        // Add message to log
        if (game.uiManager && typeof game.uiManager.addMessageToLog === 'function') {
            game.uiManager.addMessageToLog(`Teleported to zone (${target.x}, ${target.y})! A return branch awaits.`);
        }

        // Update the origin cube tile to remember this destination
        // This makes the two cubes form a permanent pair
        if ((context as any).cubeGridCoords && game.gridManager) {
            const cubeGridCoords = (context as any).cubeGridCoords as { x: number; y: number };
            const cubeTile = game.gridManager.getTile(cubeGridCoords.x, cubeGridCoords.y);
            if (cubeTile && typeof cubeTile === 'object') {
                // Store the destination as this cube's origin zone
                (cubeTile as any).originZone = {
                    x: target.x,
                    y: target.y,
                    dimension: targetDimension
                };
            }
        }

        // Set the player's dimension to surface before transitioning
        game.player!.setCurrentZone(target.x, target.y, targetDimension);

        // Teleport to the target zone
        game.transitionToZone?.(target.x, target.y, 'teleport', game.player!.x, game.player!.y);

        // Don't consume the cube - it stays in the original location
        // The player should be able to find it again if they return
        return { consumed: false, success: true };
    }
}
