/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import * as React from 'react';
import '../../../style/entity-general-form.css';
import { useModel, useModelDispatch } from '../../ModelContext';
import { ErrorView } from '../ErrorView';

interface EntityGeneralProps extends React.HTMLProps<HTMLDivElement> {}

export function EntityGeneralForm(_props: EntityGeneralProps): React.ReactElement {
   // Context variables to handle model state.
   const model = useModel();
   const dispatch = useModelDispatch();

   // Check if model initialized. Has to be here otherwise the compiler complains.
   if (model.entity === undefined) {
      return <ErrorView errorMessage='Model not initialized!' />;
   }

   return (
      <form className='form-editor-general'>
         <div>
            <label>Name:</label>
            <input
               className='theia-input'
               value={model.entity.name_val}
               onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  dispatch({ type: 'entity:change-name', name: e.target.value ? e.target.value : '' });
               }}
            />
         </div>

         <div>
            <label>Description:</label>
            <textarea
               className='theia-input'
               value={model.entity.description}
               rows={4}
               onChange={(e: any) => {
                  dispatch({ type: 'entity:change-description', description: e.target.value });
               }}
            />
         </div>
      </form>
   );
}
