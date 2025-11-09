import { TILE_TYPES } from '@core/constants/index';
import { TextBox } from '@ui/textbox';
import { TileRegistry } from '@core/TileRegistry';
import { isAdjacent } from '@core/utils/DirectionUtils';
import { eventBus } from '@core/EventBus';
import { EventTypes } from '@core/EventTypes';
import { isTileObjectOfType, TileTypeChecker, getTileType } from '@utils/TypeChecks';
import { TeleportBranchEffect } from '@managers/inventory/effects/SpecialEffects';
import { boardLoader } from '@core/BoardLoader';
import { logger } from '@core/logger';
import type { Game } from '@core/game';
import type { Position } from '@core/Position';

interface TextBoxTile {
    type: string | number;
    message: string;
    name?: string;
    icon?: string;
}

interface CubeTile {
    type: number;
    originZone?: {
        x: number;
        y: number;
        dimension?: number;
    };
}

interface BoardData {
    size: { width: number; height: number };
    terrain: unknown;
    features: unknown;
}

interface EnemyData {
    x: number;
    y: number;
    enemyType: string;
    health: number;
    attack?: number;
    id?: string;
}

interface ItemEffectContext {
    cubeGridCoords: Position;
}

// Type guard for cube tiles
function isCubeTile(tile: unknown): tile is CubeTile {
    return typeof tile === 'object' && tile !== null && 'type' in tile;
}

export class EnvironmentalInteractionManager {
    private game: Game;

    constructor(game: Game) {
        this.game = game;
    }

    public handleSignTap(gridCoords: Position): boolean {
        const gridManager = this.game.gridManager;
        const tile = gridManager.getTile(gridCoords.x, gridCoords.y);
        if (!isTileObjectOfType(tile, TILE_TYPES.SIGN)) return false;
        const signTile = tile as unknown as TextBoxTile;

        // Check if player is adjacent to this sign
        const playerPos = this.game.playerFacade.getPosition();
        const dx = Math.abs(gridCoords.x - playerPos.x);
        const dy = Math.abs(gridCoords.y - playerPos.y);

        if (isAdjacent(dx, dy)) {
            const transientState = this.game.transientGameState;

            // Check if this is a new message being displayed (not already showing)
            const displayingSign = transientState.getDisplayingSignMessage();
            const isAlreadyDisplayed = displayingSign && displayingSign.message === signTile.message;
            const showingNewMessage = !isAlreadyDisplayed;

            // Lettextbox class handle the toggle logic
            TextBox.handleClick(signTile, this.game, true);

            // Add to log only when first showing the message
            const lastMessage = transientState.getLastSignMessage();
            if (showingNewMessage && signTile.message !== lastMessage) {
                eventBus.emit(EventTypes.UI_MESSAGE_LOG, {
                    text: `Atextbox reads: "${signTile.message.replace(/<br>/g, ' ')}"`,
                    category: 'environment',
                    priority: 'info'
                });
                transientState.setLastSignMessage(signTile.message);
            }
            return true; // Interaction handled
        }

        return false;
    }

    public handleStatueTap(gridCoords: Position): boolean {
        const gridManager = this.game.gridManager;
        const tile = gridManager.getTile(gridCoords.x, gridCoords.y);

        // Get tile type using TypeChecks utility
        const tileType = TileTypeChecker.getTileType(tile);

        // Use centralized TileRegistry for statue mapping
        const statueNpcType = TileRegistry.getStatueNPCType(tileType ?? 0);

        if (statueNpcType) {
            // Check if player is adjacent to the statue
            const playerPos = this.game.playerFacade.getPosition();
            const dx = Math.abs(gridCoords.x - playerPos.x);
            const dy = Math.abs(gridCoords.y - playerPos.y);

            if (isAdjacent(dx, dy)) {
                eventBus.emit(EventTypes.UI_DIALOG_SHOW, {
                    type: 'statue',
                    npc: statueNpcType
                });
            }
            return true; // Interaction handled
        }

        return false;
    }

