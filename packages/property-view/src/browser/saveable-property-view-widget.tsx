/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

import { DelegatingSaveable, Saveable, SaveableSource } from '@theia/core/lib/browser';
import { injectable } from '@theia/core/shared/inversify';
import { PropertyViewContentWidget } from '@theia/property-view/lib/browser/property-view-content-widget';
import { PropertyViewWidget } from '@theia/property-view/lib/browser/property-view-widget';

@injectable()
export class SaveablePropertyViewWidget extends PropertyViewWidget implements SaveableSource {
   saveable: Saveable = new DelegatingSaveable();

   protected override attachContentWidget(newContentWidget: PropertyViewContentWidget): void {
      super.attachContentWidget(newContentWidget);
      this.saveable = Saveable.get(newContentWidget) ?? new DelegatingSaveable();
   }
}
