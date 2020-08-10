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

export function getStats(): PerformanceStats {
  const performance = window.performance || window.webkitPerformance;

  const initStats = {
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

  const timing = performance.timing;
  const stats = initStats;

  if (timing) {
    // Time to first paint
    if (stats.firstPaintTime === 0) {
      if (performance.getEntriesByName !== undefined) {
        const firstPaintPerformanceEntry = performance.getEntriesByName('first-paint');
        if (firstPaintPerformanceEntry.length === 1) {
          const firstPaintTime = firstPaintPerformanceEntry[0].startTime;
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
