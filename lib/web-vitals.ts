import { onCLS, onINP, onFCP, onLCP, onTTFB, Metric } from "web-vitals";

// Performance targets
const TARGETS = {
  LCP: 2500, // Largest Contentful Paint < 2.5s
  INP: 200, // Interaction to Next Paint < 200ms (replaced FID)
  CLS: 0.1, // Cumulative Layout Shift < 0.1
  FCP: 1800, // First Contentful Paint < 1.8s
  TTFB: 600, // Time to First Byte < 600ms
};

function reportWebVitals(metric: Metric) {
  const { name, value } = metric;
  const target = TARGETS[name as keyof typeof TARGETS];

  if (target && value < target) {
    // eslint-disable-next-line no-console
    console.log(`✅ Good performance: ${name} = ${Math.round(value)}ms`);
  } else if (target) {
    console.warn(`⚠️ Check performance: ${name} = ${Math.round(value)}ms (target: <${target}ms)`);
  } else {
    // eslint-disable-next-line no-console
    console.log(`📊 ${name} = ${Math.round(value)}ms`);
  }

  // In production, you could send this to an analytics service
  // Example: sendToAnalytics(metric);
}

// Measure all Core Web Vitals
export function measureWebVitals() {
  if (typeof window === "undefined") return;

  onCLS(reportWebVitals);
  onINP(reportWebVitals);
  onFCP(reportWebVitals);
  onLCP(reportWebVitals);
  onTTFB(reportWebVitals);
}

