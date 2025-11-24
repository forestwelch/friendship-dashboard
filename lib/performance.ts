/**
 * Performance monitoring utilities
 * Helps identify bottlenecks in rendering and data fetching
 */

/**
 * Create a performance marker for measuring execution time
 */
export function measurePerformance(label: string, fn: () => void | Promise<void>) {
  const startMark = `${label}-start`;
  const endMark = `${label}-end`;
  
  performance.mark(startMark);
  
  const result = fn();
  
  if (result instanceof Promise) {
    return result.finally(() => {
      performance.mark(endMark);
      performance.measure(label, startMark, endMark);
      const measure = performance.getEntriesByName(label)[0];
      // eslint-disable-next-line no-console
      console.log(`[Performance] ${label}: ${measure.duration.toFixed(2)}ms`);
    });
  } else {
    performance.mark(endMark);
    performance.measure(label, startMark, endMark);
    const measure = performance.getEntriesByName(label)[0];
    // eslint-disable-next-line no-console
    console.log(`[Performance] ${label}: ${measure.duration.toFixed(2)}ms`);
    return result;
  }
}

/**
 * Measure React component render time
 */
export function measureRender(componentName: string, renderFn: () => void) {
  if (typeof window === 'undefined') return renderFn();
  
  const startMark = `render-${componentName}-start`;
  const endMark = `render-${componentName}-end`;
  
  performance.mark(startMark);
  const result = renderFn();
  performance.mark(endMark);
  
  try {
    performance.measure(`render-${componentName}`, startMark, endMark);
    const measure = performance.getEntriesByName(`render-${componentName}`)[0];
    if (measure.duration > 16) { // Only log if slower than 60fps (16ms)
      console.warn(`[Performance] Slow render: ${componentName} took ${measure.duration.toFixed(2)}ms`);
    }
  } catch {
    // Ignore if measure already exists
  }
  
  return result;
}

/**
 * Get all performance measurements for analysis
 */
export function getPerformanceReport() {
  const measures = performance.getEntriesByType('measure');
  const report: Record<string, number> = {};
  
  measures.forEach(measure => {
    report[measure.name] = measure.duration;
  });
  
  return report;
}

/**
 * Clear all performance measurements
 */
export function clearPerformanceMarks() {
  performance.clearMarks();
  performance.clearMeasures();
}

