/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { PlaywrightWorkerArgs } from '@playwright/test';
import { TheiaApp, TheiaAppFactory, TheiaAppLoader, TheiaPlaywrightTestConfig } from '@theia/playwright';
import { CrossModelWorkspace } from './crossmodel-workspace';

export class CrossModelApp extends TheiaApp {
   public static async load(
      args: TheiaPlaywrightTestConfig & PlaywrightWorkerArgs,
      workspace: CrossModelWorkspace
   ): Promise<CrossModelApp> {
      return TheiaAppLoader.load(args, workspace, CrossModelApp as TheiaAppFactory<CrossModelApp>);
   }
}
