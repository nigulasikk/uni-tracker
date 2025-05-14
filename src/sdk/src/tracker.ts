import { TrackerConfig, EventData, PerformanceData, ErrorData, ApiData, TrackingData } from './types';

class UniTracker {
  private config: TrackerConfig = {
    id: '',
    autoTrackPV: true,
    enableSPA: false,
    maxBatchSize: 10,
    sendInterval: 5000,
    serverUrl: 'http://localhost:3000/api/collect'
  };
  
  private queue: TrackingData[] = [];
  private timer: ReturnType<typeof setInterval> | null = null;
  private initialized = false;

  /**
   * Initialize the tracker with configuration
   */
  public init(config: TrackerConfig): void {
    if (this.initialized) {
      console.warn('UniTracker already initialized');
      return;
    }

    this.config = { ...this.config, ...config };
    
    if (!this.config.id) {
      console.error('UniTracker initialization failed: appId is required');
      return;
    }

    this.initialized = true;
    this.startTimer();
    this.setupListeners();
    
    if (this.config.autoTrackPV) {
      this.trackPageView();
    }
  }

  /**
   * Track custom events
   */
  public track(eventName: string, params?: Record<string, any>): void {
    if (!this.initialized) {
      console.warn('UniTracker not initialized');
      return;
    }

    const eventData: EventData = {
      eventName,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      userId: this.config.userId,
      username: this.config.username,
      appId: this.config.id,
      environment: this.config.environment,
      version: this.config.version,
      params
    };

    this.addToQueue(eventData);
  }

  /**
   * Track page views
   */
  public trackPageView(): void {
    this.track('page_view');
  }

  /**
   * Set user information
   */
  public setUser(userInfo: { userId: string; username?: string }): void {
    this.config.userId = userInfo.userId;
    this.config.username = userInfo.username;
  }

  /**
   * Start a new session
   */
  public startSession(): void {
    this.track('session_start');
  }

  /**
   * End the current session
   */
  public endSession(): void {
    this.track('session_end');
    this.flush();
  }

  /**
   * Enable automatic tracking
   */
  public enableAutoTrack(): void {
    this.config.autoTrackPV = true;
    this.setupListeners();
  }

  /**
   * Disable automatic tracking
   */
  public disableAutoTrack(): void {
    this.config.autoTrackPV = false;
    this.removeListeners();
  }

  /**
   * Set custom dimension
   */
  public setCustomDimension(key: string, value: any): void {
    (this.config as any)[key] = value;
  }

  /**
   * Add data to the queue
   */
  private addToQueue(data: TrackingData): void {
    this.queue.push(data);
    
    if (this.queue.length >= (this.config.maxBatchSize || 10)) {
      this.flush();
    }
  }

