export class FPS {
  constructor(sampleSize: number = 60) {
    this.sampleSize = sampleSize;
  }

  private sampleSize = 60;
  private value = 0;
  private sample: Array<number> = [];
  private index = 0;
  private lastTick = -1;
  private perf = window.performance || window.webkitPerformance;

  public tick() {
    if (this.perf === undefined) {
      return 0;
    }
    // if is first tick, just set tick timestamp and return
    if (this.lastTick === -1) {
      this.lastTick = this.perf.now();
      return 0;
    }
    // calculate necessary values to obtain current tick FPS
    let now = this.perf.now();
    let delta = (now - this.lastTick) / 1000;
    let fps = 1 / delta;
    // add to fps samples, current tick fps value
    this.sample[this.index] = Math.round(fps);

    // iterate samples to obtain the average
    let average = 0;
    for (let i = 0; i < this.sample.length; i++) {
      average += this.sample[i];
    }

    average = Math.round(average / this.sample.length);

    // set new FPS
    this.value = average;
    // store current timestamp
    this.lastTick = now;
    // increase sample index counter, and reset it
    // to 0 if exceded maximum sampleSize limit
    this.index++;
    if (this.index === this.sampleSize) this.index = 0;
    return this.value;
  }
}
