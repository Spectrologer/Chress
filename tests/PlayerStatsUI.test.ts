import { PlayerStatsUI } from '../ui/PlayerStatsUI\.ts';
import { eventBus } from '@core/EventBus';
import { EventTypes } from '@core/EventTypes';
import { createMockGame, createMockPlayer, setupDOMFixture, teardownDOMFixture } from './helpers/mocks\.ts';

describe('PlayerStatsUI', () => {
  let playerStatsUI;
  let mockGame;
  let mockPlayer;

  beforeEach(() => {
    // Setup DOM
    setupDOMFixture();

    // Add specific player stats elements
    document.body.innerHTML += `
      <div id="thirst-progress" style="width: 0%"></div>
      <div id="hunger-progress" style="width: 0%"></div>
      <div class="thirst-bar">
        <div class="bar-label">Thirst</div>
      </div>
      <div class="hunger-bar">
        <div class="bar-label">Hunger</div>
      </div>
      <div class="hearts">
        <div class="heart-icon"></div>
        <div class="heart-icon"></div>
        <div class="heart-icon"></div>
      </div>
      <div class="axe-ability-icon" style="display: none"></div>
      <div class="hammer-ability-icon" style="display: none"></div>
    `;

    // Create mock player with stats methods
    mockPlayer = createMockPlayer({
      getThirst: vi.fn().mockReturnValue(40),
      getHunger: vi.fn().mockReturnValue(35),
      getHealth: vi.fn().mockReturnValue(3),
      abilities: new Set(),
    });

    mockGame = createMockGame({
      player: mockPlayer,
      inventoryManager: {
        updateInventoryDisplay: vi.fn(),
      },
    });

    // Clear event bus
    eventBus.clear?.() || eventBus.offAll?.();

    // Create PlayerStatsUI instance
    playerStatsUI = new PlayerStatsUI(mockGame);
  });

  afterEach(() => {
    teardownDOMFixture();
    eventBus.clear?.() || eventBus.offAll?.();
  });

  describe('Initialization', () => {
    test('should set up event listeners', () => {
      const updateSpy = vi.spyOn(playerStatsUI, 'updatePlayerStats');

      // Trigger event
      eventBus.emit(EventTypes.UI_UPDATE_STATS, {});

      expect(updateSpy).toHaveBeenCalled();
    });

    test('should listen to PLAYER_STATS_CHANGED event', () => {
      const updateSpy = vi.spyOn(playerStatsUI, 'updatePlayerStats');

      // Trigger event
      eventBus.emit(EventTypes.PLAYER_STATS_CHANGED, {});

      expect(updateSpy).toHaveBeenCalled();
    });
  });

  describe('updateProgressBar()', () => {
    test('should update bar width based on percentage', () => {
      const bar = document.getElementById('thirst-progress');

      playerStatsUI.updateProgressBar('thirst-progress', 25, 50);

      expect(bar.style.width).toBe('50%');
    });

    test('should handle full bar (100%)', () => {
      const bar = document.getElementById('hunger-progress');

      playerStatsUI.updateProgressBar('hunger-progress', 50, 50);

      expect(bar.style.width).toBe('100%');
    });

    test('should handle empty bar (0%)', () => {
      const bar = document.getElementById('thirst-progress');

      playerStatsUI.updateProgressBar('thirst-progress', 0, 50);

      expect(bar.style.width).toBe('0%');
    });

    test('should handle missing bar element gracefully', () => {
      expect(() => {
        playerStatsUI.updateProgressBar('non-existent-bar', 25, 50);
      }).not.toThrow();
    });
  });

  describe('updatePlayerStats()', () => {
    test('should update thirst and hunger progress bars', () => {
      mockPlayer.getThirst.mockReturnValue(40);
      mockPlayer.getHunger.mockReturnValue(25);

      playerStatsUI.updatePlayerStats();

      const thirstBar = document.getElementById('thirst-progress');
      const hungerBar = document.getElementById('hunger-progress');

      expect(thirstBar.style.width).toBe('80%'); // 40/50 = 80%
      expect(hungerBar.style.width).toBe('50%'); // 25/50 = 50%
    });

    test('should add pulsating class when hunger is low', () => {
      mockPlayer.getHunger.mockReturnValue(10); // Low hunger

      playerStatsUI.updatePlayerStats();

      const hungerLabel = document.querySelector('.hunger-bar .bar-label');
      expect(hungerLabel.classList.contains('pulsating')).toBe(true);
    });

    test('should add pulsating class when thirst is low', () => {
      mockPlayer.getThirst.mockReturnValue(8); // Low thirst

      playerStatsUI.updatePlayerStats();

      const thirstLabel = document.querySelector('.thirst-bar .bar-label');
      expect(thirstLabel.classList.contains('pulsating')).toBe(true);
    });

    test('should remove pulsating class when hunger is not low', () => {
      mockPlayer.getHunger.mockReturnValue(30); // Normal hunger

      playerStatsUI.updatePlayerStats();

      const hungerLabel = document.querySelector('.hunger-bar .bar-label');
      expect(hungerLabel.classList.contains('pulsating')).toBe(false);
    });

    test('should update heart display based on health', () => {
      mockPlayer.getHealth.mockReturnValue(2); // 2 hearts

      playerStatsUI.updatePlayerStats();

      const hearts = document.querySelectorAll('.heart-icon');
      expect(hearts[0].style.opacity).toBe('1');
      expect(hearts[1].style.opacity).toBe('1');
      expect(hearts[2].style.opacity).toBe('0.3');
    });

    test('should add grayscale filter to lost hearts', () => {
      mockPlayer.getHealth.mockReturnValue(1);

      playerStatsUI.updatePlayerStats();

      const hearts = document.querySelectorAll('.heart-icon');
      expect(hearts[0].style.filter).toBe('none');
      expect(hearts[1].style.filter).toBe('grayscale(100%)');
      expect(hearts[2].style.filter).toBe('grayscale(100%)');
    });

    test('should add pulsating class to last heart when health is 1', () => {
      mockPlayer.getHealth.mockReturnValue(1);

      playerStatsUI.updatePlayerStats();

      const hearts = document.querySelectorAll('.heart-icon');
      expect(hearts[0].classList.contains('pulsating')).toBe(true);
      expect(hearts[1].classList.contains('pulsating')).toBe(false);
    });

    test('should show axe icon when player has axe ability', () => {
      mockPlayer.abilities.add('axe');

      playerStatsUI.updatePlayerStats();

      const axeIcon = document.querySelector('.axe-ability-icon');
      expect(axeIcon.style.display).toBe('block');
    });

    test('should hide axe icon when player does not have axe ability', () => {
      mockPlayer.abilities.clear();

      playerStatsUI.updatePlayerStats();

      const axeIcon = document.querySelector('.axe-ability-icon');
      expect(axeIcon.style.display).toBe('none');
    });

    test('should show hammer icon when player has hammer ability', () => {
      mockPlayer.abilities.add('hammer');

      playerStatsUI.updatePlayerStats();

      const hammerIcon = document.querySelector('.hammer-ability-icon');
      expect(hammerIcon.style.display).toBe('block');
    });

    test('should update inventory display when inventoryManager exists', () => {
      playerStatsUI.updatePlayerStats();

      expect(mockGame.inventoryManager.updateInventoryDisplay).toHaveBeenCalled();
    });

    test('should handle missing inventoryManager gracefully', () => {
      mockGame.inventoryManager = null;

      expect(() => {
        playerStatsUI.updatePlayerStats();
      }).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    test('should handle missing DOM elements gracefully', () => {
      document.body.innerHTML = ''; // Clear all elements

      expect(() => {
        playerStatsUI.updatePlayerStats();
      }).not.toThrow();
    });

    test('should handle zero health', () => {
      mockPlayer.getHealth.mockReturnValue(0);

      playerStatsUI.updatePlayerStats();

      const hearts = document.querySelectorAll('.heart-icon');
      hearts.forEach(heart => {
        expect(heart.style.opacity).toBe('0.3');
      });
    });

    test('should handle maximum stats', () => {
      mockPlayer.getThirst.mockReturnValue(50);
      mockPlayer.getHunger.mockReturnValue(50);
      mockPlayer.getHealth.mockReturnValue(3);

      expect(() => {
        playerStatsUI.updatePlayerStats();
      }).not.toThrow();
    });

    test('should handle both abilities at once', () => {
      mockPlayer.abilities.add('axe');
      mockPlayer.abilities.add('hammer');

      playerStatsUI.updatePlayerStats();

      const axeIcon = document.querySelector('.axe-ability-icon');
      const hammerIcon = document.querySelector('.hammer-ability-icon');

      expect(axeIcon.style.display).toBe('block');
      expect(hammerIcon.style.display).toBe('block');
    });
  });

  describe('Integration with Event Bus', () => {
    test('should update stats when UI_UPDATE_STATS event is emitted', () => {
      const updateSpy = vi.spyOn(playerStatsUI, 'updatePlayerStats');

      eventBus.emit(EventTypes.UI_UPDATE_STATS, {});

      expect(updateSpy).toHaveBeenCalled();
    });

    test('should update stats when PLAYER_STATS_CHANGED event is emitted', () => {
      const updateSpy = vi.spyOn(playerStatsUI, 'updatePlayerStats');

      eventBus.emit(EventTypes.PLAYER_STATS_CHANGED, {});

      expect(updateSpy).toHaveBeenCalled();
    });

    test('should respond to multiple event emissions', () => {
      const updateSpy = vi.spyOn(playerStatsUI, 'updatePlayerStats');

      eventBus.emit(EventTypes.UI_UPDATE_STATS, {});
      eventBus.emit(EventTypes.PLAYER_STATS_CHANGED, {});
      eventBus.emit(EventTypes.UI_UPDATE_STATS, {});

      expect(updateSpy).toHaveBeenCalledTimes(3);
    });
  });
});
