/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

import { CrossModelWidgetOptions } from '@crossbreeze/core/lib/browser';
import { FormEditorOpenHandler, FormEditorWidget } from '@crossbreeze/form-client/lib/browser';
import { MappingDiagramManager, SystemDiagramManager } from '@crossbreeze/glsp-client/lib/browser/';
import { MappingDiagramLanguage, SystemDiagramLanguage } from '@crossbreeze/glsp-client/lib/common';
import { codiconCSSString, ModelFileType } from '@crossbreeze/protocol';
import { FocusStateChangedAction, toTypeGuard } from '@eclipse-glsp/client';
import { GLSPDiagramWidget, GLSPDiagramWidgetContainer, GLSPDiagramWidgetOptions } from '@eclipse-glsp/theia-integration';
import { GLSPDiagramLanguage } from '@eclipse-glsp/theia-integration/lib/common';
import { Emitter, Event, URI } from '@theia/core';
import {
   BaseWidget,
   BoxLayout,
   LabelProvider,
   Message,
   Navigatable,
   NavigatableWidgetOptions,
   Saveable,
   SaveOptions,
   TabPanel,
   Widget,
   WidgetManager
} from '@theia/core/lib/browser';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { EditorPreviewWidgetFactory } from '@theia/editor-preview/lib/browser/editor-preview-widget-factory';
import { EditorOpenerOptions, EditorWidget } from '@theia/editor/lib/browser';
import { CrossModelEditorManager } from './cm-editor-manager';
import { CompositeEditorOptions } from './composite-editor-open-handler';

@injectable()
export class CompositeEditor extends BaseWidget implements Saveable, Navigatable, Partial<GLSPDiagramWidgetContainer> {
   @inject(CrossModelWidgetOptions) protected options: CompositeEditorOptions;
   @inject(LabelProvider) protected labelProvider: LabelProvider;
   @inject(WidgetManager) protected widgetManager: WidgetManager;
   @inject(CrossModelEditorManager) protected editorManager: CrossModelEditorManager;

   // We can ignore the autosave property. Child widgets will handle auto saving.
   autoSave: 'off' | 'afterDelay' | 'onFocusChange' | 'onWindowChange' = 'off';
   protected tabPanel: TabPanel;

   protected onDirtyChangedEmitter = new Emitter<void>();
   get onDirtyChanged(): Event<void> {
      return this.onDirtyChangedEmitter.event;
   }

   protected _dirty = false;
   get dirty(): boolean {
      return this._dirty;
   }
   protected set dirty(value: boolean) {
      this._dirty = value;
   }

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

   protected get saveables(): ReadonlyArray<Saveable> {
      return this.tabPanel.widgets.map(widget => Saveable.get(widget)).filter((saveable): saveable is Saveable => !!saveable);
   }

   @postConstruct()
   protected init(): void {
      this.id = this.options.widgetId;
      this.addClass('cm-composite-editor');
      this.title.closable = true;
      this.title.label = this.labelProvider.getName(this.resourceUri);
      this.title.iconClass = ModelFileType.getIconClass(this.fileType) ?? '';
      this.initializeContent();
   }

   protected async initializeContent(): Promise<void> {
      const layout = (this.layout = new BoxLayout({ direction: 'top-to-bottom', spacing: 0 }));
      this.tabPanel = new TabPanel({ tabPlacement: 'bottom', tabsMovable: false });
      BoxLayout.setStretch(this.tabPanel, 1);
      this.tabPanel.currentChanged.connect((_, event) => this.handleCurrentWidgetChanged(event));
      layout.addWidget(this.tabPanel);

      const primateWidget = await this.createPrimaryWidget();
      this.tabPanel.addWidget(primateWidget);
      const codeWidget = await this.createCodeWidget();
      this.tabPanel.addWidget(codeWidget);

      // Hook up dirty state change listeners
      this.saveables.forEach(saveable => {
         this.toDispose.push(
            saveable.onDirtyChanged(() => {
               this.handleWidgetDirtyStateChanged();
            })
         );
      });

      this.update();
   }

   getResourceUri(): URI {
      return new URI(this.options.uri);
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

   protected handleWidgetDirtyStateChanged(): void {
      const dirty = this.saveables.some(saveable => saveable.dirty);
      if (this.dirty !== dirty) {
         this.dirty = dirty;
         this.onDirtyChangedEmitter.fire(undefined);
      }
   }

   async save(options?: SaveOptions): Promise<void> {
      for (const saveable of this.saveables) {
         await saveable.save(options);
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

   protected async createPrimaryWidget(): Promise<Widget> {
      switch (this.fileType) {
         case 'Entity':
            return this.getFormWidget();
         case 'Relationship':
            return this.getFormWidget();
         case 'SystemDiagram':
            return this.createSystemDiagramWidget();
         case 'Mapping':
            return this.createMappingDiagramWidget();
      }
   }

   protected async createCodeWidget(): Promise<Widget> {
      const { kind, uri, counter } = this.options;
      const options: NavigatableWidgetOptions = { kind, uri, counter };
      const codeWidget = await this.widgetManager.getOrCreateWidget(EditorPreviewWidgetFactory.ID, options);
      codeWidget.title.label = 'Code Editor';
      return codeWidget;
   }

   protected async getFormWidget(): Promise<Widget> {
      const { kind, uri, counter } = this.options;
      const options: NavigatableWidgetOptions = { kind, uri, counter };
      const formEditor = await this.widgetManager.getOrCreateWidget<FormEditorWidget>(FormEditorOpenHandler.ID, options);
      this.toDispose.push(
         formEditor.onModelSet(() => {
            formEditor.title.label = 'Form Editor';
         })
      );
      return formEditor;
   }

   protected async createSystemDiagramWidget(): Promise<Widget> {
      const diagramOptions = this.createDiagramWidgetOptions(SystemDiagramLanguage, 'System Diagram');
      return this.widgetManager.getOrCreateWidget<GLSPDiagramWidget>(SystemDiagramManager.ID, diagramOptions);
   }

   protected async createMappingDiagramWidget(): Promise<Widget> {
      const diagramOptions = this.createDiagramWidgetOptions(MappingDiagramLanguage, 'Mapping Diagram');
      return this.widgetManager.getOrCreateWidget<GLSPDiagramWidget>(MappingDiagramManager.ID, diagramOptions);
   }

   protected getCodeWidget(): EditorWidget | undefined {
      return this.tabPanel.widgets.find<EditorWidget>(toTypeGuard(EditorWidget));
   }

   createMoveToUri(resourceUri: URI): URI | undefined {
      return resourceUri;
   }

   revealCodeTab(options: EditorOpenerOptions): void {
      const codeWidget = this.getCodeWidget();
      if (codeWidget) {
         this.tabPanel.currentWidget = codeWidget;
         this.editorManager.revealSelection(codeWidget, options, this.resourceUri);
      }
   }
}
