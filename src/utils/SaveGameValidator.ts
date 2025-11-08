/**
 * SaveGameValidator - Type-safe validation for save game data
 *
 * This module provides runtime validation for save game data to prevent
 * security vulnerabilities from malformed or malicious JSON data.
 *
 * Security Features:
 * - Type validation for all required fields
 * - Protection against prototype pollution
 * - Sanitization of unknown properties
 * - Array validation with bounds checking
 *
 * @module SaveGameValidator
 */

import type { SaveGameData, SavedPlayerData, SavedPlayerStats, SavedEnemyData } from '@core/SharedTypes';
import type { InventoryItem } from '@managers/inventory/ItemMetadata';
import type { ZoneCoordinates } from '@core/PositionTypes';
import { logger } from '@core/logger';

/**
 * Validation error for save game data
 */
export class SaveGameValidationError extends Error {
    constructor(message: string, public readonly path?: string) {
        super(path ? `${message} at ${path}` : message);
        this.name = 'SaveGameValidationError';
    }
}

/**
 * Type guard for ZoneCoordinates
 */
function isZoneCoordinates(value: unknown): value is ZoneCoordinates {
    if (typeof value !== 'object' || value === null) {
        return false;
    }

    const obj = value as Record<string, unknown>;
    return (
        typeof obj.dimension === 'number' &&
        typeof obj.x === 'number' &&
        typeof obj.y === 'number'
    );
}

/**
 * Type guard for InventoryItem
 */
function isInventoryItem(value: unknown): value is InventoryItem {
    if (typeof value !== 'object' || value === null) {
        return false;
    }

    const obj = value as Record<string, unknown>;

    // Check for required type field
    if (typeof obj.type !== 'string') {
        return false;
    }

    // Optional fields are allowed
    return true;
}

/**
 * Type guard for SavedPlayerData
 */
function isSavedPlayerData(value: unknown, path = 'player'): value is SavedPlayerData {
    if (typeof value !== 'object' || value === null) {
        throw new SaveGameValidationError('Player data must be an object', path);
    }

    const obj = value as Record<string, unknown>;

    // Validate required numeric fields
    if (typeof obj.x !== 'number' || !Number.isFinite(obj.x)) {
        throw new SaveGameValidationError('Player x must be a finite number', `${path}.x`);
    }
    if (typeof obj.y !== 'number' || !Number.isFinite(obj.y)) {
        throw new SaveGameValidationError('Player y must be a finite number', `${path}.y`);
    }
    if (typeof obj.thirst !== 'number' || !Number.isFinite(obj.thirst)) {
        throw new SaveGameValidationError('Player thirst must be a finite number', `${path}.thirst`);
    }
    if (typeof obj.hunger !== 'number' || !Number.isFinite(obj.hunger)) {
        throw new SaveGameValidationError('Player hunger must be a finite number', `${path}.hunger`);
    }
    if (typeof obj.health !== 'number' || !Number.isFinite(obj.health)) {
        throw new SaveGameValidationError('Player health must be a finite number', `${path}.health`);
    }
    if (typeof obj.points !== 'number' || !Number.isFinite(obj.points)) {
        throw new SaveGameValidationError('Player points must be a finite number', `${path}.points`);
    }
    if (typeof obj.spentDiscoveries !== 'number' || !Number.isFinite(obj.spentDiscoveries)) {
        throw new SaveGameValidationError('Player spentDiscoveries must be a finite number', `${path}.spentDiscoveries`);
    }

    // Validate boolean field
    if (typeof obj.dead !== 'boolean') {
        throw new SaveGameValidationError('Player dead must be a boolean', `${path}.dead`);
    }

    // Validate currentZone
    if (!isZoneCoordinates(obj.currentZone)) {
        throw new SaveGameValidationError('Player currentZone must be valid ZoneCoordinates', `${path}.currentZone`);
    }

    // Validate inventory array
    if (!Array.isArray(obj.inventory)) {
        throw new SaveGameValidationError('Player inventory must be an array', `${path}.inventory`);
    }

    // Limit inventory size for security
    if (obj.inventory.length > 1000) {
        throw new SaveGameValidationError('Player inventory exceeds maximum size', `${path}.inventory`);
    }

    // Validate each inventory item
    obj.inventory.forEach((item, index) => {
        if (!isInventoryItem(item)) {
            throw new SaveGameValidationError('Invalid inventory item', `${path}.inventory[${index}]`);
        }
    });

    // Validate abilities array
    if (!Array.isArray(obj.abilities)) {
        throw new SaveGameValidationError('Player abilities must be an array', `${path}.abilities`);
    }

    // Limit abilities size
    if (obj.abilities.length > 100) {
        throw new SaveGameValidationError('Player abilities exceeds maximum size', `${path}.abilities`);
    }

    // Validate each ability is a string
    obj.abilities.forEach((ability, index) => {
        if (typeof ability !== 'string') {
            throw new SaveGameValidationError('Ability must be a string', `${path}.abilities[${index}]`);
        }
    });

    // Validate visitedZones array
    if (!Array.isArray(obj.visitedZones)) {
        throw new SaveGameValidationError('Player visitedZones must be an array', `${path}.visitedZones`);
    }

    // Limit visited zones size
    if (obj.visitedZones.length > 10000) {
        throw new SaveGameValidationError('Player visitedZones exceeds maximum size', `${path}.visitedZones`);
    }

    // Validate each visited zone is a string
    obj.visitedZones.forEach((zone, index) => {
        if (typeof zone !== 'string') {
            throw new SaveGameValidationError('Visited zone must be a string', `${path}.visitedZones[${index}]`);
        }
    });

    return true;
}

