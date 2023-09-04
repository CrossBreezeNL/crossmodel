/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { ContainerModule } from '@theia/core/shared/inversify';
import { PropertyViewWidgetProvider } from '@theia/property-view/lib/browser/property-view-widget-provider';
import { ModelPropertyWidgetProvider } from './model-property-widget-provider';
import { PropertyDataService } from '@theia/property-view/lib/browser/property-data-service';
import { ModelDataService } from '../common/model-data-service';
import '../../src/style/property-view.css';
import { ModelPropertyWidget } from './model-property-widget';

export default new ContainerModule((bind, _unbind, _isBound, rebind) => {
    // To make the property widget working
    bind(ModelPropertyWidget).toSelf();
    bind(ModelDataService).toSelf().inSingletonScope();
    bind(PropertyDataService).toService(ModelDataService);
    bind(PropertyViewWidgetProvider).to(ModelPropertyWidgetProvider).inSingletonScope();
});
