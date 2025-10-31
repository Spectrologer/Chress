import { BarterWindow } from '../ui/BarterWindow.js';
import { Player } from '../entities/Player.js';
import { Sign } from '../ui/Sign.js';

// Setup a minimal DOM for barter overlay elements used by BarterWindow
beforeAll(() => {
  document.body.innerHTML = `
    <div id="barterOverlay"></div>
    <div id="barterNPCName"></div>
    <img id="barterNPCPortrait" />
    <div id="barterNPCMessage"></div>
    <div id="barterOffers"></div>
  `;
});

describe('BarterWindow discovery trades', () => {
  let player;
  let barter;
  let mockGame;

  beforeEach(() => {
    player = new Player();
    mockGame = {
      player,
      uiManager: {
        addMessageToLog: vi.fn(),
        showOverlayMessage: vi.fn(),
        updateZoneDisplay: vi.fn()
      },
      soundManager: { playSound: vi.fn() },
      updatePlayerStats: vi.fn()
    };

    // Make player have some discovered zones
    player.visitedZones = new Set(['0,0:0', '1,0:0', '2,0:0', '3,0:0', '4,0:0', '5,0:0', '6,0:0', '7,0:0', '8,0:0', '9,0:0']);
    player.setSpentDiscoveries(0);

    barter = new BarterWindow(mockGame);
  });

  test('axelotl_axe trade consumes discoveries and grants axe ability', () => {
    const npcData = Sign.getBarterNpcData('axelotl');
    expect(npcData).toBeDefined();

    // sanity check: requiredAmount should be defined
    const trade = npcData.trades[0];
    const required = trade.requiredAmount || 1;

    // Ensure initial state
    expect(player.abilities.has('axe')).toBe(false);
    expect(player.getSpentDiscoveries()).toBe(0);
    const initialAvailable = player.getVisitedZones().size - player.getSpentDiscoveries();
    expect(initialAvailable).toBeGreaterThanOrEqual(required);

    // Simulate confirming the trade
    barter.confirmTrade(trade);

    // After trade: player should have axe and spentDiscoveries incremented
    expect(player.abilities.has('axe')).toBe(true);
    expect(player.getSpentDiscoveries()).toBe(required);

    // UI methods should have been called
    expect(mockGame.uiManager.addMessageToLog).toHaveBeenCalled();
    expect(mockGame.uiManager.showOverlayMessage).toHaveBeenCalled();
  });
});
