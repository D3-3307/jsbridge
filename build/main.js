var ua = window.navigator.userAgent;
var isAndroid = function () { return ua.indexOf('Android') > -1 || ua.indexOf('Adr') > -1; };
var isIOS = function () { return !!ua.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/); };
var NATIVE_CALLBACK = '__NativeCallback';
var CALL_NATIVE = '__CallNative';
var MSG_PREFIX = '[JSBridge]';
var uuid = function () {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (Math.random() * 16) | 0, v = c == 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
};
var JSBridgeError = function (msg) {
    throw Error(MSG_PREFIX + ": " + msg);
};
var randomCallbackID = function (actionID) {
    return actionID + "-" + uuid();
};
var JSBridgeBase = /** @class */ (function () {
    function JSBridgeBase() {
        if (!!this.cachedPromise) {
            JSBridgeError('Already loaded');
        }
        else {
            this.cachedPromise = new Map();
        }
        this.nativeCallbackHandler();
    }
    JSBridgeBase.prototype.callNative = function (toNativeData) {
        if (isAndroid()) {
            if (!window.android) {
                JSBridgeError('No window.android, please be sure your H5 is in APP WebView');
            }
            else {
                window.android[CALL_NATIVE](JSON.stringify(toNativeData));
            }
        }
        else if (isIOS()) {
            if (!window.webkit) {
                JSBridgeError('No window.webkit, please be sure your H5 is in APP WebView');
            }
            else {
                window.webkit.messageHandlers[CALL_NATIVE].postMessage(toNativeData);
            }
        }
    };
    JSBridgeBase.prototype.nativeCallbackHandler = function () {
        var _this = this;
        if (!!window[NATIVE_CALLBACK]) {
            JSBridgeError('Already loaded');
            return;
        }
        window[NATIVE_CALLBACK] = function (dataString) {
            try {
                var data = JSON.parse(dataString);
                if (_this.cachedPromise.has(data.callbackID)) {
                    var correspondingHandler = _this.cachedPromise.get(data.callbackID);
                    if (data.error) {
                        correspondingHandler.reject(data.error);
                    }
                    else {
                        correspondingHandler.resolve(data.data || {});
                    }
                    _this.cachedPromise.delete(data.callbackID);
                }
                else {
                    console.warn(MSG_PREFIX + ": No corresponding callbackID");
                }
            }
            catch (e) {
                JSBridgeError("Native callback error: " + e);
            }
        };
    };
    JSBridgeBase.prototype.handlePublicAPI = function (actionID, params) {
        var _this = this;
        var callbackID = randomCallbackID(actionID);
        return new Promise(function (resolve, reject) {
            _this.cachedPromise.set(callbackID, { resolve: resolve, reject: reject });
            _this.callNative({
                actionID: actionID,
                callbackID: callbackID,
                params: params
            });
        });
    };
    return JSBridgeBase;
}());

export default JSBridgeBase;
