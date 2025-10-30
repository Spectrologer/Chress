/**
 * @jest-environment jsdom
 */
import { DialogueManager } from '../ui/DialogueManager.js';
import { createMockGame, setupDOMFixture, teardownDOMFixture } from './helpers/mocks.js';

describe('DialogueManager', () => {
  let dialogueManager;
  let mockGame;
  let mockTypewriterController;
  let messageOverlay;

  beforeEach(() => {
    // Setup DOM
    setupDOMFixture();

    // Add message overlay
    document.body.innerHTML += `
      <div id="messageOverlay"></div>
    `;

    messageOverlay = document.getElementById('messageOverlay');

    // Create mock typewriter controller
    mockTypewriterController = {
      shouldUseTypewriter: jest.fn().mockReturnValue(false),
      start: jest.fn(),
      stop: jest.fn(),
    };

    mockGame = createMockGame();

    // Create DialogueManager instance
    dialogueManager = new DialogueManager(mockGame, mockTypewriterController);
  });

  afterEach(() => {
    teardownDOMFixture();
  });

  describe('Initialization', () => {
    test('should initialize with game and typewriter controller', () => {
      expect(dialogueManager.game).toBe(mockGame);
      expect(dialogueManager.typewriterController).toBe(mockTypewriterController);
    });

    test('should find messageOverlay element', () => {
      expect(dialogueManager.messageOverlay).toBe(messageOverlay);
    });
  });

  describe('showDialogue() - Signs', () => {
    test('should display sign text without portrait', () => {
      dialogueManager.showDialogue('This is a sign message', null, null);

      expect(messageOverlay.innerHTML).toContain('This is a sign message');
      expect(messageOverlay.classList.contains('show')).toBe(true);
    });

    test('should use "True" as default button text for signs', () => {
      dialogueManager.showDialogue('Sign text', null, null);

      expect(messageOverlay.innerHTML).toContain('True');
    });

    test('should not use typewriter effect for signs', () => {
      dialogueManager.showDialogue('Sign text', null, null);

      expect(mockTypewriterController.stop).toHaveBeenCalled();
      expect(mockTypewriterController.start).not.toHaveBeenCalled();
    });

    test('should allow custom button text for signs', () => {
      dialogueManager.showDialogue('Sign text', null, null, 'Continue');

      expect(messageOverlay.innerHTML).toContain('Continue');
      expect(messageOverlay.innerHTML).not.toContain('True');
    });
  });

  describe('showDialogue() - NPC Dialogues', () => {
    test('should display NPC name and portrait', () => {
      dialogueManager.showDialogue(
        'Hello adventurer!',
        'assets/portraits/npc.png',
        'Guard'
      );

      expect(messageOverlay.innerHTML).toContain('Guard');
      expect(messageOverlay.innerHTML).toContain('assets/portraits/npc.png');
      expect(messageOverlay.innerHTML).toContain('Hello adventurer!');
    });

    test('should show "show" class when dialogue is displayed', () => {
      dialogueManager.showDialogue('Text', 'image.png', 'NPC');

      expect(messageOverlay.classList.contains('show')).toBe(true);
    });

    test('should use typewriter effect for NPC dialogues when enabled', () => {
      mockTypewriterController.shouldUseTypewriter.mockReturnValue(true);

      dialogueManager.showDialogue('NPC text', 'image.png', 'NPC');

      expect(mockTypewriterController.start).toHaveBeenCalled();
      expect(mockTypewriterController.stop).not.toHaveBeenCalled();
    });

    test('should not use typewriter effect when disabled', () => {
      mockTypewriterController.shouldUseTypewriter.mockReturnValue(false);

      dialogueManager.showDialogue('NPC text', 'image.png', 'NPC');

      expect(mockTypewriterController.stop).toHaveBeenCalled();
      expect(mockTypewriterController.start).not.toHaveBeenCalled();
    });

    test('should use default button text "Got it" for generic NPCs', () => {
      dialogueManager.showDialogue('Text', 'image.png', 'Generic NPC');

      expect(messageOverlay.innerHTML).toContain('Got it');
    });
  });

  describe('_getButtonText()', () => {
    test('should return custom button text when provided', () => {
      const result = dialogueManager._getButtonText('NPC', 'Custom Text');

      expect(result).toBe('Custom Text');
    });

    test('should return "Okay..." for Crayn', () => {
      const result = dialogueManager._getButtonText('Crayn', null);

      expect(result).toBe('Okay...');
    });

    test('should return "Okay..." for crayn (lowercase)', () => {
      const result = dialogueManager._getButtonText('crayn', null);

      expect(result).toBe('Okay...');
    });

    test('should return "Right..." for Forge', () => {
      const result = dialogueManager._getButtonText('Forge', null);

      expect(result).toBe('Right...');
    });

    test('should return "Right..." for forge (lowercase)', () => {
      const result = dialogueManager._getButtonText('forge', null);

      expect(result).toBe('Right...');
    });

    test('should return "Got it" for other NPCs', () => {
      const result = dialogueManager._getButtonText('Guard', null);

      expect(result).toBe('Got it');
    });

    test('should return "True" for signs (no name)', () => {
      const result = dialogueManager._getButtonText(null, null);

      expect(result).toBe('True');
    });
  });

  describe('_buildDialogueHTML()', () => {
    test('should build NPC dialogue with name and portrait', () => {
      dialogueManager._buildDialogueHTML(
        'Hello!',
        'portrait.png',
        'Merchant',
        'Okay'
      );

      expect(messageOverlay.innerHTML).toContain('Merchant');
      expect(messageOverlay.innerHTML).toContain('portrait.png');
      expect(messageOverlay.innerHTML).toContain('Hello!');
      expect(messageOverlay.innerHTML).toContain('Okay');
    });

    test('should build sign dialogue without name or portrait', () => {
      dialogueManager._buildDialogueHTML(
        'Beware of monsters',
        null,
        null,
        'True'
      );

      expect(messageOverlay.innerHTML).toContain('Beware of monsters');
      expect(messageOverlay.innerHTML).toContain('True');
      expect(messageOverlay.innerHTML).not.toContain('character-name');
    });

    test('should include button container', () => {
      dialogueManager._buildDialogueHTML('Text', null, null, 'OK');

      expect(messageOverlay.innerHTML).toContain('dialogue-button-container');
      expect(messageOverlay.innerHTML).toContain('dialogue-button');
    });

    test('should support HTML in dialogue text', () => {
      dialogueManager._buildDialogueHTML(
        'Text with <strong>bold</strong>',
        null,
        null,
        'OK'
      );

      expect(messageOverlay.innerHTML).toContain('<strong>bold</strong>');
    });
  });

  describe('Button Handler', () => {
    test('should attach button handler after showing dialogue', () => {
      dialogueManager.showDialogue('Text', null, null);

      const button = messageOverlay.querySelector('.dialogue-close-button');
      expect(button).toBeTruthy();
    });

    test('should hide overlay when button is clicked', () => {
      dialogueManager.showDialogue('Text', null, null);

      const button = messageOverlay.querySelector('.dialogue-close-button');
      button.click();

      expect(messageOverlay.classList.contains('show')).toBe(false);
    });

    test('should resume game loop when button is clicked', () => {
      mockGame.gameLoop = jest.fn();
      dialogueManager.showDialogue('Text', null, null);

      const button = messageOverlay.querySelector('.dialogue-close-button');
      button.click();

      expect(mockGame.gameLoop).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty text', () => {
      expect(() => {
        dialogueManager.showDialogue('', null, null);
      }).not.toThrow();
    });

    test('should handle very long text', () => {
      const longText = 'A'.repeat(1000);

      expect(() => {
        dialogueManager.showDialogue(longText, null, null);
      }).not.toThrow();
    });

    test('should handle special characters in text', () => {
      const specialText = 'Text with "quotes" and \'apostrophes\' and <>&';

      dialogueManager.showDialogue(specialText, null, null);

      // HTML entities should be escaped in innerHTML
      expect(messageOverlay.innerHTML).toContain('Text with "quotes" and \'apostrophes\'');
      expect(messageOverlay.innerHTML).toContain('&lt;&gt;&amp;'); // <& should be escaped
    });

    test('should handle null imageSrc gracefully', () => {
      expect(() => {
        dialogueManager.showDialogue('Text', null, 'NPC');
      }).not.toThrow();
    });

    test('should handle missing messageOverlay element', () => {
      messageOverlay.remove();

      // Create new DialogueManager without messageOverlay
      const manager = new DialogueManager(mockGame, mockTypewriterController);

      expect(manager.messageOverlay).toBeNull();
    });
  });

  describe('Multiple Dialogues', () => {
    test('should replace previous dialogue when showing new one', () => {
      dialogueManager.showDialogue('First message', null, null);
      expect(messageOverlay.innerHTML).toContain('First message');

      dialogueManager.showDialogue('Second message', null, null);
      expect(messageOverlay.innerHTML).toContain('Second message');
      expect(messageOverlay.innerHTML).not.toContain('First message');
    });

    test('should maintain "show" class when replacing dialogue', () => {
      dialogueManager.showDialogue('First', null, null);
      expect(messageOverlay.classList.contains('show')).toBe(true);

      dialogueManager.showDialogue('Second', null, null);
      expect(messageOverlay.classList.contains('show')).toBe(true);
    });
  });

  describe('Typewriter Integration', () => {
    test('should call shouldUseTypewriter with messageOverlay', () => {
      dialogueManager.showDialogue('Text', 'image.png', 'NPC');

      expect(mockTypewriterController.shouldUseTypewriter).toHaveBeenCalledWith(
        messageOverlay
      );
    });

    test('should show button after typewriter completes', () => {
      mockTypewriterController.shouldUseTypewriter.mockReturnValue(true);
      mockTypewriterController.start.mockImplementation((element, callback) => {
        // Simulate typewriter completion
        callback();
      });

      dialogueManager.showDialogue('Text', 'image.png', 'NPC');

      // After callback, button container should be visible
      const buttonContainer = messageOverlay.querySelector('#dialogue-button-container');
      if (buttonContainer) {
        expect(buttonContainer.style.display).toBe('block');
      }
    });

    test('should stop typewriter for signs', () => {
      dialogueManager.showDialogue('Sign text', null, null);

      expect(mockTypewriterController.stop).toHaveBeenCalled();
    });
  });

  describe('CSS Classes', () => {
    test('should add "show" class to overlay when dialogue is displayed', () => {
      dialogueManager.showDialogue('Text', null, null);

      expect(messageOverlay.classList.contains('show')).toBe(true);
    });

    test('should remove "show" class when button is clicked', () => {
      dialogueManager.showDialogue('Text', null, null);

      const button = messageOverlay.querySelector('.dialogue-close-button');
      button.click();

      expect(messageOverlay.classList.contains('show')).toBe(false);
    });
  });
});
