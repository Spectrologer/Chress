import { ANIMATION_SCHEMAS } from './constants/index.js';
import { eventBus } from './EventBus.js';
import { EventTypes } from './EventTypes.js';

interface TileBase {
  type: number | string;
  [key: string]: any;
}

interface BombTile extends TileBase {
  actionsSincePlaced: number;
  justPlaced: boolean;
}

interface ChargedItemTile extends TileBase {
  uses: number;
}

interface BowTile extends TileBase {
  uses: number;
}

interface SignTile extends TileBase {
  message: string;
}

interface FoodTile extends TileBase {
  foodType: string;
}

type Tile = number | TileBase;

interface Position {
  x: number;
  y: number;
}

interface AnimationData {
  [key: string]: any;
}

interface PointAnimation {
  x: number;
  y: number;
  amount: number;
  frame: number;
}

interface MultiplierAnimation {
  x: number;
  y: number;
  multiplier: number;
  frame: number;
}

interface ArrowAnimation {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  frame: number;
}

interface HorseChargeAnimation {
  startPos: Position;
  midPos: Position;
  endPos: Position;
  frame: number;
}

interface BumpAnimation {
  offsetX: number;
  offsetY: number;
  frames: number;
}

interface LiftAnimation {
  offsetY: number;
  frames: number;
}

interface SmokeAnimation {
  frame: number;
}

interface ActiveAnimations {
  pointAnimations: PointAnimation[];
  arrowAnimations: ArrowAnimation[];
  horseChargeAnimations: HorseChargeAnimation[];
  bumpAnimations: BumpAnimation[];
  liftAnimations: LiftAnimation[];
  smokeAnimations: SmokeAnimation[];
  multiplierAnimations: MultiplierAnimation[];
}

/**
 * Data Contract Validation System
 * Ensures all data structures conform to defined schemas
 */
export class DataContractValidator {

  /**
   * Validates a tile object against the appropriate schema
   * @param tile - The tile object to validate
   * @returns True if valid
   * @throws Error if validation fails
   */
  static validateTile(tile: Tile): boolean {
    if (typeof tile === 'number') {
      // Primitive tile - should be a valid TILE_TYPES enum value
      return this.validatePrimitiveTile(tile);
    } else if (typeof tile === 'object' && tile !== null) {
      // Object tile - should have required properties
      return this.validateObjectTile(tile);
    }
    throw new Error(`Invalid tile format: expected number or object, got ${typeof tile}`);
  }

  /**
   * Validates a primitive tile (number representing TILE_TYPES)
   * @param tileType - The tile type number
   * @returns True if valid
   */
  static validatePrimitiveTile(tileType: number): boolean {
    if (typeof tileType !== 'number') {
      throw new Error(`Primitive tile must be a number, got ${typeof tileType}`);
    }
    // Basic validation - tile type should be a valid integer
    if (!Number.isInteger(tileType) || tileType < 0) {
      throw new Error(`Invalid tile type: ${tileType}. Must be a non-negative integer.`);
    }
    return true;
  }

  /**
   * Validates an object tile with properties
   * @param tile - The tile object to validate
   * @returns True if valid
   */
  static validateObjectTile(tile: TileBase): boolean {
    if (!tile.type) {
      throw new Error('Object tile must have a "type" property');
    }
    if (typeof tile.type === 'number') {
      this.validatePrimitiveTile(tile.type);
    }

    // Additional property validation can be added per tile type
    switch (tile.type) {
      case 'BOMB':
        return this.validateBombTile(tile as BombTile);
      case 'BISHOP_SPEAR':
      case 'HORSE_ICON':
        return this.validateChargedItemTile(tile as ChargedItemTile);
      case 'BOW':
        return this.validateBowTile(tile as BowTile);
      case 'SIGN':
        return this.validateSignTile(tile as SignTile);
      case 'FOOD':
        return this.validateFoodTile(tile as FoodTile);
      default:
        // Default validation for unknown object tiles
        return true;
    }
  }

  /**
   * Validates bomb tile properties
   */
  static validateBombTile(tile: BombTile): boolean {
    if (typeof tile.actionsSincePlaced !== 'number') {
      throw new Error('Bomb tile must have numeric "actionsSincePlaced" property');
    }
    if (tile.actionsSincePlaced < 0) {
      throw new Error('Bomb "actionsSincePlaced" must be non-negative');
    }
    if (typeof tile.justPlaced !== 'boolean') {
      throw new Error('Bomb tile must have boolean "justPlaced" property (if present)');
    }
    return true;
  }

  /**
   * Validates charged item tile properties
   */
  static validateChargedItemTile(tile: ChargedItemTile): boolean {
    if (typeof tile.uses !== 'number' || !Number.isInteger(tile.uses)) {
      throw new Error('Charged item tile must have integer "uses" property');
    }
    if (tile.uses < 0 || tile.uses > 3) {
      throw new Error('Charged item "uses" must be between 0 and 3');
    }
    return true;
  }

