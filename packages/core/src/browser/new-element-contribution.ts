/** ******************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { ModelService } from '@crossbreezenl/model-service/lib/common';
import {
   ID_REGEX,
   LogicalEntityType,
   MappingType,
   ModelFileExtensions,
   ModelMemberPermissions,
   ModelStructure,
   NPM_PACKAGE_NAME_REGEX,
   RelationshipType,
   TargetObjectType,
   isMemberPermittedInModel,
   packageNameToId,
   quote,
   toId,
   toIdReference,
   toPascal
} from '@crossbreezenl/protocol';
import {
   Command,
   CommandContribution,
   CommandRegistry,
   MaybePromise,
   MenuContribution,
   MenuModelRegistry,
   Resource,
   UNTITLED_SCHEME,
   URI,
   UntitledResourceResolver,
   UriSelection,
   nls
} from '@theia/core';
import { CommonMenus, DialogError, open } from '@theia/core/lib/browser';
import { TabBarToolbarRegistry } from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { inject, injectable } from '@theia/core/shared/inversify';
import { EditorContextMenu } from '@theia/editor/lib/browser';
import { FileStat } from '@theia/filesystem/lib/common/files';
import { FileNavigatorContribution, NavigatorContextMenu } from '@theia/navigator/lib/browser/navigator-contribution';
import { WorkspaceCommandContribution } from '@theia/workspace/lib/browser/workspace-commands';
import { WorkspaceInputDialog, WorkspaceInputDialogProps } from '@theia/workspace/lib/browser/workspace-input-dialog';
import * as yaml from 'yaml';
import { FieldValues, InputOptions, getGridInputOptions } from './grid-dialog';

const NEW_ELEMENT_NAV_MENU = [...NavigatorContextMenu.NAVIGATION, '0_new'];
const NEW_ELEMENT_MAIN_MENU = [...CommonMenus.FILE, '0_new'];

interface NewElementTemplate<T extends readonly InputOptions[] = readonly InputOptions[]> extends Command {
   label: string;
   toUri: (parent: URI, name: string) => URI;
   memberType: string;
   content: string | ((parent: URI, model: ModelService, options: FieldValues<T>) => string | Promise<string>);
   validateName?(name: string): string | undefined;
   getInputOptions?(parent: URI, modelService: ModelService): MaybePromise<T>;
}

const INITIAL_ENTITY_CONTENT = `entity:
    id: _
    name: ""
`;

const INITIAL_RELATIONSHIP_CONTENT = `relationship:
    id: _Parent_to_Child_
    name: "<Parent> to <Child>"
`;

const INITIAL_DIAGRAM_CONTENT = `systemDiagram:
    id: \${id}
`;

const INITIAL_MAPPING_CONTENT = `mapping:
    id: \${id}
    target:
        entity: \${target}
`;

function resolvePlaceholder(content: string, parameters: Record<string, string>): string {
   return Object.entries(parameters).reduce((result, [key, value]) => result.replace(new RegExp(`\\$\\{${key}\\}`, 'gi'), value), content);
}

const TEMPLATE_CATEGORY = 'New Element';

const NEW_ELEMENT_TEMPLATES: ReadonlyArray<NewElementTemplate> = [
   {
      id: 'crossbreeze.new.entity',
      label: 'Entity',
      memberType: LogicalEntityType,
      toUri(parent) {
         return join(parent, `New${this.memberType}`, ModelFileExtensions.LogicalEntity);
      },
      category: TEMPLATE_CATEGORY,
      iconClass: ModelStructure.LogicalEntity.ICON_CLASS,
      content: INITIAL_ENTITY_CONTENT
   },
   {
      id: 'crossbreeze.new.relationship',
      label: 'Relationship',
      memberType: RelationshipType,
      toUri(parent) {
         return join(parent, `New${this.memberType}`, ModelFileExtensions.Relationship);
      },
      category: TEMPLATE_CATEGORY,
      iconClass: ModelStructure.Relationship.ICON_CLASS,
      content: INITIAL_RELATIONSHIP_CONTENT
   },
   {
      id: 'crossbreeze.new.system-diagram',
      label: 'System Diagram',
      memberType: 'SystemDiagram',
      toUri: (parent, name) => join(parent, toId(name), ModelFileExtensions.SystemDiagram),
      category: TEMPLATE_CATEGORY,
      validateName: validateObjectName,
      iconClass: ModelStructure.SystemDiagram.ICON_CLASS,
      content: (_, __, { name }) => resolvePlaceholder(INITIAL_DIAGRAM_CONTENT, { name: quote(name), id: toId(name) })
   },
   {
      id: 'crossbreeze.new.mapping',
      label: 'Mapping',
      memberType: 'Mapping',
      toUri: (parent, name) => join(parent, toId(name), ModelFileExtensions.Mapping),
      category: TEMPLATE_CATEGORY,
      iconClass: ModelStructure.Mapping.ICON_CLASS,
      validateName: validateObjectName,
      content: (_, __, { name, target }) => resolvePlaceholder(INITIAL_MAPPING_CONTENT, { id: toId(name), target: toIdReference(target) }),
      async getInputOptions(parent, modelService) {
         const elements = await modelService.findReferenceableElements({
            container: { uri: parent.toString(), type: this.memberType },
            syntheticElements: [{ property: 'target', type: TargetObjectType }],
            property: 'entity'
         });
         return [
            { id: 'name', label: 'Name' },
            { id: 'target', label: 'Target', options: Object.fromEntries(elements.map(element => [element.label, element.label])) }
         ] as const;
      }
   },
   {
      id: 'crossbreeze.new.data-model',
      label: 'Data Model',
      memberType: 'DataModel',
      category: TEMPLATE_CATEGORY,
      validateName: validatePackageName,
      iconClass: ModelStructure.System.ICON_CLASS,
      toUri: (selectedDirectory, name) => selectedDirectory.resolve(packageNameToId(name)).resolve('package.json'),
      content: (_, __, options) => JSON.stringify({ ...options, dependencies: {} }, undefined, 4),
      getInputOptions() {
         return [
            { id: 'name', label: 'Model Name', placeholder: 'new-data-model', value: 'new-data-model' },
            { id: 'version', label: 'Version', placeholder: '1.0.0', value: '1.0.0' },
            {
               value: 'logical',
               id: 'type',
               label: 'Type',
               options: Object.fromEntries(Object.keys(ModelMemberPermissions).map(key => [key, toPascal(key)]))
            }
         ] as const;
      }
   }
];

const DERIVE_MAPPING_FROM_ENTITY: Command = {
   id: 'crossmodel.mapping',
   label: 'Derive Mapping'
};

@injectable()
export class CrossModelWorkspaceContribution extends WorkspaceCommandContribution implements MenuContribution, CommandContribution {
   @inject(ModelService) modelService: ModelService;
   @inject(UntitledResourceResolver) untitledResources: UntitledResourceResolver;

   override registerCommands(commands: CommandRegistry): void {
      super.registerCommands(commands);
      for (const template of NEW_ELEMENT_TEMPLATES) {
         commands.registerCommand(
            { ...template, label: template.label + '...' },
            this.newWorkspaceRootUriAwareCommandHandler({
               isVisible: uri => doesTemplateFitPackage(uri, this.modelService, template),
               isEnabled: uri => doesTemplateFitPackage(uri, this.modelService, template),
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
                     entity: toIdReference(entityElement.label)
                  }
               }
            };
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
         if (template.memberType === LogicalEntityType || template.memberType === RelationshipType) {
            const fileUri = template.toUri(parent.resource, '');
            const content =
               typeof template.content === 'string' ? template.content : await template.content(parent.resource, this.modelService, {});
            const resource = await this.getUntitledResource(fileUri, content);
            await open(this.openerService, resource.uri);
         } else {
            const options = await this.getMemberOptions(
               {
                  title: 'New ' + template.label + '...',
                  parentUri: parentUri,
                  initialValue: 'New' + template.memberType,
                  placeholder: 'New ' + template.memberType
               },
               template,
               parent
            );
            if (!options) {
               return;
            }
            const { fileUri, content } = options;
            await this.fileService.create(fileUri, content);
            this.fireCreateNewFile({ parent: parentUri, uri: fileUri });
            open(this.openerService, fileUri);
         }
      }
   }

   protected async getMemberOptions(
      baseProps: WorkspaceInputDialogProps,
      template: NewElementTemplate,
      parent: FileStat
   ): Promise<{ fileUri: URI; content: string } | undefined> {
      const options = await getGridInputOptions(
         {
            ...baseProps,
            inputs: (await template.getInputOptions?.(parent.resource, this.modelService)) ?? [{ id: 'name', label: 'Name' }],
            validate: value => {
               const name = JSON.parse(value).name ?? '';
               return name && (template.validateName?.(name) || this.validateFile(template.toUri(parent.resource, name)));
            }
         },
         this.labelProvider
      );
      if (!options) {
         return undefined;
      }
      const fileUri = template.toUri(parent.resource, options.name);
      const content =
         typeof template.content === 'string' ? template.content : await template.content(parent.resource, this.modelService, options);
      return { fileUri, content };
   }

   protected async getUntitledResource(fileUri: URI, content: string): Promise<Resource> {
      let untitledUri = fileUri.withScheme(UNTITLED_SCHEME);
      let suffix = 1;
      while (this.untitledResources.has(untitledUri)) {
         const base = untitledUri.path.base;
         const pivot = base.indexOf('.');
         untitledUri = untitledUri.parent.resolve(`${base.slice(0, pivot)}${suffix++}${base.slice(pivot)}`);
      }
      return this.untitledResources.createUntitledResource(content, undefined, untitledUri);
   }

   protected async validateElementFileName(file: URI, name: string): Promise<DialogError> {
      // we automatically name some part in the initial code after the given name so ensure it is an ID
      if (!ID_REGEX.test(name)) {
         return nls.localizeByDefault(`'${name}' is not a valid name, must match: ${ID_REGEX}.`);
      }
      return this.validateFile(file);
   }

   protected validateFile(file: URI): Promise<string> | string {
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
                        doesTemplateFitPackage(UriSelection.getUri(navigator.model.selectedNodes), this.modelService, template)
                  ),
               isVisible: widget =>
                  this.withWidget(
                     widget,
                     navigator =>
                        this.workspaceService.opened &&
                        doesTemplateFitPackage(UriSelection.getUri(navigator.model.selectedNodes), this.modelService, template)
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

function doesTemplateFitPackage(target: URI | undefined, modelService: ModelService, template: { memberType: string }): boolean {
   if (!target) {
      return false;
   }
   const model = modelService.systems.find(candidate => URI.fromFilePath(candidate.directory).isEqualOrParent(target));
   if (!model) {
      return template.memberType === 'DataModel';
   }
   return isMemberPermittedInModel(model.type, template.memberType);
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

function validateObjectName(input: string): string | undefined {
   const asId = toId(input);
   if (!ID_REGEX.test(asId)) {
      return `Derived ID '${asId}' does not match '${ID_REGEX}'.`;
   }
   return undefined;
}

function validatePackageName(input: string): string | undefined {
   if (!NPM_PACKAGE_NAME_REGEX.test(input)) {
      return `Name must match '${NPM_PACKAGE_NAME_REGEX}'.`;
   }
   const asId = packageNameToId(input);
   if (!ID_REGEX.test(asId)) {
      return `Derived ID '${asId}' does not match '${ID_REGEX}'.`;
   }
   return undefined;
}
