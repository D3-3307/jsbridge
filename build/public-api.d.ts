import JSBridgeBase from './main';
interface Stats {
    fps: number;
    white: number;
    onload: number;
}
export declare class JSBridge extends JSBridgeBase {
    constructor();
    sendStats(stats: Stats): Promise<unknown>;
}
export {};
