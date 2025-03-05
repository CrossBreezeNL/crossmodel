/** ******************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { ModelService } from '@crossbreeze/model-service/lib/common';
import {
   MappingType,
   ModelFileExtensions,
   ModelStructure,
   PackageMemberPermissions,
   TargetObjectType,
   isMemberPermittedInPackage,
   quote,
   toId,
   toPascal
} from '@crossbreeze/protocol';
import { Command, CommandContribution, CommandRegistry, MenuContribution, MenuModelRegistry, URI, UriSelection, nls } from '@theia/core';
import { CommonMenus, DialogError, open } from '@theia/core/lib/browser';
import { TabBarToolbarRegistry } from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { inject, injectable } from '@theia/core/shared/inversify';
import { EditorContextMenu } from '@theia/editor/lib/browser';
import { FileStat } from '@theia/filesystem/lib/common/files';
import { FileNavigatorContribution, NavigatorContextMenu } from '@theia/navigator/lib/browser/navigator-contribution';
import { WorkspaceCommandContribution } from '@theia/workspace/lib/browser/workspace-commands';
import { WorkspaceInputDialog, WorkspaceInputDialogProps } from '@theia/workspace/lib/browser/workspace-input-dialog';
import * as yaml from 'yaml';
import { getNewDataModelOptions } from './new-data-model-dialog';

const NEW_ELEMENT_NAV_MENU = [...NavigatorContextMenu.NAVIGATION, '0_new'];
const NEW_ELEMENT_MAIN_MENU = [...CommonMenus.FILE, '0_new'];

interface NewElementTemplate extends Command {
   label: string;
   toUri: (parent: URI, name: string) => URI;
   memberType: string;
   content: string | ((options: { name: string }) => string);
}

const INITIAL_ENTITY_CONTENT = `entity:
    id: \${id}
    name: \${name}`;

const INITIAL_RELATIONSHIP_CONTENT = `relationship:
    id: \${id}
    parent:
    child:
    type: "1:1"`;

const INITIAL_DIAGRAM_CONTENT = `systemDiagram:
    id: \${id}
    name: \${name}`;

const INITIAL_MAPPING_CONTENT = `mapping:
   id: \${id}
   sources:
      - id: Source
   target:
      entity:
      mappings: `;

const TEMPLATE_CATEGORY = 'New Element';

const NEW_ELEMENT_TEMPLATES: NewElementTemplate[] = [
   {
      id: 'crossbreeze.new.entity',
      label: 'Entity',
      memberType: 'Entity',
      toUri: joinWithExt(ModelFileExtensions.Entity, join),
      category: TEMPLATE_CATEGORY,
      iconClass: ModelStructure.Entity.ICON_CLASS,
      content: ({ name }) =>
         INITIAL_ENTITY_CONTENT.replace(/\$\{name\}/gi, quote(toPascal(name))).replace(/\$\{id\}/gi, toId(toPascal(name)))
   },
   {
      id: 'crossbreeze.new.relationship',
      label: 'Relationship',
      memberType: 'Relationship',
      toUri: joinWithExt(ModelFileExtensions.Relationship, join),
      category: TEMPLATE_CATEGORY,
      iconClass: ModelStructure.Relationship.ICON_CLASS,
      content: ({ name }) =>
         INITIAL_RELATIONSHIP_CONTENT.replace(/\$\{name\}/gi, quote(toPascal(name))).replace(/\$\{id\}/gi, toId(toPascal(name)))
   },
   {
      id: 'crossbreeze.new.system-diagram',
      label: 'System Diagram',
      memberType: 'SystemDiagram',
      toUri: joinWithExt(ModelFileExtensions.SystemDiagram, join),
      category: TEMPLATE_CATEGORY,
      iconClass: ModelStructure.SystemDiagram.ICON_CLASS,
      content: ({ name }) =>
         INITIAL_DIAGRAM_CONTENT.replace(/\$\{name\}/gi, quote(toPascal(name))).replace(/\$\{id\}/gi, toId(toPascal(name)))
   },
   {
      id: 'crossbreeze.new.mapping',
      label: 'Mapping',
      memberType: 'Mapping',
      toUri: joinWithExt(ModelFileExtensions.Mapping, join),
      category: TEMPLATE_CATEGORY,
      iconClass: ModelStructure.Mapping.ICON_CLASS,
      content: ({ name }) =>
         INITIAL_MAPPING_CONTENT.replace(/\$\{name\}/gi, quote(toPascal(name))).replace(/\$\{id\}/gi, toId(toPascal(name)))
   },
   {
      id: 'crossbreeze.new.data-model',
      label: 'Data Model',
      memberType: 'DataModel',
      category: TEMPLATE_CATEGORY,
      iconClass: ModelStructure.System.ICON_CLASS,
      toUri: (selectedDirectory, name) => selectedDirectory.resolve(toPascal(name)).resolve('package.json'),
      content: options => JSON.stringify({ ...options, name: toPascal(options.name), dependencies: {} }, undefined, 4)
   }
];

const ID_REGEX = /^[_a-zA-Z@][\w_\-@/#]*$/; /* taken from the langium file, in newer Langium versions constants may be generated. */

