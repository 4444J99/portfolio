/**
 * jsdom does not implement canvas rendering APIs by default and logs noisy
 * "Not implemented" errors when accessibility tooling probes canvas elements.
 * A minimal stub keeps tests deterministic and signal-rich.
 */

if (typeof HTMLCanvasElement !== 'undefined') {
  const contextStub = {
    canvas: null as HTMLCanvasElement | null,
    fillRect: () => {},
    clearRect: () => {},
    getImageData: () => ({ data: new Uint8ClampedArray() }),
    putImageData: () => {},
    createImageData: () => ([]),
    setTransform: () => {},
    drawImage: () => {},
    save: () => {},
    fillText: () => {},
    restore: () => {},
    beginPath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    closePath: () => {},
    stroke: () => {},
    translate: () => {},
    scale: () => {},
    rotate: () => {},
    arc: () => {},
    fill: () => {},
    measureText: () => ({ width: 0 }),
    transform: () => {},
    rect: () => {},
    clip: () => {},
  };

  Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
    configurable: true,
    value: function getContext() {
      contextStub.canvas = this;
      return contextStub;
    },
  });

  Object.defineProperty(HTMLCanvasElement.prototype, 'toDataURL', {
    configurable: true,
    value: () => 'data:image/png;base64,',
  });
}
