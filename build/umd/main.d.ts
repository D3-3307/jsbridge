import JSBridgeBase from './base';
export default class JSBridge extends JSBridgeBase {
    constructor();
    private fpsReqId;
    sendStats(): Promise<unknown>;
    fps(start?: boolean): void;
}
