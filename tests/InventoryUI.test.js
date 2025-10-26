import { InventoryUI } from '../ui/InventoryUI.js';
import { InventoryService } from '../managers/inventory/InventoryService.js';

function makeMockGame() {
  const mockGame = {
    player: {
      inventory: [],
      isDead: () => false,
      getPosition: () => ({ x: 1, y: 1 }),
    },
    uiManager: { updatePlayerStats: jest.fn() },
    animationScheduler: { createSequence: () => ({ wait: () => ({ then: () => ({ start: () => {} }) }) }) },
    startEnemyTurns: jest.fn(),
    updatePlayerStats: jest.fn(),
  };
  return mockGame;
}

describe('InventoryUI integration', () => {
  beforeEach(() => {
    // Minimal DOM for inventory
    document.body.innerHTML = `
      <div class="player-inventory">
        <div class="inventory-list">
          <div class="inventory-slot"></div>
          <div class="inventory-slot"></div>
          <div class="inventory-slot"></div>
          <div class="inventory-slot"></div>
          <div class="inventory-slot"></div>
          <div class="inventory-slot"></div>
        </div>
      </div>
      <div id="inventory-tooltip"></div>
    `;
  });

  test('tapping book consumes one charge (touch pointerup then click suppressed)', () => {
    const game = makeMockGame();
    const book = { type: 'book_of_time_travel', uses: 3 };
    game.player.inventory = [book];

    const service = new InventoryService(game);
    const ui = new InventoryUI(game, service);

    // Ensure debug mode off for test clarity
    window.inventoryDebugMode = false;

    ui.updateInventoryDisplay();
    const slot = document.querySelector('.inventory-list .inventory-slot');
    expect(slot).toBeTruthy();

    // Polyfill PointerEvent for jsdom if missing
    if (typeof PointerEvent === 'undefined') {
      global.PointerEvent = function(type, props = {}) {
        const e = new MouseEvent(type, props);
        e.pointerId = props.pointerId || 1;
        e.pointerType = props.pointerType || 'mouse';
        return e;
      };
    }

    // Simulate touch pointer sequence: pointerdown -> pointerup (should trigger use)
    const pd = new PointerEvent('pointerdown', { pointerId: 1, pointerType: 'touch', bubbles: true });
    const pu = new PointerEvent('pointerup', { pointerId: 1, pointerType: 'touch', bubbles: true });
    slot.dispatchEvent(pd);
    slot.dispatchEvent(pu);

    // Synthetic click that some browsers fire after touch
    const click = new MouseEvent('click', { bubbles: true });
    slot.dispatchEvent(click);

    // After the interaction, uses should be 2 (only one consumed)
    expect(game.player.inventory[0].uses).toBe(2);
    // startEnemyTurns should have been called once via ItemUsageHandler
    expect(game.startEnemyTurns).toHaveBeenCalledTimes(1);
  });
});
