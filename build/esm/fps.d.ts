export declare class FPS {
    constructor(sampleSize?: number);
    private sampleSize;
    private value;
    private sample;
    private index;
    private lastTick;
    private perf;
    tick(): number;
}
