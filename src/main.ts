import JSBridgeBase from './base';
import { FPS } from './fps';

export default class JSBridge extends JSBridgeBase {
  constructor() {
    super();
  }

  private fpsReqId = 0;

  public sendStats() {
    const performance = window.performance || window.webkitPerformance;

    if (performance === undefined) {
      console.warn('can not get performance stats');
      return;
    }

    const timing = performance.timing;

    const data = {
      fps: 0,
      white: timing.responseStart - timing.navigationStart,
      onload: timing.loadEventEnd - timing.fetchStart
    };

    return this.handlePublicAPI('stats', data);
  }

  public fps(start: boolean = true) {
    if (!start) {
      cancelAnimationFrame(this.fpsReqId);
      return;
    }

    const fps = new FPS(120);

    function loop() {
      let fpsValue = fps.tick();
      console.log(fpsValue);
      this.handlePublicAPI('fps', { fps: fpsValue });
      this.fpsReqId = requestAnimationFrame(loop);
    }

    requestAnimationFrame(loop);
  }
}
