import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Stats {
  pv: number;
  uv: number;
  jsErrorRate: string;
  jsErrors: any[];
  apiSuccessRate: string;
  apiRequests: any[];
  performance: {
    avgLoadTime: number;
    avgDomReady: number;
    avgFirstPaint: number;
  };
}

interface TimeSeriesData {
  timestamp: number;
  count?: number;
  successCount?: number;
  successRate?: number;
  avgLoadTime?: number;
  avgDomReady?: number;
  avgFirstPaint?: number;
}

const App: React.FC = () => {
  const [appId, setAppId] = useState<string>('demo-app');
  const [stats, setStats] = useState<Stats | null>(null);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<string>('pv');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<string>('1h');

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const mockStats: Stats = {
        pv: 1250,
        uv: 320,
        jsErrorRate: '1.2',
        jsErrors: [
          { timestamp: Date.now() - 300000, error: { message: 'Cannot read property of undefined', filename: 'app.js', lineno: 42 } },
          { timestamp: Date.now() - 600000, error: { message: 'Syntax error', filename: 'vendor.js', lineno: 123 } },
        ],
        apiSuccessRate: '98.5',
        apiRequests: [
          { timestamp: Date.now() - 100000, api: { method: 'GET', url: '/api/users', status: 200, duration: 120, success: true } },
          { timestamp: Date.now() - 200000, api: { method: 'POST', url: '/api/orders', status: 500, duration: 350, success: false } },
        ],
        performance: {
          avgLoadTime: 1250,
          avgDomReady: 850,
          avgFirstPaint: 450
        }
      };

      setStats(mockStats);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch stats data');
      setLoading(false);
    }
  };

  const fetchTimeSeriesData = async () => {
    try {
      setLoading(true);
      setError(null);

      const now = Date.now();
      const mockData: TimeSeriesData[] = [];

      for (let i = 0; i < 24; i++) {
        const timestamp = now - (23 - i) * 3600000;
        
        if (selectedMetric === 'pv') {
          mockData.push({
            timestamp,
            count: Math.floor(Math.random() * 100) + 50
          });
        } else if (selectedMetric === 'errors') {
          mockData.push({
            timestamp,
            count: Math.floor(Math.random() * 10)
          });
        } else if (selectedMetric === 'api') {
          const count = Math.floor(Math.random() * 100) + 20;
          const successCount = count - Math.floor(Math.random() * 5);
          mockData.push({
            timestamp,
            count,
            successCount,
            successRate: (successCount / count) * 100
          });
        } else if (selectedMetric === 'performance') {
          mockData.push({
            timestamp,
            avgLoadTime: Math.floor(Math.random() * 500) + 1000,
            avgDomReady: Math.floor(Math.random() * 300) + 700,
            avgFirstPaint: Math.floor(Math.random() * 200) + 300
          });
        }
      }

      setTimeSeriesData(mockData);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch time series data');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchTimeSeriesData();
  }, [appId, selectedMetric, timeRange]);

  const formatTimestamp = (timestamp: number): string => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className="container">
      <div className="header">
        <h1>Uni-Tracker Dashboard</h1>
        <div>
          <select 
            value={appId} 
            onChange={(e) => setAppId(e.target.value)}
            className="form-input"
            style={{ marginRight: '10px' }}
          >
            <option value="demo-app">Demo App</option>
            <option value="test-app">Test App</option>
          </select>
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            className="form-input"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {loading ? (
        <div className="card">
          <p>Loading data...</p>
        </div>
      ) : stats ? (
        <>
          {/* 统计概览 */}
          <div className="grid">
            <div className="stat-card">
              <div className="stat-title">Page Views</div>
              <div className="stat-value">{stats.pv}</div>
              <div className="stat-change positive">+5.2% from yesterday</div>
            </div>
            <div className="stat-card">
              <div className="stat-title">Unique Visitors</div>
              <div className="stat-value">{stats.uv}</div>
              <div className="stat-change positive">+3.8% from yesterday</div>
            </div>
            <div className="stat-card">
              <div className="stat-title">JS Error Rate</div>
              <div className="stat-value">{stats.jsErrorRate}%</div>
              <div className="stat-change negative">+0.3% from yesterday</div>
            </div>
            <div className="stat-card">
              <div className="stat-title">API Success Rate</div>
              <div className="stat-value">{stats.apiSuccessRate}%</div>
              <div className="stat-change positive">+0.5% from yesterday</div>
            </div>
          </div>

          {/* 图表部分 */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Metrics Over Time</div>
              <div>
                <select 
                  value={selectedMetric} 
                  onChange={(e) => setSelectedMetric(e.target.value)}
                  className="form-input"
                >
                  <option value="pv">Page Views</option>
                  <option value="errors">JS Errors</option>
                  <option value="api">API Requests</option>
                  <option value="performance">Performance</option>
                </select>
              </div>
            </div>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={timeSeriesData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="timestamp" 
                    tickFormatter={formatTimestamp} 
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(label) => formatTimestamp(label as number)}
                  />
                  <Legend />
                  {selectedMetric === 'pv' && (
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      name="Page Views" 
                      stroke="#8884d8" 
                      activeDot={{ r: 8 }} 
                    />
                  )}
                  {selectedMetric === 'errors' && (
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      name="JS Errors" 
                      stroke="#ff5252" 
                      activeDot={{ r: 8 }} 
                    />
                  )}
                  {selectedMetric === 'api' && (
                    <>
                      <Line 
                        type="monotone" 
                        dataKey="count" 
                        name="Total Requests" 
                        stroke="#8884d8" 
                        activeDot={{ r: 8 }} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="successRate" 
                        name="Success Rate (%)" 
                        stroke="#4caf50" 
                        activeDot={{ r: 8 }} 
                      />
                    </>
                  )}
                  {selectedMetric === 'performance' && (
                    <>
                      <Line 
                        type="monotone" 
                        dataKey="avgLoadTime" 
                        name="Avg Load Time (ms)" 
                        stroke="#8884d8" 
                        activeDot={{ r: 8 }} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="avgDomReady" 
                        name="Avg DOM Ready (ms)" 
                        stroke="#82ca9d" 
                        activeDot={{ r: 8 }} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="avgFirstPaint" 
                        name="Avg First Paint (ms)" 
                        stroke="#ffc658" 
                        activeDot={{ r: 8 }} 
                      />
                    </>
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* JS错误部分 */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Recent JS Errors</div>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Error Message</th>
                  <th>File</th>
                  <th>Line</th>
                </tr>
              </thead>
              <tbody>
                {stats.jsErrors.map((error, index) => (
                  <tr key={index}>
                    <td>{formatTimestamp(error.timestamp)}</td>
                    <td>{error.error.message}</td>
                    <td>{error.error.filename}</td>
                    <td>{error.error.lineno}</td>
                  </tr>
                ))}
                {stats.jsErrors.length === 0 && (
                  <tr>
                    <td colSpan={4}>No JS errors recorded</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* API请求部分 */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Recent API Requests</div>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Method</th>
                  <th>URL</th>
                  <th>Status</th>
                  <th>Duration</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.apiRequests.map((request, index) => (
                  <tr key={index}>
                    <td>{formatTimestamp(request.timestamp)}</td>
                    <td>{request.api.method}</td>
                    <td>{request.api.url}</td>
                    <td>{request.api.status}</td>
                    <td>{request.api.duration}ms</td>
                    <td>
                      <span className={`status-badge ${request.api.success ? 'success' : 'error'}`}>
                        {request.api.success ? 'Success' : 'Error'}
                      </span>
                    </td>
                  </tr>
                ))}
                {stats.apiRequests.length === 0 && (
                  <tr>
                    <td colSpan={6}>No API requests recorded</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* 性能指标部分 */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Performance Metrics</div>
            </div>
            <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              <div className="stat-card">
                <div className="stat-title">Avg Load Time</div>
                <div className="stat-value">{stats.performance.avgLoadTime}ms</div>
              </div>
              <div className="stat-card">
                <div className="stat-title">Avg DOM Ready</div>
                <div className="stat-value">{stats.performance.avgDomReady}ms</div>
              </div>
              <div className="stat-card">
                <div className="stat-title">Avg First Paint</div>
                <div className="stat-value">{stats.performance.avgFirstPaint}ms</div>
              </div>
            </div>
          </div>
        </>
      ) : null}

      {/* 数据导出/导入部分 */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Data Management</div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn">Export Data</button>
          <button className="btn btn-secondary">Import Data</button>
        </div>
      </div>
    </div>
  );
};

export default App;
