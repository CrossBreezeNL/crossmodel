/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { ContainerModule } from '@theia/core/shared/inversify';
import { PropertyViewWidgetProvider } from '@theia/property-view/lib/browser/property-view-widget-provider';
import { AttributePropertyWidgetProvider } from './attribute-property-widget';
import { PropertyDataService } from '@theia/property-view/lib/browser/property-data-service';
import { AttributeDataService } from '../common/attribute-data-service';

export default new ContainerModule((bind, _unbind, _isBound, rebind) => {
    // To make the property widget working
    bind(AttributeDataService).toSelf().inSingletonScope();
    bind(PropertyDataService).toService(AttributeDataService);
    bind(PropertyViewWidgetProvider).to(AttributePropertyWidgetProvider).inSingletonScope();
});
