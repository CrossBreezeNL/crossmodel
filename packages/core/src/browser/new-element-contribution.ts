/** ******************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { ModelService } from '@crossbreeze/model-service/lib/common';
import {
   MappingType,
   ModelFileExtensions,
   ModelMemberPermissions,
   ModelStructure,
   TargetObjectType,
   isMemberPermittedInModel,
   quote,
   toId,
   toPascal
} from '@crossbreeze/protocol';
import {
   Command,
   CommandContribution,
   CommandRegistry,
   MaybePromise,
   MenuContribution,
   MenuModelRegistry,
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

interface NewElementTemplate extends Command {
   label: string;
   toUri: (parent: URI, name: string) => URI;
   memberType: string;
   content: string | ((name: string) => string);
}

interface MultiFieldNewTemplateElement<T extends readonly InputOptions[] = readonly InputOptions[]>
   extends Omit<NewElementTemplate, 'content'> {
   content: (options: FieldValues<T>) => string;
   getInputOptions(parent: URI, modelService: ModelService): MaybePromise<T>;
}

namespace NewElementTemplate {
   export function isMultiField<T extends readonly InputOptions[]>(
      candidate: NewElementTemplate | MultiFieldNewTemplateElement<T>
   ): candidate is MultiFieldNewTemplateElement<T> {
      return 'getInputOptions' in candidate;
   }
}

const INITIAL_ENTITY_CONTENT = `entity:
    id: \${id}
    name: \${name}
`;

const INITIAL_DIAGRAM_CONTENT = `systemDiagram:
    id: \${id}
`;

const TEMPLATE_CATEGORY = 'New Element';

const NEW_ELEMENT_TEMPLATES: Array<NewElementTemplate | MultiFieldNewTemplateElement> = [
   {
      id: 'crossbreeze.new.entity',
      label: 'Entity',
      memberType: 'LogicalEntity',
      toUri: joinWithExt(ModelFileExtensions.LogicalEntity, join),
      category: TEMPLATE_CATEGORY,
      iconClass: ModelStructure.LogicalEntity.ICON_CLASS,
      content: name => INITIAL_ENTITY_CONTENT.replace(/\$\{name\}/gi, quote(toPascal(name))).replace(/\$\{id\}/gi, toId(toPascal(name)))
   } satisfies NewElementTemplate,
   {
      id: 'crossbreeze.new.relationship',
      label: 'Relationship',
      memberType: 'Relationship',
      toUri: joinWithExt(ModelFileExtensions.Relationship, join),
      category: TEMPLATE_CATEGORY,
      iconClass: ModelStructure.Relationship.ICON_CLASS,
      content: ({ name, parent, child }) => `relationship:
    id: ${toId(toPascal(name))}
    name: ${quote(toPascal(name))}
    parent: ${parent}
    child: ${child}
`,
      async getInputOptions(parent, modelService) {
         const elements = await modelService.findReferenceableElements({
            container: { uri: parent.toString(), type: this.memberType },
            property: 'parent'
         });
         const options = Object.fromEntries(elements.map(element => [element.label, element.label]));
         return [
            { id: 'name', label: 'Name' },
            { id: 'parent', label: 'Parent', options },
            { id: 'child', label: 'Child', options, value: elements[1]?.label ?? elements[0]?.label }
         ] as const;
      }
   } satisfies MultiFieldNewTemplateElement,
   {
      id: 'crossbreeze.new.system-diagram',
      label: 'System Diagram',
      memberType: 'SystemDiagram',
      toUri: joinWithExt(ModelFileExtensions.SystemDiagram, join),
      category: TEMPLATE_CATEGORY,
      iconClass: ModelStructure.SystemDiagram.ICON_CLASS,
      content: name => INITIAL_DIAGRAM_CONTENT.replace(/\$\{name\}/gi, quote(toPascal(name))).replace(/\$\{id\}/gi, toId(toPascal(name)))
   } satisfies NewElementTemplate,
   {
      id: 'crossbreeze.new.mapping',
      label: 'Mapping',
      memberType: 'Mapping',
      toUri: joinWithExt(ModelFileExtensions.Mapping, join),
      category: TEMPLATE_CATEGORY,
      iconClass: ModelStructure.Mapping.ICON_CLASS,
      content: ({ name, target }) => `mapping:
    id: ${toId(toPascal(name))}
    target:
        entity: ${target}
`,
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
   } satisfies MultiFieldNewTemplateElement,
   {
      id: 'crossbreeze.new.data-model',
      label: 'Data Model',
      memberType: 'DataModel',
      category: TEMPLATE_CATEGORY,
      iconClass: ModelStructure.System.ICON_CLASS,
      toUri: (selectedDirectory, name) => selectedDirectory.resolve(toPascal(name)).resolve('package.json'),
      content: options => JSON.stringify({ ...options, name: toPascal(options.name), dependencies: {} }, undefined, 4),
      getInputOptions() {
         return [
            { id: 'name', label: 'Model Name' },
            { id: 'version', label: 'Version', placeholder: '1.0.0', value: '1.0.0' },
            {
               value: 'logical',
               id: 'type',
               label: 'Type',
               options: Object.fromEntries(Object.keys(ModelMemberPermissions).map(key => [key, toPascal(key)]))
            }
         ] as const;
      }
   } satisfies MultiFieldNewTemplateElement
];

const ID_REGEX = /^[_a-zA-Z@][\w_\-@/#]*$/; /* taken from the langium file, in newer Langium versions constants may be generated. */

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

   protected async createNewElementFile(uri: URI, template: NewElementTemplate | MultiFieldNewTemplateElement): Promise<void> {
      const parent = await this.getDirectory(uri);
      if (parent) {
         const parentUri = parent.resource;
         const baseProps = {
            title: 'New ' + template.label + '...',
            parentUri: parentUri,
            initialValue: 'New' + template.memberType,
            placeholder: 'New ' + template.memberType
         };
         const options = await (NewElementTemplate.isMultiField(template)
            ? this.getAdvancedOptions(baseProps, template, parent)
            : this.getMemberOptions(baseProps, template, parent));
         if (!options) {
            return;
         }
         const { fileUri, content } = options;
         await this.fileService.create(fileUri, content);
         this.fireCreateNewFile({ parent: parentUri, uri: fileUri });
         open(this.openerService, fileUri);
      }
   }

   protected async getAdvancedOptions(
      baseProps: WorkspaceInputDialogProps,
      template: MultiFieldNewTemplateElement,
      parent: FileStat
   ): Promise<{ fileUri: URI; content: string } | undefined> {
      const options = await getGridInputOptions(
         {
            ...baseProps,
            inputs: await template.getInputOptions(parent.resource, this.modelService),
            validate: value => {
               const name = JSON.parse(value).name ?? '';
               return name && this.validateElementFileName(template.toUri(parent.resource, name), name);
            }
         },
         this.labelProvider
      );
      if (!options) {
         return undefined;
      }
      const fileUri = template.toUri(parent.resource, options.name);
      const content = typeof template.content === 'string' ? template.content : template.content(options);
      return { fileUri, content };
   }

   protected async getMemberOptions(
      props: WorkspaceInputDialogProps,
      template: NewElementTemplate,
      parent: FileStat
   ): Promise<{ fileUri: URI; content: string } | undefined> {
      const name = await new WorkspaceInputDialog(
         {
            ...props,
            validate: newName => newName && this.validateElementFileName(template.toUri(parent.resource, newName), newName)
         },
         this.labelProvider
      ).open();
      if (!name) {
         return undefined;
      }
      const fileUri = template.toUri(parent.resource, name);
      const content = typeof template.content === 'string' ? template.content : template.content(name);
      return { fileUri, content };
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

function joinWithExt(ext: string, other: (parent: URI, name: string, extension: string) => URI): (parent: URI, name: string) => URI {
   return function (parent: URI, name: string): URI {
      return other(parent, name, ext);
   };
}
