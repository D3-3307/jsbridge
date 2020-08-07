import JSBridgeBase from './main';

// interface Stats {
//   fps: number;
//   white: number;
//   onload: number;
// }

export class JSBridge extends JSBridgeBase {
  constructor() {
    super();
  }

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
      onload: timing.loadEventEnd - timing.loadEventStart
    }

    return this.handlePublicAPI('stats', data);
  }
}


