/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

import { CrossModelWidget, CrossModelWidgetOptions } from '@crossbreezenl/core/lib/browser';
import { FormEditorOpenHandler, FormEditorWidget } from '@crossbreezenl/form-client/lib/browser';
import { MappingDiagramManager, SystemDiagramManager } from '@crossbreezenl/glsp-client/lib/browser/';
import { MappingDiagramLanguage, SystemDiagramLanguage } from '@crossbreezenl/glsp-client/lib/common';
import { ModelService } from '@crossbreezenl/model-service/lib/common';
import { ModelFileType, codiconCSSString, getSemanticRoot } from '@crossbreezenl/protocol';
import { FocusStateChangedAction, SetDirtyStateAction, toTypeGuard } from '@eclipse-glsp/client';
import { GLSPDiagramWidget, GLSPDiagramWidgetContainer, GLSPDiagramWidgetOptions, GLSPSaveable } from '@eclipse-glsp/theia-integration';
import { GLSPDiagramLanguage } from '@eclipse-glsp/theia-integration/lib/common';
import { URI } from '@theia/core';
import {
   BaseWidget,
   BoxLayout,
   CompositeSaveable,
   LabelProvider,
   Message,
   Navigatable,
   NavigatableWidgetOptions,
   SaveOptions,
   Saveable,
   TabPanel,
   Widget,
   WidgetManager
} from '@theia/core/lib/browser';
import { BinaryBuffer } from '@theia/core/lib/common/buffer';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { EditorPreviewWidget } from '@theia/editor-preview/lib/browser/editor-preview-widget';
import { EditorPreviewWidgetFactory } from '@theia/editor-preview/lib/browser/editor-preview-widget-factory';
import { EditorOpenerOptions, EditorWidget } from '@theia/editor/lib/browser';
import * as monaco from '@theia/monaco-editor-core';
import { MonacoEditorModel } from '@theia/monaco/lib/browser/monaco-editor-model';
import { CompositeEditorOptions } from './composite-editor-open-handler';
import { CrossModelEditorManager } from './cross-model-editor-manager';
import { CrossModelFileResourceResolver } from './cross-model-file-resource-resolver';
import { DefaultSaveAsSaveableSource } from './cross-model-saveable-service';

export class ReverseCompositeSaveable extends CompositeSaveable implements Required<Pick<Saveable, 'serialize'>> {
   constructor(
      protected editor: CompositeEditor,
      protected fileResourceResolver: CrossModelFileResourceResolver
   ) {
      super();
   }

   override get saveables(): readonly Saveable[] {
      // reverse order so we save the text editor first as otherwise we'll get a message that something changed on the file system
      return Array.from(this.saveablesMap.keys()).reverse();
   }

   override async save(options?: SaveOptions): Promise<void> {
      // we do not want the overwrite dialog to appear since we are syncing manually
      const autoOverwrite = this.fileResourceResolver.autoOverwrite;
      try {
         this.fileResourceResolver.autoOverwrite = true;
         const activeEditor = this.editor.activeWidget();
         const activeSaveable = Saveable.get(activeEditor);
         if (activeSaveable) {
            await activeSaveable.save(options);
            // manually reset the dirty flag on the other editors (saveables) without triggering an actual save
            this.resetDirtyState(activeSaveable);
         } else {
            // could not determine active editor, so execute save sequentially on all editors
            for (const saveable of this.saveables) {
               await saveable.save(options);
            }
         }
      } finally {
         this.fileResourceResolver.autoOverwrite = autoOverwrite;
      }
   }

   serialize(): Promise<BinaryBuffer> {
      for (const saveable of this.saveables) {
         if (typeof saveable.createSnapshot === 'function') {
            const snapshot = saveable.createSnapshot();
            if ('value' in snapshot) {
               return Promise.resolve(BinaryBuffer.fromString(snapshot.value));
            } else {
               return Promise.resolve(BinaryBuffer.fromString(snapshot.read() ?? ''));
            }
         }
         if (typeof saveable.serialize === 'function') {
            return saveable.serialize();
         }
      }
      throw new Error('Found no serializable saveable!');
   }

