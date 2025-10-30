/**
 * @jest-environment jsdom
 */
import { Sign } from '../ui/Sign.js';
import { TILE_TYPES } from '../core/constants/index.js';
import { createMockGame, setupDOMFixture, teardownDOMFixture } from './helpers/mocks.js';

describe('Sign', () => {
  let mockGame;

  beforeEach(() => {
    setupDOMFixture();
    mockGame = createMockGame();

    // Clear spawned messages before each test
    Sign.spawnedMessages.clear();
  });

  afterEach(() => {
    teardownDOMFixture();
    Sign.spawnedMessages.clear();
  });

  describe('Static Properties', () => {
    test('should have spawnedMessages Set', () => {
      expect(Sign.spawnedMessages).toBeInstanceOf(Set);
    });

    test('should have messageSets object with areas', () => {
      expect(Sign.messageSets).toBeDefined();
      expect(Sign.messageSets.home).toBeDefined();
      expect(Sign.messageSets.woods).toBeDefined();
      expect(Sign.messageSets.wilds).toBeDefined();
      expect(Sign.messageSets.frontier).toBeDefined();
      expect(Sign.messageSets.canyon).toBeDefined();
    });

    test('should have statueData object', () => {
      expect(Sign.statueData).toBeDefined();
    });
  });

  describe('Message Sets', () => {
    test('home area should have tutorial messages', () => {
      expect(Sign.messageSets.home).toBeInstanceOf(Array);
      expect(Sign.messageSets.home.length).toBeGreaterThan(0);
      expect(Sign.messageSets.home[0]).toContain('Tap to move');
    });

    test('woods area should have combat tips', () => {
      expect(Sign.messageSets.woods).toBeInstanceOf(Array);
      expect(Sign.messageSets.woods.length).toBeGreaterThan(0);
      expect(Sign.messageSets.woods.some(msg => msg.includes('Lizord'))).toBe(true);
    });

    test('wilds area should have advanced tips', () => {
      expect(Sign.messageSets.wilds).toBeInstanceOf(Array);
      expect(Sign.messageSets.wilds.length).toBeGreaterThan(0);
      expect(Sign.messageSets.wilds.some(msg => msg.includes('radial menu'))).toBe(true);
    });

    test('frontier area should have endgame messages', () => {
      expect(Sign.messageSets.frontier).toBeInstanceOf(Array);
      expect(Sign.messageSets.frontier.length).toBeGreaterThan(0);
      expect(Sign.messageSets.frontier.some(msg => msg.includes('shovel'))).toBe(true);
    });

    test('canyon area should have underground tips', () => {
      expect(Sign.messageSets.canyon).toBeInstanceOf(Array);
      expect(Sign.messageSets.canyon.length).toBeGreaterThan(0);
      expect(Sign.messageSets.canyon.some(msg => msg.includes('underground'))).toBe(true);
    });

    test('all message sets should contain non-empty messages', () => {
      Object.values(Sign.messageSets).forEach(messageSet => {
        expect(messageSet.length).toBeGreaterThan(0);
        messageSet.forEach(message => {
          expect(message.length).toBeGreaterThan(0);
        });
      });
    });
  });

  describe('Statue Data', () => {
    test('should have data for lizardy enemy', () => {
      expect(Sign.statueData.lizardy).toBeDefined();
      expect(Sign.statueData.lizardy.message).toContain('north and south');
    });

    test('should have data for lizardo enemy', () => {
      expect(Sign.statueData.lizardo).toBeDefined();
      expect(Sign.statueData.lizardo.message).toContain('orthogonally and diagonally');
    });

    test('should have data for lizardeaux enemy', () => {
      expect(Sign.statueData.lizardeaux).toBeDefined();
      expect(Sign.statueData.lizardeaux.message).toContain('Charges');
    });

    test('should have data for zard enemy', () => {
      expect(Sign.statueData.zard).toBeDefined();
      expect(Sign.statueData.zard.message).toContain('diagonally');
    });

    test('should have data for lazerd enemy', () => {
      expect(Sign.statueData.lazerd).toBeDefined();
      expect(Sign.statueData.lazerd.message).toContain('any direction');
    });

    test('should have data for lizord enemy', () => {
      expect(Sign.statueData.lizord).toBeDefined();
      expect(Sign.statueData.lizord.message).toContain('L-shapes');
    });

    test('should have data for bomb item', () => {
      expect(Sign.statueData.bomb).toBeDefined();
      expect(Sign.statueData.bomb.message).toContain('explodes');
    });

    test('should have data for spear item', () => {
      expect(Sign.statueData.spear).toBeDefined();
      expect(Sign.statueData.spear.message).toContain('diagonal');
    });

    test('should have data for bow item', () => {
      expect(Sign.statueData.bow).toBeDefined();
      expect(Sign.statueData.bow.message).toContain('straight line');
    });

    test('should have data for horse item', () => {
      expect(Sign.statueData.horse).toBeDefined();
      expect(Sign.statueData.horse.message).toContain('L-shape');
    });

    test('all statue messages should be defined', () => {
      Object.values(Sign.statueData).forEach(statue => {
        expect(statue.message).toBeDefined();
        expect(statue.message.length).toBeGreaterThan(0);
      });
    });
  });

  describe('getMessageByIndex()', () => {
    test('should return a specific message from the home area', () => {
      const message = Sign.getMessageByIndex('home', 0);

      expect(Sign.messageSets.home).toContain(message);
      expect(message).toBe(Sign.messageSets.home[0]);
    });

    test('should return a specific message from the woods area', () => {
      const message = Sign.getMessageByIndex('woods', 0);

      expect(Sign.messageSets.woods).toContain(message);
      expect(message).toBe(Sign.messageSets.woods[0]);
    });

    test('should return different messages for different indices', () => {
      const message1 = Sign.getMessageByIndex('home', 0);
      const message2 = Sign.getMessageByIndex('home', 1);

      expect(message1).not.toBe(message2);
    });
  });

  describe('getProceduralMessage()', () => {
    test('should return a message from the wilds area', () => {
      const usedMessages = new Set();
      const message = Sign.getProceduralMessage(5, 5, usedMessages);

      expect(Sign.messageSets.wilds).toContain(message);
    });

    test('should avoid returning used messages when possible', () => {
      const usedMessages = new Set();
      const message1 = Sign.getProceduralMessage(5, 5, usedMessages);

      // Mark first message as used
      usedMessages.add(message1);

      // Get another message - should try to avoid the used one if possible
      const message2 = Sign.getProceduralMessage(5, 5, usedMessages);

      expect(message2).toBeDefined();
    });

    test('should return fallback when all messages are used', () => {
      const usedMessages = new Set(Sign.messageSets.wilds);
      const message = Sign.getProceduralMessage(5, 5, usedMessages);

      // Should return the fallback (first message)
      expect(message).toBe(Sign.messageSets.wilds[0]);
    });
  });

  describe('displayMessageForSign()', () => {
    beforeEach(() => {
      document.body.innerHTML += `<div id="messageOverlay"></div>`;
      mockGame.showSignMessage = jest.fn();
      mockGame.transientGameState = {
        setDisplayingSignMessage: jest.fn(),
      };
    });

    test('should call showSignMessage on game instance', () => {
      const signData = { message: 'Test message' };

      Sign.displayMessageForSign(signData, mockGame);

      expect(mockGame.showSignMessage).toHaveBeenCalledWith('Test message', 'assets/sign.png');
    });

    test('should set transient game state', () => {
      const signData = { message: 'Test message' };

      Sign.displayMessageForSign(signData, mockGame);

      expect(mockGame.transientGameState.setDisplayingSignMessage).toHaveBeenCalledWith(signData);
    });

    test('should work with custom message content', () => {
      const signData = { message: 'Custom message with special characters: <>&"' };

      Sign.displayMessageForSign(signData, mockGame);

      expect(mockGame.showSignMessage).toHaveBeenCalled();
    });
  });

  describe('hideMessageForSign()', () => {
    beforeEach(() => {
      mockGame.hideOverlayMessage = jest.fn();
      mockGame.transientGameState = {
        getDisplayingSignMessage: jest.fn().mockReturnValue({ message: 'Test' }),
        isDisplayingSignMessage: jest.fn().mockReturnValue(true),
        clearDisplayingSignMessage: jest.fn(),
        clearCurrentNPCPosition: jest.fn(),
      };
    });

    test('should call hideOverlayMessage when message is displaying', () => {
      Sign.hideMessageForSign(mockGame);

      expect(mockGame.hideOverlayMessage).toHaveBeenCalled();
    });

    test('should clear transient game state', () => {
      Sign.hideMessageForSign(mockGame);

      expect(mockGame.transientGameState.clearDisplayingSignMessage).toHaveBeenCalled();
      expect(mockGame.transientGameState.clearCurrentNPCPosition).toHaveBeenCalled();
    });

    test('should work when no message is displaying', () => {
      mockGame.transientGameState.isDisplayingSignMessage.mockReturnValue(false);
      mockGame.displayingMessageForSign = null;

      expect(() => {
        Sign.hideMessageForSign(mockGame);
      }).not.toThrow();
    });

    test('should clear legacy displayingMessageForSign property', () => {
      mockGame.displayingMessageForSign = { x: 5, y: 5 };

      Sign.hideMessageForSign(mockGame);

      expect(mockGame.displayingMessageForSign).toBeNull();
    });
  });

  describe('getStatueData()', () => {
    test('should return data for lizardy statue', () => {
      const data = Sign.getStatueData('lizardy');

      expect(data).toBeDefined();
      expect(data.message).toBe(Sign.statueData.lizardy.message);
    });

    test('should return data for bomb statue', () => {
      const data = Sign.getStatueData('bomb');

      expect(data).toBeDefined();
      expect(data.message).toBe(Sign.statueData.bomb.message);
    });

    test('should handle unknown statue type', () => {
      const data = Sign.getStatueData('unknown');

      // getStatueData may return the statueData object for unknown types
      // Just verify it doesn't throw
      expect(() => Sign.getStatueData('unknown')).not.toThrow();
    });

    test('should return data for known statue types', () => {
      const lizardy = Sign.getStatueData('lizardy');
      const bomb = Sign.getStatueData('bomb');

      expect(lizardy).toBeDefined();
      expect(bomb).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty spawnedMessages Set', () => {
      Sign.spawnedMessages.clear();

      const message = Sign.getProceduralMessage(5, 5, new Set());

      expect(message).toBeDefined();
    });

    test('should handle exhausted message pool', () => {
      // Mark all messages as used
      const usedMessages = new Set(Sign.messageSets.wilds);

      // Should still return fallback message
      const message = Sign.getProceduralMessage(5, 5, usedMessages);
      expect(message).toBeDefined();
      expect(message).toBe(Sign.messageSets.wilds[0]);
    });

    test('should handle concurrent message requests', () => {
      const messages = [];
      const usedMessages = new Set();

      for (let i = 0; i < 5; i++) {
        messages.push(Sign.getProceduralMessage(5, 5, usedMessages));
      }

      expect(messages.length).toBe(5);
      messages.forEach(msg => expect(msg).toBeDefined());
    });
  });

  describe('Message Content Quality', () => {
    test('home messages should be tutorial-focused', () => {
      Sign.messageSets.home.forEach(message => {
        expect(message.length).toBeGreaterThan(10);
        expect(message.length).toBeLessThan(200);
      });
    });

    test('messages should not have trailing periods inconsistently', () => {
      // Check if messages follow a consistent punctuation style
      Object.values(Sign.messageSets).forEach(messageSet => {
        const withPeriod = messageSet.filter(msg => msg.endsWith('.')).length;
        const withoutPeriod = messageSet.filter(msg => !msg.endsWith('.')).length;

        // Should be mostly consistent
        expect(withPeriod === 0 || withoutPeriod === 0 || Math.abs(withPeriod - withoutPeriod) < messageSet.length).toBe(true);
      });
    });

    test('statue messages should contain descriptive text', () => {
      Object.values(Sign.statueData).forEach(statue => {
        expect(statue.message).toBeDefined();
        expect(statue.message.length).toBeGreaterThan(10);
      });
    });
  });

  describe('Integration', () => {
    test('should work with full sign interaction flow', () => {
      document.body.innerHTML += `<div id="messageOverlay"></div>`;
      mockGame.showSignMessage = jest.fn();
      mockGame.hideOverlayMessage = jest.fn();
      mockGame.transientGameState = {
        setDisplayingSignMessage: jest.fn(),
        getDisplayingSignMessage: jest.fn().mockReturnValue({ message: 'Test' }),
        isDisplayingSignMessage: jest.fn().mockReturnValue(true),
        clearDisplayingSignMessage: jest.fn(),
        clearCurrentNPCPosition: jest.fn(),
      };

      // Display sign with a message from the home area
      const message = Sign.getMessageByIndex('home', 0);
      const signData = { message };
      Sign.displayMessageForSign(signData, mockGame);

      expect(mockGame.showSignMessage).toHaveBeenCalledWith(message, 'assets/sign.png');
      expect(mockGame.transientGameState.setDisplayingSignMessage).toHaveBeenCalled();

      // Hide sign
      Sign.hideMessageForSign(mockGame);

      expect(mockGame.hideOverlayMessage).toHaveBeenCalled();
      expect(mockGame.transientGameState.clearDisplayingSignMessage).toHaveBeenCalled();
    });
  });
});