  /**
   * Send data to the server
   */
  private flush(): void {
    if (this.queue.length === 0) return;

    const dataToSend = [...this.queue];
    this.queue = [];

    fetch(this.config.serverUrl || 'http://localhost:3000/api/collect', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(dataToSend),
      keepalive: true
    }).catch(error => {
      console.error('Failed to send tracking data:', error);
      this.queue = [...this.queue, ...dataToSend];
    });
  }

  /**
   * Start the timer for periodic data sending
   */
  private startTimer(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
    
    this.timer = setInterval(() => {
      this.flush();
    }, this.config.sendInterval || 5000);
  }

  /**
   * Track performance metrics
   */
  private trackPerformance(): void {
    if (!window.performance) return;

    window.addEventListener('load', () => {
      setTimeout(() => {
        const perfData = window.performance.timing;
        const performanceData: PerformanceData = {
          type: 'performance',
          timestamp: Date.now(),
          url: window.location.href,
          userAgent: navigator.userAgent,
          userId: this.config.userId,
          username: this.config.username,
          appId: this.config.id,
          environment: this.config.environment,
          version: this.config.version,
          metrics: {
            firstPaint: perfData.responseStart - perfData.navigationStart,
            firstContentfulPaint: perfData.domContentLoadedEventStart - perfData.navigationStart,
            domReady: perfData.domComplete - perfData.navigationStart,
            loadTime: perfData.loadEventEnd - perfData.navigationStart,
            resourceLoadTime: perfData.loadEventEnd - perfData.domContentLoadedEventEnd
          }
        };

        this.addToQueue(performanceData);
      }, 0);
    });
  }

  /**
   * Track JavaScript errors
   */
  private trackErrors(): void {
    window.addEventListener('error', (event) => {
      const errorData: ErrorData = {
        type: 'error',
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        userId: this.config.userId,
        username: this.config.username,
        appId: this.config.id,
        environment: this.config.environment,
        version: this.config.version,
        error: {
          message: event.message,
          stack: event.error?.stack,
          type: event.error?.name,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      };

      this.addToQueue(errorData);
    });

    window.addEventListener('unhandledrejection', (event) => {
      const errorData: ErrorData = {
        type: 'error',
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        userId: this.config.userId,
        username: this.config.username,
        appId: this.config.id,
        environment: this.config.environment,
        version: this.config.version,
        error: {
          message: event.reason?.message || String(event.reason),
          stack: event.reason?.stack,
          type: 'UnhandledRejection'
        }
      };

      this.addToQueue(errorData);
    });
  }

  /**
   * Track API requests using XMLHttpRequest and fetch
   */
  private trackApiRequests(): void {
    const originalXhrOpen = XMLHttpRequest.prototype.open;
    const originalXhrSend = XMLHttpRequest.prototype.send;
    const tracker = this;

    XMLHttpRequest.prototype.open = function(method: string, url: string) {
      this._uniTrackerMethod = method;
      this._uniTrackerUrl = url;
      this._uniTrackerStartTime = Date.now();
      return originalXhrOpen.apply(this, arguments as any);
    };

    XMLHttpRequest.prototype.send = function() {
      this.addEventListener('load', function() {
        const duration = Date.now() - (this._uniTrackerStartTime || 0);
        const apiData: ApiData = {
          type: 'api',
          timestamp: Date.now(),
          url: window.location.href,
          userAgent: navigator.userAgent,
          userId: tracker.config.userId,
          username: tracker.config.username,
          appId: tracker.config.id,
          environment: tracker.config.environment,
          version: tracker.config.version,
          api: {
            method: this._uniTrackerMethod || 'unknown',
            url: this._uniTrackerUrl || 'unknown',
            status: this.status,
            duration,
            success: this.status >= 200 && this.status < 300,
            responseSize: this.responseText?.length
          }
        };

        tracker.addToQueue(apiData);
      });

      this.addEventListener('error', function() {
        const duration = Date.now() - (this._uniTrackerStartTime || 0);
        const apiData: ApiData = {
          type: 'api',
          timestamp: Date.now(),
          url: window.location.href,
          userAgent: navigator.userAgent,
          userId: tracker.config.userId,
          username: tracker.config.username,
          appId: tracker.config.id,
          environment: tracker.config.environment,
          version: tracker.config.version,
          api: {
            method: this._uniTrackerMethod || 'unknown',
            url: this._uniTrackerUrl || 'unknown',
            status: 0,
            duration,
            success: false
          }
        };

        tracker.addToQueue(apiData);
      });

      return originalXhrSend.apply(this, arguments as any);
    };

    const originalFetch = window.fetch;
    window.fetch = function(input: RequestInfo | URL, init?: RequestInit) {
      const startTime = Date.now();
      const method = init?.method || 'GET';
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;

      return originalFetch.call(this, input, init).then(response => {
        const duration = Date.now() - startTime;
        const apiData: ApiData = {
          type: 'api',
          timestamp: Date.now(),
          url: window.location.href,
          userAgent: navigator.userAgent,
          userId: tracker.config.userId,
          username: tracker.config.username,
          appId: tracker.config.id,
          environment: tracker.config.environment,
          version: tracker.config.version,
          api: {
            method,
            url,
            status: response.status,
            duration,
            success: response.ok
          }
        };

        tracker.addToQueue(apiData);
        return response;
      }).catch(error => {
        const duration = Date.now() - startTime;
        const apiData: ApiData = {
          type: 'api',
          timestamp: Date.now(),
          url: window.location.href,
          userAgent: navigator.userAgent,
          userId: tracker.config.userId,
          username: tracker.config.username,
          appId: tracker.config.id,
          environment: tracker.config.environment,
          version: tracker.config.version,
          api: {
            method,
            url,
            status: 0,
            duration,
            success: false
          }
        };

        tracker.addToQueue(apiData);
        throw error;
      });
    };
  }

  /**
   * Set up all event listeners
   */
  private setupListeners(): void {
    this.trackPerformance();
    this.trackErrors();
    this.trackApiRequests();

    if (this.config.enableSPA) {
      const originalPushState = history.pushState;
      const originalReplaceState = history.replaceState;
      const tracker = this;

      history.pushState = function() {
        originalPushState.apply(this, arguments as any);
        tracker.trackPageView();
      };

      history.replaceState = function() {
        originalReplaceState.apply(this, arguments as any);
        tracker.trackPageView();
      };

      window.addEventListener('popstate', () => {
        this.trackPageView();
      });
    }
  }

  /**
   * Remove event listeners
   */
  private removeListeners(): void {
  }
}

export default new UniTracker();
