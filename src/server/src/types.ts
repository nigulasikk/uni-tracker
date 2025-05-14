export interface TrackerConfig {
  id: string;
  userId?: string;
  username?: string;
  environment?: string;
  version?: string;
  autoTrackPV?: boolean;
  enableSPA?: boolean;
  maxBatchSize?: number;
  sendInterval?: number;
  serverUrl?: string;
}

export interface EventData {
  eventName: string;
  timestamp: number;
  url: string;
  userAgent: string;
  userId?: string;
  username?: string;
  appId: string;
  environment?: string;
  version?: string;
  params?: Record<string, any>;
}

export interface PerformanceData {
  type: 'performance';
  timestamp: number;
  url: string;
  userAgent: string;
  userId?: string;
  username?: string;
  appId: string;
  environment?: string;
  version?: string;
  metrics: {
    firstPaint?: number;
    firstContentfulPaint?: number;
    domReady?: number;
    loadTime?: number;
    resourceLoadTime?: number;
  };
}

export interface ErrorData {
  type: 'error';
  timestamp: number;
  url: string;
  userAgent: string;
  userId?: string;
  username?: string;
  appId: string;
  environment?: string;
  version?: string;
  error: {
    message: string;
    stack?: string;
    type?: string;
    filename?: string;
    lineno?: number;
    colno?: number;
  };
}

export interface ApiData {
  type: 'api';
  timestamp: number;
  url: string;
  userAgent: string;
  userId?: string;
  username?: string;
  appId: string;
  environment?: string;
  version?: string;
  api: {
    method: string;
    url: string;
    status: number;
    duration: number;
    success: boolean;
    requestSize?: number;
    responseSize?: number;
  };
}

export type TrackingData = EventData | PerformanceData | ErrorData | ApiData;
