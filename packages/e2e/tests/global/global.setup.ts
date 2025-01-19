import { test as setup } from '@playwright/test';
import { execSync } from 'node:child_process';

setup('setup db', async () => {
  const frontCommand = 'npm run --prefix ../../ front'
  execSync(`${frontCommand} -- migration:test`);
  execSync(`${frontCommand} -- db-execute:test -- --file ${__dirname}/global.setup.cleanup.sql`);
});
