/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { EntityAttribute, EntityAttributeType } from '@crossbreeze/protocol';
import { GridColDef, GridRowModel } from '@mui/x-data-grid';
import * as React from 'react';
import { useEntity, useModelDispatch } from '../../ModelContext';
import { ErrorView } from '../ErrorView';
import AttributeGrid, { AttributeRow, ValidationFunction } from './AttributeGrid';

export function EntityAttributesDataGrid(): React.ReactElement {
   const entity = useEntity();
   const dispatch = useModelDispatch();

   // Callback for when the user stops editing a cell.
   const handleRowUpdate = React.useCallback(
      (attribute: AttributeRow<EntityAttribute>): GridRowModel => {
         // Handle change of name property.
         dispatch({
            type: 'entity:attribute:update',
            attributeIdx: attribute.idx,
            attribute: {
               $type: EntityAttributeType,
               $globalId: attribute.id,
               id: attribute.id,
               name: attribute.name,
               datatype: attribute.datatype,
               description: attribute.description
            }
         });
         return attribute;
      },
      [dispatch]
   );

   const handleAddAttribute = React.useCallback((): void => {
      dispatch({ type: 'entity:attribute:add-empty' });
   }, [dispatch]);

   const handleAttributeUpward = React.useCallback(
      (attribute: AttributeRow<EntityAttribute>): void => {
         dispatch({
            type: 'entity:attribute:move-attribute-up',
            attributeIdx: attribute.idx
         });
      },
      [dispatch]
   );

   const handleAttributeDownward = React.useCallback(
      (attribute: AttributeRow<EntityAttribute>): void => {
         dispatch({
            type: 'entity:attribute:move-attribute-down',
            attributeIdx: attribute.idx
         });
      },
      [dispatch]
   );

   const handleAttributeDelete = React.useCallback(
      (attribute: AttributeRow<EntityAttribute>): void => {
         dispatch({
            type: 'entity:attribute:delete-attribute',
            attributeIdx: attribute.idx
         });
      },
      [dispatch]
   );

   const validateAttribute = React.useCallback<ValidationFunction<EntityAttribute>>(
      <P extends keyof EntityAttribute, V extends EntityAttribute[P]>(field: P, value: V): string | undefined => {
         if (field === 'name' && !value) {
            return 'Invalid Name';
         }
         return undefined;
      },
      []
   );

   const columns = React.useMemo<GridColDef[]>(
      () => [
         {
            field: 'name',
            headerName: 'Name',
            flex: 200,
            editable: true,
            type: 'string'
         },
         {
            field: 'datatype',
            headerName: 'Data type',
            editable: true,
            type: 'singleSelect',
            valueOptions: ['Integer', 'Float', 'Char', 'Varchar', 'Bool']
         },
         { field: 'description', headerName: 'Description', editable: true, flex: 200 }
      ],
      []
   );

   // Check if model initialized. Has to be here otherwise the compiler complains.
   if (entity === undefined) {
      return <ErrorView errorMessage='No Entity!' />;
   }
   return (
      <AttributeGrid
         autoHeight
         attributeColumns={columns}
         attributes={entity.attributes}
         onDelete={handleAttributeDelete}
         onMoveDown={handleAttributeDownward}
         onMoveUp={handleAttributeUpward}
         onNewAttribute={handleAddAttribute}
         onUpdate={handleRowUpdate}
         validateAttribute={validateAttribute}
      />
   );
}
