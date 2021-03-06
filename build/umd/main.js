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

    function getStats() {
        var performance = window.performance || window.webkitPerformance;
        var initStats = {
            appcacheTime: 0,
            connectTime: 0,
            domReadyTime: 0,
            firstPaintTime: 0,
            initDomTreeTime: 0,
            loadEventTime: 0,
            loadTime: 0,
            lookupDomainTime: 0,
            readyStart: 0,
            redirectTime: 0,
            requestTime: 0,
            unloadEventTime: 0
        };
        if (performance === undefined) {
            return initStats;
        }
        var timing = performance.timing;
        var stats = initStats;
        if (timing) {
            // Time to first paint
            if (stats.firstPaintTime === 0) {
                if (performance.getEntriesByName !== undefined) {
                    var firstPaintPerformanceEntry = performance.getEntriesByName('first-paint');
                    if (firstPaintPerformanceEntry.length === 1) {
                        var firstPaintTime = firstPaintPerformanceEntry[0].startTime;
                        stats.firstPaintTime = firstPaintTime;
                    }
                }
            }
            // Total time from start to load
            stats.loadTime = timing.loadEventEnd - timing.fetchStart;
            // Time spent constructing the DOM tree
            stats.domReadyTime = timing.domComplete - timing.domInteractive;
            // Time consumed preparing the new page
            stats.readyStart = timing.fetchStart - timing.navigationStart;
            // Time spent during redirection
            stats.redirectTime = timing.redirectEnd - timing.redirectStart;
            // AppCache
            stats.appcacheTime = timing.domainLookupStart - timing.fetchStart;
            // Time spent unloading documents
            stats.unloadEventTime = timing.unloadEventEnd - timing.unloadEventStart;
            // DNS query time
            stats.lookupDomainTime = timing.domainLookupEnd - timing.domainLookupStart;
            // TCP connection time
            stats.connectTime = timing.connectEnd - timing.connectStart;
            // Time spent during the request
            stats.requestTime = timing.responseEnd - timing.requestStart;
            // Request to completion of the DOM loading
            stats.initDomTreeTime = timing.domInteractive - timing.responseEnd;
            // Load event time
            stats.loadEventTime = timing.loadEventEnd - timing.loadEventStart;
        }
        return stats;
    }

    var JSBridge = /** @class */ (function (_super) {
        __extends(JSBridge, _super);
        function JSBridge() {
            var _this = _super.call(this) || this;
            _this.fpsReqId = 0;
            _this.traceError();
            return _this;
        }
        JSBridge.prototype.stats = function () {
            return this.handlePublicAPI('stats', getStats());
        };
        JSBridge.prototype.fps = function (start) {
            var _this = this;
            if (start === void 0) { start = true; }
            if (!start) {
                cancelAnimationFrame(this.fpsReqId);
                return;
            }
            var performance = window.performance || window.webkitPerformance || Date;
            var prevTime = performance.now();
            var frames = 0;
            var loop = function () {
                var time = performance.now();
                frames++;
                if (time > prevTime + 1000) {
                    var fps = Math.round((frames * 1000) / (time - prevTime));
                    prevTime = time;
                    frames = 0;
                    _this.handlePublicAPI('fps', { fps: fps });
                }
                _this.fpsReqId = requestAnimationFrame(loop);
            };
            this.fpsReqId = requestAnimationFrame(loop);
        };
        JSBridge.prototype.traceError = function () {
            var _this = this;
            window.addEventListener('error', function (e) {
                _this.handlePublicAPI('error', { message: e.message, filename: e.filename, lineno: e.lineno, colno: e.colno });
            });
        };
        return JSBridge;
    }(JSBridgeBase));

    return JSBridge;

})));
//# sourceMappingURL=main.js.map
