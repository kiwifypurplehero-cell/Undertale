(function () {
  'use strict';

  const PLUMPGAMES_ORIGIN = 'https://site.kiwifypurplehero.workers.dev';
  const pressedKeys = new Map();

  const debug = (...args) => {
    if (window.PLUMPGAMES_INPUT_DEBUG === true) console.debug(...args);
  };

  const getAdapter = () => window.PlumpGamesInputAdapter;
  const keyIdentifier = (input) => input.code || input.key;

  const sendStatus = (event) => {
    if (!event.source || typeof event.source.postMessage !== 'function') return;
    const adapter = getAdapter();
    event.source.postMessage({
      type: 'plumpgames-input-status',
      game: adapter ? adapter.game : 'Undertale',
      supported: Boolean(adapter && adapter.isAvailable()),
      adapter: adapter ? adapter.id : null,
      message: adapter
        ? 'Controles LDT integrados para este jogo.'
        : 'Controles LDT ainda não integrados para este jogo.'
    }, PLUMPGAMES_ORIGIN);
  };

  const releaseAllKeys = () => {
    const adapter = getAdapter();
    if (adapter) {
      pressedKeys.forEach((input) => adapter.keyup(input));
    }
    pressedKeys.clear();
  };

  const handleMessage = (event) => {
    if (event.origin !== PLUMPGAMES_ORIGIN) return;

    if (event.data === 'plumpgames-input-ping') {
      if (event.source && typeof event.source.postMessage === 'function') {
        event.source.postMessage('plumpgames-input-ready', PLUMPGAMES_ORIGIN);
      }
      sendStatus(event);
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

    debug('[LDT] message received', input.action, input.key || input.code);
    const adapter = getAdapter();
    if (!adapter || !adapter.isAvailable()) {
      sendStatus(event);
      return;
    }

    const identifier = keyIdentifier(input);
    if (input.action === 'keydown') {
      if (pressedKeys.has(identifier)) return;
      const pressedInput = {key: input.key, code: input.code};
      pressedKeys.set(identifier, pressedInput);
      adapter.keydown(pressedInput);
      return;
    }

    const pressedInput = pressedKeys.get(identifier);
    if (!pressedInput) return;
    adapter.keyup(pressedInput);
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
