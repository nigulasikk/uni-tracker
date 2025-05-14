import express from 'express';
import cors from 'cors';
import { MongoClient, Collection } from 'mongodb';
import { TrackingData } from './types';

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/uni-tracker';
const DB_NAME = 'uni-tracker';

const app = express();

app.use(cors());
app.use(express.json({ limit: '5mb' }));

let trackingCollection: Collection;

async function connectToDatabase() {
  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    trackingCollection = db.collection('tracking_data');
    
    await trackingCollection.createIndex({ timestamp: -1 });
    await trackingCollection.createIndex({ 'appId': 1, 'timestamp': -1 });
    await trackingCollection.createIndex({ 'type': 1, 'timestamp': -1 });
    
    console.log('Indexes created');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
}


app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.post('/api/collect', async (req, res) => {
  try {
    const trackingData: TrackingData[] = Array.isArray(req.body) ? req.body : [req.body];
    
    if (trackingData.length === 0) {
      return res.status(400).json({ error: 'No tracking data provided' });
    }
    
    const dataWithTimestamp = trackingData.map(data => ({
      ...data,
      receivedAt: new Date()
    }));
    
    await trackingCollection.insertMany(dataWithTimestamp);
    
    res.status(200).json({ success: true, count: trackingData.length });
  } catch (error) {
    console.error('Error collecting tracking data:', error);
    res.status(500).json({ error: 'Failed to collect tracking data' });
  }
});

