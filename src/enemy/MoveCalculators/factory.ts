import { LizardyMoveCalculator } from './lizardy';
import { ZardMoveCalculator } from './zard';
import { LizardeauxMoveCalculator } from './lizardeaux';
import { LazerdMoveCalculator } from './lazerd';
import { LizardoMoveCalculator } from './lizardo';
import { LizordMoveCalculator } from './lizord';
import { BaseMoveCalculator } from './base';

export class EnemyMoveCalculatorFactory {
    static getCalculator(enemyType: string): BaseMoveCalculator {
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
