/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { CrossModelSharedServices } from './cross-model-module';

export class ClientLogger {
   constructor(protected services: CrossModelSharedServices) {}

   /**
    * Show an error message.
    *
    * @param message The message to show.
    */
   error(message: string): void {
      this.services.lsp.Connection?.console.error(message);
   }

   /**
    * Show a warning message.
    *
    * @param message The message to show.
    */
   warn(message: string): void {
      this.services.lsp.Connection?.console.warn(message);
   }

   /**
    * Show an information message.
    *
    * @param message The message to show.
    */
   info(message: string): void {
      this.services.lsp.Connection?.console.info(message);
   }

   /**
    * Log a message.
    *
    * @param message The message to log.
    */
   log(message: string): void {
      this.services.lsp.Connection?.console.log(message);
   }
}