   /**
    * Reset the dirty state (without triggering an additional save) of the non-active saveables after a save operation.
    */
   protected resetDirtyState(activeSaveable?: Saveable): void {
      this.saveables
         .filter(saveable => saveable !== activeSaveable)
         .forEach(saveable => {
            if (saveable instanceof MonacoEditorModel) {
               saveable['setDirty'](false);
            } else if (saveable instanceof GLSPSaveable) {
               saveable['actionDispatcher'].dispatch(SetDirtyStateAction.create(false));
            } else if (saveable instanceof CrossModelWidget) {
               saveable.setDirty(false);
            }
         });
   }

   override async revert(options?: Saveable.RevertOptions): Promise<void> {
      if (this.editor.getResourceUri().scheme === 'file') {
         // for file resources, we can revert to the last saved state
         return super.revert(options);
      }
      // for non-file, untitled resources, we do not care about the content and just reset the dirty state
      this.resetDirtyState();
   }
}

export interface CompositeWidgetOptions extends NavigatableWidgetOptions {
   version?: number;
}

@injectable()
export class CompositeEditor extends BaseWidget implements DefaultSaveAsSaveableSource, Navigatable, Partial<GLSPDiagramWidgetContainer> {
   @inject(CrossModelWidgetOptions) protected options: CompositeEditorOptions;
   @inject(LabelProvider) protected labelProvider: LabelProvider;
   @inject(WidgetManager) protected widgetManager: WidgetManager;
   @inject(CrossModelEditorManager) protected editorManager: CrossModelEditorManager;
   @inject(CrossModelFileResourceResolver) protected fileResourceResolver: CrossModelFileResourceResolver;
   @inject(ModelService) protected readonly modelService: ModelService;

   protected tabPanel: TabPanel;
   saveable: CompositeSaveable;

   protected _resourceUri?: URI;
   protected get resourceUri(): URI {
      if (!this._resourceUri) {
         this._resourceUri = new URI(this.options.uri);
      }
      return this._resourceUri;
   }

   get uri(): string {
      return this.options.uri;
   }

   get fileType(): Exclude<ModelFileType, 'Generic'> {
      return this.options.fileType;
   }

   get diagramWidget(): GLSPDiagramWidget | undefined {
      if (this.tabPanel.currentWidget instanceof GLSPDiagramWidget) {
         return this.tabPanel.currentWidget;
      }
      return undefined;
   }

   @postConstruct()
   protected init(): void {
      this.id = this.options.widgetId;
      this.addClass('cm-composite-editor');
      this.title.closable = true;
      this.title.label = this.labelProvider.getName(this.resourceUri);
      this.title.iconClass = ModelFileType.getIconClass(this.fileType) ?? '';
      this.saveable = new ReverseCompositeSaveable(this, this.fileResourceResolver);
      this.initializeContent();
   }

   protected async initializeContent(): Promise<void> {
      const layout = (this.layout = new BoxLayout({ direction: 'top-to-bottom', spacing: 0 }));
      this.tabPanel = new TabPanel({ tabPlacement: 'bottom', tabsMovable: false });
      this.tabPanel.tabBar.addClass('theia-app-centers');
      BoxLayout.setStretch(this.tabPanel, 1);
      this.tabPanel.currentChanged.connect((_, event) => this.handleCurrentWidgetChanged(event));
      layout.addWidget(this.tabPanel);

      // create code editor first as Monaco has it's own version number management
      const codeWidget = await this.createCodeWidget(this.options);
      const version = monaco.editor.getModel(monaco.Uri.parse(this.options.uri))?.getVersionId() ?? 0;
      const options: CompositeWidgetOptions = { ...this.options, version };
      const primateWidget = await this.createPrimaryWidget(options);

      this.addWidget(primateWidget);
      this.addWidget(codeWidget);

      this.update();
   }

   protected addWidget(widget: Widget): void {
      this.tabPanel.addWidget(widget);
      const saveable = Saveable.get(widget);
      if (saveable) {
         this.saveable.add(saveable);
      }
   }

   getResourceUri(): URI {
      return new URI(this.options.uri);
   }

   /** Updates ID of untitled editor to match user's name input. */
   async getSaveAsUri(): Promise<URI | undefined> {
      if (this.resourceUri.scheme === 'file') {
         return;
      }
      const uri = this.resourceUri.toString();
      const document = await this.modelService.open({ uri, clientId: 'save' });
      try {
         if (!document) {
            return;
         }
         const node = getSemanticRoot(document.root);
         if (!node) {
            return;
         }
         const fullExtension = this.resourceUri.path.base.slice(this.resourceUri.path.base.indexOf('.'));
         const newId = node.id;
         return this.resourceUri.withScheme('file').parent.resolve(`${newId}${fullExtension}`);
      } finally {
         await this.modelService.close({ uri: this.resourceUri.toString(), clientId: 'save' });
      }
   }

