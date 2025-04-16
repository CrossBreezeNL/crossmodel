/********************************************************************************
 * Copyright (c) 2025 CrossBreeze.
 ********************************************************************************/
import { ModelService } from '@crossbreezenl/model-service/lib/common';
import { quote, toId } from '@crossbreezenl/protocol';
import { ToolProvider, ToolRequest } from '@theia/ai-core';
import { URI } from '@theia/core';
import { inject, injectable } from '@theia/core/shared/inversify';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { WorkspaceService } from '@theia/workspace/lib/browser';

const INITIAL_ENTITY_CONTENT = `entity:
    id: \${id}
    name: \${name}
`;

@injectable()
export class CreateLogicalEntityToolProvider implements ToolProvider {
   static ID = 'xm-create-logical-entity-tool';

   @inject(WorkspaceService)
   protected workspaceService: WorkspaceService;

   @inject(FileService)
   protected fileService: FileService;

   @inject(ModelService) modelService: ModelService;

   async getWorkspaceRoot(): Promise<URI> {
      const wsRoots = await this.workspaceService.roots;
      if (wsRoots.length === 0) {
         throw new Error('No workspace has been opened yet');
      }
      return wsRoots[0].resource;
   }

   private async getProjectFolder(): Promise<URI> {
      const workspaceRootUri = await this.getWorkspaceRoot();
      const stat = await this.fileService.resolve(workspaceRootUri);

      if (stat && stat.isDirectory && stat.children) {
         for (const child of stat.children) {
            if (child.isDirectory) {
               const childStat = await this.fileService.resolve(child.resource);
               // If the directory contains a package.json in the root, it's probably a data model.
               if (childStat.children?.find(c => c.name === 'package.json') !== undefined) {
                  return child.resource;
               }
            }
         }
      }
      throw new Error('No project exists in the workspace');
   }

   private async createLogicalEntity(args: any): Promise<void> {
      if (args.length === 0 || args.entity_name === undefined) {
         throw new Error('No entity name provided');
      }
      const newEntityName = args.entity_name;
      this.getProjectFolder().then(projectFolderUri => {
         const newEntityFilePath: URI = projectFolderUri.resolve(newEntityName + '.entity.cm');
         return this.fileService.create(
            newEntityFilePath,
            INITIAL_ENTITY_CONTENT.replace(/\$\{name\}/gi, quote(newEntityName)).replace(/\$\{id\}/gi, toId(newEntityName))
         );
      });
   }

   getTool(): ToolRequest {
      return {
         id: CreateLogicalEntityToolProvider.ID,
         name: CreateLogicalEntityToolProvider.ID,
         description: 'Create an entity in a logical data model',
         parameters: {
            type: 'object',
            properties: {
               entity_name: {
                  type: 'string',
                  description: 'The name of the entity to create'
               }
            }
         },
         handler: args => this.createLogicalEntity(JSON.parse(args) || '{}')
      };
   }
}
