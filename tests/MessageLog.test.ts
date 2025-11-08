import { MessageLog } from '../ui/MessageLog';
import { createMockGame, setupDOMFixture, teardownDOMFixture } from './helpers/mocks';

describe('MessageLog', () => {
  let messageLog;
  let mockGame;
  let messageLogOverlay;
  let messageLogContent;
  let closeButton;
  let openButton;

  beforeEach(() => {
    // Setup DOM
    setupDOMFixture();

    // Add specific message log elements
    document.body.innerHTML += `
      <div id="messageLogOverlay" class="overlay">
        <div id="messageLogContent"></div>
        <button id="closeMessageLogButton">Close</button>
      </div>
      <button id="message-log-button">Messages</button>
    `;

    messageLogOverlay = document.getElementById('messageLogOverlay');
    messageLogContent = document.getElementById('messageLogContent');
    closeButton = document.getElementById('closeMessageLogButton');
    openButton = document.getElementById('message-log-button');

    // Create mock game with message log
    mockGame = createMockGame({
      messageLog: [
        'Welcome to the game!',
        'You found a treasure at (5, 3)',
        'Enemy defeated!',
      ],
      gameLoop: vi.fn(),
    });

    // Create MessageLog instance
    messageLog = new MessageLog(mockGame);
  });

  afterEach(() => {
    teardownDOMFixture();
  });

  describe('Initialization', () => {
    test('should initialize with DOM elements', () => {
      expect(messageLog.messageLogOverlay).toBe(messageLogOverlay);
      expect(messageLog.messageLogContent).toBe(messageLogContent);
      expect(messageLog.closeMessageLogButton).toBe(closeButton);
    });

    test('should set up event handlers', () => {
      // Event handlers should be attached
      expect(messageLog.closeMessageLogButton).toBeDefined();
    });
  });

  describe('show()', () => {
    test('should display messages in reverse order (newest first)', () => {
      messageLog.show();

      const paragraphs = messageLogContent.querySelectorAll('p');
      expect(paragraphs).toHaveLength(3);
      expect(paragraphs[0].innerHTML).toBe('Enemy defeated!');
      expect(paragraphs[1].innerHTML).toBe('You found a treasure at (5, 3)');
      expect(paragraphs[2].innerHTML).toBe('Welcome to the game!');
    });

    test('should add "show" class to overlay', () => {
      messageLog.show();

      expect(messageLogOverlay.classList.contains('show')).toBe(true);
    });

    test('should display "No messages yet" when log is empty', () => {
      mockGame.messageLog = [];

      messageLog.show();

      expect(messageLogContent.innerHTML).toBe('<p>No messages yet.</p>');
    });

    test('should style messages with small-caps and bold', () => {
      messageLog.show();

      const paragraph = messageLogContent.querySelector('p');
      expect(paragraph.style.fontVariant).toBe('small-caps');
      expect(paragraph.style.fontWeight).toBe('bold');
    });

    test('should clear previous content before showing', () => {
      messageLogContent.innerHTML = '<p>Old content</p>';

      messageLog.show();

      const paragraphs = messageLogContent.querySelectorAll('p');
      expect(paragraphs[0].innerHTML).not.toBe('Old content');
    });

    test('should support HTML in messages', () => {
      mockGame.messageLog = ['Message with <strong>bold</strong> text'];

      messageLog.show();

      const paragraph = messageLogContent.querySelector('p');
      expect(paragraph.innerHTML).toBe('Message with <strong>bold</strong> text');
      expect(paragraph.querySelector('strong')).toBeTruthy();
    });
  });

  describe('hide()', () => {
    test('should remove "show" class from overlay', () => {
      messageLogOverlay.classList.add('show');

      messageLog.hide();

      expect(messageLogOverlay.classList.contains('show')).toBe(false);
    });

    test('should work when "show" class is not present', () => {
      expect(() => messageLog.hide()).not.toThrow();
    });
  });

  describe('Event Handlers', () => {
    test('should hide overlay and resume game loop when close button is clicked', () => {
      messageLogOverlay.classList.add('show');

      closeButton.click();

      expect(messageLogOverlay.classList.contains('show')).toBe(false);
      expect(mockGame.gameLoop).toHaveBeenCalled();
    });

    test('should show overlay when message log button is clicked', () => {
      const showSpy = vi.spyOn(messageLog, 'show');

      openButton.click();

      expect(showSpy).toHaveBeenCalled();
    });

    test('should show overlay on pointerdown event', () => {
      const showSpy = vi.spyOn(messageLog, 'show');
      const event = new PointerEvent('pointerdown', { bubbles: true });
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

      openButton.dispatchEvent(event);

      expect(showSpy).toHaveBeenCalled();
      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    test('should handle missing close button gracefully', () => {
      closeButton.remove();

      expect(() => new MessageLog(mockGame)).not.toThrow();
    });

    test('should handle missing open button gracefully', () => {
      openButton.remove();

      expect(() => new MessageLog(mockGame)).not.toThrow();
    });

    test('should handle very long message log', () => {
      mockGame.messageLog = Array(100).fill('Test message');

      messageLog.show();

      const paragraphs = messageLogContent.querySelectorAll('p');
      expect(paragraphs).toHaveLength(100);
    });

    test('should handle messages with special characters', () => {
      mockGame.messageLog = [
        'Message with "quotes"',
        "Message with 'apostrophes'",
        'Message with <>&',
      ];

      messageLog.show();

      const paragraphs = messageLogContent.querySelectorAll('p');
      expect(paragraphs).toHaveLength(3);
    });
  });

  describe('Integration', () => {
    test('should work with full show/hide cycle', () => {
      // Show
      messageLog.show();
      expect(messageLogOverlay.classList.contains('show')).toBe(true);

      // Hide
      messageLog.hide();
      expect(messageLogOverlay.classList.contains('show')).toBe(false);

      // Show again
      messageLog.show();
      expect(messageLogOverlay.classList.contains('show')).toBe(true);
    });

    test('should update content when showing multiple times', () => {
      messageLog.show();
      let paragraphs = messageLogContent.querySelectorAll('p');
      expect(paragraphs).toHaveLength(3);

      // Add more messages
      mockGame.messageLog.push('New message!');

      messageLog.show();
      paragraphs = messageLogContent.querySelectorAll('p');
      expect(paragraphs).toHaveLength(4);
      expect(paragraphs[0].innerHTML).toBe('New message!');
    });
  });
});
