/**
 * @jest-environment jsdom
 */

import { PanelManager } from '../ui/PanelManager.js';

// Minimal DOM fixture for records overlay
beforeEach(() => {
    document.body.innerHTML = `
        <div id="recordsOverlay" class="stats-panel-overlay">
            <div class="stats-panel game-parchment">
                <div class="stats-main-content">
                    <div class="stats-info">
                        <h2>Records</h2>
                        <div class="config-list records-list">
                            <div class="config-item"><span class="stat-label">Most Discoveries:</span><span id="record-zones" class="stat-value">0</span></div>
                            <div class="config-item"><span class="stat-label">Most Points:</span><span id="record-points" class="stat-value">0</span></div>
                            <div class="config-item"><span class="stat-label">Highest Combo:</span><span id="record-combo" class="stat-value">0</span></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Mock minimal game object since PanelManager expects `game` but showRecordsOverlay uses only localStorage
    global.game = { player: {} };
});

afterEach(() => {
    localStorage.clear();
    jest.restoreAllMocks();
});

test('showRecordsOverlay reads values from localStorage and populates DOM', () => {
    localStorage.setItem('chress:record:zones', '12');
    localStorage.setItem('chress:record:points', '345');
    localStorage.setItem('chress:record:combo', '7');

    const pm = new PanelManager(global.game);
    pm.recordsOverlay = document.getElementById('recordsOverlay');

    // Should not throw
    expect(() => pm.showRecordsOverlay()).not.toThrow();

    const rz = document.getElementById('record-zones');
    const rp = document.getElementById('record-points');
    const rc = document.getElementById('record-combo');

    expect(rz.textContent).toBe('12');
    expect(rp.textContent).toBe('345');
    expect(rc.textContent).toBe('7');
});
