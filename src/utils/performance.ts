interface PerformanceMetric {
  name: string;
  startTime: number;
  duration: number;
  type: 'api' | 'render' | 'interaction' | 'resource';
  metadata?: Record<string, any>;
}

interface ResourceTiming {
  name: string;
  initiatorType: string;
  duration: number;
  transferSize?: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private marks: Map<string, number> = new Map();
  private enabled: boolean = true;
  private observer: PerformanceObserver | null = null;

  constructor() {
    this.setupObserver();
  }

  private setupObserver() {
    if (typeof window === 'undefined' || !window.PerformanceObserver) {
      console.warn('PerformanceObserver is not supported in this environment');
      return;
    }

    try {
      this.observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.entryType === 'resource') {
            this.logResourceTiming(entry as PerformanceResourceTiming);
          }
        });
      });

      this.observer.observe({ entryTypes: ['resource', 'navigation', 'paint'] });
    } catch (error) {
      console.warn('Failed to setup PerformanceObserver:', error);
    }
  }

  enable() {
    this.enabled = true;
  }

  disable() {
    this.enabled = false;
  }

  mark(name: string) {
    if (!this.enabled) return;
    const time = window.performance.now();
    this.marks.set(name, time);
    window.performance.mark(name);
  }

  measure(name: string, startMark: string) {
    if (!this.enabled) return;
    
    const startTime = this.marks.get(startMark);
    if (!startTime) {
      console.warn(`Start mark "${startMark}" not found`);
      return;
    }

    const endTime = window.performance.now();
    const duration = endTime - startTime;
    
    window.performance.measure(name, startMark);
    
    this.logMetric({
      name,
      startTime,
      duration,
      type: 'interaction'
    });

    this.marks.delete(startMark);
  }

  trackApiCall(name: string, duration: number, metadata?: Record<string, any>) {
    if (!this.enabled) return;
    
    const now = window.performance.now();
    this.logMetric({
      name,
      startTime: now - duration,
      duration,
      type: 'api',
      metadata
    });
  }

  trackRender(componentName: string, duration: number) {
    if (!this.enabled) return;
    
    const now = window.performance.now();
    this.logMetric({
      name: `render_${componentName}`,
      startTime: now - duration,
      duration,
      type: 'render'
    });
  }

  private logMetric(metric: PerformanceMetric) {
    this.metrics.push(metric);
    this.pruneOldMetrics();
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`Performance: ${metric.name} - ${metric.duration.toFixed(2)}ms`, metric);
    }
  }

  private logResourceTiming(entry: PerformanceResourceTiming) {
    const timing: ResourceTiming = {
      name: entry.name,
      initiatorType: entry.initiatorType,
      duration: entry.duration,
      transferSize: entry.transferSize
    };

    this.logMetric({
      name: `resource_${entry.initiatorType}`,
      startTime: entry.startTime,
      duration: entry.duration,
      type: 'resource',
      metadata: timing
    });
  }

  private pruneOldMetrics() {
    // Keep only the last 1000 metrics
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }

  getMetrics(type?: string, name?: string): PerformanceMetric[] {
    let filtered = this.metrics;
    
    if (type) {
      filtered = filtered.filter(m => m.type === type);
    }
    
    if (name) {
      filtered = filtered.filter(m => m.name === name);
    }
    
    return filtered;
  }

  getAverageMetric(type: string, name: string): number {
    const metrics = this.getMetrics(type, name);
    if (metrics.length === 0) return 0;
    
    const sum = metrics.reduce((acc, m) => acc + m.duration, 0);
    return sum / metrics.length;
  }

  getSlowMetrics(threshold: number = 1000): PerformanceMetric[] {
    return this.metrics.filter(m => m.duration > threshold);
  }

  generateReport(): Record<string, any> {
    const apiCalls = this.getMetrics('api');
    const renders = this.getMetrics('render');
    const resources = this.getMetrics('resource');

    return {
      timestamp: new Date().toISOString(),
      summary: {
        totalMetrics: this.metrics.length,
        apiCalls: apiCalls.length,
        renders: renders.length,
        resources: resources.length
      },
      averages: {
        apiCalls: this.getAverageMetric('api', ''),
        renders: this.getAverageMetric('render', ''),
        resources: this.getAverageMetric('resource', '')
      },
      slow: {
        apiCalls: apiCalls.filter(m => m.duration > 1000),
        renders: renders.filter(m => m.duration > 100),
        resources: resources.filter(m => m.duration > 500)
      }
    };
  }

  clearMetrics() {
    this.metrics = [];
    this.marks.clear();
    if (typeof window !== 'undefined') {
      window.performance.clearMarks();
      window.performance.clearMeasures();
    }
  }
}

export const performanceMonitor = new PerformanceMonitor();

// React Hook for component performance tracking
export function usePerformanceTracking(componentName: string) {
  return {
    trackRender: (duration: number) => performanceMonitor.trackRender(componentName, duration),
    trackInteraction: (name: string, startMark: string) => performanceMonitor.measure(`${componentName}_${name}`, startMark)
  };
} 