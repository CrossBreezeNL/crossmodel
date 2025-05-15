/********************************************************************************
 * Copyright (c) 2025 CrossBreeze.
 ********************************************************************************/
import { ModelService } from '@crossbreezenl/model-service/lib/common';
import { LogicalAttribute, OpenModelArgs, SaveModelArgs } from '@crossbreezenl/protocol';
import { ToolProvider, ToolRequest } from '@theia/ai-core';
import { CommandRegistry, URI } from '@theia/core';
import { inject, injectable } from '@theia/core/shared/inversify';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { WorkspaceService } from '@theia/workspace/lib/browser';

@injectable()
export class CreateLogicalEntityToolProvider implements ToolProvider {
   static ID = 'xm-create-logical-entity-tool';

   @inject(WorkspaceService)
   protected workspaceService: WorkspaceService;

   @inject(FileService)
   protected fileService: FileService;

   @inject(ModelService) modelService: ModelService;

   @inject(CommandRegistry) commandRegistry: CommandRegistry;

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
      if (args.length === 0 || args.name === undefined) {
         throw new Error('No entity name provided');
      }
      const newEntityName = args.name;
      const projectFolderUri = await this.getProjectFolder();
      // Execute the command to create a new entity
      const entityUri = await this.commandRegistry.executeCommand('crossmodel.logical.entity.create', projectFolderUri, {
         name: newEntityName,
         description: args.description
      });
      // If the entity is created, create the attributes.
      if (entityUri !== undefined) {
         const newDocument = await this.modelService.open(<OpenModelArgs>{ uri: entityUri!.toString() });
         if (newDocument === undefined || newDocument.root === undefined) {
            throw new Error('Failed to find logical entity document');
         }
         const entity = newDocument.root.entity;
         // Push the attributes to the new entity
         args.attributes.forEach((attribute: any) => {
            // Create a plain object that matches the LogicalAttribute type
            const newAttribute: LogicalAttribute = {
               $type: 'LogicalAttribute',
               $globalId: entity!.$globalId.concat(attribute.id),
               id: attribute.id,
               name: attribute.name,
               description: attribute.description
            };
            entity?.attributes.push(newAttribute);
         });
         await this.modelService.save(<SaveModelArgs>{ uri: entityUri!.toString(), model: newDocument.root });
         // this.commandRegistry.executeCommand(CommonCommands.SAVE.id);
      }
   }

   getTool(): ToolRequest {
      return {
         id: CreateLogicalEntityToolProvider.ID,
         name: 'create-logical-entity',
         description: 'Create an entity in a logical data model',
         parameters: {
            type: 'object',
            properties: {
               name: {
                  type: 'string',
                  description: 'The name of the entity to create'
               },
               description: {
                  type: 'string',
                  description: 'The description of the entity to create'
               },
               attributes: {
                  type: 'array',
                  items: {
                     type: 'object',
                     properties: {
                        id: {
                           type: 'string',
                           description: 'The ID of the attribute (Can only contain letters, numbers, and underscores)'
                        },
                        name: {
                           type: 'string',
                           description: 'The name of the attribute'
                        },
                        description: {
                           type: 'string',
                           description: 'The description of the attribute'
                        }
                     }
                  }
               }
            }
         },
         handler: args => this.createLogicalEntity(JSON.parse(args) || '{}')
      };
   }
}