const DERIVE_MAPPING_FROM_ENTITY: Command = {
   id: 'crossmodel.mapping',
   label: 'Derive Mapping'
};

@injectable()
export class CrossModelWorkspaceContribution extends WorkspaceCommandContribution implements MenuContribution, CommandContribution {
   @inject(ModelService) modelService: ModelService;

   override registerCommands(commands: CommandRegistry): void {
      super.registerCommands(commands);
      for (const template of NEW_ELEMENT_TEMPLATES) {
         commands.registerCommand(
            { ...template, label: template.label + '...' },
            this.newWorkspaceRootUriAwareCommandHandler({
               isVisible: uri => doesTemplateFitsPackage(this.modelService, template, uri),
               isEnabled: uri => doesTemplateFitsPackage(this.modelService, template, uri),
               execute: uri => this.createNewElementFile(uri, template)
            })
         );
      }

      commands.registerCommand(
         DERIVE_MAPPING_FROM_ENTITY,
         this.newWorkspaceRootUriAwareCommandHandler({
            execute: uri => this.deriveNewMappingFile(uri),
            isEnabled: uri => ModelFileExtensions.isEntityFile(uri.path.base),
            isVisible: uri => ModelFileExtensions.isEntityFile(uri.path.base)
         })
      );
   }

   registerMenus(registry: MenuModelRegistry): void {
      // explorer context menu
      registry.registerSubmenu(NEW_ELEMENT_NAV_MENU, TEMPLATE_CATEGORY);
      for (const [id, template] of NEW_ELEMENT_TEMPLATES.entries()) {
         registry.registerMenuAction(NEW_ELEMENT_NAV_MENU, {
            commandId: template.id,
            label: template.label + '...',
            order: id.toString()
         });
      }

      registry.registerMenuAction(NavigatorContextMenu.NAVIGATION, {
         commandId: DERIVE_MAPPING_FROM_ENTITY.id,
         label: DERIVE_MAPPING_FROM_ENTITY.label + '...'
      });

      // main menu bar
      registry.registerSubmenu(NEW_ELEMENT_MAIN_MENU, TEMPLATE_CATEGORY);
      for (const [id, template] of NEW_ELEMENT_TEMPLATES.entries()) {
         registry.registerMenuAction(NEW_ELEMENT_MAIN_MENU, {
            commandId: template.id,
            label: template.label + '...',
            order: id.toString()
         });
      }

      // editor context menu
      registry.registerMenuAction(EditorContextMenu.COMMANDS, { commandId: DERIVE_MAPPING_FROM_ENTITY.id });
   }

   protected async deriveNewMappingFile(entityUri: URI): Promise<void> {
      const parent = await this.getDirectory(entityUri);
      if (parent) {
         const parentUri = parent.resource;
         const dialog = new WorkspaceInputDialog(
            {
               title: 'New Mapping...',
               parentUri: parentUri,
               initialValue: 'NewMapping',
               placeholder: 'NewMapping',
               validate: newName =>
                  newName && this.validateElementFileName(join(parent.resource, newName, ModelFileExtensions.Mapping), newName)
            },
            this.labelProvider
         );
         const selectedSource = await dialog.open();
         if (selectedSource) {
            const fileName = applyFileExtension(selectedSource, ModelFileExtensions.Mapping);
            const baseFileName = removeFileExtension(selectedSource, ModelFileExtensions.Mapping);
            const mappingUri = parentUri.resolve(fileName);

            const elements = await this.modelService.findReferenceableElements({
               container: { uri: mappingUri.path.fsPath(), type: MappingType },
               syntheticElements: [{ property: 'target', type: TargetObjectType }],
               property: 'entity'
            });
            const entityElement = elements.find(element => element.uri === entityUri.toString());
            if (!entityElement) {
               this.messageService.error('Could not detect target element at ' + entityUri.path.fsPath());
               return;
            }

            const document = await this.modelService.request(entityElement.uri);
            const entity = document?.root.entity;
            if (!entity) {
               this.messageService.error('Could not resolve entity element at ' + entityUri.path.fsPath());
               return;
            }
            const mappingName = toPascal(baseFileName);
            const mapping = {
               mapping: {
                  id: mappingName,
                  target: {
                     entity: entityElement.label,
                     mappings: [] as { attribute: string }[]
                  }
               }
            };
            entity.attributes.forEach(attribute => mapping.mapping.target.mappings.push({ attribute: attribute.id }));
            const content = yaml.stringify(mapping, { indent: 4 });
            await this.fileService.create(mappingUri, content);
            this.fireCreateNewFile({ parent: parentUri, uri: mappingUri });
            open(this.openerService, mappingUri);
         }
      }
   }

