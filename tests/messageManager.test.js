import { MessageManager } from '../ui/MessageManager.js';
import { getVoiceSettingsForName } from '../ui/VoiceSettings.js';

// Minimal fake animation scheduler used by many MessageManager flows
const makeFakeAnimationScheduler = () => ({
  createSequence() {
    return {
      wait() { return this; },
      then() { return this; },
      start() { /* no-op */ }
    };
  }
});

describe('MessageManager typing & blip behavior', () => {
  let originalRAF;
  let originalCancelRAF;

  beforeEach(() => {
    // ensure a clean DOM for each test
    document.body.innerHTML = '';

    // Provide required DOM elements used by MessageManager
    const overlay = document.createElement('div');
    overlay.id = 'messageOverlay';
    document.body.appendChild(overlay);

    const messageBox = document.createElement('div');
    messageBox.id = 'messageBox';
    document.body.appendChild(messageBox);

    const noteStack = document.createElement('div');
    noteStack.id = 'noteStack';
    document.body.appendChild(noteStack);

    const messageLogOverlay = document.createElement('div');
    messageLogOverlay.id = 'messageLogOverlay';
    document.body.appendChild(messageLogOverlay);

    const messageLogContent = document.createElement('div');
    messageLogContent.id = 'messageLogContent';
    document.body.appendChild(messageLogContent);

    const closeBtn = document.createElement('button');
    closeBtn.id = 'closeMessageLogButton';
    document.body.appendChild(closeBtn);

    // Minimal fake requestAnimationFrame to yield to the event loop
    originalRAF = global.requestAnimationFrame;
    originalCancelRAF = global.cancelAnimationFrame;
    global.requestAnimationFrame = (cb) => setTimeout(() => cb(performance.now()), 0);
    global.cancelAnimationFrame = (id) => clearTimeout(id);
  });

  afterEach(() => {
    // restore rAF
    global.requestAnimationFrame = originalRAF;
    global.cancelAnimationFrame = originalCancelRAF;
    // clear DOM
    document.body.innerHTML = '';
  });

  test('getVoiceSettingsForName returns deterministic tuning for Crayn', () => {
    const vs = getVoiceSettingsForName('Crayn');
    expect(vs).toBeTruthy();
    expect(vs.name).toBe('Crayn');
    expect(vs.base).toBe(120);
    expect(vs.wave1).toBe('sawtooth');
    expect(vs.wave2).toBe('sine');
  });

  test('TypewriterController detects character name from element', () => {
    const fakeGame = { messageLog: [], animationScheduler: makeFakeAnimationScheduler() };
    const mm = new MessageManager(fakeGame);
    const container = document.createElement('div');
    container.innerHTML = '<span class="character-name">  Penne  </span><div class="dialogue-text">Hi</div>';
    const name = mm.typewriterController._detectCharacterNameForElement(container);
    expect(name).toBe('Penne');
  });

  test('showMessage with typewriterSpeed = 0 displays text immediately', async () => {
    const fakeGame = { messageLog: [], animationScheduler: makeFakeAnimationScheduler(), soundManager: { sfxEnabled: true } };
    const mm = new MessageManager(fakeGame);
    // disable animation by setting speed to 0
    mm.setTypewriterSpeed(0);

    const overlay = document.getElementById('messageOverlay');
    // ensure no character-name so typewriter won't activate
    mm.showMessage('Hello world!', null, true, false, false);

    // because speed === 0 the text should be present immediately
    const textNode = overlay.querySelector('.dialogue-text');
    expect(textNode).toBeTruthy();
    expect(textNode.textContent).toBe('Hello world!');
  });

  test('TypewriterController starts typewriter effect on element with character name', async () => {
    const fakeGame = { messageLog: [], animationScheduler: makeFakeAnimationScheduler(), soundManager: { sfxEnabled: true } };
    const mm = new MessageManager(fakeGame);

    // Prepare element with a character name and dialogue text
    const el = document.createElement('div');
    el.innerHTML = '<span class="character-name">Tester</span><div class="dialogue-text">Test</div>';
    document.body.appendChild(el);

    // Should use typewriter for this element
    expect(mm.typewriterController.shouldUseTypewriter(el)).toBe(true);

    // Start typewriter
    await new Promise((resolve) => {
      mm.typewriterController.start(el, () => {
        resolve();
      });
    });

    // The text should have been revealed
    const textNode = el.querySelector('.dialogue-text');
    expect(textNode).toBeTruthy();
  }, 10000);

  test('MessageLog adds messages with coordinate highlighting', () => {
    const fakeGame = { messageLog: [], animationScheduler: makeFakeAnimationScheduler() };
    const mm = new MessageManager(fakeGame);

    const coords = mm.messageLog.addMessage('Found treasure at (5, 10)');

    expect(coords).toBe('(5, 10)');
    expect(fakeGame.messageLog.length).toBe(1);
    expect(fakeGame.messageLog[0]).toContain('darkgreen');
  });

  test('PenneMessageHandler shows message only if no sign message active', () => {
    const fakeGame = {
      messageLog: [],
      animationScheduler: makeFakeAnimationScheduler(),
      displayingMessageForSign: false
    };
    const mm = new MessageManager(fakeGame);

    mm.handlePenneInteractionMessage();

    const overlay = document.getElementById('messageOverlay');
    expect(overlay.classList.contains('show')).toBe(true);
    expect(overlay.innerHTML).toContain('Penne');

    // Now set sign flag and try again
    fakeGame.displayingMessageForSign = true;
    overlay.classList.remove('show');

    mm.handlePenneInteractionMessage();
    expect(overlay.classList.contains('show')).toBe(false);
  });
});
