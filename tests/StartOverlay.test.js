import { GameInitializer } from '../core/GameInitializer.js';

// Minimal DOM fixture for the start overlay
beforeEach(() => {
  document.body.innerHTML = `
    <canvas id="gameCanvas"></canvas>
    <canvas id="zoneMap"></canvas>
    <div id="startOverlay" style="position:absolute;inset:0;display:none;align-items:center;justify-content:center;z-index:30;">
      <label id="overlayMusicToggleWrap">
        <input id="overlay-music-toggle" type="checkbox" aria-label="Music on/off" checked />
      </label>
      <div class="start-overlay-title">
        <div class="start-overlay-main">Chress</div>
      </div>
  <button id="startButton">New Game</button>
      <button id="continueButton">continue</button>
    </div>
  `;
  // Ensure clean localStorage between tests
  try { localStorage.removeItem('chress_game_state'); } catch (e) {}
});

describe('Start overlay', () => {
  test('Continue button is disabled when no saved state; clicking Start starts new game and applies music pref', async () => {
    // Prepare mock game and GameInitializer instance without running constructor
    const mockGame = {
      previewMode: true,
      player: { stats: {} },
      soundManager: {
        resumeAudioContext: jest.fn(() => Promise.resolve()),
        setMusicEnabled: jest.fn(),
        setSfxEnabled: jest.fn()
      },
      gameStateManager: { resetGame: jest.fn() }
    };

    // Uncheck the overlay toggle to verify preference is applied
    const overlayToggle = document.getElementById('overlay-music-toggle');
    overlayToggle.checked = false;

    // Create instance without invoking constructor side-effects
    const gi = Object.create(GameInitializer.prototype);
    gi.game = mockGame;
    gi.startGame = jest.fn();

    // Call the method under test
    GameInitializer.prototype.showStartOverlay.call(gi);

    const overlay = document.getElementById('startOverlay');
    const continueBtn = document.getElementById('continueButton');
    const startBtn = document.getElementById('startButton');

    // Continue should be disabled when no saved state exists
    expect(continueBtn.disabled).toBe(true);
    expect(continueBtn.classList.contains('disabled')).toBe(true);

    // Overlay should be visible
    expect(overlay.style.display).toBe('flex');

    // Click the start button and wait for async handlers to settle
    startBtn.click();
    // allow microtasks to run (resumeAudioContext promise, etc.)
    await Promise.resolve();
    await Promise.resolve();

    // Expect previewMode cleared and startGame invoked
    expect(mockGame.previewMode).toBe(false);
    expect(gi.startGame).toHaveBeenCalled();

    // music preference (unchecked) should have been passed to setMusicEnabled
    expect(mockGame.soundManager.setMusicEnabled).toHaveBeenCalledWith(false);
    // Overlay should be hidden
    expect(overlay.style.display).toBe('none');
  });

  test('Continue button enabled when saved state exists and clicking Continue loads and starts', async () => {
    // Simulate saved state
    try { localStorage.setItem('chress_game_state', JSON.stringify({ foo: 'bar' })); } catch (e) {}

    const mockGame = {
      previewMode: true,
      player: { stats: {} },
      soundManager: { resumeAudioContext: jest.fn(() => Promise.resolve()), setMusicEnabled: jest.fn() },
      gameStateManager: { loadGameState: jest.fn() }
    };

    const gi = Object.create(GameInitializer.prototype);
    gi.game = mockGame;
    gi.startGame = jest.fn();

    GameInitializer.prototype.showStartOverlay.call(gi);

    const continueBtn = document.getElementById('continueButton');
    const overlay = document.getElementById('startOverlay');

    // Continue should be enabled when saved state exists
    expect(continueBtn.disabled).toBe(false);
    expect(continueBtn.classList.contains('disabled')).toBe(false);

    // Click continue and await async handlers
    continueBtn.click();
    await Promise.resolve();
    await Promise.resolve();

    expect(mockGame.gameStateManager.loadGameState).toHaveBeenCalled();
    expect(gi.startGame).toHaveBeenCalled();
    expect(overlay.style.display).toBe('none');
  });
});
