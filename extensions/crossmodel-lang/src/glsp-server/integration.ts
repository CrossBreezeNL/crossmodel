/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import * as fs from 'fs';
import { AddressInfo } from 'net';
import { join } from 'path';
import { CrossModelServices, CrossModelSharedServices } from '../language-server/cross-model-module';

/**
 * Language services required in GLSP.
 */
export const CrossModelLSPServices = Symbol('CrossModelLSPServices');
export interface CrossModelLSPServices {
   /** Language services shared across all languages. */
   shared: CrossModelSharedServices;
   /** CrossModel language-specific services. */
   language: CrossModelServices;
}

export function writePortFileToWorkspace(fileName: string, address: AddressInfo | string | null): void {
   if (process.env.WORKSPACE_PATH && address && !(typeof address === 'string')) {
      fs.writeFileSync(join(process.env.WORKSPACE_PATH, fileName), address.port.toString());
   } else {
      console.error(
         'Could not write file ' + fileName + ' to workspace as no workspace is set or no port was provided.',
         fileName,
         address
      );
   }
}
