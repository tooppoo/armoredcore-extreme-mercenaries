import { test as teardown } from '@playwright/test';

teardown('setup db', async () => {
  console.log('teardown');
});
