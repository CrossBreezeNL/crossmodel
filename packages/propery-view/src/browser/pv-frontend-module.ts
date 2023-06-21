/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { ContainerModule } from '@theia/core/shared/inversify';
import { PropertyViewWidgetProvider } from '@theia/property-view/lib/browser/property-view-widget-provider';
import { AttributePropertyWidgetProvider } from './attribute-property-widget';
import { PropertyDataService } from '@theia/property-view/lib/browser/property-data-service';
import { AttributeDataService } from '../common/attribute-data-service';
import { WebSocketConnectionProvider } from '@theia/core/lib/browser';
import { AttributePropertyServer } from '../node/property-server';
import { AttributeFrontEndClient, AttributeFrontEndClientImpl } from '../common/pv-frontend-client';

export default new ContainerModule((bind, _unbind, _isBound, rebind) => {
    // To make the property widget working
    bind(AttributeDataService).toSelf().inSingletonScope();
    bind(PropertyDataService).toService(AttributeDataService);
    bind(PropertyViewWidgetProvider).to(AttributePropertyWidgetProvider).inSingletonScope();

    bind(AttributeFrontEndClientImpl).toSelf().inSingletonScope();
    bind(AttributeFrontEndClient).toService(AttributeFrontEndClientImpl);

    bind(AttributePropertyServer)
        .toDynamicValue(ctx => {
            const connection = ctx.container.get(WebSocketConnectionProvider);
            const dataService: AttributeFrontEndClient = ctx.container.get(AttributeFrontEndClient);

            return connection.createProxy<AttributePropertyServer>('/services/property-view', dataService);
        })
        .inSingletonScope();
});
