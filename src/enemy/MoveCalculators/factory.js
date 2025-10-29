import { LizardyMoveCalculator } from './lizardy.js';
import { ZardMoveCalculator } from './zard.js';
import { LizardeauxMoveCalculator } from './lizardeaux.js';
import { LazerdMoveCalculator } from './lazerd.js';
import { LizardoMoveCalculator } from './lizardo.js';
import { LizordMoveCalculator } from './lizord.js';
import { BaseMoveCalculator } from './base.js';

export class EnemyMoveCalculatorFactory {
    static getCalculator(enemyType) {
        switch (enemyType) {
            case 'lizardy': return new LizardyMoveCalculator();
            case 'zard': return new ZardMoveCalculator();
            case 'lizardeaux': return new LizardeauxMoveCalculator();
            case 'lazerd': return new LazerdMoveCalculator();
            case 'lizardo': return new LizardoMoveCalculator();
            case 'lizord': return new LizordMoveCalculator();
            default: return new BaseMoveCalculator();
        }
    }
}