app.get('/api/stats', async (req, res) => {
  try {
    const { appId, startTime, endTime } = req.query;
    
    if (!appId) {
      return res.status(400).json({ error: 'appId is required' });
    }
    
    const query: any = { appId };
    
    if (startTime || endTime) {
      query.timestamp = {};
      if (startTime) query.timestamp.$gte = Number(startTime);
      if (endTime) query.timestamp.$lte = Number(endTime);
    }
    
    const pvCount = await trackingCollection.countDocuments({
      ...query,
      eventName: 'page_view'
    });
    
    const uniqueUsers = await trackingCollection.distinct('userId', {
      ...query,
      eventName: 'page_view',
      userId: { $exists: true, $ne: null }
    });
    
    const jsErrors = await trackingCollection.find({
      ...query,
      type: 'error'
    }).sort({ timestamp: -1 }).limit(100).toArray();
    
    const apiRequests = await trackingCollection.find({
      ...query,
      type: 'api'
    }).sort({ timestamp: -1 }).limit(100).toArray();
    
    const performanceData = await trackingCollection.find({
      ...query,
      type: 'performance'
    }).sort({ timestamp: -1 }).limit(100).toArray();
    
    const totalPageViews = pvCount || 1; // Avoid division by zero
    const errorRate = (jsErrors.length / totalPageViews) * 100;
    
    const successfulApiRequests = apiRequests.filter(req => req.api.success).length;
    const apiSuccessRate = apiRequests.length > 0 
      ? (successfulApiRequests / apiRequests.length) * 100 
      : 100;
    
    let avgLoadTime = 0;
    let avgDomReady = 0;
    let avgFirstPaint = 0;
    
    if (performanceData.length > 0) {
      avgLoadTime = performanceData.reduce((sum, item) => sum + (item.metrics.loadTime || 0), 0) / performanceData.length;
      avgDomReady = performanceData.reduce((sum, item) => sum + (item.metrics.domReady || 0), 0) / performanceData.length;
      avgFirstPaint = performanceData.reduce((sum, item) => sum + (item.metrics.firstPaint || 0), 0) / performanceData.length;
    }
    
    res.status(200).json({
      pv: pvCount,
      uv: uniqueUsers.length,
      jsErrorRate: errorRate.toFixed(2),
      jsErrors: jsErrors.slice(0, 10), // Return only the 10 most recent errors
      apiSuccessRate: apiSuccessRate.toFixed(2),
      apiRequests: apiRequests.slice(0, 10), // Return only the 10 most recent API requests
      performance: {
        avgLoadTime,
        avgDomReady,
        avgFirstPaint
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

app.get('/api/timeseries', async (req, res) => {
  try {
    const { appId, metric, interval, startTime, endTime } = req.query;
    
    if (!appId || !metric) {
      return res.status(400).json({ error: 'appId and metric are required' });
    }
    
    const query: any = { appId };
    
    if (startTime || endTime) {
      query.timestamp = {};
      if (startTime) query.timestamp.$gte = Number(startTime);
      if (endTime) query.timestamp.$lte = Number(endTime);
    }
    
    let timeSeriesData;
    
    switch (metric) {
      case 'pv':
        timeSeriesData = await trackingCollection.aggregate([
          { $match: { ...query, eventName: 'page_view' } },
          { $group: {
              _id: { $floor: { $divide: ['$timestamp', Number(interval) || 3600000] } },
              count: { $sum: 1 },
              timestamp: { $first: '$timestamp' }
            }
          },
          { $sort: { _id: 1 } },
          { $project: { _id: 0, timestamp: 1, count: 1 } }
        ]).toArray();
        break;
        
      case 'errors':
        timeSeriesData = await trackingCollection.aggregate([
          { $match: { ...query, type: 'error' } },
          { $group: {
              _id: { $floor: { $divide: ['$timestamp', Number(interval) || 3600000] } },
              count: { $sum: 1 },
              timestamp: { $first: '$timestamp' }
            }
          },
          { $sort: { _id: 1 } },
          { $project: { _id: 0, timestamp: 1, count: 1 } }
        ]).toArray();
        break;
        
      case 'api':
        timeSeriesData = await trackingCollection.aggregate([
          { $match: { ...query, type: 'api' } },
          { $group: {
              _id: { $floor: { $divide: ['$timestamp', Number(interval) || 3600000] } },
              count: { $sum: 1 },
              successCount: { 
                $sum: { $cond: [{ $eq: ['$api.success', true] }, 1, 0] }
              },
              timestamp: { $first: '$timestamp' }
            }
          },
          { $sort: { _id: 1 } },
          { $project: { 
              _id: 0, 
              timestamp: 1, 
              count: 1,
              successCount: 1,
              successRate: { 
                $cond: [
                  { $eq: ['$count', 0] },
                  100,
                  { $multiply: [{ $divide: ['$successCount', '$count'] }, 100] }
                ]
              }
            } 
          }
        ]).toArray();
        break;
        
      case 'performance':
        timeSeriesData = await trackingCollection.aggregate([
          { $match: { ...query, type: 'performance' } },
          { $group: {
              _id: { $floor: { $divide: ['$timestamp', Number(interval) || 3600000] } },
              avgLoadTime: { $avg: '$metrics.loadTime' },
              avgDomReady: { $avg: '$metrics.domReady' },
              avgFirstPaint: { $avg: '$metrics.firstPaint' },
              timestamp: { $first: '$timestamp' }
            }
          },
          { $sort: { _id: 1 } },
          { $project: { _id: 0, timestamp: 1, avgLoadTime: 1, avgDomReady: 1, avgFirstPaint: 1 } }
        ]).toArray();
        break;
        
      default:
        return res.status(400).json({ error: 'Invalid metric' });
    }
    
    res.status(200).json(timeSeriesData);
  } catch (error) {
    console.error('Error fetching time series data:', error);
    res.status(500).json({ error: 'Failed to fetch time series data' });
  }
});

app.get('/api/export', async (req, res) => {
  try {
    const { appId, startTime, endTime, type } = req.query;
    
    if (!appId) {
      return res.status(400).json({ error: 'appId is required' });
    }
    
    const query: any = { appId };
    
    if (startTime || endTime) {
      query.timestamp = {};
      if (startTime) query.timestamp.$gte = Number(startTime);
      if (endTime) query.timestamp.$lte = Number(endTime);
    }
    
    if (type) {
      query.type = type;
    }
    
    const data = await trackingCollection.find(query).sort({ timestamp: -1 }).toArray();
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=uni-tracker-export-${Date.now()}.json`);
    res.status(200).json(data);
  } catch (error) {
    console.error('Error exporting data:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

app.post('/api/import', async (req, res) => {
  try {
    const importData = req.body;
    
    if (!Array.isArray(importData) || importData.length === 0) {
      return res.status(400).json({ error: 'Invalid import data format' });
    }
    
    const dataWithTimestamp = importData.map(data => ({
      ...data,
      importedAt: new Date()
    }));
    
    const result = await trackingCollection.insertMany(dataWithTimestamp);
    
    res.status(200).json({ 
      success: true, 
      count: result.insertedCount 
    });
  } catch (error) {
    console.error('Error importing data:', error);
    res.status(500).json({ error: 'Failed to import data' });
  }
});

async function startServer() {
  await connectToDatabase();
  
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch(console.error);
