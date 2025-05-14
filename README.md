# uni-tracker

## 简介 (Introduction)
uni-tracker 是一个支持私有化部署的前端埋点方案，专为需要在无网络环境下追踪用户行为的业务系统设计。它允许埋点系统随业务系统一起部署到网络隔离的局点环境中，并通过离线手段回流用户体验数据。

## 目标 (Objectives)
- 提供轻量级、易于集成的前端埋点解决方案
- 支持私有化部署到网络隔离环境
- 实时监控用户行为和系统性能
- 支持离线数据收集和回流
- 提供实时监控大屏展示局点使用情况

## 系统架构 (System Architecture)
### 整体架构
uni-tracker 由以下几个核心组件组成：
- **采集SDK**：嵌入到前端应用中的轻量级JavaScript库
- **数据处理服务**：接收、处理和存储埋点数据
- **可视化大屏**：展示实时监控数据和分析报告
- **数据同步工具**：支持离线环境下的数据回流

### 数据流
1. 用户与前端应用交互
2. SDK捕获用户行为和性能数据
3. 数据发送到本地数据处理服务
4. 数据处理服务存储和分析数据
5. 可视化大屏展示实时数据
6. 数据同步工具将数据回流到中心系统（可选）

## 接入方式 (Integration Methods)
### CDN方式
```html
<script src="https://cdn.example.com/uni-tracker.min.js"></script>
<script>
  UniTracker.init({
    id: 'your-app-id',
    userId: 'user-id',
    username: 'username',
    environment: 'production',
    version: '1.0.0'
  });
</script>
```

### NPM包方式
```bash
npm install uni-tracker
```

```javascript
import UniTracker from 'uni-tracker';

UniTracker.init({
  id: 'your-app-id',
  userId: 'user-id',
  username: 'username',
  environment: 'production',
  version: '1.0.0'
});
```

## 监控能力 (Monitoring Capabilities)
### PV/UV统计
自动捕获页面访问量(PV)和独立访问用户数(UV)，支持按时间、地域等维度分析。

### 页面性能监控
监控关键性能指标：
- 首次渲染时间
- 首屏时间
- DOM Ready时间
- 资源加载时间
- 页面完全加载时间

### JS错误诊断
- 自动捕获JavaScript运行时错误
- 记录错误堆栈和上下文信息
- 关联用户行为回溯，帮助快速定位问题

### API请求监控
- 监控API请求成功率
- 记录请求响应时间
- 捕获请求错误和异常状态

### 用户行为追踪
- 记录用户点击、滚动等交互行为
- 支持用户行为回放
- 构建用户行为路径分析

### 自定义埋点
```javascript
// 记录按钮点击事件
UniTracker.track('button_click', {
  buttonId: 'submit-btn',
  pageSection: 'checkout',
  customData: {
    productId: '12345',
    price: 99.99
  }
});
```

## 实时监控大屏 (Real-time Dashboard)
每个局点部署环境都配备实时监控大屏，展示以下关键指标：

### JS错误率
- 显示JavaScript错误发生比例
- 与昨日均值对比
- 最近1小时错误率趋势图
- 页面错误率排行

### 告警信息
- 显示最近24小时告警数量
- 展示详细告警信息和级别

### PV/UV数据
- 今日PV和UV总量
- 与昨日同比变化
- 最近1小时PV/UV趋势图
- 按地域分布的PV/UV统计
- 高访问量Top 5服务

### API请求成功率
- API请求成功率指标
- 与昨日均值对比
- 最近1小时成功率趋势图
- API成功率排行

### 访问速度
- 首次渲染耗时统计
- 与昨日均值对比
- 最近1小时访问速度趋势图
- 低访问速度Top 5服务

## 私有化部署 (Private Deployment)
### 系统要求
- Node.js 14+
- MongoDB 4.4+
- 至少2GB RAM和10GB存储空间

### 部署步骤
1. 下载最新版本的uni-tracker服务端
2. 配置环境变量和数据库连接
3. 启动数据处理服务
4. 配置并启动可视化大屏服务
5. 集成SDK到前端应用

### Docker部署
提供Docker镜像和docker-compose配置，简化部署流程：
```bash
docker-compose up -d
```

## 离线数据回流 (Offline Data Synchronization)
### 数据存储
在局点环境中，所有埋点数据存储在本地数据库，确保在无网络环境下正常工作。

### 数据导出
提供命令行工具导出指定时间范围的数据：
```bash
uni-tracker-export --from="2023-01-01" --to="2023-01-31" --output="data.json"
```

### 数据导入
支持将导出的数据导入到中心系统：
```bash
uni-tracker-import --file="data.json" --target="central-system"
```

## 配置选项 (Configuration Options)
### SDK配置
| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| id | string | 是 | 应用唯一标识 |
| userId | string | 否 | 用户ID |
| username | string | 否 | 用户名 |
| environment | string | 否 | 环境(dev/test/prod) |
| version | string | 否 | 应用版本号 |
| autoTrackPV | boolean | 否 | 是否自动追踪PV |
| enableSPA | boolean | 否 | 是否为单页应用 |
| maxBatchSize | number | 否 | 批量发送数据的最大条数 |
| sendInterval | number | 否 | 发送数据的时间间隔(ms) |

### 服务端配置
支持通过环境变量或配置文件设置服务端参数：
- 数据库连接信息
- 数据保留策略
- 告警阈值
- 数据同步设置

## API参考 (API Reference)
### 核心方法
- `UniTracker.init(config)`: 初始化SDK
- `UniTracker.track(eventName, params)`: 记录自定义事件
- `UniTracker.setUser(userInfo)`: 设置用户信息
- `UniTracker.startSession()`: 开始新会话
- `UniTracker.endSession()`: 结束当前会话

### 高级功能
- `UniTracker.enableAutoTrack()`: 启用自动行为追踪
- `UniTracker.disableAutoTrack()`: 禁用自动行为追踪
- `UniTracker.setCustomDimension(key, value)`: 设置自定义维度

## 示例 (Examples)
### React应用集成
```jsx
import React, { useEffect } from 'react';
import UniTracker from 'uni-tracker';

function App() {
  useEffect(() => {
    UniTracker.init({
      id: 'react-app',
      environment: process.env.NODE_ENV,
      version: '1.0.0',
      enableSPA: true
    });
    
    return () => {
      UniTracker.endSession();
    };
  }, []);
  
  return (
    <div className="App">
      {/* 应用内容 */}
    </div>
  );
}
```

### Vue应用集成
```javascript
// main.js
import { createApp } from 'vue';
import App from './App.vue';
import UniTracker from 'uni-tracker';

UniTracker.init({
  id: 'vue-app',
  environment: process.env.NODE_ENV,
  version: '1.0.0',
  enableSPA: true
});

createApp(App).mount('#app');
```

## 参考资料 (References)
- [前端监控最佳实践](https://example.com/best-practices)
- [Web性能监控指标](https://example.com/performance-metrics)
- [用户行为分析方法](https://example.com/user-behavior-analysis)

## 贡献指南 (Contributing)
欢迎贡献代码或提出建议，请参阅[贡献指南](CONTRIBUTING.md)了解详情。

## 许可证 (License)
本项目采用MIT许可证，详见[LICENSE](LICENSE)文件。
