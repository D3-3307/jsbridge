import { ACTIONID } from './types';
declare class JSBridgeBase {
    constructor();
    private cachedPromise;
    private callNative;
    private nativeCallbackHandler;
    protected handlePublicAPI<T, K>(actionID: ACTIONID, params?: T): Promise<K>;
}
export default JSBridgeBase;
