# Uni-Tracker 技术文档

## 1. 项目概述

Uni-Tracker 是一个支持私有化部署的前端埋点方案，旨在解决网络隔离环境下的用户体验数据收集问题。该系统可以随业务系统一起部署到无网络的局点环境中，并支持通过离线手段回流用户体验数据。

### 1.1 核心目标

- 支持私有化部署，适应网络隔离环境
- 提供全面的前端监控能力
- 支持离线数据回流
- 提供实时监控大屏
- 轻量级接入，支持多种集成方式

## 2. 系统架构

### 2.1 整体架构图

```
+------------------+      +------------------+      +------------------+
|                  |      |                  |      |                  |
|  前端应用        +----->+  Uni-Tracker SDK +----->+  数据收集服务器   |
|                  |      |                  |      |                  |
+------------------+      +------------------+      +--------+---------+
                                                             |
                                                             v
                                                    +--------+---------+
                                                    |                  |
                                                    |  监控仪表盘       |
                                                    |                  |
                                                    +------------------+
```

### 2.2 组件说明

Uni-Tracker 系统由三个主要组件构成：

1. **SDK 组件**：集成到前端应用中，负责数据采集和上报
2. **服务器组件**：接收和存储跟踪数据
3. **仪表盘组件**：可视化展示监控数据

### 2.3 数据流向

1. 用户与前端应用交互
2. SDK 捕获用户行为、性能指标、错误信息和 API 请求
3. 数据通过批量方式发送到服务器
4. 服务器处理并存储数据
5. 仪表盘从服务器获取数据并展示

## 3. 技术实现细节

### 3.1 SDK 实现

#### 3.1.1 核心功能

- **初始化配置**：支持多种配置项，如应用ID、用户信息、环境等
- **自动采集**：页面访问、性能指标、JS错误、API请求
- **手动跟踪**：自定义事件跟踪
- **会话管理**：支持会话的开始和结束
- **数据批量发送**：减少网络请求次数
- **离线存储**：在网络不可用时本地存储数据

#### 3.1.2 技术选型

- 使用 TypeScript 开发，提供类型安全
- 无外部依赖，减小包体积
- 使用 Rollup 打包，支持多种模块格式（UMD、ESM）

#### 3.1.3 关键代码实现

```typescript
// 初始化配置
init(config: TrackerConfig): void {
  this.config = { ...this.defaultConfig, ...config };
  
  // 验证必要配置
  if (!this.config.id) {
    console.error('Uni-Tracker: 应用ID是必需的');
    return;
  }
  
  // 初始化存储
  this.initStorage();
  
  // 自动跟踪页面访问
  if (this.config.autoTrackPV) {
    this.trackPageView();
  }
  
  // 设置自动跟踪
  this.setupAutoTracking();
  
  // 启动定时发送
  this.startBatchSending();
}
```

### 3.2 服务器实现

#### 3.2.1 核心功能

- **数据接收**：提供API接口接收SDK上报的数据
- **数据存储**：将数据存储到数据库
- **数据导出**：支持数据导出功能，用于离线数据回流
- **数据导入**：支持数据导入功能，用于离线数据回流
- **数据聚合**：对原始数据进行聚合，用于仪表盘展示

#### 3.2.2 技术选型

- 使用 Node.js 和 Express 构建服务器
- 使用 SQLite 作为数据库，便于私有化部署
- 支持 JSON 格式的数据导入导出

#### 3.2.3 API 接口设计

| 接口路径 | 方法 | 描述 |
|---------|------|------|
| /api/collect | POST | 接收跟踪数据 |
| /api/export | GET | 导出数据 |
| /api/import | POST | 导入数据 |
| /api/stats | GET | 获取统计数据 |
| /api/health | GET | 健康检查 |

### 3.3 仪表盘实现

#### 3.3.1 核心功能

- **实时数据展示**：展示实时监控数据
- **历史数据查询**：支持历史数据查询和筛选
- **数据可视化**：使用图表展示数据
- **告警信息**：展示告警信息
- **数据导入导出**：提供UI界面进行数据导入导出

#### 3.3.2 技术选型

- 使用 React 构建前端界面
- 使用 Vite 作为构建工具
- 使用 ECharts 进行数据可视化
- 使用 Axios 进行数据请求

#### 3.3.3 界面设计

