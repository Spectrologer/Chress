import { GRID_SIZE, TILE_TYPES } from './constants.js';
import { Sign } from './Sign.js';
import consoleCommands from './consoleCommands.js';

export class InteractionManager {
    constructor(game, inputManager) {
        this.game = game;
        this.inputManager = inputManager;
    }

    checkLionInteraction() {
        // NPC interactions now handled via clicking - no automatic messages
    }

    checkSquigInteraction() {
        // NPC interactions now handled via clicking - no automatic messages
    }

    checkItemPickup() {
        const p = this.game.player.getPosition();
        const tile = this.game.grid[p.y][p.x];
        const inv = this.game.player.inventory;
        const ui = this.game.uiManager;
        const pick = (item) => { inv.push(item); this.game.grid[p.y][p.x] = TILE_TYPES.FLOOR; ui.updatePlayerStats(); };

        if (tile === TILE_TYPES.NOTE && inv.length < 6) {
            pick({ type: 'note' });
            ui.addMessageToLog('Found an ancient map note.');
            return;
        }
        if (inv.length < 6) {
            if (tile?.type === TILE_TYPES.FOOD) {
                // Ensure foodType is passed correctly
                pick({ type: 'food', foodType: tile.foodType });
                ui.addMessageToLog('Found some food.');
            }
            else if (tile === TILE_TYPES.WATER) pick({ type: 'water' });
            else if (tile === TILE_TYPES.AXE) pick({ type: 'axe' });
            else if (tile === TILE_TYPES.HAMMER) pick({ type: 'hammer' });
            else if (tile?.type === TILE_TYPES.BISHOP_SPEAR) pick({ type: 'bishop_spear', uses: tile.uses });
            else if (tile?.type === TILE_TYPES.HORSE_ICON) pick({ type: 'horse_icon', uses: tile.uses });
            else if (tile === TILE_TYPES.BOMB) pick({ type: 'bomb' });
            else if (tile === TILE_TYPES.HEART) pick({ type: 'heart' });
            else if (tile?.type === TILE_TYPES.BOW) pick({ type: 'bow', uses: tile.uses });
        }
    }

    useMapNote() {
        const currentZone = this.game.player.getCurrentZone();
        const visited = this.game.player.getVisitedZones();

        // Find all undiscovered zones within a reasonable range
        const candidates = [];
        for (let zoneX = currentZone.x - 50; zoneX <= currentZone.x + 50; zoneX++) {
            for (let zoneY = currentZone.y - 50; zoneY <= currentZone.y + 50; zoneY++) {
                const zoneKey = `${zoneX},${zoneY}`;
                if (!visited.has(zoneKey) && !this.game.specialZones.has(zoneKey)) {
                    // Calculate Manhattan distance (zones)
                    const distance = Math.max(Math.abs(zoneX - currentZone.x), Math.abs(zoneY - currentZone.y));
                    if (distance >= 20) {
                        candidates.push({ x: zoneX, y: zoneY, distance });
                    }
                }
            }
        }

        if (candidates.length === 0) {
            return;
        }

        // Pick a random candidate
        const selected = candidates[Math.floor(Math.random() * candidates.length)];
        const zoneKey = `${selected.x},${selected.y}`;

        // Mark the zone as a special zone (with treasures)
        this.game.specialZones.set(zoneKey, [
            'Treasure Found: Bombs Added',
            'Treasure Found: Spears Added',
            'Treasure Found: Food Added'
        ]);

        // Mark the zone as visited (this adds it to the map)
        this.game.player.markZoneVisited(selected.x, selected.y);

        // Add to message log
        this.game.uiManager.addMessageToLog(`A distant location has been revealed on your map: (${selected.x}, ${selected.y})`);
        this.game.uiManager.updatePlayerStats();
        this.game.uiManager.renderZoneMap();
    }

