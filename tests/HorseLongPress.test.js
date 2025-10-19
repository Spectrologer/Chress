import { InventoryUI } from '../managers/InventoryUI.js';
import { ItemService } from '../managers/ItemService.js';
import { ItemUsageHandler } from '../managers/ItemUsageHandler.js';

// Minimal mock game (similar to existing tests)
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

describe('Horse long-press behavior', () => {
  beforeEach(() => {
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
      <div id="inventory-tooltip" class="inventory-tooltip"></div>
    `;

    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    delete global.PointerEvent;
    window.inventoryDebugMode = false;
  });

  test('long-press on horse shows temp visual, commits disable on release, tooltip hidden and contextmenu suppressed', () => {
    const game = makeMockGame();
    const horse = { type: 'horse_icon', uses: 2, disabled: false };
    game.player.inventory = [horse];

    const handler = new ItemUsageHandler(game);
    const service = new ItemService(game, handler);
    const ui = new InventoryUI(game, service);

    ui.updateInventoryDisplay();
    const slot = document.querySelector('.inventory-list .inventory-slot');
    const tooltip = document.getElementById('inventory-tooltip');

    // Polyfill PointerEvent for jsdom if missing
    if (typeof PointerEvent === 'undefined') {
      global.PointerEvent = function(type, props = {}) {
        const e = new MouseEvent(type, props);
        Object.defineProperty(e, 'pointerId', { value: props.pointerId || 1, configurable: true });
        Object.defineProperty(e, 'pointerType', { value: props.pointerType || 'touch', configurable: true });
        Object.defineProperty(e, 'clientX', { value: props.clientX || 0, configurable: true });
        Object.defineProperty(e, 'clientY', { value: props.clientY || 0, configurable: true });
        return e;
      };
    }

    // pointerdown (touch)
    const pd = new PointerEvent('pointerdown', { pointerId: 1, pointerType: 'touch', clientX: 10, clientY: 10, bubbles: true });
    slot.dispatchEvent(pd);

    // Advance timers to trigger long-press
    jest.advanceTimersByTime(600);

    // During hold, temp class should be present and item still not toggled
    expect(slot.classList.contains('item-disabled-temp')).toBe(true);
    expect(horse.disabled).toBe(false);
    // Tooltip may be hidden during this state
    expect(tooltip.classList.contains('show')).toBe(false);

    // pointerup commit
    const pu = new PointerEvent('pointerup', { pointerId: 1, pointerType: 'touch', clientX: 10, clientY: 10, bubbles: true });
    slot.dispatchEvent(pu);

    // After release, pending toggle should commit: item disabled true
    expect(horse.disabled).toBe(true);
    expect(slot.classList.contains('item-disabled-temp')).toBe(false);
    // Tooltip hidden
    expect(tooltip.classList.contains('show')).toBe(false);

    // Simulate contextmenu that sometimes follows and ensure it doesn't re-enable
    const cm = new MouseEvent('contextmenu', { bubbles: true });
    slot.dispatchEvent(cm);

    expect(horse.disabled).toBe(true);
  });
});
