import { getItemTooltipText } from '../managers/ItemUtils.js';

describe('ItemUtils.getItemTooltipText', () => {
  test('food tooltip', () => {
    const item = { type: 'food', foodType: 'food/meat/beaf.png', quantity: 1 };
    expect(getItemTooltipText(item)).toBe('meat - Restores 10 hunger');
  });

  test('water tooltip with quantity', () => {
    const item = { type: 'water', quantity: 2 };
    expect(getItemTooltipText(item)).toBe('Water (x2) - Restores 10 thirst');
  });

  test('disabled spear tooltip', () => {
    const item = { type: 'bishop_spear', uses: 3, disabled: true };
    expect(getItemTooltipText(item)).toBe('Bishop Spear (DISABLED) - Charge diagonally towards enemies, has 3 charges');
  });
});