    interactWithNPC(foodType) {
        const index = this.game.player.inventory.findIndex(item => item.type === 'food' && item.foodType.includes(foodType));
        if (index >= 0 && this.game.player.inventory.length < 6) {
            this.game.player.inventory.splice(index, 1);
            this.game.player.inventory.push({ type: 'water' });
            this.game.uiManager.updatePlayerStats();
        } else if (index >= 0 && this.game.player.inventory.length >= 6) {
            this.game.uiManager.addMessageToLog('Inventory is full! Cannot complete trade.');
        }
    }

    handleTap(gridCoords) {
        // If a charge is pending, check for confirmation or cancellation
        if (this.game.pendingCharge) {
            const { type, item, targetX, targetY, enemy, dx, dy } = this.game.pendingCharge;
            
            // If tapped tile is the confirmation tile, perform the charge
            if (gridCoords.x === targetX && gridCoords.y === targetY) {
                if (type === 'bishop_spear') {
                    this.game.performBishopSpearCharge(item, targetX, targetY, enemy, dx, dy);
                } else if (type === 'horse_icon') {
                    this.game.performHorseIconCharge(item, targetX, targetY, enemy, dx, dy);
                } else if (type === 'bow') {
                    this.game.actionManager.performBowShot(item, targetX, targetY);
                }
            }

            // Clear pending charge and message regardless of confirmation or cancellation
            this.game.pendingCharge = null;
            this.game.hideOverlayMessage();
            return true; // Absorb the tap
        }

        // If any other interaction is happening, cancel pending charge
        if (this.game.pendingCharge) {
            this.game.pendingCharge = null;
            this.game.hideOverlayMessage();
        }

        const playerPos = this.game.player.getPosition();

        // Handle bomb placement mode
        if (this.game.bombPlacementMode) {
            const pos = this.game.bombPlacementPositions.find(p => p.x === gridCoords.x && p.y === gridCoords.y);
            if (pos) {
                // Place timed bomb here
                this.game.grid[pos.y][pos.x] = { type: 'BOMB', actionsSincePlaced: 0, justPlaced: true };
                const bombIndex = this.game.player.inventory.findIndex(item => item.type === 'bomb');
                if (bombIndex !== -1) this.game.player.inventory.splice(bombIndex, 1);
                this.game.uiManager.updatePlayerStats();
                // Placing bomb counts as an action - increment bomb timers and start enemy turns
                this.game.incrementBombActions();
                this.game.startEnemyTurns();
            }
            // End mode regardless
            this.game.bombPlacementMode = false;
            this.game.bombPlacementPositions = [];
            this.game.hideOverlayMessage();
            return true;
        }

        // Check if tapped on lion for interaction
        const lionAtPosition = this.game.grid[gridCoords.y]?.[gridCoords.x] === TILE_TYPES.LION;
        if (lionAtPosition) {
            // Check if player is adjacent to the lion (including diagonal, but excluding self)
            const dx = Math.abs(gridCoords.x - playerPos.x);
            const dy = Math.abs(gridCoords.y - playerPos.y);
            const isAdjacent = (dx <= 1 && dy <= 1) && !(dx === 0 && dy === 0);
            if (isAdjacent) {
                this.game.uiManager.showBarterWindow('lion');
            } else {
            }
            return true; // Interaction attempted, completion status varies
        }

        // Check if tapped on squig for interaction
        const squigAtPosition = this.game.grid[gridCoords.y]?.[gridCoords.x] === TILE_TYPES.SQUIG;
        if (squigAtPosition) {
            // Check if player is adjacent to the squig (including diagonal, but excluding self)
            const dx = Math.abs(gridCoords.x - playerPos.x);
            const dy = Math.abs(gridCoords.y - playerPos.y);
            const isAdjacent = (dx <= 1 && dy <= 1) && !(dx === 0 && dy === 0);
            if (isAdjacent) {
                this.game.uiManager.showBarterWindow('squig');
            } else {
            }
            return true; // Interaction attempted, completion status varies
        }

        // Check if tapped on rune for interaction
        const runeAtPosition = this.game.grid[gridCoords.y]?.[gridCoords.x] === TILE_TYPES.RUNE;
        if (runeAtPosition) {
            // Check if player is adjacent to the rune (including diagonal, but excluding self)
            const dx = Math.abs(gridCoords.x - playerPos.x);
            const dy = Math.abs(gridCoords.y - playerPos.y);
            const isAdjacent = (dx <= 1 && dy <= 1) && !(dx === 0 && dy === 0);
            if (isAdjacent) {
                this.game.uiManager.showBarterWindow('rune');
            } else {
            }
            return true; // Interaction attempted, completion status varies
        }

        // Check if tapped on crayn for interaction
        const craynAtPosition = this.game.grid[gridCoords.y]?.[gridCoords.x] === TILE_TYPES.CRAYN;
        if (craynAtPosition) {
            // Check if player is adjacent to crayn (including diagonal, but excluding self)
            const dx = Math.abs(gridCoords.x - playerPos.x);
            const dy = Math.abs(gridCoords.y - playerPos.y);
            const isAdjacent = (dx <= 1 && dy <= 1) && !(dx === 0 && dy === 0);
            if (isAdjacent) {
                const npcData = Sign.getDialogueNpcData('crayn');
                if (npcData) {
                    const message = npcData.messages[npcData.currentMessageIndex];
                    // Use the sign message system for a persistent message that clears on movement
                    this.game.displayingMessageForSign = { message: message, type: 'npc' };
                    this.game.uiManager.showSignMessage(message, npcData.portrait, npcData.name);
                    // Cycle to the next message
                    npcData.currentMessageIndex = (npcData.currentMessageIndex + 1) % npcData.messages.length;
                }
            } else {
                // Not adjacent, perhaps show message?
            }
            return true; // Interaction attempted
        }

        // Check if tapped on felt for interaction
        const feltAtPosition = this.game.grid[gridCoords.y]?.[gridCoords.x] === TILE_TYPES.FELT;
        if (feltAtPosition) {
            // Check if player is adjacent to felt (including diagonal, but excluding self)
            const dx = Math.abs(gridCoords.x - playerPos.x);
            const dy = Math.abs(gridCoords.y - playerPos.y);
            const isAdjacent = (dx <= 1 && dy <= 1) && !(dx === 0 && dy === 0);
            if (isAdjacent) {
                const npcData = Sign.getDialogueNpcData('felt');
                if (npcData) {
                    const message = npcData.messages[npcData.currentMessageIndex];
                    // Use the sign message system for a persistent message that clears on movement
                    this.game.displayingMessageForSign = { message: message, type: 'npc' };
                    this.game.uiManager.showSignMessage(message, npcData.portrait, npcData.name);
                    // Cycle to the next message
                    npcData.currentMessageIndex = (npcData.currentMessageIndex + 1) % npcData.messages.length;
                }
            } else {
                // Not adjacent, perhaps show message?
            }
            return true; // Interaction attempted
        }

        // Check if tapped on forge for interaction
        const forgeAtPosition = this.game.grid[gridCoords.y]?.[gridCoords.x] === TILE_TYPES.FORGE;
        if (forgeAtPosition) {
            // Check if player is adjacent to forge (including diagonal, but excluding self)
            const dx = Math.abs(gridCoords.x - playerPos.x);
            const dy = Math.abs(gridCoords.y - playerPos.y);
            const isAdjacent = (dx <= 1 && dy <= 1) && !(dx === 0 && dy === 0);
            if (isAdjacent) {
                const npcData = Sign.getDialogueNpcData('forge');
                if (npcData) {
                    const message = npcData.messages[npcData.currentMessageIndex];
                    // Use the sign message system for a persistent message that clears on movement
                    this.game.displayingMessageForSign = { message: message, type: 'npc' };
                    this.game.uiManager.showSignMessage(message, npcData.portrait, npcData.name);
                    // Cycle to the next message
                    npcData.currentMessageIndex = (npcData.currentMessageIndex + 1) % npcData.messages.length;
                }
            } else {
            }
            return true; // Interaction attempted
        }

        // Check if tapped on sign for interaction
        const signTile = this.game.grid[gridCoords.y]?.[gridCoords.x];
        if (signTile && typeof signTile === 'object' && signTile.type === TILE_TYPES.SIGN) {
            // Check if player is adjacent to this sign
            const playerPos = this.game.player.getPosition();
            const dx = Math.abs(gridCoords.x - playerPos.x);
            const dy = Math.abs(gridCoords.y - playerPos.y);
            const isAdjacent = (dx <= 1 && dy <= 1) && !(dx === 0 && dy === 0);

            if (isAdjacent) {
                // Check if this is a new message being displayed (not already showing)
                const isAlreadyDisplayed = this.game.displayingMessageForSign &&
                                          this.game.displayingMessageForSign.message === signTile.message;
                const showingNewMessage = !isAlreadyDisplayed;

            // Let Sign class handle the toggle logic
            Sign.handleClick(signTile, this.game, isAdjacent);

            // Add to log only when first showing the message
            if (showingNewMessage && signTile.message !== this.game.lastSignMessage) {
                this.game.uiManager.addMessageToLog(`A sign reads: "${signTile.message.replace(/<br>/g, ' ')}"`);
                this.game.lastSignMessage = signTile.message;
            }
            }
            return true; // Interaction handled
        }

        // Check if tapped on enemy statue for behavior details
        const statueTile = this.game.grid[gridCoords.y]?.[gridCoords.x];
        let statueNpcType = null;

        if (statueTile === TILE_TYPES.LIZARDY_STATUE) {
            statueNpcType = 'statue_lizardy';
        } else if (statueTile === TILE_TYPES.LIZARDO_STATUE) {
            statueNpcType = 'statue_lizardo';
        } else if (statueTile === TILE_TYPES.LIZARDEAUX_STATUE) {
            statueNpcType = 'statue_lizardeaux';
        } else if (statueTile === TILE_TYPES.ZARD_STATUE) {
            statueNpcType = 'statue_zard';
        } else if (statueTile === TILE_TYPES.LAZERD_STATUE) {
            statueNpcType = 'statue_lazerd';
        } else if (statueTile === TILE_TYPES.LIZORD_STATUE) {
            statueNpcType = 'statue_lizord';
        }

        if (statueNpcType) {
            // Check if player is adjacent to the statue
            const playerPos = this.game.player.getPosition();
            const dx = Math.abs(gridCoords.x - playerPos.x);
            const dy = Math.abs(gridCoords.y - playerPos.y);
            const isAdjacent = (dx <= 1 && dy <= 1) && !(dx === 0 && dy === 0);

            if (isAdjacent) {
                this.game.uiManager.showStatueInfo(statueNpcType);
            }
            return true; // Interaction handled
        }

        // Check if tapped on bomb to explode it
        const tapTile = this.game.grid[gridCoords.y][gridCoords.x];
        if (tapTile && typeof tapTile === 'object' && tapTile.type === 'BOMB') {
            const dx = Math.abs(gridCoords.x - playerPos.x);
            const dy = Math.abs(gridCoords.y - playerPos.y);
            const isAdjacent = dx <= 1 && dy <= 1;
            if (isAdjacent) {
                // Activating bomb counts as an action - increment bomb timers and start enemy turns
                this.game.incrementBombActions();
                this.game.explodeBomb(gridCoords.x, gridCoords.y);
                this.game.startEnemyTurns();
                return true;
            }
            return true;
        }

        // Handle bomb placement confirmation (legacy, can be removed if not used)

        // Check if player has bishop spear and if tapped position is diagonal and valid for bishop spear charge
        const bishopSpearItem = this.game.player.inventory.find(item => item.type === 'bishop_spear' && item.uses > 0 && !item.disabled);
        const enemyAtCoords = this.game.enemies.find(enemy => enemy.x === gridCoords.x && enemy.y === gridCoords.y);
        const targetTile = this.game.grid[gridCoords.y][gridCoords.x];
        const isEmptyTile = !enemyAtCoords && this.game.player.isWalkable(gridCoords.x, gridCoords.y, this.game.grid, playerPos.x, playerPos.y);

        if (bishopSpearItem && (enemyAtCoords || isEmptyTile)) {
            // Calculate direction from player to target
            const dx = gridCoords.x - playerPos.x;
            const dy = gridCoords.y - playerPos.y;

            // Check if diagonal and within range (<=5 tiles)
            if (Math.abs(dx) === Math.abs(dy) && Math.abs(dx) > 0 && Math.abs(dx) <= 5) {
                // Set pending charge instead of performing it immediately
                this.game.pendingCharge = {
                    type: 'bishop_spear',
                    item: bishopSpearItem,
                    targetX: gridCoords.x,
                    targetY: gridCoords.y,
                    enemy: enemyAtCoords, dx, dy
                };
                this.game.uiManager.showOverlayMessage('Tap again to confirm Bishop Charge', null, true, true);
                return true; // Interaction started, don't pathfind
            }
        }

        // Check if player has horse icon and if tapped position is valid for horse icon charge (knight moves)
        const horseIconItem = this.game.player.inventory.find(item => item.type === 'horse_icon' && item.uses > 0 && !item.disabled);

        if (horseIconItem && (enemyAtCoords || isEmptyTile)) {
            // Calculate direction from player to target
            const dx = gridCoords.x - playerPos.x;
            const dy = gridCoords.y - playerPos.y;

            // Check if L-shape (knight move) and within range (<=5 tiles)
            const absDx = Math.abs(dx);
            const absDy = Math.abs(dy);
            if (absDx + absDy === 3 && absDx >= 1 && absDy >= 1 && absDx !== absDy && Math.max(absDx, absDy) <= 5) {
                // Set pending charge instead of performing it immediately
                this.game.pendingCharge = {
                    type: 'horse_icon',
                    item: horseIconItem,
                    targetX: gridCoords.x,
                    targetY: gridCoords.y,
                    enemy: enemyAtCoords, dx, dy
                };
                this.game.uiManager.showOverlayMessage('Tap again to confirm Knight Charge', null, true, true);
                return true; // Interaction started, don't pathfind
            }
        }

        // Check if player has bow and if tapped position has an enemy in straight line with clear LOS, more than 1 tile away
        const bowItem = this.game.player.inventory.find(item => item.type === 'bow' && item.uses > 0 && !item.disabled);
        if (bowItem && enemyAtCoords) {
            const dx = gridCoords.x - playerPos.x;
            const dy = gridCoords.y - playerPos.y;

            // Check if orthogonal, more than 1 tile away, and there's a clear path
            const isOrthogonal = (dx === 0 && Math.abs(dy) > 1) || (dy === 0 && Math.abs(dx) > 1);
            if (isOrthogonal) {
                let isPathClear = true;
                const stepX = Math.sign(dx);
                const stepY = Math.sign(dy);
                let checkX = playerPos.x + stepX;
                let checkY = playerPos.y + stepY;

                while (checkX !== gridCoords.x || checkY !== gridCoords.y) {
                    if (!this.game.player.isWalkable(checkX, checkY, this.game.grid)) {
                        isPathClear = false;
                        break;
                    }
                    checkX += stepX;
                    checkY += stepY;
                }

                if (isPathClear) {
                    this.game.pendingCharge = { type: 'bow', item: bowItem, targetX: gridCoords.x, targetY: gridCoords.y, enemy: enemyAtCoords };
                    this.game.uiManager.showOverlayMessage('Tap again to confirm Bow Shot', null, true, true);
                    return true; // Interaction started
                }
            }
        }


        // Check if tapped on adjacent choppable tile
        const tappedTile = this.game.grid[gridCoords.y]?.[gridCoords.x];
        const isAdjacent = Math.abs(gridCoords.x - playerPos.x) <= 1 && Math.abs(gridCoords.y - playerPos.y) <= 1 &&
                           !(gridCoords.x === playerPos.x && gridCoords.y === playerPos.y);
        const hasAxe = this.game.player.inventory.some(item => item.type === 'axe');
        const hasHammer = this.game.player.inventory.some(item => item.type === 'hammer');

        if (isAdjacent && (tappedTile === TILE_TYPES.GRASS || tappedTile === TILE_TYPES.SHRUBBERY || tappedTile === TILE_TYPES.ROCK)) {
            if ((hasAxe && (tappedTile === TILE_TYPES.GRASS || tappedTile === TILE_TYPES.SHRUBBERY)) ||
                (hasHammer && tappedTile === TILE_TYPES.ROCK)) {
                // Perform chopping action
                this.game.player.move(gridCoords.x, gridCoords.y, this.game.grid, (zoneX, zoneY, exitSide) => {
                    this.game.transitionToZone(zoneX, zoneY, exitSide, playerPos.x, playerPos.y);
                });
                this.game.handleEnemyMovements();
                this.game.checkCollisions();
                this.game.checkItemPickup();
                this.game.updatePlayerPosition();
                this.game.updatePlayerStats();
                return true; // Action performed, don't navigate
            }
        }

        // If player is on an exit tile, check for zone transition gestures
        if (this.game.grid[playerPos.y][playerPos.x] === TILE_TYPES.EXIT) {
            const transitionTriggered = this.checkForZoneTransitionGesture(gridCoords, playerPos);
            if (transitionTriggered) {
                return true;
            }
        }

        // Check if tapped tile is an exit and player is already on it - trigger zone transition
        const tileUnderPlayer = this.game.grid[playerPos.y]?.[playerPos.x];
        if (gridCoords.x === playerPos.x && gridCoords.y === playerPos.y) {
            if (tileUnderPlayer === TILE_TYPES.EXIT) {
                this.handleExitTap(gridCoords.x, gridCoords.y);
                return true;
            } else if (tileUnderPlayer === TILE_TYPES.PORT) {
                // Player tapped on a PORT tile they are standing on
                this.game.player.currentZone.dimension = this.game.player.currentZone.dimension === 0 ? 1 : 0;
                this.game.transitionToZone(this.game.player.currentZone.x, this.game.player.currentZone.y, 'port', playerPos.x, playerPos.y);
                return true;
            }
        }

        return false; // No interaction, allow path finding
    }

