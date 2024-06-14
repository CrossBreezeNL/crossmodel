/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { EntityAttribute, EntityAttributeType } from '@crossbreeze/protocol';
import { GridColDef } from '@mui/x-data-grid';
import * as React from 'react';
import { useEntity, useModelDispatch } from '../../ModelContext';
import { ErrorView } from '../ErrorView';
import GridComponent, { GridComponentRow, ValidationFunction } from './GridComponent';

export type EntityAttributeRow = GridComponentRow<EntityAttribute>;

export function EntityAttributesDataGrid(): React.ReactElement {
   const entity = useEntity();
   const dispatch = useModelDispatch();

   // Callback for when the user stops editing a cell.
   const handleRowUpdate = React.useCallback(
      (attribute: EntityAttributeRow): EntityAttributeRow => {
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

   const handleAddAttribute = React.useCallback(
      (attribute: EntityAttributeRow): void => {
         if (attribute.name) {
            dispatch({
               type: 'entity:attribute:add-attribute',
               attribute: { ...attribute, id: findName('Attribute', entity.attributes, attr => attr.id!) }
            });
         }
      },
      [dispatch, entity.attributes]
   );

   const handleAttributeUpward = React.useCallback(
      (attribute: EntityAttributeRow): void => {
         dispatch({
            type: 'entity:attribute:move-attribute-up',
            attributeIdx: attribute.idx
         });
      },
      [dispatch]
   );

   const handleAttributeDownward = React.useCallback(
      (attribute: EntityAttributeRow): void => {
         dispatch({
            type: 'entity:attribute:move-attribute-down',
            attributeIdx: attribute.idx
         });
      },
      [dispatch]
   );

   const handleAttributeDelete = React.useCallback(
      (attribute: EntityAttributeRow): void => {
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

   const defaultEntry = React.useMemo<EntityAttribute>(
      () => ({
         $type: EntityAttributeType,
         id: findName('Attribute', entity.attributes, attr => attr.id!),
         $globalId: 'toBeAssigned',
         name: findName('New Attribute', entity.attributes, attr => attr.name!),
         datatype: 'Varchar'
      }),
      [entity.attributes]
   );

   // Check if model initialized. Has to be here otherwise the compiler complains.
   if (entity === undefined) {
      return <ErrorView errorMessage='No Entity!' />;
   }
   return (
      <GridComponent
         autoHeight
         gridColumns={columns}
         gridData={entity.attributes}
         defaultEntry={defaultEntry}
         onDelete={handleAttributeDelete}
         onMoveDown={handleAttributeDownward}
         onMoveUp={handleAttributeUpward}
         noEntriesText='No Attributes'
         newEntryText='Add Attribute'
         onAdd={handleAddAttribute}
         onUpdate={handleRowUpdate}
         validateField={validateAttribute}
      />
   );
}

export function findName<T>(suggestion: string, data: T[], nameGetter: (element: T) => string): string {
   const names = data.map(nameGetter);
   let name = suggestion;
   let index = 1;
   while (names.includes(name)) {
      name = name + index++;
   }
   return name;
}
