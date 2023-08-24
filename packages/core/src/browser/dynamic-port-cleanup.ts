/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { GLSP_PORT_FILE, MODELSERVER_PORT_FILE, PORT_FOLDER } from '@crossbreeze/protocol';
import { URI } from '@theia/core';
import { FrontendApplication, FrontendApplicationContribution } from '@theia/core/lib/browser';
import { inject, injectable } from '@theia/core/shared/inversify';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { FileStat } from '@theia/filesystem/lib/common/files';
import { WorkspaceService } from '@theia/workspace/lib/browser/workspace-service';

/**
 * A class that deletes all .port files that are used to configure the port for external servers.
 * To be extra safe we delete the files on startup (before the new configuration files are written) and when shutting down the application.
 */
@injectable()
export class DynamicPortCleanup implements FrontendApplicationContribution {
    @inject(WorkspaceService) protected readonly workspaceService: WorkspaceService;
    @inject(FileService) protected readonly fileService: FileService;

    async onStart(_app: FrontendApplication): Promise<void> {
        this.workspaceService.onWorkspaceChanged(workspaces => workspaces.forEach(ws => this.cleanupDynamicPorts(ws)));
        await Promise.all(this.workspaceService.tryGetRoots().map(ws => this.cleanupDynamicPorts(ws)));
    }

    onStop(_app: FrontendApplication): void {
        this.workspaceService.tryGetRoots().map(ws => this.cleanupDynamicPorts(ws));
    }

    async cleanupDynamicPorts(workspace: FileStat, portFiles = [GLSP_PORT_FILE, MODELSERVER_PORT_FILE]): Promise<void> {
        for (const portFile of portFiles) {
            const portFileURI = URI.fromFilePath(workspace.resource.path.join(PORT_FOLDER, portFile).fsPath());
            if (await this.fileService.exists(portFileURI)) {
                await this.fileService.delete(portFileURI);
            }
        }
    }
}