    // Check if tap gesture should trigger zone transition when player is on exit
    checkForZoneTransitionGesture(tapCoords, playerPos) {
        // If player is on an exit tile and taps outside the grid or on the same edge, trigger transition
        const isOnExit = this.game.grid[playerPos.y][playerPos.x] === TILE_TYPES.EXIT;
        if (!isOnExit) return false;

        // Check if tap is outside grid boundaries (attempting to go beyond current zone)
        if (tapCoords.x < 0 || tapCoords.x >= GRID_SIZE || tapCoords.y < 0 || tapCoords.y >= GRID_SIZE) {
            this.handleExitTap(playerPos.x, playerPos.y);
            return true;
        }

        // Check if player is on edge exit and tapping towards that edge
        if (playerPos.y === 0 && tapCoords.y < playerPos.y) {
            // On top edge, tapping up/beyond row
            this.handleExitTap(playerPos.x, playerPos.y);
            return true;
        } else if (playerPos.y === GRID_SIZE - 1 && tapCoords.y > playerPos.y) {
            // On bottom edge, tapping down/beyond row
            this.handleExitTap(playerPos.x, playerPos.y);
            return true;
        } else if (playerPos.x === 0 && tapCoords.x < playerPos.x) {
            // On left edge, tapping left/beyond column
            this.handleExitTap(playerPos.x, playerPos.y);
            return true;
        } else if (playerPos.x === GRID_SIZE - 1 && tapCoords.x > playerPos.x) {
            // On right edge, tapping right/beyond column
            this.handleExitTap(playerPos.x, playerPos.y);
            return true;
        }

        return false;
    }