    public handleCubeTap(gridCoords: Position): boolean {
        const gridManager = this.game.gridManager;
        const tile = gridManager.getTile(gridCoords.x, gridCoords.y);

        // Check if this is a cube tile (FISCHERS_CUBE or TELEPORT_BRANCH)
        const tileType = getTileType(tile);
        if (!isTileObjectOfType(tile, TILE_TYPES.FISCHERS_CUBE) &&
            tileType !== TILE_TYPES.FISCHERS_CUBE &&
            tileType !== TILE_TYPES.TELEPORT_BRANCH) {
            return false;
        }

        // Check if player is adjacent to the cube
        const playerPos = this.game.playerFacade.getPosition();
        const dx = Math.abs(gridCoords.x - playerPos.x);
        const dy = Math.abs(gridCoords.y - playerPos.y);

        if (isAdjacent(dx, dy)) {
            // Create cube item from the tile
            const cubeTile = isCubeTile(tile) ? tile : null;
            const cubeItem = isTileObjectOfType(tile, TILE_TYPES.FISCHERS_CUBE) && cubeTile?.originZone
                ? { type: 'cube' as const, originZone: cubeTile.originZone }
                : { type: 'cube' as const };

            // Show confirmation prompt with button
            const message = cubeItem.originZone
                ? `Teleport back to zone (${cubeItem.originZone.x}, ${cubeItem.originZone.y})?`
                : 'Activate branch and teleport 10 zones away?';

            // Show confirmation with button
            if (this.game.uiManager && this.game.uiManager.messageManager) {
                this.game.uiManager.messageManager.showOverlayMessageWithButton(
                    message,
                    'Confirm',
                    () => {
                        // Execute teleport branch effect, passing the grid coordinates
                        const effect = new TeleportBranchEffect();
                        const context: ItemEffectContext = { cubeGridCoords: gridCoords };
                        effect.apply(this.game, cubeItem, context);
                    },
                    'assets/items/misc/branch.png',
                    false
                );
            }

            return true; // Interaction handled
        }

        return false;
    }

    public handleCustomBoardSignTap(gridCoords: Position): boolean {
        const gridManager = this.game.gridManager;
        const tile = gridManager.getTile(gridCoords.x, gridCoords.y);
        const tileType = getTileType(tile);

        // Check if this is a sign_metal_alt tile
        if (tileType !== TILE_TYPES.SIGN_METAL_ALT) {
            return false;
        }

        // Check if player is adjacent to the sign
        const playerPos = this.game.playerFacade.getPosition();
        const dx = Math.abs(gridCoords.x - playerPos.x);
        const dy = Math.abs(gridCoords.y - playerPos.y);

        if (isAdjacent(dx, dy)) {
            this.showCustomBoardSelector();
            return true;
        }

        return false;
    }

    private async showCustomBoardSelector(): Promise<void> {
        // Get available custom boards
        const availableBoards = await this.getAvailableCustomBoards();

        // Create selection dialog
        this.createBoardSelectionDialog(availableBoards);
    }

    /**
     * Fetches the list of available custom boards from static/boards/custom
     */
    private async getAvailableCustomBoards(): Promise<string[]> {
        try {
            // Hardcoded list of available boards
            // In a real implementation, you might fetch this from a manifest file
            return ['classico', 'lizardo_grove'];
        } catch (error) {
            logger.error('Error fetching custom boards:', error);
            return [];
        }
    }