  /**
   * Validates bow tile properties
   */
  static validateBowTile(tile: BowTile): boolean {
    if (typeof tile.uses !== 'number' || !Number.isInteger(tile.uses)) {
      throw new Error('Bow tile must have integer "uses" property');
    }
    if (tile.uses < 0 || tile.uses > 3) {
      throw new Error('Bow "uses" must be between 0 and 3');
    }
    return true;
  }

  /**
   * Validates sign tile properties
   */
  static validateSignTile(tile: SignTile): boolean {
    if (typeof tile.message !== 'string') {
      throw new Error('Sign tile must have string "message" property');
    }
    return true;
  }

  /**
   * Validates food tile properties
   */
  static validateFoodTile(tile: FoodTile): boolean {
    if (typeof tile.foodType !== 'string') {
      throw new Error('Food tile must have string "foodType" property');
    }
    return true;
  }

  /**
   * Validates animation data against schemas
   * @param animationType - Type of animation (POINT, ARROW, etc.)
   * @param animationData - The animation data object
   * @returns True if valid
   */
  static validateAnimation(animationType: string, animationData: AnimationData): boolean {
    const schema = (ANIMATION_SCHEMAS as any)[animationType];
    if (!schema) {
      throw new Error(`Unknown animation type: ${animationType}`);
    }

    for (const [property, expectedType] of Object.entries(schema)) {
      const value = animationData[property];
      if (value === undefined) {
        throw new Error(`Animation ${animationType} missing required property: ${property}`);
      }
      this.validatePropertyType(value, expectedType as string, `${animationType}.${property}`);
    }
    return true;
  }

  /**
   * Validates a property's type
   * @param value - The value to check
   * @param expectedType - The expected type
   * @param propertyPath - Path for error reporting
   */
  static validatePropertyType(value: any, expectedType: string, propertyPath: string): void {
    switch (expectedType) {
      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          throw new Error(`${propertyPath} must be a valid number, got ${typeof value}`);
        }
        break;
      case 'string':
        if (typeof value !== 'string') {
          throw new Error(`${propertyPath} must be a string, got ${typeof value}`);
        }
        break;
      case 'boolean':
        if (typeof value !== 'boolean') {
          throw new Error(`${propertyPath} must be a boolean, got ${typeof value}`);
        }
        break;
      case 'object':
        if (typeof value !== 'object' || value === null) {
          throw new Error(`${propertyPath} must be an object, got ${typeof value}`);
        }
        break;
      default:
        throw new Error(`Unknown type validation: ${expectedType}`);
    }
  }
}

/**
 * Animation Manager for managing different animation collections
 */
export class AnimationManager {
  pointAnimations: PointAnimation[];
  arrowAnimations: ArrowAnimation[];
  horseChargeAnimations: HorseChargeAnimation[];
  bumpAnimations: BumpAnimation[];
  liftAnimations: LiftAnimation[];
  smokeAnimations: SmokeAnimation[];
  multiplierAnimations: MultiplierAnimation[];

  constructor() {
    this.pointAnimations = [];
    this.arrowAnimations = [];
    this.horseChargeAnimations = [];
    this.bumpAnimations = [];
    this.liftAnimations = [];
    this.smokeAnimations = [];
    this.multiplierAnimations = [];
    this.setupEventListeners();
  }

  setupEventListeners(): void {
    // Listen to animation requested events
    eventBus.on(EventTypes.ANIMATION_REQUESTED, (data: any) => {
      switch (data.type) {
        case 'point':
          this.addPointAnimation(data.x, data.y, data.data.amount);
          break;
        case 'multiplier':
          this.addMultiplierAnimation(data.x, data.y, data.data.multiplier);
          break;
        case 'horseCharge':
          this.addHorseChargeAnimation(data.data);
          break;
        case 'arrow':
          this.addArrowAnimation(data.data.startX, data.data.startY, data.data.endX, data.data.endY);
          break;
      }
    });

    // Listen to specific animation event types
    eventBus.on(EventTypes.ANIMATION_HORSE_CHARGE, (data: any) => {
      this.addHorseChargeAnimation(data);
    });

    eventBus.on(EventTypes.ANIMATION_ARROW, (data: any) => {
      this.addArrowAnimation(data.startX, data.startY, data.endX, data.endY);
    });

    eventBus.on(EventTypes.ANIMATION_POINT, (data: any) => {
      this.addPointAnimation(data.x, data.y, data.points);
    });

    eventBus.on(EventTypes.ANIMATION_MULTIPLIER, (data: any) => {
      this.addMultiplierAnimation(data.x, data.y, data.multiplier);
    });

    // Listen to combo achieved events
    eventBus.on(EventTypes.COMBO_ACHIEVED, (data: any) => {
      this.addMultiplierAnimation(data.x, data.y, data.comboCount);
    });
  }

  /**
   * Adds a point animation
   * @param x - X position
   * @param y - Y position
   * @param amount - Point amount to display
   */
  addPointAnimation(x: number, y: number, amount: number): void {
    const animation: PointAnimation = { x, y, amount, frame: 30 };
    DataContractValidator.validateAnimation('POINT', animation);
    this.pointAnimations.push(animation);
  }

