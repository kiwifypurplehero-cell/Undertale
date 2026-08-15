(function () {
  'use strict';

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

  const keyFromCode = (code) => {
    if (Object.prototype.hasOwnProperty.call(legacyKeyCodes, code)) return code;
    if (/^Key[A-Z]$/.test(code)) return code.slice(3).toLowerCase();
    if (/^Digit[0-9]$/.test(code)) return code.slice(5);
    return '';
  };

  const normalize = (input) => {
    const key = input.key || keyFromCode(input.code);
    let keyCode = legacyKeyCodes[key];
    if (keyCode === undefined && /^Key[A-Z]$/.test(input.code)) {
      keyCode = input.code.charCodeAt(3);
    } else if (keyCode === undefined && /^Digit[0-9]$/.test(input.code)) {
      keyCode = input.code.charCodeAt(5);
    } else if (keyCode === undefined && key.length === 1) {
      keyCode = key.toUpperCase().charCodeAt(0);
    }
    return {key, keyCode: keyCode || 0};
  };

  const getKeyboard = () => {
    const runtime = window.vm && window.vm.runtime;
    return runtime && runtime.ioDevices && runtime.ioDevices.keyboard;
  };

  const updateKeyboard = (action, input) => {
    const keyboard = getKeyboard();
    if (!keyboard || typeof keyboard.postData !== 'function') return false;

    const normalized = normalize(input);
    if (!normalized.key) return false;
    if (window.PLUMPGAMES_INPUT_DEBUG === true) {
      console.debug(`[LDT] adapter ${action} ${normalized.key}`);
    }
    keyboard.postData({
      key: normalized.key,
      keyCode: normalized.keyCode,
      isDown: action === 'keydown'
    });
    if (window.PLUMPGAMES_INPUT_DEBUG === true) {
      console.debug('[LDT] internal input updated');
    }
    return true;
  };

  window.PlumpGamesInputAdapter = Object.freeze({
    id: 'undertale-turbowarp-scratch-vm',
    game: 'Undertale',
    isAvailable: () => Boolean(getKeyboard()),
    keydown: (input) => updateKeyboard('keydown', input),
    keyup: (input) => updateKeyboard('keyup', input)
  });
})();
