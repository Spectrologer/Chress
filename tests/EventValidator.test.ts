import { EventValidator } from '@core/EventValidator';
import { EventTypes } from '@core/EventTypes';

describe('EventValidator', () => {
    let validator;

    beforeEach(() => {
        validator = new EventValidator();
    });

    describe('Basic Validation', () => {
        test('validates required fields', () => {
            validator.registerSchema(EventTypes.UI_CONFIRMATION_SHOW, {
                message: { required: true, type: 'string' },
                action: { required: true, type: 'string' }
            });

            const result = validator.validate(EventTypes.UI_CONFIRMATION_SHOW, {
                message: 'Confirm?',
                action: 'test_action'
            });

            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        test('fails when required field is missing', () => {
            validator.registerSchema(EventTypes.UI_CONFIRMATION_SHOW, {
                message: { required: true, type: 'string' },
                action: { required: true, type: 'string' }
            });

            const result = validator.validate(EventTypes.UI_CONFIRMATION_SHOW, {
                message: 'Confirm?'
                // action is missing
            });

            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Missing required field: action');
        });

        test('validates field types', () => {
            validator.registerSchema(EventTypes.STATS_HEALTH_CHANGED, {
                oldValue: { required: true, type: 'number' },
                newValue: { required: true, type: 'number' },
                delta: { required: true, type: 'number' }
            });

            const result = validator.validate(EventTypes.STATS_HEALTH_CHANGED, {
                oldValue: 100,
                newValue: 80,
                delta: -20
            });

            expect(result.valid).toBe(true);
        });

        test('fails when field type is incorrect', () => {
            validator.registerSchema(EventTypes.STATS_HEALTH_CHANGED, {
                oldValue: { required: true, type: 'number' }
            });

            const result = validator.validate(EventTypes.STATS_HEALTH_CHANGED, {
                oldValue: 'not a number'
            });

            expect(result.valid).toBe(false);
            expect(result.errors.some((err: string) => err.includes('Invalid type for "oldValue"'))).toBe(true);
        });

        test('allows optional fields to be missing', () => {
            validator.registerSchema(EventTypes.UI_OVERLAY_MESSAGE_SHOW, {
                text: { required: true, type: 'string' },
                imageSrc: { required: false, type: 'string' }
            });

            const result = validator.validate(EventTypes.UI_OVERLAY_MESSAGE_SHOW, {
                text: 'Hello'
                // imageSrc is optional and missing
            });

            expect(result.valid).toBe(true);
        });

        test('validates optional fields when present', () => {
            validator.registerSchema(EventTypes.UI_OVERLAY_MESSAGE_SHOW, {
                text: { required: true, type: 'string' },
                imageSrc: { required: false, type: 'string' }
            });

            const result = validator.validate(EventTypes.UI_OVERLAY_MESSAGE_SHOW, {
                text: 'Hello',
                imageSrc: 'assets/image.png'
            });

            expect(result.valid).toBe(true);
        });
    });

    describe('Enum Validation', () => {
        test('validates enum values', () => {
            validator.registerSchema(EventTypes.UI_DIALOG_SHOW, {
                type: {
                    required: true,
                    type: 'string',
                    values: ['barter', 'sign', 'statue']
                }
            });

            const result = validator.validate(EventTypes.UI_DIALOG_SHOW, {
                type: 'barter'
            });

            expect(result.valid).toBe(true);
        });

        test('fails when enum value is invalid', () => {
            validator.registerSchema(EventTypes.UI_DIALOG_SHOW, {
                type: {
                    required: true,
                    type: 'string',
                    values: ['barter', 'sign', 'statue']
                }
            });

            const result = validator.validate(EventTypes.UI_DIALOG_SHOW, {
                type: 'invalid_type'
            });

            expect(result.valid).toBe(false);
            expect(result.errors.some((err: string) => err.includes('Invalid value for "type"'))).toBe(true);
        });
    });

    describe('Custom Validators', () => {
        test('uses custom validator function', () => {
            validator.registerSchema('test:event', {
                position: {
                    required: true,
                    type: 'object',
                    validator: (val: any) => {
                        if (typeof val.x !== 'number' || typeof val.y !== 'number') {
                            return 'position must have numeric x and y';
                        }
                        return true;
                    }
                }
            });

            const result = validator.validate('test:event', {
                position: { x: 5, y: 10 }
            });

            expect(result.valid).toBe(true);
        });

        test('fails custom validation', () => {
            validator.registerSchema('test:event', {
                position: {
                    required: true,
                    type: 'object',
                    validator: (val: any) => {
                        if (typeof val.x !== 'number' || typeof val.y !== 'number') {
                            return 'position must have numeric x and y';
                        }
                        return true;
                    }
                }
            });

            const result = validator.validate('test:event', {
                position: { x: 'invalid', y: 10 }
            });

            expect(result.valid).toBe(false);
            expect(result.errors.some((err: string) => err.includes('position must have numeric x and y'))).toBe(true);
        });
    });

    describe('Default Schemas', () => {
        test('has schema for UI_DIALOG_SHOW registered by default', () => {
            const result = validator.validate(EventTypes.UI_DIALOG_SHOW, {
                type: 'barter',
                npc: 'penne'
            });

            expect(result.valid).toBe(true);
        });

        test('validates UI_CONFIRMATION_SHOW schema', () => {
            const result = validator.validate(EventTypes.UI_CONFIRMATION_SHOW, {
                message: 'Tap to confirm',
                action: 'bishop_charge',
                persistent: true,
                largeText: true
            });

            expect(result.valid).toBe(true);
        });

        test('validates UI_MESSAGE_LOG priority enum', () => {
            const validResult = validator.validate(EventTypes.UI_MESSAGE_LOG, {
                text: 'Test message',
                priority: 'warning'
            });

            expect(validResult.valid).toBe(true);

            const invalidResult = validator.validate(EventTypes.UI_MESSAGE_LOG, {
                text: 'Test message',
                priority: 'invalid_priority'
            });

            expect(invalidResult.valid).toBe(false);
        });

        test('validates ANIMATION_HORSE_CHARGE position objects', () => {
            const result = validator.validate(EventTypes.ANIMATION_HORSE_CHARGE, {
                startPos: { x: 1, y: 1 },
                midPos: { x: 2, y: 1 },
                endPos: { x: 2, y: 2 }
            });

            expect(result.valid).toBe(true);
        });

        test('fails ANIMATION_ARROW with missing required fields', () => {
            const result = validator.validate(EventTypes.ANIMATION_ARROW, {
                startX: 1,
                startY: 1
                // missing endX and endY
            });

            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Missing required field: endX');
            expect(result.errors).toContain('Missing required field: endY');
        });
    });

    describe('Configuration', () => {
        test('can be disabled', () => {
            validator.registerSchema('test:event', {
                required: { required: true, type: 'string' }
            });

            validator.setEnabled(false);

            const result = validator.validate('test:event', {
                // missing required field, but validation is disabled
            });

            expect(result.valid).toBe(true);
        });

        test('can be re-enabled', () => {
            validator.registerSchema('test:event', {
                required: { required: true, type: 'string' }
            });

            validator.setEnabled(false);
            validator.setEnabled(true);

            const result = validator.validate('test:event', {
                // missing required field
            });

            expect(result.valid).toBe(false);
        });

        test('returns valid for unregistered event types', () => {
            const result = validator.validate('unregistered:event', {
                anything: 'goes'
            });

            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });
    });

    describe('Complex Validation Scenarios', () => {
        test('validates multiple errors at once', () => {
            validator.registerSchema('test:event', {
                field1: { required: true, type: 'string' },
                field2: { required: true, type: 'number' },
                field3: { required: true, type: 'boolean' }
            });

            const result = validator.validate('test:event', {
                field1: 123,  // wrong type
                // field2 missing
                field3: 'yes'  // wrong type
            });

            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(1);
        });

        test('handles null and undefined data', () => {
            validator.registerSchema('test:event', {
                field: { required: true, type: 'string' }
            });

            const nullResult = validator.validate('test:event', null);
            expect(nullResult.valid).toBe(false);

            const undefinedResult = validator.validate('test:event', undefined);
            expect(undefinedResult.valid).toBe(false);
        });

        test('validates array type', () => {
            validator.registerSchema('test:event', {
                items: { required: true, type: 'array' }
            });

            const validResult = validator.validate('test:event', {
                items: [1, 2, 3]
            });
            expect(validResult.valid).toBe(true);

            const invalidResult = validator.validate('test:event', {
                items: 'not an array'
            });
            expect(invalidResult.valid).toBe(false);
        });
    });
});
