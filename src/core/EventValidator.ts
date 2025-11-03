import { EventTypes } from './EventTypes';

/**
 * EventValidator - Validates event data against registered schemas
 * Provides runtime validation to catch event contract violations early
 */
export class EventValidator {
    constructor() {
        this.schemas = new Map();
        this.enabled = true;
        this.strictMode = false; // In strict mode, invalid events throw errors
        this.registerDefaultSchemas();
    }

    /**
     * Register a validation schema for an event type
     * @param {string} eventType - The event type constant
     * @param {Object} schema - Schema definition with field validators
     */
    registerSchema(eventType, schema) {
        this.schemas.set(eventType, schema);
    }

    /**
     * Validate event data against registered schema
     * @param {string} eventType - The event type
     * @param {*} data - The event data to validate
     * @returns {{valid: boolean, errors: string[]}} - Validation result
     */
    validate(eventType, data) {
        if (!this.enabled) {
            return { valid: true, errors: [] };
        }

        const schema = this.schemas.get(eventType);
        if (!schema) {
            // No schema registered = no validation required
            return { valid: true, errors: [] };
        }

        const errors = [];

        // Validate required fields
        for (const [fieldName, validator] of Object.entries(schema)) {
            const { required, type, values, validator: customValidator } = validator;

            // Check required fields
            if (required && (data === undefined || data === null || !(fieldName in data))) {
                errors.push(`Missing required field: ${fieldName}`);
                continue;
            }

            // Skip validation if field is not present and not required
            if (!(fieldName in data) && !required) {
                continue;
            }

            const fieldValue = data[fieldName];

            // Type validation
            if (type && fieldValue !== undefined && fieldValue !== null) {
                const actualType = Array.isArray(fieldValue) ? 'array' : typeof fieldValue;
                if (actualType !== type) {
                    errors.push(`Invalid type for "${fieldName}": expected ${type}, got ${actualType}`);
                }
            }

            // Enum/value validation
            if (values && fieldValue !== undefined && !values.includes(fieldValue)) {
                errors.push(`Invalid value for "${fieldName}": got "${fieldValue}", expected one of [${values.join(', ')}]`);
            }

            // Custom validator function
            if (customValidator && typeof customValidator === 'function') {
                const result = customValidator(fieldValue, data);
                if (result !== true) {
                    errors.push(`Custom validation failed for "${fieldName}": ${result}`);
                }
            }
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Enable or disable validation
     * @param {boolean} enabled - Whether validation is enabled
     */
    setEnabled(enabled) {
        this.enabled = enabled;
    }

    /**
     * Enable or disable strict mode
     * In strict mode, validation failures throw errors instead of just logging
     * @param {boolean} strict - Whether strict mode is enabled
     */
    setStrictMode(strict) {
        this.strictMode = strict;
    }

    /**
     * Register default schemas for core event types
     */
    registerDefaultSchemas() {
        // UI Dialog Events
        this.registerSchema(EventTypes.UI_DIALOG_SHOW, {
            type: {
                required: true,
                type: 'string',
                values: ['barter', 'sign', 'statue']
            },
            npc: { type: 'string' },
            message: { type: 'string' },
            portrait: { type: 'string' },
            name: { type: 'string' },
            buttonText: { type: 'string' },
            playerPos: {
                type: 'object',
                validator: (val) => {
                    if (!val) return true;
                    if (typeof val.x !== 'number' || typeof val.y !== 'number') {
                        return 'playerPos must have numeric x and y properties';
                    }
                    return true;
                }
            },
            npcPos: {
                type: 'object',
                validator: (val) => {
                    if (!val) return true;
                    if (typeof val.x !== 'number' || typeof val.y !== 'number') {
                        return 'npcPos must have numeric x and y properties';
                    }
                    return true;
                }
            }
        });

        this.registerSchema(EventTypes.UI_DIALOG_HIDE, {
            type: {
                required: true,
                type: 'string'
            }
        });

        this.registerSchema(EventTypes.UI_CONFIRMATION_SHOW, {
            message: { required: true, type: 'string' },
            action: { required: true, type: 'string' },
            data: {},
            persistent: { type: 'boolean' },
            largeText: { type: 'boolean' },
            useTypewriter: { type: 'boolean' }
        });

        this.registerSchema(EventTypes.UI_CONFIRMATION_RESPONSE, {
            action: { required: true, type: 'string' },
            confirmed: { required: true, type: 'boolean' },
            data: {}
        });

        this.registerSchema(EventTypes.UI_OVERLAY_MESSAGE_SHOW, {
            text: { required: true, type: 'string' },
            imageSrc: { type: 'string' },
            persistent: { type: 'boolean' },
            largeText: { type: 'boolean' },
            useTypewriter: { type: 'boolean' }
        });

        this.registerSchema(EventTypes.UI_MESSAGE_LOG, {
            text: { required: true, type: 'string' },
            category: { type: 'string' },
            priority: {
                type: 'string',
                values: ['info', 'warning', 'error']
            },
            timestamp: { type: 'number' }
        });

        this.registerSchema(EventTypes.UI_REGION_NOTIFICATION_SHOW, {
            x: { required: true, type: 'number' },
            y: { required: true, type: 'number' },
            regionName: { type: 'string' }
        });

        // Stats Events
        this.registerSchema(EventTypes.STATS_HEALTH_CHANGED, {
            oldValue: { required: true, type: 'number' },
            newValue: { required: true, type: 'number' },
            delta: { required: true, type: 'number' },
            source: { type: 'string' }
        });

        this.registerSchema(EventTypes.STATS_POINTS_CHANGED, {
            oldValue: { required: true, type: 'number' },
            newValue: { required: true, type: 'number' },
            delta: { required: true, type: 'number' },
            source: { type: 'string' }
        });

        this.registerSchema(EventTypes.STATS_HUNGER_CHANGED, {
            oldValue: { required: true, type: 'number' },
            newValue: { required: true, type: 'number' },
            delta: { required: true, type: 'number' }
        });

        this.registerSchema(EventTypes.STATS_THIRST_CHANGED, {
            oldValue: { required: true, type: 'number' },
            newValue: { required: true, type: 'number' },
            delta: { required: true, type: 'number' }
        });

        // Animation Events
        this.registerSchema(EventTypes.ANIMATION_HORSE_CHARGE, {
            startPos: {
                required: true,
                type: 'object',
                validator: (val) => {
                    if (typeof val.x !== 'number' || typeof val.y !== 'number') {
                        return 'startPos must have numeric x and y properties';
                    }
                    return true;
                }
            },
            midPos: {
                required: true,
                type: 'object',
                validator: (val) => {
                    if (typeof val.x !== 'number' || typeof val.y !== 'number') {
                        return 'midPos must have numeric x and y properties';
                    }
                    return true;
                }
            },
            endPos: {
                required: true,
                type: 'object',
                validator: (val) => {
                    if (typeof val.x !== 'number' || typeof val.y !== 'number') {
                        return 'endPos must have numeric x and y properties';
                    }
                    return true;
                }
            }
        });

        this.registerSchema(EventTypes.ANIMATION_ARROW, {
            startX: { required: true, type: 'number' },
            startY: { required: true, type: 'number' },
            endX: { required: true, type: 'number' },
            endY: { required: true, type: 'number' }
        });

        this.registerSchema(EventTypes.ANIMATION_POINT, {
            x: { required: true, type: 'number' },
            y: { required: true, type: 'number' },
            points: { required: true, type: 'number' },
            color: { type: 'string' }
        });
    }
}

// Create singleton instance
export const eventValidator = new EventValidator();

/**
 * Wrap an event bus to add validation
 * @param {Object} eventBus - The event bus to wrap
 * @returns {Object} - The wrapped event bus
 */
export function wrapEventBusWithValidation(eventBus) {
    const originalEmit = eventBus.emit.bind(eventBus);

    eventBus.emit = function(eventType, data) {
        const validation = eventValidator.validate(eventType, data);

        if (!validation.valid) {
            const errorMessage = `Event validation failed for "${eventType}":\n  ${validation.errors.join('\n  ')}`;

            if (eventValidator.strictMode) {
                throw new Error(errorMessage);
            } else {
                console.error(errorMessage);
                console.error('Event data:', data);
            }
        }

        return originalEmit(eventType, data);
    };

    return eventBus;
}
