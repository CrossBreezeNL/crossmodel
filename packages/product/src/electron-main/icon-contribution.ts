/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { ElectronMainApplication, ElectronMainApplicationContribution } from '@theia/core/lib/electron-main/electron-main-application';
import { injectable } from '@theia/core/shared/inversify';
import * as os from 'os';
import * as path from 'path';

@injectable()
export class IconContribution implements ElectronMainApplicationContribution {
    onStart(application: ElectronMainApplication): void {
        if (os.platform() === 'linux') {
            const windowOptions = application.config.electron.windowOptions;
            if (windowOptions && windowOptions.icon === undefined) {
                // The window image is undefined. If the executable has an image set, this is used as a fallback.
                // Since AppImage does not support this anymore via electron-builder, set an image for the linux platform.
                windowOptions.icon = path.join(__dirname, '../../resources/icons/icon_64x64.png');
            }
        }
    }
}
