/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { PORT_FOLDER } from '@crossbreeze/protocol';
import * as fs from 'fs';
import { AddressInfo } from 'net';
import { join } from 'path';
import { URI } from 'vscode-uri';
import { CrossModelServices, CrossModelSharedServices } from './language-server/cross-model-module.js';

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

export function writePortFileToWorkspace(workspace: URI, fileName: string, address: AddressInfo | string | null): void {
   if (address && !(typeof address === 'string')) {
      const portFolder = join(workspace.fsPath, PORT_FOLDER);
      fs.mkdirSync(portFolder, { recursive: true });
      fs.writeFileSync(join(portFolder, fileName), address.port.toString());
   } else {
      console.error(
         'Could not write file ' + fileName + ' to workspace as no workspace is set or no port was provided.',
         fileName,
         address
      );
   }
}
