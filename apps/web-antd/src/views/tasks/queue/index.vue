<script lang="ts" setup>
import { Page } from '@vben/common-ui';

import QueueStatusPanel from './components/QueueStatusPanel.vue';

defineOptions({ name: 'TaskQueueStatus' });
</script>

<template>
  <Page auto-content-height>
    <QueueStatusPanel />
  </Page>
</template>