  /**
   * Adds a multiplier animation (e.g. x2, x3) shown near an enemy when combos occur
   * @param x - X tile coordinate
   * @param y - Y tile coordinate
   * @param multiplier - Multiplier value (2,3,...)
   */
  addMultiplierAnimation(x: number, y: number, multiplier: number): void {
    const animation: MultiplierAnimation = { x, y, multiplier, frame: 40 };
    DataContractValidator.validateAnimation('MULTIPLIER', animation);
    this.multiplierAnimations.push(animation);
  }

  /**
   * Adds an arrow animation
   * @param startX - Start X position
   * @param startY - Start Y position
   * @param endX - End X position
   * @param endY - End Y position
   */
  addArrowAnimation(startX: number, startY: number, endX: number, endY: number): void {
    const animation: ArrowAnimation = { startX, startY, endX, endY, frame: 20 };
    DataContractValidator.validateAnimation('ARROW', animation);
    this.arrowAnimations.push(animation);
  }

  /**
   * Adds a horse charge animation
   * @param data - Animation data with positions
   */
  addHorseChargeAnimation({ startPos, midPos, endPos }: { startPos: Position; midPos: Position; endPos: Position }): void {
    const animation: HorseChargeAnimation = {
      startPos: { ...startPos },
      midPos: { ...midPos },
      endPos: { ...endPos },
      frame: 20
    };
    DataContractValidator.validateAnimation('HORSE_CHARGE', animation);
    this.horseChargeAnimations.push(animation);
  }

  /**
   * Adds a bump animation
   * @param offsetX - X offset
   * @param offsetY - Y offset
   * @param frames - Number of frames
   */
  addBumpAnimation(offsetX: number, offsetY: number, frames: number = 15): void {
    const animation: BumpAnimation = { offsetX, offsetY, frames };
    DataContractValidator.validateAnimation('BUMP', animation);
    this.bumpAnimations.push(animation);
  }

  /**
   * Adds a lift animation
   * @param offsetY - Y offset
   * @param frames - Number of frames
   */
  addLiftAnimation(offsetY: number, frames: number = 15): void {
    const animation: LiftAnimation = { offsetY, frames };
    DataContractValidator.validateAnimation('LIFT', animation);
    this.liftAnimations.push(animation);
  }

  /**
   * Adds a smoke animation
   * @param duration - Duration in frames
   */
  addSmokeAnimation(duration: number = 6): void {
    const animation: SmokeAnimation = { frame: duration };
    DataContractValidator.validateAnimation('SMOKE', animation);
    this.smokeAnimations.push(animation);
  }

  /**
   * Updates all animations (decrements frames, removes expired)
   */
  updateAnimations(): void {
    // Update point animations
    this.pointAnimations.forEach(anim => anim.frame--);
    this.pointAnimations = this.pointAnimations.filter(anim => anim.frame > 0);

    // Update arrow animations
    this.arrowAnimations.forEach(anim => anim.frame--);
    this.arrowAnimations = this.arrowAnimations.filter(anim => anim.frame > 0);

    // Update horse charge animations
    this.horseChargeAnimations.forEach(anim => anim.frame--);
    this.horseChargeAnimations = this.horseChargeAnimations.filter(anim => anim.frame > 0);

    // Update bump animations
    this.bumpAnimations.forEach(anim => {
      anim.frames--;
      // Gradually reduce offsets for smooth return
      anim.offsetX *= 0.85;
      anim.offsetY *= 0.85;
    });
    this.bumpAnimations = this.bumpAnimations.filter(anim => anim.frames > 0);

    // Update lift animations
    this.liftAnimations.forEach(anim => {
      anim.frames--;
      // Parabolic lift curve
      const progress = anim.frames / 15;
      const maxLift = -12;
      anim.offsetY = maxLift * 4 * progress * (1 - progress);
    });
    this.liftAnimations = this.liftAnimations.filter(anim => anim.frames > 0);

    // Update smoke animations
    this.smokeAnimations.forEach(anim => anim.frame--);
    this.smokeAnimations = this.smokeAnimations.filter(anim => anim.frame > 0);

    // Update multiplier animations
    this.multiplierAnimations.forEach(anim => anim.frame--);
    this.multiplierAnimations = this.multiplierAnimations.filter(anim => anim.frame > 0);
  }

  /**
   * Gets all active animations
   * @returns Object containing all animation arrays
   */
  getActiveAnimations(): ActiveAnimations {
    return {
      pointAnimations: [...this.pointAnimations],
      arrowAnimations: [...this.arrowAnimations],
      horseChargeAnimations: [...this.horseChargeAnimations],
      bumpAnimations: [...this.bumpAnimations],
      liftAnimations: [...this.liftAnimations],
      smokeAnimations: [...this.smokeAnimations],
      multiplierAnimations: [...this.multiplierAnimations]
    };
  }

  /**
   * Clears all animations
   */
  clearAll(): void {
    this.pointAnimations = [];
    this.arrowAnimations = [];
    this.horseChargeAnimations = [];
    this.bumpAnimations = [];
    this.liftAnimations = [];
    this.smokeAnimations = [];
    this.multiplierAnimations = [];
  }
}
