interface PerformanceStats {
    appcacheTime: number;
    connectTime: number;
    domReadyTime: number;
    firstPaintTime: number;
    initDomTreeTime: number;
    loadEventTime: number;
    loadTime: number;
    lookupDomainTime: number;
    readyStart: number;
    redirectTime: number;
    requestTime: number;
    unloadEventTime: number;
}
export declare function getStats(): PerformanceStats;
export {};
