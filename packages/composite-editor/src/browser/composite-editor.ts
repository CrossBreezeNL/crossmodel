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
import { URI } from '@theia/core';
import {
   BaseWidget,
   BoxLayout,
   CompositeSaveable,
   LabelProvider,
   Message,
   Navigatable,
   NavigatableWidgetOptions,
   Saveable,
   SaveableSource,
   TabPanel,
   Widget,
   WidgetManager
} from '@theia/core/lib/browser';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { EditorPreviewWidgetFactory } from '@theia/editor-preview/lib/browser/editor-preview-widget-factory';
import { EditorOpenerOptions, EditorWidget } from '@theia/editor/lib/browser';
import { CompositeEditorOptions } from './composite-editor-open-handler';
import { CrossModelEditorManager } from './cross-model-editor-manager';

export class ReverseCompositeSaveable extends CompositeSaveable {
   override get saveables(): readonly Saveable[] {
      // reverse order so we save the text editor first as otherwise we'll get a message that something changed on the file system
      return Array.from(this.saveablesMap.keys()).reverse();
   }
}

@injectable()
export class CompositeEditor extends BaseWidget implements SaveableSource, Navigatable, Partial<GLSPDiagramWidgetContainer> {
   @inject(CrossModelWidgetOptions) protected options: CompositeEditorOptions;
   @inject(LabelProvider) protected labelProvider: LabelProvider;
   @inject(WidgetManager) protected widgetManager: WidgetManager;
   @inject(CrossModelEditorManager) protected editorManager: CrossModelEditorManager;

   protected tabPanel: TabPanel;
   saveable: CompositeSaveable = new ReverseCompositeSaveable();

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
      this.initializeContent();
   }

   protected async initializeContent(): Promise<void> {
      const layout = (this.layout = new BoxLayout({ direction: 'top-to-bottom', spacing: 0 }));
      this.tabPanel = new TabPanel({ tabPlacement: 'bottom', tabsMovable: false });
      this.tabPanel.tabBar.addClass('theia-app-centers');
      BoxLayout.setStretch(this.tabPanel, 1);
      this.tabPanel.currentChanged.connect((_, event) => this.handleCurrentWidgetChanged(event));
      layout.addWidget(this.tabPanel);

      const primateWidget = await this.createPrimaryWidget();
      this.addWidget(primateWidget);

      const codeWidget = await this.createCodeWidget();
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
      codeWidget.title.iconClass = codiconCSSString('code');
      codeWidget.title.closable = false;
      return codeWidget;
   }

   protected async getFormWidget(): Promise<Widget> {
      const { kind, uri, counter } = this.options;
      const options: NavigatableWidgetOptions = { kind, uri, counter };
      const formEditor = await this.widgetManager.getOrCreateWidget<FormEditorWidget>(FormEditorOpenHandler.ID, options);
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
