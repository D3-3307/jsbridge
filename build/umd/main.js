(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = global || self, global.jsbridge = factory());
}(this, (function () { 'use strict';

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the Apache License, Version 2.0 (the "License"); you may not use
    this file except in compliance with the License. You may obtain a copy of the
    License at http://www.apache.org/licenses/LICENSE-2.0

    THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
    WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
    MERCHANTABLITY OR NON-INFRINGEMENT.

    See the Apache Version 2.0 License for specific language governing permissions
    and limitations under the License.
    ***************************************************************************** */
    /* global Reflect, Promise */

    var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };

    function __extends(d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    }

    var ua = window.navigator.userAgent;
    var isAndroid = function () { return ua.indexOf('Android') > -1 || ua.indexOf('Adr') > -1; };
    var isIOS = function () { return !!ua.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/); };
    var NATIVE_CALLBACK = '__NativeCallback';
    var CALL_NATIVE = '__CallNative';
    var MSG_PREFIX = '[JSBridge]';
    var print = function (msg) {
        try {
            console.log("%c " + MSG_PREFIX + ":\n", 'color: #D7BB71', JSON.stringify(msg, null, 4));
        }
        catch (error) {
            console.warn(MSG_PREFIX + ": print error:", error);
        }
    };
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
            var _this = this;
            this.mock = function (mockResponse) {
                _this.mockResponse = mockResponse;
                _this.mockMode = true;
                return _this;
            };
            this.devMode = false;
            this.mockMode = false;
            if (!!this.cachedPromise) {
                JSBridgeError('Already loaded');
            }
            else {
                this.cachedPromise = new Map();
            }
            this.nativeCallbackHandler();
        }
        JSBridgeBase.prototype.toggleDevMode = function () {
            return (this.devMode = !this.devMode);
        };
        JSBridgeBase.prototype.callNative = function (toNativeData) {
            if (this.mockMode) {
                window[NATIVE_CALLBACK](JSON.stringify({
                    actionID: toNativeData.actionID,
                    callbackID: toNativeData.callbackID,
                    data: this.mockResponse
                }));
                this.mockMode = false;
                this.mockResponse = null;
                return;
            }
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
                    if (_this.devMode) {
                        print(data);
                    }
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
            if (this.devMode) {
                print({ actionID: actionID, params: params });
            }
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

    var FPS = /** @class */ (function () {
        function FPS(sampleSize) {
            if (sampleSize === void 0) { sampleSize = 60; }
            this.sampleSize = 60;
            this.value = 0;
            this.sample = [];
            this.index = 0;
            this.lastTick = -1;
            this.perf = window.performance || window.webkitPerformance;
            this.sampleSize = sampleSize;
        }
        FPS.prototype.tick = function () {
            if (this.perf === undefined) {
                return 0;
            }
            // if is first tick, just set tick timestamp and return
            if (this.lastTick === -1) {
                this.lastTick = this.perf.now();
                return 0;
            }
            // calculate necessary values to obtain current tick FPS
            var now = this.perf.now();
            var delta = (now - this.lastTick) / 1000;
            var fps = 1 / delta;
            // add to fps samples, current tick fps value
            this.sample[this.index] = Math.round(fps);
            // iterate samples to obtain the average
            var average = 0;
            for (var i = 0; i < this.sample.length; i++) {
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
            if (this.index === this.sampleSize)
                this.index = 0;
            return this.value;
        };
        return FPS;
    }());

    var JSBridge = /** @class */ (function (_super) {
        __extends(JSBridge, _super);
        function JSBridge() {
            var _this = _super.call(this) || this;
            _this.fpsReqId = 0;
            return _this;
        }
        JSBridge.prototype.sendStats = function () {
            var performance = window.performance || window.webkitPerformance;
            if (performance === undefined) {
                console.warn('can not get performance stats');
                return;
            }
            var timing = performance.timing;
            var data = {
                fps: 0,
                white: timing.responseStart - timing.navigationStart,
                onload: timing.loadEventEnd - timing.fetchStart
            };
            return this.handlePublicAPI('stats', data);
        };
        JSBridge.prototype.fps = function (start) {
            if (start === void 0) { start = true; }
            if (!start) {
                cancelAnimationFrame(this.fpsReqId);
                return;
            }
            var fps = new FPS(120);
            function loop() {
                var fpsValue = fps.tick();
                console.log(fpsValue);
                this.handlePublicAPI('fps', { fps: fpsValue });
                this.fpsReqId = requestAnimationFrame(loop);
            }
            requestAnimationFrame(loop);
        };
        return JSBridge;
    }(JSBridgeBase));

    return JSBridge;

})));
//# sourceMappingURL=main.js.map
