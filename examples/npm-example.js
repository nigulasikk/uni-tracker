

import UniTracker from 'uni-tracker';

UniTracker.init({
  id: 'my-app-id',
  environment: 'production',
  userId: 'user-123',
  username: 'John Doe',
  autoTrackPV: true,
  enableSPA: true,
  maxBatchSize: 10,
  sendInterval: 5000,
  serverUrl: 'https://api.example.com/collect'
});

function trackButtonClick(buttonId) {
  UniTracker.track('button_click', {
    buttonId,
    page: window.location.pathname
  });
}

function setUserInfo(userId, username) {
  UniTracker.setUser({
    userId,
    username
  });
}

function trackPageView() {
  UniTracker.trackPageView();
}

function startSession() {
  UniTracker.startSession();
}

function endSession() {
  UniTracker.endSession();
}

/*
import React, { useEffect } from 'react';
import UniTracker from 'uni-tracker';

function App() {
  useEffect(() => {
    UniTracker.init({
      id: 'my-react-app',
      environment: process.env.NODE_ENV
    });

    return () => {
      UniTracker.endSession();
    };
  }, []);

  const handleButtonClick = () => {
    UniTracker.track('button_click', {
      component: 'App',
      action: 'Submit Form'
    });
  };

  return (
    <div>
      <h1>Uni-Tracker React 示例</h1>
      <button onClick={handleButtonClick}>跟踪点击</button>
    </div>
  );
}

export default App;
*/

/*
<template>
  <div>
    <h1>Uni-Tracker Vue 示例</h1>
    <button @click="handleButtonClick">跟踪点击</button>
  </div>
</template>

<script>
import UniTracker from 'uni-tracker';

export default {
  name: 'App',
  mounted() {
    UniTracker.init({
      id: 'my-vue-app',
      environment: process.env.NODE_ENV
    });
  },
  beforeDestroy() {
    UniTracker.endSession();
  },
  methods: {
    handleButtonClick() {
      UniTracker.track('button_click', {
        component: 'App',
        action: 'Submit Form'
      });
    }
  }
};
</script>
*/
