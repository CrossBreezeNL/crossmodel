/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { ContainerModule } from '@theia/core/shared/inversify';
import { PropertyDataService } from '@theia/property-view/lib/browser/property-data-service';
import { PropertyViewWidgetProvider } from '@theia/property-view/lib/browser/property-view-widget-provider';
import '../../style/property-view.css';
import { ModelDataService } from './model-data-service';
import { ModelPropertyWidget } from './model-property-widget';
import { ModelPropertyWidgetProvider } from './model-property-widget-provider';

export default new ContainerModule((bind, _unbind, _isBound, rebind) => {
   // To make the property widget working
   bind(ModelPropertyWidget).toSelf();
   bind(ModelDataService).toSelf().inSingletonScope();
   bind(PropertyDataService).toService(ModelDataService);
   bind(PropertyViewWidgetProvider).to(ModelPropertyWidgetProvider).inSingletonScope();
});