仪表盘主要包含以下几个部分：

1. **概览面板**：展示关键指标
2. **JS错误面板**：展示JS错误率和错误详情
3. **API请求面板**：展示API请求成功率和请求详情
4. **性能指标面板**：展示页面性能指标
5. **用户行为面板**：展示用户行为数据
6. **数据管理面板**：提供数据导入导出功能

## 4. 私有化部署方案

### 4.1 部署架构

```
+------------------+      +------------------+      +------------------+
|                  |      |                  |      |                  |
|  业务系统        +----->+  Uni-Tracker     +----->+  局点监控大屏     |
|                  |      |  (SDK+服务器)     |      |                  |
+------------------+      +------------------+      +------------------+
                                   |
                                   v
                          +--------+---------+
                          |                  |
                          |  离线数据包       |
                          |                  |
                          +--------+---------+
                                   |
                                   v
                          +--------+---------+
                          |                  |
                          |  中心监控系统     |
                          |                  |
                          +------------------+
```

### 4.2 部署步骤

1. **准备工作**
   - 确保局点环境满足系统要求
   - 准备部署包

2. **部署服务器**
   - 安装 Node.js 环境
   - 部署服务器组件
   - 配置数据库

3. **部署仪表盘**
   - 部署仪表盘静态文件
   - 配置仪表盘连接服务器

4. **集成 SDK**
   - 在业务系统中集成 SDK
   - 配置 SDK 连接服务器

### 4.3 离线数据回流

1. **数据导出**
   - 在局点仪表盘使用"导出数据"功能
   - 生成数据包文件

2. **数据传输**
   - 通过离线方式（如U盘）将数据包传输到中心环境

3. **数据导入**
   - 在中心环境仪表盘使用"导入数据"功能
   - 导入数据包

## 5. 监控指标详解

### 5.1 PV/UV 指标

- **定义**：PV（页面浏览量）和UV（独立访客数）
- **采集方式**：SDK自动采集页面访问信息
- **展示方式**：仪表盘展示今日PV/UV、同比昨日、趋势图等

### 5.2 页面性能指标

- **首次渲染时间**：从页面开始加载到首次渲染的时间
- **首屏时间**：从页面开始加载到首屏内容完全呈现的时间
- **DOM Ready时间**：从页面开始加载到DOM树构建完成的时间
- **资源加载时间**：页面资源（如JS、CSS、图片等）的加载时间

### 5.3 JS错误指标

- **JS错误率**：发生JS错误的PV占总PV的比例
- **错误分布**：按错误类型、页面、浏览器等维度统计错误分布
- **错误详情**：错误信息、堆栈、发生位置等

### 5.4 API请求指标

- **API请求成功率**：成功的API请求占总请求的比例
- **请求耗时**：API请求的响应时间
- **请求分布**：按API路径、方法、状态码等维度统计请求分布

### 5.5 自定义事件指标

- **事件计数**：自定义事件的触发次数
- **事件属性**：自定义事件的属性分布
- **事件转化率**：事件之间的转化关系

## 6. 使用指南

### 6.1 SDK 使用指南

#### 6.1.1 CDN 方式集成

```html
<!-- 引入 Uni-Tracker SDK -->
<script src="https://cdn.example.com/uni-tracker.min.js"></script>
<script>
  // 初始化 Uni-Tracker
  UniTracker.init({
    id: 'your-app-id',
    environment: 'production'
  });
</script>
```

#### 6.1.2 NPM 方式集成

```bash
# 安装 Uni-Tracker
npm install uni-tracker
```

```javascript
// 引入并初始化
import UniTracker from 'uni-tracker';

UniTracker.init({
  id: 'your-app-id',
  environment: 'production'
});
```

#### 6.1.3 常用 API

```javascript
// 跟踪自定义事件
UniTracker.track('button_click', {
  buttonId: 'submit-button',
  page: 'checkout'
});

// 手动跟踪页面访问
UniTracker.trackPageView();

// 设置用户信息
UniTracker.setUser({
  userId: 'user-123',
  username: 'John Doe'
});

// 开始会话
UniTracker.startSession();

// 结束会话
UniTracker.endSession();
```

### 6.2 服务器使用指南

#### 6.2.1 启动服务器

```bash
# 进入服务器目录
cd src/server

# 安装依赖
npm install

# 启动服务器
npm start
```

