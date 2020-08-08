declare global {
    interface Window {
        android: any;
        webkit: any;
        __NativeCallback: any;
        callWeb: any;
        webkitPerformance: any;
    }
}
export interface CALL_NATIVE {
    actionID: string;
    callbackID: string;
    params?: any;
}
interface NATIVE_ERROR {
    code: string;
    message: string;
}
export declare type CACHED_INDEX = string;
export interface CACHED_PROMISE {
    resolve: Function;
    reject: Function;
}
export interface NATIVE_CALLBACK {
    actionID: string;
    callbackID: string;
    data: object;
    error?: NATIVE_ERROR;
}
export declare type ACTIONID = string;
export {};