    // Handle tapping on exit tiles to trigger zone transitions
    handleExitTap(exitX, exitY) {
        // Determine which direction to move based on exit position
        let direction = '';

        if (exitY === 0) {
            // Top edge exit - move north
            direction = 'arrowup';
        } else if (exitY === GRID_SIZE - 1) {
            // Bottom edge exit - move south
            direction = 'arrowdown';
        } else if (exitX === 0) {
            // Left edge exit - move west
            direction = 'arrowleft';
        } else if (exitX === GRID_SIZE - 1) {
            // Right edge exit - move east
            direction = 'arrowright';
        }

        if (direction) {
            // Simulate the key press to trigger zone transition
            this.inputManager.handleKeyPress({ key: direction, preventDefault: () => {} });
        }
    }

    // Force trigger interaction at a given position (used when player arrives adjacent via auto-pathing)
    triggerInteractAt(gridCoords) {
        // Skip if player is not adjacent to the target
        const playerPos = this.game.player.getPosition();
        const dx = Math.abs(gridCoords.x - playerPos.x);
        const dy = Math.abs(gridCoords.y - playerPos.y);
        const isAdjacent = (dx <= 1 && dy <= 1) && !(dx === 0 && dy === 0);
        if (!isAdjacent) return;

        // Now trigger the same logic as handleTap
        // Check if tapped on sign
        const signTile = this.game.grid[gridCoords.y]?.[gridCoords.x];
        if (signTile && typeof signTile === 'object' && signTile.type === TILE_TYPES.SIGN) {
            Sign.handleClick(signTile, this.game, isAdjacent);
            const isAlreadyDisplayed = this.game.displayingMessageForSign &&
                                      this.game.displayingMessageForSign.message === signTile.message;
            const showingNewMessage = !isAlreadyDisplayed;
            if (showingNewMessage && signTile.message !== this.game.lastSignMessage) {
                this.game.uiManager.addMessageToLog(`A sign reads: "${signTile.message.replace(/<br>/g, ' ')}"`);
                this.game.lastSignMessage = signTile.message;
            }
            return;
        }

        // Check if tapped on lion
        const lionAtPosition = this.game.grid[gridCoords.y]?.[gridCoords.x] === TILE_TYPES.LION;
        if (lionAtPosition) {
            this.game.uiManager.showBarterWindow('lion');
            return;
        }

        // Check if tapped on squig
        const squigAtPosition = this.game.grid[gridCoords.y]?.[gridCoords.x] === TILE_TYPES.SQUIG;
        if (squigAtPosition) {
            this.game.uiManager.showBarterWindow('squig');
            return;
        }

        // Check if tapped on rune
        const runeAtPosition = this.game.grid[gridCoords.y]?.[gridCoords.x] === TILE_TYPES.RUNE;
        if (runeAtPosition) {
            this.game.uiManager.showBarterWindow('rune');
            return;
        }

        // Check if crayn
        const craynAtPosition = this.game.grid[gridCoords.y]?.[gridCoords.x] === TILE_TYPES.CRAYN;
        if (craynAtPosition) {
            const npcData = Sign.getDialogueNpcData('crayn');
            if (npcData) {
                const message = npcData.messages[npcData.currentMessageIndex];
                // Use the sign message system for a persistent message that clears on movement
                this.game.displayingMessageForSign = { message: message, type: 'npc' };
                this.game.uiManager.showSignMessage(message, npcData.portrait, npcData.name);
                // Cycle to the next message
                npcData.currentMessageIndex = (npcData.currentMessageIndex + 1) % npcData.messages.length;
            }
            return;
        }

        // Check if felt
        const feltAtPosition = this.game.grid[gridCoords.y]?.[gridCoords.x] === TILE_TYPES.FELT;
        if (feltAtPosition) {
            const npcData = Sign.getDialogueNpcData('felt');
            if (npcData) {
                const message = npcData.messages[npcData.currentMessageIndex];
                // Use the sign message system for a persistent message that clears on movement
                this.game.displayingMessageForSign = { message: message, type: 'npc' };
                this.game.uiManager.showSignMessage(message, npcData.portrait, npcData.name);
                // Cycle to the next message
                npcData.currentMessageIndex = (npcData.currentMessageIndex + 1) % npcData.messages.length;
            }
            return;
        }

        // Check if forge
        const forgeAtPosition = this.game.grid[gridCoords.y]?.[gridCoords.x] === TILE_TYPES.FORGE;
        if (forgeAtPosition) {
            const npcData = Sign.getDialogueNpcData('forge');
            if (npcData) {
                const message = npcData.messages[npcData.currentMessageIndex];
                // Use the sign message system for a persistent message that clears on movement
                this.game.displayingMessageForSign = { message: message, type: 'npc' };
                this.game.uiManager.showSignMessage(message, npcData.portrait, npcData.name);
                // Cycle to the next message
                npcData.currentMessageIndex = (npcData.currentMessageIndex + 1) % npcData.messages.length;
            }
            return;
        }

        // Check enemy statue
        const statueTile = this.game.grid[gridCoords.y]?.[gridCoords.x];
        let statueNpcType = null;
        if (statueTile === TILE_TYPES.LIZARDY_STATUE) statueNpcType = 'statue_lizardy';
        else if (statueTile === TILE_TYPES.LIZARDO_STATUE) statueNpcType = 'statue_lizardo';
        else if (statueTile === TILE_TYPES.LIZARDEAUX_STATUE) statueNpcType = 'statue_lizardeaux';
        else if (statueTile === TILE_TYPES.ZARD_STATUE) statueNpcType = 'statue_zard';
        else if (statueTile === TILE_TYPES.LAZERD_STATUE) statueNpcType = 'statue_lazerd';
        else if (statueTile === TILE_TYPES.LIZORD_STATUE) statueNpcType = 'statue_lizord';

        if (statueNpcType) {
            this.game.uiManager.showStatueInfo(statueNpcType);
            return;
        }

        // Check if bomb
        const tapTile = this.game.grid[gridCoords.y][gridCoords.x];
        if (tapTile && typeof tapTile === 'object' && tapTile.type === 'BOMB') {
            tapTile.actionsSincePlaced = 2;  // Trigger immediate explosion
            this.game.explodeBomb(gridCoords.x, gridCoords.y);
            return;
        }

        // Check choppables - since we're adjacent, perform action directly
        const tappedTile = this.game.grid[gridCoords.y]?.[gridCoords.x];
        const hasAxe = this.game.player.inventory.some(item => item.type === 'axe');
        const hasHammer = this.game.player.inventory.some(item => item.type === 'hammer');

        if ((tappedTile === TILE_TYPES.GRASS || tappedTile === TILE_TYPES.SHRUBBERY)) {
            if (hasAxe) {
                // Perform chopping action - since player is adjacent, move to it and chop
                this.game.player.move(gridCoords.x, gridCoords.y, this.game.grid, (zoneX, zoneY, exitSide) => {
                    this.game.transitionToZone(zoneX, zoneY, exitSide, playerPos.x, playerPos.y);
                });
                this.game.handleEnemyMovements();
                this.game.checkCollisions();
                this.game.checkItemPickup();
                this.game.updatePlayerPosition();
                this.game.updatePlayerStats();
            }
        } else if (tappedTile === TILE_TYPES.ROCK) {
            if (hasHammer) {
                // Perform breaking action
                this.game.player.move(gridCoords.x, gridCoords.y, this.game.grid, (zoneX, zoneY, exitSide) => {
                    this.game.transitionToZone(zoneX, zoneY, exitSide, playerPos.x, playerPos.y);
                });
                this.game.handleEnemyMovements();
                this.game.checkCollisions();
                this.game.checkItemPickup();
                this.game.updatePlayerPosition();
                this.game.updatePlayerStats();
            }
        }
    }
}
