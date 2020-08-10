import JSBridgeBase from './base';
import { getStats } from './performance';

export default class JSBridge extends JSBridgeBase {
  constructor() {
    super();
  }

  private fpsReqId = 0;

  public sendStats() {
    return this.handlePublicAPI('stats', { ...getStats() });
  }

  public fps(start: boolean = true) {
    if (!start) {
      cancelAnimationFrame(this.fpsReqId);
      return;
    }

    const performance = window.performance || window.webkitPerformance || Date;
    let prevTime = performance.now();
    let frames = 0;

    const loop = () => {
      const time = performance.now();
      frames++;
      if (time > prevTime + 1000) {
        let fps = Math.round((frames * 1000) / (time - prevTime));
        prevTime = time;
        frames = 0;

        this.handlePublicAPI('fps', { fps });
      }

      this.fpsReqId = requestAnimationFrame(loop);
    };

    this.fpsReqId = requestAnimationFrame(loop);
  }
}
