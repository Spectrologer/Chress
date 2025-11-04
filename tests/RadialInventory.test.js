import { RadialInventoryUI } from '../ui/RadialInventoryUI.js';
import { InventoryService } from '@managers/inventory/InventoryService';

function makeMockGame() {
  const mockGame = {
    player: {
      inventory: [],
      radialInventory: [],
      x: 1,
      y: 1,
      isDead: () => false,
      getPosition: () => ({ x: 1, y: 1 }),
    },
    canvas: { getBoundingClientRect: () => ({ left: 0, top: 0, width: 540, height: 540 }), width: 540, height: 540 },
    uiManager: { showOverlayMessage: jest.fn(), updatePlayerStats: jest.fn() },
    animationScheduler: { createSequence: () => ({ wait: () => ({ then: () => ({ start: () => {} }) }) }) },
    startEnemyTurns: jest.fn(),
    updatePlayerStats: jest.fn(),
  };
  return mockGame;
}

describe('RadialInventoryUI', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>';
    // Polyfill PointerEvent for jsdom if missing
    if (typeof PointerEvent === 'undefined') {
      global.PointerEvent = function(type, props = {}) {
        const e = new MouseEvent(type, props);
        e.pointerId = props.pointerId || 1;
        e.pointerType = props.pointerType || 'mouse';
        return e;
      };
    }
  });

  test('openAtPlayer migrates eligible items from main inventory into radial and saves', () => {
    const game = makeMockGame();
    const book = { type: 'book_of_time_travel', quantity: 2 };
    const horse = { type: 'horse_icon', uses: 3 };
    game.player.inventory = [ { type: 'food', foodType: 'apple' }, book, horse ];

    // Spy on saveRadialInventory by replacing the imported function in the module cache
    jest.spyOn(require('../managers/RadialPersistence.js'), 'saveRadialInventory').mockImplementation(() => {});

    const service = new InventoryService(game);
    const radial = new RadialInventoryUI(game, service);

    radial.openAtPlayer();

    expect(game.player.radialInventory.length).toBeGreaterThan(0);
    // Horse should have moved into radial
    expect(game.player.radialInventory.find(i => i.type === 'horse_icon')).toBeTruthy();
    // Book should have uses normalized
    const b = game.player.radialInventory.find(i => i.type === 'book_of_time_travel');
    expect(b).toBeTruthy();
    expect(typeof b.uses).toBe('number');

    expect(require('../managers/RadialPersistence.js').saveRadialInventory).toHaveBeenCalled();
  });

  test('clicking horse icon in radial sets pendingCharge selectionType', () => {
    const game = makeMockGame();
    const horse = { type: 'horse_icon', uses: 2 };
    game.player.radialInventory = [horse];

    const service = new InventoryService(game);
    const radial = new RadialInventoryUI(game, service);

    radial.openAtPlayer();
    // Find the slot element
    const slot = document.querySelector('.radial-slot');
    expect(slot).toBeTruthy();

    // Simulate click on the slot to use the horse icon from radial
    slot.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    // Using from radial should set pendingCharge selectionType
    expect(game.pendingCharge).toBeTruthy();
    expect(game.pendingCharge.selectionType).toBe('horse_icon');
  });

});