   protected async createNewElementFile(uri: URI, template: NewElementTemplate): Promise<void> {
      const parent = await this.getDirectory(uri);
      if (parent) {
         const parentUri = parent.resource;
         const baseProps = {
            title: 'New ' + template.label + '...',
            parentUri: parentUri,
            initialValue: 'New' + template.memberType,
            placeholder: 'New ' + template.memberType
         };
         const options = await (template.memberType === 'DataModel'
            ? this.getDataModelOptions(baseProps, template, parent)
            : this.getMemberOptions(baseProps, template, parent));
         if (!options) {
            return;
         }
         const fileUri = template.toUri(parent.resource, options.name);
         const content = typeof template.content === 'string' ? template.content : template.content(options);
         await this.fileService.create(fileUri, content);
         this.fireCreateNewFile({ parent: parentUri, uri: fileUri });
         open(this.openerService, fileUri);
      }
   }

   protected getDataModelOptions(
      props: WorkspaceInputDialogProps,
      template: NewElementTemplate,
      parent: FileStat
   ): Promise<{ name: string } | undefined> {
      return getNewDataModelOptions(
         {
            ...props,
            dataModelTypes: Object.keys(PackageMemberPermissions),
            validate: value => {
               const name = JSON.parse(value).name ?? '';
               return name && this.validateElementFileName(template.toUri(parent.resource, name), name);
            }
         },
         this.labelProvider
      );
   }

   protected async getMemberOptions(
      props: WorkspaceInputDialogProps,
      template: NewElementTemplate,
      parent: FileStat
   ): Promise<{ name: string } | undefined> {
      const name = await new WorkspaceInputDialog(
         {
            ...props,
            validate: newName => newName && this.validateElementFileName(template.toUri(parent.resource, newName), newName)
         },
         this.labelProvider
      ).open();
      return name ? { name } : undefined;
   }

   protected async validateElementFileName(file: URI, name: string): Promise<DialogError> {
      // we automatically name some part in the initial code after the given name so ensure it is an ID
      if (!ID_REGEX.test(name)) {
         return nls.localizeByDefault(`'${name}' is not a valid name, must match: ${ID_REGEX}.`);
      }
      const root = this.workspaceService.tryGetRoots().find(candidate => candidate.resource.isEqualOrParent(file));
      const relativeName = root?.resource.relative(file)?.toString();
      if (!relativeName || !root) {
         return 'Intended destination is outside the workspace.';
      }
      return this.validateFileName(relativeName, root, true);
   }
}

@injectable()
export class CrossModelFileNavigatorContribution extends FileNavigatorContribution {
   @inject(ModelService) modelService: ModelService;

   override registerCommands(registry: CommandRegistry): void {
      super.registerCommands(registry);

      for (const template of NEW_ELEMENT_TEMPLATES) {
         registry.registerCommand(
            { ...template, label: undefined, id: template.id + '.toolbar' },
            {
               execute: (...args) => registry.executeCommand(template.id, ...args),
               isEnabled: widget =>
                  this.withWidget(
                     widget,
                     navigator =>
                        this.workspaceService.opened &&
                        doesTemplateFitsPackage(this.modelService, template, UriSelection.getUri(navigator.model.selectedNodes))
                  ),
               isVisible: widget =>
                  this.withWidget(
                     widget,
                     navigator =>
                        this.workspaceService.opened &&
                        doesTemplateFitsPackage(this.modelService, template, UriSelection.getUri(navigator.model.selectedNodes))
                  )
            }
         );
      }
   }

   override async registerToolbarItems(toolbarRegistry: TabBarToolbarRegistry): Promise<void> {
      super.registerToolbarItems(toolbarRegistry);

      for (const [id, template] of NEW_ELEMENT_TEMPLATES.entries()) {
         toolbarRegistry.registerItem({
            id: template.id + '.toolbar',
            command: template.id + '.toolbar',
            tooltip: 'New ' + template.label + '...',
            priority: 2,
            order: id.toString(),
            onDidChange: this.selectionService.onSelectionChanged
         });
      }
   }
}

function doesTemplateFitsPackage(modelService: ModelService, template: NewElementTemplate, parent?: URI): boolean {
   if (!parent) {
      return false;
   }
   const model = modelService.systems.find(candidate => URI.fromFilePath(candidate.directory).isEqualOrParent(parent));
   if (!model) {
      return template.memberType === 'DataModel';
   }
   return isMemberPermittedInPackage(model.type, template.memberType);
}

function applyFileExtension(name: string, fileExtension: string): string {
   return name.endsWith(fileExtension) ? name : name + fileExtension;
}

function removeFileExtension(name: string, fileExtension: string): string {
   return name.endsWith(fileExtension) ? name.slice(0, -fileExtension.length) : name;
}

function join(parent: URI, name: string, ext: string): URI {
   return parent.resolve(applyFileExtension(name, ext));
}

function joinWithExt(ext: string, other: (parent: URI, name: string, extension: string) => URI): (parent: URI, name: string) => URI {
   return function (parent: URI, name: string): URI {
      return other(parent, name, ext);
   };
}
