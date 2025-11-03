// Console Commands Registry - Declarative configuration for spawn commands
import { TILE_TYPES } from './constants/index.js';

/**
 * Registry of spawn commands with their configurations
 * Each entry defines:
 * - commandName: The function name (e.g., 'spawnBomb')
 * - displayName: Human-readable name for logging
 * - tileValue: The tile type or object to spawn
 * - hotkey: Optional keyboard shortcut (if applicable)
 */
export const SPAWN_REGISTRY = [
  // Simple item spawns
  { commandName: 'spawnBomb', displayName: 'bomb', tileValue: TILE_TYPES.BOMB, hotkey: 'b' },
  { commandName: 'spawnHammer', displayName: 'hammer', tileValue: TILE_TYPES.HAMMER, hotkey: 'm' },
  { commandName: 'spawnNote', displayName: 'note', tileValue: TILE_TYPES.NOTE, hotkey: 'n' },
  { commandName: 'spawnHeart', displayName: 'heart', tileValue: TILE_TYPES.HEART, hotkey: 'r' },
  { commandName: 'spawnWater', displayName: 'water', tileValue: TILE_TYPES.WATER, hotkey: 'w' },
  { commandName: 'spawnPenne', displayName: 'Penne', tileValue: TILE_TYPES.PENNE, hotkey: 'l' },
  { commandName: 'spawnSquig', displayName: 'squig', tileValue: TILE_TYPES.SQUIG, hotkey: 'g' },
  { commandName: 'spawnRune', displayName: 'rune', tileValue: TILE_TYPES.RUNE, hotkey: 'e' },
  { commandName: 'spawnNib', displayName: 'nib', tileValue: TILE_TYPES.NIB, hotkey: 'i' },
  { commandName: 'spawnMark', displayName: 'Mark', tileValue: TILE_TYPES.MARK, hotkey: 'x' },
  { commandName: 'spawnGouge', displayName: 'Gouge', tileValue: TILE_TYPES.GOUGE, hotkey: 'd' },
  { commandName: 'spawnPitfall', displayName: 'pitfall', tileValue: TILE_TYPES.PITFALL, hotkey: 'p' },

  // Object-based spawns (items with properties)
  {
    commandName: 'spawnTimedBomb',
    displayName: 'timed bomb',
    tileValue: { type: TILE_TYPES.BOMB, actionsSincePlaced: 0, justPlaced: true }
  },
  {
    commandName: 'spawnHorseIcon',
    displayName: 'horse icon',
    tileValue: { type: TILE_TYPES.HORSE_ICON, uses: 3 },
    hotkey: 'h'
  },
  {
    commandName: 'spawnBishopSpear',
    displayName: 'bishop spear',
    tileValue: { type: TILE_TYPES.BISHOP_SPEAR, uses: 3 },
    hotkey: 'z'
  },
  {
    commandName: 'spawnBook',
    displayName: 'Book of Time Travel',
    tileValue: { type: TILE_TYPES.BOOK_OF_TIME_TRAVEL, uses: 3 },
    hotkey: 'k'
  },
  {
    commandName: 'spawnBow',
    displayName: 'bow',
    tileValue: { type: TILE_TYPES.BOW, uses: 3 },
    hotkey: 'y'
  },
  {
    commandName: 'spawnShovel',
    displayName: 'shovel',
    tileValue: { type: TILE_TYPES.SHOVEL, uses: 3 },
    hotkey: 'v'
  },

  // Food spawns
  {
    commandName: 'spawnFoodMeat',
    displayName: 'meat',
    tileValue: { type: TILE_TYPES.FOOD, foodType: 'items/consumables/beaf.png' }
  },
  {
    commandName: 'spawnFoodNut',
    displayName: 'nut',
    tileValue: { type: TILE_TYPES.FOOD, foodType: 'items/consumables/nut.png' },
    hotkey: 'u'
  },
];

/**
 * Enemy spawn registry
 * Each entry defines the enemy type and optional hotkey
 */
export const ENEMY_REGISTRY = [
  { commandName: 'spawnLizardy', enemyType: 'lizardy', hotkey: '1' },
  { commandName: 'spawnLizardo', enemyType: 'lizardo', hotkey: '2' },
  { commandName: 'spawnLizardeaux', enemyType: 'lizardeaux', hotkey: '3' },
  { commandName: 'spawnLizord', enemyType: 'lizord', hotkey: '4' },
  { commandName: 'spawnLazerd', enemyType: 'lazerd', hotkey: '5' },
  { commandName: 'spawnZard', enemyType: 'zard', hotkey: '6' },
];

/**
 * Special commands that require custom logic
 */
export const SPECIAL_COMMANDS = [
  { commandName: 'spawnShack', hotkey: 'j' },
  { commandName: 'spawnCistern', hotkey: 'c' },
  { commandName: 'spawnStairdown', hotkey: 't' },
  { commandName: 'spawnFoodRandom', hotkey: 'f' }, // Random food spawner
  { commandName: 'spawnGossipNPC', hotkey: 'o' }, // Random gossip NPC spawner
];
