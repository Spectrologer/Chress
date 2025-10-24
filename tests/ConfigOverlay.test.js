import { PanelManager } from '../ui/PanelManager.js';
import { Player } from '../entities/Player.js';

// Minimal DOM setup for overlays
beforeAll(() => {
  document.body.innerHTML = `
    <div id="statsPanelOverlay" class="stats-panel-overlay">
      <div class="stats-panel game-parchment">
        <div class="stats-main-content"><div class="stats-info"></div></div>
      </div>
    </div>
    <div id="configOverlay" class="stats-panel-overlay">
      <div class="stats-panel game-parchment">
        <div class="stats-main-content">
          <div class="stats-info">
            <div class="config-list">
              <div class="config-item"><input id="music-toggle" type="checkbox"></div>
              <div class="config-item"><input id="sfx-toggle" type="checkbox"></div>
              <div class="config-item"><input id="auto-path-enemies-toggle" type="checkbox"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div id="player-card-content">
      <div class="player-portrait-container"><img src="" class="player-portrait"></div>
    </div>
  `;
});

describe('Config overlay interactions', () => {
  let panelManager;
  let mockGame;
  let player;

  beforeEach(() => {
    player = new Player();
    mockGame = { player, soundManager: { setMusicEnabled: jest.fn(), setSfxEnabled: jest.fn() } };
    panelManager = new PanelManager(mockGame);
  });

  test('clicking outside config overlay closes it and reopens stats panel', async () => {
    // Open stats, then open config
    panelManager.showStatsPanel();
    expect(document.getElementById('statsPanelOverlay').classList.contains('show')).toBe(true);

    // Simulate clicking the config button (open config)
    const cfgBtn = document.createElement('button');
    cfgBtn.id = 'stats-config-button';
    document.querySelector('.stats-panel .stats-main-content').appendChild(cfgBtn);
    cfgBtn.click();

    // Because showStatsPanel wires the button to showConfigOverlay, call it directly
    panelManager.showConfigOverlay();

    expect(document.getElementById('configOverlay').classList.contains('show')).toBe(true);
    expect(document.getElementById('statsPanelOverlay').classList.contains('show')).toBe(true);

    // Wait for the blocker to clear (300ms + a bit more), then simulate a pointerdown somewhere outside the config inner panel
    await new Promise(resolve => setTimeout(resolve, 350));

    const ev = new MouseEvent('pointerdown', { bubbles: true });
    document.dispatchEvent(ev);

    // After the outside click, config overlay should be hidden and stats panel shown
    expect(document.getElementById('configOverlay').classList.contains('show')).toBe(false);
    expect(document.getElementById('statsPanelOverlay').classList.contains('show')).toBe(true);
  });
});