/**
 * Type guard for SavedPlayerStats
 */
function isSavedPlayerStats(value: unknown, path = 'playerStats'): value is SavedPlayerStats {
    if (typeof value !== 'object' || value === null) {
        throw new SaveGameValidationError('Player stats must be an object', path);
    }

    const obj = value as Record<string, unknown>;

    if (typeof obj.musicEnabled !== 'boolean') {
        throw new SaveGameValidationError('musicEnabled must be a boolean', `${path}.musicEnabled`);
    }
    if (typeof obj.sfxEnabled !== 'boolean') {
        throw new SaveGameValidationError('sfxEnabled must be a boolean', `${path}.sfxEnabled`);
    }

    return true;
}

/**
 * Type guard for SavedEnemyData
 */
function isSavedEnemyData(value: unknown, path = 'enemy'): value is SavedEnemyData {
    if (typeof value !== 'object' || value === null) {
        throw new SaveGameValidationError('Enemy data must be an object', path);
    }

    const obj = value as Record<string, unknown>;

    if (typeof obj.x !== 'number' || !Number.isFinite(obj.x)) {
        throw new SaveGameValidationError('Enemy x must be a finite number', `${path}.x`);
    }
    if (typeof obj.y !== 'number' || !Number.isFinite(obj.y)) {
        throw new SaveGameValidationError('Enemy y must be a finite number', `${path}.y`);
    }
    if (typeof obj.health !== 'number' || !Number.isFinite(obj.health)) {
        throw new SaveGameValidationError('Enemy health must be a finite number', `${path}.health`);
    }
    if (typeof obj.enemyType !== 'string') {
        throw new SaveGameValidationError('Enemy enemyType must be a string', `${path}.enemyType`);
    }
    if (typeof obj.id !== 'string') {
        throw new SaveGameValidationError('Enemy id must be a string', `${path}.id`);
    }

    return true;
}

/**
 * Type guard and assertion for SaveGameData
 */
