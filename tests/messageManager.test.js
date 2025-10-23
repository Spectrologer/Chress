import { MessageManager } from '../ui/MessageManager.js';

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

  test('_getVoiceSettingsForName returns deterministic tuning for Crayn', () => {
    const fakeGame = { messageLog: [], animationScheduler: makeFakeAnimationScheduler() };
    const mm = new MessageManager(fakeGame);
    const vs = mm._getVoiceSettingsForName('Crayn');
    expect(vs).toBeTruthy();
    expect(vs.name).toBe('Crayn');
    expect(vs.base).toBe(120);
    expect(vs.wave1).toBe('sawtooth');
    expect(vs.wave2).toBe('sine');
  });

  test('_detectCharacterNameForElement finds a .character-name child', () => {
    const fakeGame = { messageLog: [], animationScheduler: makeFakeAnimationScheduler() };
    const mm = new MessageManager(fakeGame);
    const container = document.createElement('div');
    container.innerHTML = '<span class="character-name">  Penne  </span><div class="dialogue-text">Hi</div>';
    const name = mm._detectCharacterNameForElement(container);
    expect(name).toBe('Penne');
  });

  test('showMessage with typewriterSpeed = 0 displays text immediately and does not call blip SFX', async () => {
    const fakeGame = { messageLog: [], animationScheduler: makeFakeAnimationScheduler(), soundManager: { sfxEnabled: true } };
    const mm = new MessageManager(fakeGame);
    // disable animation by setting speed to 0
    mm.typewriterSpeed = 0;

    // spy on _playTypingBlip to ensure it's not called
    const spy = jest.spyOn(mm, '_playTypingBlip');

    const overlay = document.getElementById('messageOverlay');
    // ensure no character-name so typewriter would act on full text
    mm.showMessage('Hello world!', null, true, false, false);

    // because speed === 0 the text should be present immediately
    const textNode = overlay.querySelector('.dialogue-text');
    expect(textNode).toBeTruthy();
    expect(textNode.textContent).toBe('Hello world!');
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  test('_typewriter triggers per-letter blips when voice settings are present', async () => {
    const fakeGame = { messageLog: [], animationScheduler: makeFakeAnimationScheduler(), soundManager: { sfxEnabled: true } };
    const mm = new MessageManager(fakeGame);

    // Prepare element with a dialogue-text node containing non-whitespace characters
    const el = document.createElement('div');
    el.innerHTML = '<div class="dialogue-text">Test</div>';
    document.body.appendChild(el);

    // Ensure blips are enabled and we have a current voice
    mm.typewriterSfxEnabled = true;
    mm._currentVoiceSettings = { name: 'Tester', base: 120 };

    // Spy on _playTypingBlip and wait for _typewriter to call onComplete
    const spy = jest.spyOn(mm, '_playTypingBlip');

    await new Promise((resolve) => {
      // use a small speed so the routine runs quickly but still schedules via rAF
      mm._typewriter(el, 6, () => { resolve(); });
    });

    // Expect at least one blip was played for the non-whitespace chars
    expect(spy.mock.calls.length).toBeGreaterThan(0);
    spy.mockRestore();
  }, 10000);
});