    /**
     * Creates a dialog showing available custom boards with a "Load Custom File" option
     */
    private createBoardSelectionDialog(boards: string[]): void {
        // Create overlay
        const overlay = document.createElement('div');
        overlay.id = 'custom-board-selector-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
        `;

        // Create dialog container
        const dialog = document.createElement('div');
        dialog.style.cssText = `
            background-color: #2c1810;
            border: 3px solid #8B4513;
            border-radius: 10px;
            padding: 20px;
            max-width: 500px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
        `;

        // Title
        const title = document.createElement('h2');
        title.textContent = 'Select Custom Board';
        title.style.cssText = `
            color: #FFD700;
            text-align: center;
            margin: 0 0 20px 0;
            font-size: 1.5em;
        `;
        dialog.appendChild(title);

        // Board list container
        const boardList = document.createElement('div');
        boardList.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 10px;
            margin-bottom: 15px;
        `;

        // Add available boards
        boards.forEach(boardName => {
            const button = this.createBoardButton(boardName, async () => {
                this.closeBoardSelectionDialog(overlay);
                // Use import.meta.env.BASE_URL to respect Vite's base path configuration
                const basePath = import.meta.env.BASE_URL || '/';
                const boardPath = `${basePath}boards/custom/${boardName}.json`;
                await this.loadCustomBoardFromFile(boardPath, boardName);
            });
            boardList.appendChild(button);
        });

        dialog.appendChild(boardList);

        // Separator
        const separator = document.createElement('hr');
        separator.style.cssText = `
            border: none;
            border-top: 2px solid #654321;
            margin: 15px 0;
        `;
        dialog.appendChild(separator);

        // "Load Custom File" button
        const customFileButton = this.createBoardButton('Load Custom File...', () => {
            this.closeBoardSelectionDialog(overlay);
            this.openFileExplorer();
        });
        customFileButton.style.backgroundColor = '#4A5D23';
        customFileButton.style.borderColor = '#2F3A14';
        boardList.appendChild(customFileButton);

        // Cancel button
        const cancelButton = document.createElement('button');
        cancelButton.textContent = 'Cancel';
        cancelButton.style.cssText = `
            width: 100%;
            padding: 12px;
            font-size: 1.1em;
            cursor: pointer;
            background-color: #666;
            color: white;
            border: 2px solid #444;
            border-radius: 5px;
            margin-top: 10px;
            transition: background-color 0.2s;
        `;
        cancelButton.addEventListener('mouseover', () => {
            cancelButton.style.backgroundColor = '#555';
        });
        cancelButton.addEventListener('mouseout', () => {
            cancelButton.style.backgroundColor = '#666';
        });
        cancelButton.addEventListener('click', () => {
            this.closeBoardSelectionDialog(overlay);
        });
        dialog.appendChild(cancelButton);

        overlay.appendChild(dialog);
        document.body.appendChild(overlay);

        // Close on overlay click (but not dialog click)
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.closeBoardSelectionDialog(overlay);
            }
        });
    }

    /**
     * Creates a styled button for board selection
     */
    private createBoardButton(text: string, onClick: () => void): HTMLButtonElement {
        const button = document.createElement('button');
        button.textContent = text;
        button.style.cssText = `
            width: 100%;
            padding: 15px;
            font-size: 1.2em;
            cursor: pointer;
            background-color: #8B4513;
            color: white;
            border: 2px solid #654321;
            border-radius: 5px;
            transition: background-color 0.2s;
        `;
        button.addEventListener('mouseover', () => {
            button.style.backgroundColor = '#A0522D';
        });
        button.addEventListener('mouseout', () => {
            button.style.backgroundColor = '#8B4513';
        });
        button.addEventListener('click', onClick);
        return button;
    }

    /**
     * Closes the board selection dialog
     */
    private closeBoardSelectionDialog(overlay: HTMLElement): void {
        if (overlay && overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
        }
    }

    /**
     * Opens the file explorer for selecting a custom board file
     */
    private openFileExplorer(): void {
        // Create a file input element
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.json,application/json';
        fileInput.style.display = 'none';

        // Add event listener for file selection
        fileInput.addEventListener('change', async (event) => {
            const target = event.target as HTMLInputElement;
            const file = target.files?.[0];

            if (file) {
                try {
                    // Read the file content
                    const text = await file.text();
                    const boardData = JSON.parse(text);

                    // Validate that it's a board file
                    if (!boardData.size || !boardData.terrain || !boardData.features) {
                        throw new Error('Invalid board file format');
                    }

                    // Load the board
                    await this.loadCustomBoardFromData(boardData, file.name.replace('.json', ''));
                } catch (error) {
                    logger.error('Error loading custom board file:', error);
                    eventBus.emit(EventTypes.UI_SHOW_MESSAGE, {
                        text: 'Invalid board file. Please select a valid JSON board file.',
                        isPersistent: false,
                        isLargeText: false,
                        useTypewriter: true
                    });
                }
            }

            // Clean up
            document.body.removeChild(fileInput);
        });

        // Add to DOM and trigger click
        document.body.appendChild(fileInput);
        fileInput.click();

        // Show message to user
        eventBus.emit(EventTypes.UI_SHOW_MESSAGE, {
            text: 'Select a custom board file (.json)',
            isPersistent: false,
            isLargeText: false,
            useTypewriter: true
        });
    }

    /**
     * Loads a custom board from a file path
     */
    private async loadCustomBoardFromFile(filePath: string, boardName: string): Promise<void> {
        try {
            const response = await fetch(filePath);
            if (!response.ok) {
                throw new Error(`Failed to fetch board: ${response.statusText}`);
            }

            const boardData = await response.json();

            // Validate that it's a board file
            if (!boardData.size || !boardData.terrain || !boardData.features) {
                throw new Error('Invalid board file format');
            }

            // Load the board
            await this.loadCustomBoardFromData(boardData, boardName);
        } catch (error) {
            logger.error('Error loading custom board from file:', error);
            eventBus.emit(EventTypes.UI_SHOW_MESSAGE, {
                text: `Failed to load ${boardName}. File may not exist.`,
                isPersistent: false,
                isLargeText: false,
                useTypewriter: true
            });
        }
    }

    private async loadCustomBoardFromData(boardData: BoardData, boardName: string): Promise<void> {
        try {
            logger.log(`[CustomBoard] Starting to load custom board: ${boardName}`);
            logger.log(`[CustomBoard] Board data:`, boardData);

            // Convert board to grid format
            const boardResult = boardLoader.convertBoardToGrid(boardData, this.game.availableFoodAssets || []);
            logger.log(`[CustomBoard] Converted board result:`, boardResult);

            // Use dimension 3 for custom boards (isolated from surface=0, interior=1, underground=2)
            // Zone coordinates don't matter since we're in a unique dimension
            const CUSTOM_BOARD_ZONE_X = 0;
            const CUSTOM_BOARD_ZONE_Y = 0;
            const CUSTOM_BOARD_DIMENSION = 3;

            // Store current zone to enable returning and custom board name for display
            const currentZone = this.game.playerFacade.getCurrentZone();

            // Store custom board metadata on game object
            if (!this.game.customBoardReturnZone) {
                Object.defineProperty(this.game, 'customBoardReturnZone', {
                    writable: true,
                    configurable: true,
                    value: undefined
                });
            }
            if (!this.game.customBoardName) {
                Object.defineProperty(this.game, 'customBoardName', {
                    writable: true,
                    configurable: true,
                    value: undefined
                });
            }

            this.game.customBoardReturnZone = {
                x: currentZone.x,
                y: currentZone.y,
                dimension: currentZone.dimension
            };
            this.game.customBoardName = boardName;

            logger.log(`[CustomBoard] Stored return zone: (${currentZone.x}, ${currentZone.y}) dimension ${currentZone.dimension}`);

            // Prepare zone data with enemies as proper Enemy instances
            const EnemyClass = this.game.Enemy;
            const enemyInstances = (boardResult.enemies || []).map((enemyData: EnemyData) => new EnemyClass(enemyData));

            const zoneData = {
                grid: boardResult.grid,
                enemies: enemyInstances,
                playerSpawn: boardResult.playerSpawn,
                terrainTextures: boardResult.terrainTextures,
                overlayTextures: boardResult.overlayTextures || {},
                rotations: boardResult.rotations,
                overlayRotations: boardResult.overlayRotations || {}
            };

            // Cache this custom board zone using the correct key format
            if (this.game.zoneRepository) {
                const zoneKey = `${CUSTOM_BOARD_ZONE_X},${CUSTOM_BOARD_ZONE_Y}:${CUSTOM_BOARD_DIMENSION}`;
                this.game.zoneRepository.setByKey(zoneKey, zoneData);
                logger.log(`[CustomBoard] Cached zone data at key: ${zoneKey}`);
            }

            // Update player's zone coordinates to the custom board zone
            this.game.playerFacade.setCurrentZone(CUSTOM_BOARD_ZONE_X, CUSTOM_BOARD_ZONE_Y);
            this.game.playerFacade.setZoneDimension(CUSTOM_BOARD_DIMENSION);

            // Generate/load the zone (this will use the cached data)
            this.game.generateZone();

            logger.log(`[CustomBoard] Successfully transitioned to custom board: ${boardName}`);

            // Show success message with return instruction
            eventBus.emit(EventTypes.UI_SHOW_MESSAGE, {
                text: `Loaded ${boardName}. Exit the zone to return to the museum.`,
                isPersistent: false,
                isLargeText: false,
                useTypewriter: true
            });
        } catch (error) {
            logger.error('[CustomBoard] Error loading custom board:', error);
            eventBus.emit(EventTypes.UI_SHOW_MESSAGE, {
                text: `Failed to load ${boardName}`,
                isPersistent: false,
                isLargeText: false,
                useTypewriter: true
            });
        }
    }

    public forceInteractAt(gridCoords: Position): void {
        const gridManager = this.game.gridManager;
        const playerPos = this.game.playerFacade.getPosition();
        const dx = Math.abs(gridCoords.x - playerPos.x);
        const dy = Math.abs(gridCoords.y - playerPos.y);
        if (!isAdjacent(dx, dy)) return;

        const transientState = this.game.transientGameState;

        // Check if sign
        const tile = gridManager.getTile(gridCoords.x, gridCoords.y);
        if (isTileObjectOfType(tile, TILE_TYPES.SIGN)) {
            const signTile = tile as unknown as TextBoxTile;
            TextBox.handleClick(signTile, this.game, true);
            const displayingSign = transientState.getDisplayingSignMessage();
            const isAlreadyDisplayed = displayingSign && displayingSign.message === signTile.message;
            const showingNewMessage = !isAlreadyDisplayed;
            const lastMessage = transientState.getLastSignMessage();
            if (showingNewMessage && signTile.message !== lastMessage) {
                eventBus.emit(EventTypes.UI_MESSAGE_LOG, {
                    text: `Atextbox reads: "${signTile.message.replace(/<br>/g, ' ')}"`,
                    category: 'environment',
                    priority: 'info'
                });
                transientState.setLastSignMessage(signTile.message);
            }
            return;
        }

        // Check for cube - show confirmation prompt for teleportation (FISCHERS_CUBE or TELEPORT_BRANCH)
        const tileTy = getTileType(tile);
        if (isTileObjectOfType(tile, TILE_TYPES.FISCHERS_CUBE) ||
            tileTy === TILE_TYPES.FISCHERS_CUBE ||
            tileTy === TILE_TYPES.TELEPORT_BRANCH) {
            // Create cube item from the tile
            const cubeTile = isCubeTile(tile) ? tile : null;
            const cubeItem = isTileObjectOfType(tile, TILE_TYPES.FISCHERS_CUBE) && cubeTile?.originZone
                ? { type: 'cube' as const, originZone: cubeTile.originZone }
                : { type: 'cube' as const };

            // Show confirmation prompt with button
            const message = cubeItem.originZone
                ? `Teleport back to zone (${cubeItem.originZone.x}, ${cubeItem.originZone.y})?`
                : 'Activate branch and teleport 10 zones away?';

            // Show confirmation with button
            if (this.game.uiManager && this.game.uiManager.messageManager) {
                this.game.uiManager.messageManager.showOverlayMessageWithButton(
                    message,
                    'Confirm',
                    () => {
                        // Execute teleport branch effect, passing the grid coordinates
                        const effect = new TeleportBranchEffect();
                        const context: ItemEffectContext = { cubeGridCoords: gridCoords };
                        effect.apply(this.game, cubeItem, context);
                    },
                    'assets/items/misc/branch.png',
                    false
                );
            }
            return;
        }

        // Check enemy statue using centralized TileRegistry
        const statueTile2 = gridManager.getTile(gridCoords.x, gridCoords.y);
        const statueTileType = TileTypeChecker.getTileType(statueTile2) ?? 0;
        const statueNpcType = TileRegistry.getStatueNPCType(statueTileType);

        if (statueNpcType) {
            eventBus.emit(EventTypes.UI_DIALOG_SHOW, {
                type: 'statue',
                npc: statueNpcType
            });
            return;
        }
    }
}
