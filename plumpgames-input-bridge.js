(function () {
  'use strict';

  const PLUMPGAMES_ORIGIN = 'https://site.kiwifypurplehero.workers.dev';
  const pressedKeys = new Map();

  const legacyKeyCodes = {
    Backspace: 8,
    Enter: 13,
    Escape: 27,
    ' ': 32,
    ArrowLeft: 37,
    ArrowUp: 38,
    ArrowRight: 39,
    ArrowDown: 40
  };

  const getLegacyKeyCode = (key, code) => {
    if (Object.prototype.hasOwnProperty.call(legacyKeyCodes, key)) {
      return legacyKeyCodes[key];
    }

    if (/^Key[A-Z]$/.test(code)) return code.charCodeAt(3);
    if (/^Digit[0-9]$/.test(code)) return code.charCodeAt(5);
    if (typeof key === 'string' && key.length === 1) {
      return key.toUpperCase().charCodeAt(0);
    }

    return 0;
  };

  const dispatchKeyboardEvent = (type, input, repeat) => {
    const keyCode = getLegacyKeyCode(input.key, input.code);
    const event = new KeyboardEvent(type, {
      key: input.key,
      code: input.code,
      bubbles: true,
      cancelable: true,
      repeat
    });

    // TurboWarp's scaffolding forwards event.key and event.keyCode to the
    // Scratch keyboard device. Browsers do not derive keyCode for synthetic
    // KeyboardEvents, so expose the legacy value expected by that adapter.
    Object.defineProperties(event, {
      keyCode: {get: () => keyCode},
      which: {get: () => keyCode}
    });

    document.dispatchEvent(event);
  };

  const keyIdentifier = (input) => input.code || input.key;

  const releaseAllKeys = () => {
    pressedKeys.forEach((input) => dispatchKeyboardEvent('keyup', input, false));
    pressedKeys.clear();
  };

  const handleMessage = (event) => {
    if (event.origin !== PLUMPGAMES_ORIGIN) return;

    if (event.data === 'plumpgames-input-ping') {
      if (event.source && typeof event.source.postMessage === 'function') {
        event.source.postMessage('plumpgames-input-ready', PLUMPGAMES_ORIGIN);
      }
      return;
    }

    const input = event.data;
    if (
      !input ||
      input.type !== 'plumpgames-input' ||
      (input.action !== 'keydown' && input.action !== 'keyup') ||
      typeof input.key !== 'string' ||
      typeof input.code !== 'string' ||
      (!input.key && !input.code)
    ) {
      return;
    }

    const identifier = keyIdentifier(input);
    if (input.action === 'keydown') {
      if (pressedKeys.has(identifier)) return;
      const pressedInput = {key: input.key, code: input.code};
      pressedKeys.set(identifier, pressedInput);
      dispatchKeyboardEvent('keydown', pressedInput, false);
      return;
    }

    const pressedInput = pressedKeys.get(identifier);
    if (!pressedInput) return;
    dispatchKeyboardEvent('keyup', pressedInput, false);
    pressedKeys.delete(identifier);
  };

  window.addEventListener('message', handleMessage);
  window.addEventListener('blur', releaseAllKeys);
  window.addEventListener('pagehide', releaseAllKeys);
  window.addEventListener('beforeunload', releaseAllKeys);
  window.addEventListener('unload', releaseAllKeys);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) releaseAllKeys();
  });
})();
