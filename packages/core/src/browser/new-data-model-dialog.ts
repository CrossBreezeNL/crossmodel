/** ******************************************************************************
 * Copyright (c) 2025 CrossBreeze.
 ********************************************************************************/

import { inject } from '@theia/core/shared/inversify';
import { LabelProvider } from '@theia/core/lib/browser';
import { WorkspaceInputDialog, WorkspaceInputDialogProps } from '@theia/workspace/lib/browser/workspace-input-dialog';
import { toPascal } from '@crossbreeze/protocol';

const DataModelInputDialogProps = Symbol('DataModelInputDialogProps');
interface DataModelInputDialogProps extends WorkspaceInputDialogProps {
   dataModelTypes: string[];
}

export class DataModelInputDialog extends WorkspaceInputDialog {
   protected readonly versionInput: HTMLInputElement;
   protected readonly typeSelector: HTMLSelectElement;
   protected readonly grid: HTMLDivElement;

   constructor(
      @inject(DataModelInputDialogProps) protected override readonly props: DataModelInputDialogProps,
      @inject(LabelProvider) protected override readonly labelProvider: LabelProvider
   ) {
      super(props, labelProvider);
      this.grid = this.getGrid();
      this.contentNode.appendChild(this.grid);
      const idBase = Date.now().toString(26);
      const nameInputId = idBase + '-name';
      this.grid.appendChild(createLabel({ text: 'Model Name', for: nameInputId }));
      this.inputField.id = nameInputId;
      this.grid.appendChild(this.inputField);
      const versionInputId = idBase + '-version';
      this.grid.appendChild(createLabel({ text: 'Version', for: versionInputId }));
      this.versionInput = createInput({ placeholder: '1.0.0', value: '1.0.0', id: versionInputId });
      this.grid.appendChild(this.versionInput);
      const typeInputId = idBase + '-type';
      this.grid.appendChild(createLabel({ text: 'Type', for: typeInputId }));
      this.typeSelector = createInput({
         value: 'logical',
         id: typeInputId,
         options: Object.fromEntries(props.dataModelTypes.map(key => [key, toPascal(key)]))
      });
      this.grid.appendChild(this.typeSelector);
   }

   protected getGrid(): HTMLDivElement {
      const grid = document.createElement('div');
      grid.setAttribute(
         'style',
         'display: grid; width: 100%; grid-template-columns: max-content auto; gap: var(--theia-ui-padding); align-items: center;'
      );
      return grid;
   }

   override get value(): string {
      const name = this.inputField.value;
      const version = this.versionInput.value;
      const type = this.typeSelector.value;
      return JSON.stringify({ name, version, type });
   }
}

export async function getNewDataModelOptions(
   props: DataModelInputDialogProps,
   labelProvider: LabelProvider
): Promise<{ name: string; version: string; type: string } | undefined> {
   const userSelection = await new DataModelInputDialog(props, labelProvider).open();
   if (!userSelection) {
      return undefined;
   }
   return JSON.parse(userSelection);
}

interface InputOptions {
   placeholder?: string;
   value?: string;
   id?: string;
   options?: Record<string, string>;
}

function createInput<T extends InputOptions, U = T extends { options: Record<string, string> } ? HTMLSelectElement : HTMLInputElement>(
   options: T
): U {
   const isSelect = !!options.options;
   const inputField = document.createElement(isSelect ? 'select' : 'input');
   inputField.className = isSelect ? 'theia-select' : 'theia-input';
   inputField.spellcheck = false;
   // inputField.setAttribute('style', 'flex: 0;');
   if (inputField instanceof HTMLInputElement) {
      inputField.placeholder = options.placeholder || '';
      inputField.type = 'text';
   }
   if (options.value) {
      inputField.value = options.value;
   }
   if (options.id) {
      inputField.id = options.id;
   }
   if (options.options) {
      Object.entries(options.options).forEach(([key, value]) => {
         const option = document.createElement('option');
         option.textContent = value;
         option.value = key;
         inputField.appendChild(option);
      });
   }
   return inputField as U;
}

interface LabelOptions {
   text: string;
   for: string;
}

function createLabel(options: LabelOptions): HTMLLabelElement {
   const label = document.createElement('label');
   label.setAttribute('htmlFor', options.for);
   label.innerText = options.text;
   label.classList.add('theia-header', 'no-select');
   return label;
}
