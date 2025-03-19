/** ******************************************************************************
 * Copyright (c) 2025 CrossBreeze.
 ********************************************************************************/

import { inject } from '@theia/core/shared/inversify';
import { LabelProvider } from '@theia/core/lib/browser';
import { WorkspaceInputDialog, WorkspaceInputDialogProps } from '@theia/workspace/lib/browser/workspace-input-dialog';

const GridInputDialogProps = Symbol('GridInputDialogProps');
interface GridInputDialogProps<T extends readonly InputOptions[] = readonly InputOptions[]> extends WorkspaceInputDialogProps {
   inputs: T;
}

export interface InputOptions {
   placeholder?: string;
   value?: string;
   id: string;
   label: string;
   options?: Record<string, string>;
}

export type FieldValues<T extends readonly InputOptions[]> = Record<T[number]['id'], string>;

interface LabelOptions {
   text: string;
   for: string;
}

export class GridInputDialog extends WorkspaceInputDialog {
   protected readonly grid: HTMLDivElement;

   constructor(
      @inject(GridInputDialogProps) protected override readonly props: GridInputDialogProps,
      @inject(LabelProvider) protected override readonly labelProvider: LabelProvider
   ) {
      super(props, labelProvider);
      this.grid = this.getGrid();
      this.contentNode.insertBefore(this.grid, this.inputField);
      this.addInputs();
   }

   protected addInputs(): void {
      const idBase = Date.now().toString(26);
      let inputFieldSet = false;
      this.props.inputs.forEach(inputProps => {
         const computedId = idBase + '-' + inputProps.id;
         const label = createLabel({ text: inputProps.label, for: computedId });
         this.grid.appendChild(label);
         if (!inputFieldSet && !inputProps.options) {
            inputFieldSet = true;
            this.inputField.id = computedId;
            this.grid.appendChild(this.inputField);
         } else {
            const input = createInput({ ...inputProps, id: computedId });
            this.grid.appendChild(input);
         }
      });
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
      const data: Record<string, string> = {};
      for (let i = 0; i < this.grid.children.length; i++) {
         const child = this.grid.children[i];
         if (child instanceof HTMLLabelElement) {
            continue;
         }
         const value = (child as HTMLInputElement | HTMLSelectElement).value;
         const id = child.id.slice(child.id.indexOf('-') + 1);
         data[id] = value;
      }
      return JSON.stringify(data);
   }
}

export async function getGridInputOptions<T extends readonly InputOptions[]>(
   props: GridInputDialogProps<T>,
   labelProvider: LabelProvider
): Promise<FieldValues<T> | undefined> {
   const userSelection = await new GridInputDialog(props, labelProvider).open();
   if (!userSelection) {
      return undefined;
   }
   return JSON.parse(userSelection);
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
   if (options.options) {
      Object.entries(options.options).forEach(([key, value]) => {
         const option = document.createElement('option');
         option.textContent = value;
         option.value = key;
         inputField.appendChild(option);
      });
   }
   if (options.value) {
      inputField.value = options.value;
   }
   if (options.id) {
      inputField.id = options.id;
   }
   return inputField as U;
}

function createLabel(options: LabelOptions): HTMLLabelElement {
   const label = document.createElement('label');
   label.setAttribute('for', options.for);
   label.innerText = options.text;
   label.classList.add('theia-header', 'no-select');
   return label;
}
