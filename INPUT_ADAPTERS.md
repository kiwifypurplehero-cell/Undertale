# Adaptadores de input da PlumpGames

## Compatibilidade

| Jogo | Estado | Adaptador |
| --- | --- | --- |
| Undertale (`index.html`) | Integrado | `undertale-turbowarp-scratch-vm` |
| Sans Battles | Ainda não integrado | — |
| Rejuvenation | Ainda não integrado | — |
| The Final Experiment | Ainda não integrado | — |
| Last Breath Trio | Ainda não integrado | — |

O Site só deve enviar mensagens no formato abaixo. Ele não deve criar eventos de
teclado nem escolher uma implementação de engine:

```js
{
  type: 'plumpgames-input',
  action: 'keydown', // ou 'keyup'
  key: 'ArrowUp',
  code: 'ArrowUp'
}
```

Ao receber `plumpgames-input-ping`, o jogo responde com o sinal legado
`plumpgames-input-ready` e também com `plumpgames-input-status`. O campo
`supported` permite que as configurações mostrem, para jogos sem adaptador:
“Controles LDT ainda não integrados para este jogo.”

## Caminho real de input do Undertale

Esta versão não usa um runtime nativo do Undertale. Ela é um projeto Scratch 3
empacotado pelo **TurboWarp Packager**. O scaffolding registra `keydown` e `keyup`
no `document`; os handlers transformam a tecla física em
`{key, keyCode, isDown}` e chamam `vm.postIOData('keyboard', data)`.

`VM.postIOData` encaminha os dados a
`vm.runtime.ioDevices.keyboard.postData(data)`. Esse método é o receptor real:
ele normaliza a tecla, atualiza o array interno `_keysPressed` e, no keydown,
emite `KEY_PRESSED`. Os blocos Scratch “tecla pressionada?” consultam esse mesmo
dispositivo por `getKeyIsDown`.

O adaptador de Undertale, portanto, não cria `KeyboardEvent`. Ele chama
diretamente `window.vm.runtime.ioDevices.keyboard.postData`, exatamente o ponto
ao qual o listener de teclado físico encaminha os dados. Keyup remove a tecla do
estado interno, e teclas simultâneas permanecem independentes porque o bridge
mantém cada `code`/`key` pressionado separadamente.

## Como integrar outro jogo

1. Identifique o engine e siga o listener de teclado físico até o estado ou API
   que o gameplay realmente consulta.
2. Crie um arquivo de adaptador que exponha em `window.PlumpGamesInputAdapter`:
   `id`, `game`, `isAvailable()`, `keydown(input)` e `keyup(input)`.
3. Faça `keydown` e `keyup` chamarem diretamente a API interna encontrada. Não
   dispare `KeyboardEvent`, não altere `isTrusted` e não reutilize este adaptador
   sem confirmar que o jogo usa a mesma API.
4. Carregue o adaptador antes de `plumpgames-input-bridge.js` e acrescente o jogo
   ao registro de compatibilidade acima.
5. Valide pressão, soltura e combinações. Para diagnóstico, defina
   `window.PLUMPGAMES_INPUT_DEBUG = true` antes de usar os controles; os logs
   `[LDT]` confirmam mensagem, tradução pelo adaptador e atualização interna.

No Undertale, os casos mínimos são ArrowUp pressionado/solto, `Z` para confirmar
e duas teclas direcionais simultâneas. A inspeção automatizada também deve
confirmar que o array interno do teclado muda sem qualquer evento DOM sintético.
