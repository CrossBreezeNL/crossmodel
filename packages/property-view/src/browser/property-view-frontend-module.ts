/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { CrossModelWidgetOptions } from '@crossbreezenl/core/lib/browser';
import { ContainerModule } from '@theia/core/shared/inversify';
import { PropertyDataService } from '@theia/property-view/lib/browser/property-data-service';
import { PropertyViewWidget } from '@theia/property-view/lib/browser/property-view-widget';
import { PropertyViewWidgetProvider } from '@theia/property-view/lib/browser/property-view-widget-provider';
import '../../style/property-view.css';
import { ModelDataService } from './model-data-service';
import { ModelPropertyWidget } from './model-property-widget';
import { ModelPropertyWidgetProvider } from './model-property-widget-provider';
import { SaveablePropertyViewWidget } from './saveable-property-view-widget';

export default new ContainerModule((bind, _unbind, _isBound, rebind) => {
   // To make the property widget working
   bind(CrossModelWidgetOptions).toConstantValue({ clientId: 'model-property-view', widgetId: 'model-property-view' });
   bind(ModelPropertyWidget).toSelf();
   bind(ModelDataService).toSelf().inSingletonScope();
   bind(PropertyDataService).toService(ModelDataService);
   bind(PropertyViewWidgetProvider).to(ModelPropertyWidgetProvider).inSingletonScope();
   rebind(PropertyViewWidget).to(SaveablePropertyViewWidget);
});
