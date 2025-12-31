// Read more about creating fixtures https://playwright.dev/docs/test-fixtures
import { ElectronApplication, test as baseTest, TraceMode } from '@playwright/test';
import path from 'path';

import {
  bundleType,
  cwd,
  executablePath,
  mainPath,
  randomDataPath,
} from './paths';

interface EnvOptions {
  RESTPIE_DATA_PATH: string;
  RESTPIE_API_URL: string;
  RESTPIE_APP_WEBSITE_URL: string;
  RESTPIE_GITHUB_API_URL: string;
  RESTPIE_GITLAB_API_URL: string;
  RESTPIE_UPDATES_URL: string;
}

export const test = baseTest.extend<{
  app: ElectronApplication;
}>({
  app: async ({ playwright, trace }, use, testInfo) => {
    const webServerUrl = testInfo.config.webServer?.url;

    const options: EnvOptions = {
      RESTPIE_DATA_PATH: randomDataPath(),
      RESTPIE_API_URL: webServerUrl + '/api',
      RESTPIE_APP_WEBSITE_URL: webServerUrl + '/website',
      RESTPIE_GITHUB_API_URL: webServerUrl + '/github-api/graphql',
      RESTPIE_GITLAB_API_URL: webServerUrl + '/gitlab-api',
      RESTPIE_UPDATES_URL: webServerUrl || 'https://archgpt.dev/restpie',
    };

    const electronApp = await playwright._electron.launch({
      cwd,
      executablePath,
      args: bundleType() === 'package' ? [] : [mainPath],
      env: {
        ...process.env,
        ...options,
        PLAYWRIGHT: 'true',
      },
    });

    const appContext = electronApp.context();
    const traceMode: TraceMode = typeof trace === 'string' ? trace as TraceMode : trace.mode;

    const defaultTraceOptions = { screenshots: true, snapshots: true, sources: true };
    const traceOptions = typeof trace === 'string' ? defaultTraceOptions : { ...defaultTraceOptions, ...trace, mode: undefined };
    const captureTrace = (traceMode === 'on' || traceMode === 'retain-on-failure' || (traceMode === 'on-first-retry' && testInfo.retry === 1));

    if (captureTrace) {
      await appContext.tracing.start(traceOptions);
    }

    await use(electronApp);

    if (captureTrace) {
      await appContext.tracing.stop({
        path: path.join(testInfo.outputDir, 'trace.zip'),
      });
    }

    await electronApp.close();
  },
  page: async ({ app }, use) => {
    const page = await app.firstWindow();

    await page.waitForLoadState();

    await use(page);
  },
});