   protected override onAfterAttach(msg: Message): void {
      super.onAfterAttach(msg);
   }

   protected override onActivateRequest(msg: Message): void {
      super.onActivateRequest(msg);
      this.tabPanel.currentWidget?.activate();
   }

   protected handleCurrentWidgetChanged(event: TabPanel.ICurrentChangedArgs): void {
      // Forward focus state changes to the diagram widget
      if (event.previousWidget instanceof GLSPDiagramWidget && event.previousWidget.hasFocus) {
         event.previousWidget.actionDispatcher.dispatch(FocusStateChangedAction.create(false));
      } else if (event.currentWidget instanceof GLSPDiagramWidget && !event.currentWidget.hasFocus) {
         event.currentWidget.actionDispatcher.dispatch(FocusStateChangedAction.create(true));
      }
   }

   protected override onCloseRequest(msg: Message): void {
      this.tabPanel.widgets.forEach(widget => widget.close());
      super.onCloseRequest(msg);
      this.dispose();
   }

   protected createDiagramWidgetOptions(language: GLSPDiagramLanguage, label?: string): GLSPDiagramWidgetOptions {
      return {
         diagramType: language.diagramType,
         kind: 'navigatable',
         uri: this.uri,
         iconClass: language.iconClass ?? codiconCSSString('type-hierarchy-sub'),
         label: label ?? this.labelProvider.getName(this.resourceUri),
         editMode: 'editable'
      };
   }

   protected async createPrimaryWidget(options: CompositeWidgetOptions): Promise<Widget> {
      switch (this.fileType) {
         case 'LogicalEntity':
            return this.createFormWidget(options);
         case 'Relationship':
            return this.createFormWidget(options);
         case 'SystemDiagram':
            return this.createSystemDiagramWidget();
         case 'Mapping':
            return this.createMappingDiagramWidget();
      }
   }

   protected async createCodeWidget(options: CompositeWidgetOptions): Promise<Widget> {
      const codeWidget = await this.widgetManager.getOrCreateWidget<EditorPreviewWidget>(EditorPreviewWidgetFactory.ID, { ...options });
      codeWidget.title.label = 'Code Editor';
      codeWidget.title.iconClass = codiconCSSString('code');
      codeWidget.title.closable = false;
      return codeWidget;
   }

   protected async createFormWidget(options: CompositeWidgetOptions): Promise<Widget> {
      const formEditor = await this.widgetManager.getOrCreateWidget<FormEditorWidget>(FormEditorOpenHandler.ID, { ...options });
      formEditor.title.label = 'Form Editor';
      formEditor.title.iconClass = codiconCSSString('symbol-keyword');
      formEditor.title.closable = false;
      return formEditor;
   }

   protected async createSystemDiagramWidget(): Promise<Widget> {
      const diagramOptions = this.createDiagramWidgetOptions(SystemDiagramLanguage, 'System Diagram');
      const widget = await this.widgetManager.getOrCreateWidget<GLSPDiagramWidget>(SystemDiagramManager.ID, diagramOptions);
      widget.title.closable = false;
      return widget;
   }

   protected async createMappingDiagramWidget(): Promise<Widget> {
      const diagramOptions = this.createDiagramWidgetOptions(MappingDiagramLanguage, 'Mapping Diagram');
      const widget = await this.widgetManager.getOrCreateWidget<GLSPDiagramWidget>(MappingDiagramManager.ID, diagramOptions);
      widget.title.closable = false;
      return widget;
   }

   getCodeWidget(): EditorWidget | undefined {
      return this.tabPanel.widgets.find<EditorWidget>(toTypeGuard(EditorWidget));
   }

   createMoveToUri(resourceUri: URI): URI | undefined {
      return resourceUri;
   }

   revealCodeTab(options: EditorOpenerOptions): void {
      const codeWidget = this.getCodeWidget();
      if (codeWidget) {
         this.tabPanel.currentWidget = codeWidget;
         this.editorManager.revealSelection(codeWidget, this.resourceUri, options);
      }
   }

   activeWidget(): Widget | undefined {
      return this.tabPanel.currentWidget ?? undefined;
   }
}
