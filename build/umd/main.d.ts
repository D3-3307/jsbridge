import JSBridgeBase from './base';
export default class JSBridge extends JSBridgeBase {
    constructor();
    private fpsReqId;
    stats(): Promise<unknown>;
    fps(start?: boolean): void;
    traceError(): void;
}