function isValidSaveGameData(data: unknown): data is SaveGameData {
    if (typeof data !== 'object' || data === null) {
        throw new SaveGameValidationError('Save game data must be an object');
    }

    const obj = data as Record<string, unknown>;

    // Protect against prototype pollution
    if (Object.prototype.hasOwnProperty.call(obj, '__proto__') ||
        Object.prototype.hasOwnProperty.call(obj, 'constructor') ||
        Object.prototype.hasOwnProperty.call(obj, 'prototype')) {
        throw new SaveGameValidationError('Save game data contains forbidden properties');
    }

    // Validate required fields
    isSavedPlayerData(obj.player, 'player');
    isSavedPlayerStats(obj.playerStats, 'playerStats');

    // Validate zones array
    if (!Array.isArray(obj.zones)) {
        throw new SaveGameValidationError('zones must be an array', 'zones');
    }

    // Limit zones size for security
    if (obj.zones.length > 10000) {
        throw new SaveGameValidationError('zones exceeds maximum size', 'zones');
    }

    // Validate grid array
    if (!Array.isArray(obj.grid)) {
        throw new SaveGameValidationError('grid must be an array', 'grid');
    }

    // Limit grid size
    if (obj.grid.length > 1000) {
        throw new SaveGameValidationError('grid exceeds maximum size', 'grid');
    }

    // Validate each grid row is an array
    obj.grid.forEach((row, index) => {
        if (!Array.isArray(row)) {
            throw new SaveGameValidationError('grid row must be an array', `grid[${index}]`);
        }
        if (row.length > 1000) {
            throw new SaveGameValidationError('grid row exceeds maximum size', `grid[${index}]`);
        }
    });

    // Validate enemies array
    if (!Array.isArray(obj.enemies)) {
        throw new SaveGameValidationError('enemies must be an array', 'enemies');
    }

    // Limit enemies size
    if (obj.enemies.length > 10000) {
        throw new SaveGameValidationError('enemies exceeds maximum size', 'enemies');
    }

    // Validate each enemy
    obj.enemies.forEach((enemy, index) => {
        isSavedEnemyData(enemy, `enemies[${index}]`);
    });

    // Validate defeatedEnemies array
    if (!Array.isArray(obj.defeatedEnemies)) {
        throw new SaveGameValidationError('defeatedEnemies must be an array', 'defeatedEnemies');
    }

    // Limit defeated enemies size
    if (obj.defeatedEnemies.length > 10000) {
        throw new SaveGameValidationError('defeatedEnemies exceeds maximum size', 'defeatedEnemies');
    }

    // Validate each defeated enemy ID is a string
    obj.defeatedEnemies.forEach((id, index) => {
        if (typeof id !== 'string') {
            throw new SaveGameValidationError('defeatedEnemies entry must be a string', `defeatedEnemies[${index}]`);
        }
    });

    // Validate specialZones array
    if (!Array.isArray(obj.specialZones)) {
        throw new SaveGameValidationError('specialZones must be an array', 'specialZones');
    }

    // Limit special zones size
    if (obj.specialZones.length > 1000) {
        throw new SaveGameValidationError('specialZones exceeds maximum size', 'specialZones');
    }

    // Validate messageLog array
    if (!Array.isArray(obj.messageLog)) {
        throw new SaveGameValidationError('messageLog must be an array', 'messageLog');
    }

    // Limit message log size
    if (obj.messageLog.length > 10000) {
        throw new SaveGameValidationError('messageLog exceeds maximum size', 'messageLog');
    }

    // Validate each message is a string
    obj.messageLog.forEach((msg, index) => {
        if (typeof msg !== 'string') {
            throw new SaveGameValidationError('messageLog entry must be a string', `messageLog[${index}]`);
        }
    });

    // Validate currentRegion
    if (typeof obj.currentRegion !== 'string') {
        throw new SaveGameValidationError('currentRegion must be a string', 'currentRegion');
    }

    return true;
}

/**
 * Validator class for save game data
 */
export class SaveGameValidator {
    /**
     * Validates save game data and throws if invalid
     * @param data - Unknown data to validate
     * @throws {SaveGameValidationError} If validation fails
     */
    static validate(data: unknown): asserts data is SaveGameData {
        try {
            if (!isValidSaveGameData(data)) {
                throw new SaveGameValidationError('Invalid save game data structure');
            }
        } catch (error) {
            if (error instanceof SaveGameValidationError) {
                logger.error('SaveGameValidator: Validation failed:', error.message);
                throw error;
            }
            logger.error('SaveGameValidator: Unexpected error during validation:', error);
            throw new SaveGameValidationError('Validation failed with unexpected error');
        }
    }

    /**
     * Validates save game data and returns a boolean
     * @param data - Unknown data to validate
     * @returns True if valid, false otherwise
     */
    static isValid(data: unknown): data is SaveGameData {
        try {
            this.validate(data);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Validates and sanitizes save game data
     * @param data - Unknown data to validate and sanitize
     * @returns Validated and sanitized save game data
     * @throws {SaveGameValidationError} If validation fails
     */
    static validateAndSanitize(data: unknown): SaveGameData {
        this.validate(data);

        // Additional sanitization - remove any __proto__, constructor, or prototype properties
        const sanitized = JSON.parse(JSON.stringify(data));

        // Remove dangerous properties at any level
        this.removeDangerousProperties(sanitized);

        return sanitized as SaveGameData;
    }

    /**
     * Recursively removes dangerous properties that could lead to prototype pollution
     */
    private static removeDangerousProperties(obj: any): void {
        if (typeof obj !== 'object' || obj === null) {
            return;
        }

        const dangerousKeys = ['__proto__', 'constructor', 'prototype'];

        for (const key of dangerousKeys) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                delete obj[key];
            }
        }

        // Recursively check nested objects and arrays
        if (Array.isArray(obj)) {
            obj.forEach(item => this.removeDangerousProperties(item));
        } else {
            Object.values(obj).forEach(value => this.removeDangerousProperties(value));
        }
    }
}