#### 6.2.2 配置服务器

服务器配置文件位于 `src/server/config.js`，可以配置以下选项：

- 端口号
- 数据库路径
- 日志级别
- CORS 设置

### 6.3 仪表盘使用指南

#### 6.3.1 启动仪表盘

```bash
# 进入仪表盘目录
cd src/dashboard

# 安装依赖
npm install

# 启动仪表盘
npm start
```

#### 6.3.2 使用仪表盘

- **查看实时数据**：在概览面板查看实时数据
- **查询历史数据**：使用时间选择器查询历史数据
- **导出数据**：使用"导出数据"按钮导出数据
- **导入数据**：使用"导入数据"按钮导入数据

## 7. 常见问题与解决方案

### 7.1 SDK 相关问题

1. **问题**：SDK 初始化失败
   **解决方案**：检查配置参数，确保应用ID已正确设置

2. **问题**：数据未上报
   **解决方案**：检查网络连接，确保服务器URL正确

3. **问题**：自动跟踪不生效
   **解决方案**：检查配置中的自动跟踪选项是否已启用

### 7.2 服务器相关问题

1. **问题**：服务器启动失败
   **解决方案**：检查端口是否被占用，确保依赖已正确安装

2. **问题**：数据库连接失败
   **解决方案**：检查数据库路径和权限

3. **问题**：API请求返回错误
   **解决方案**：检查请求参数和格式

### 7.3 仪表盘相关问题

1. **问题**：仪表盘无法显示数据
   **解决方案**：检查与服务器的连接，确保数据已正确收集

2. **问题**：图表显示异常
   **解决方案**：检查数据格式，尝试清除浏览器缓存

3. **问题**：导入数据失败
   **解决方案**：检查数据包格式，确保与系统兼容

## 8. 未来规划

### 8.1 短期规划

- 增强错误诊断能力
- 优化性能指标采集
- 改进数据可视化展示
- 增加更多自定义配置选项

### 8.2 中期规划

- 支持更多前端框架的集成
- 增加用户行为回放功能
- 增强数据分析能力
- 优化离线数据回流机制

### 8.3 长期规划

- 构建完整的APM（应用性能监控）系统
- 增加智能告警和异常检测
- 支持更多部署方式
- 增加机器学习分析能力

## 9. 附录

### 9.1 配置项参考

| 配置项 | 类型 | 默认值 | 描述 |
|-------|------|-------|------|
| id | string | - | 应用ID（必需） |
| userId | string | - | 用户ID |
| username | string | - | 用户名 |
| environment | string | 'production' | 环境（如development、production） |
| version | string | - | 应用版本 |
| autoTrackPV | boolean | true | 是否自动跟踪页面访问 |
| enableSPA | boolean | false | 是否启用单页应用支持 |
| maxBatchSize | number | 10 | 批量发送的最大事件数 |
| sendInterval | number | 5000 | 批量发送的时间间隔（毫秒） |
| serverUrl | string | 'http://localhost:3000/api/collect' | 数据上报服务器URL |

### 9.2 API 参考

#### 9.2.1 SDK API

```javascript
// 初始化
UniTracker.init(config: TrackerConfig): void

// 跟踪自定义事件
UniTracker.track(eventName: string, params?: Record<string, any>): void

// 跟踪页面访问
UniTracker.trackPageView(url?: string): void

// 设置用户信息
UniTracker.setUser(userInfo: { userId?: string, username?: string }): void

// 开始会话
UniTracker.startSession(): void

// 结束会话
UniTracker.endSession(): void
```

#### 9.2.2 服务器 API

```
// 接收跟踪数据
POST /api/collect
Content-Type: application/json
Body: TrackingData | TrackingData[]

// 导出数据
GET /api/export?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD

// 导入数据
POST /api/import
Content-Type: application/json
Body: { data: TrackingData[] }

// 获取统计数据
GET /api/stats?type=pv|error|api|performance&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
```

### 9.3 数据结构参考

#### 9.3.1 事件数据

```typescript
interface EventData {
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
```

#### 9.3.2 性能数据

```typescript
interface PerformanceData {
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
```

#### 9.3.3 错误数据

```typescript
interface ErrorData {
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
```

#### 9.3.4 API数据

```typescript
interface ApiData {
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
```
