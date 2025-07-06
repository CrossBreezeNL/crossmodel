/********************************************************************************
 * Copyright (c) 2025 CrossBreeze.
 ********************************************************************************/
import { CustomProperty, CustomPropertyType, findNextUnique, identifier, toId } from '@crossmodel/protocol';
import { GridColDef } from '@mui/x-data-grid';
import * as React from 'react';
import { useModelDispatch, useReadonly, useRelationship } from '../../ModelContext';
import { ErrorView } from '../ErrorView';
import GridComponent, { GridComponentRow, ValidationFunction } from './GridComponent';

export type CustomPropertyRow = GridComponentRow<CustomProperty>;

export function RelationshipCustomPropertiesDataGrid(): React.ReactElement {
   const relationship = useRelationship();
   const dispatch = useModelDispatch();
   const readonly = useReadonly();

   // Callback for when the user stops editing a cell.
   const handleRowUpdate = React.useCallback(
      (customProperty: CustomPropertyRow): CustomPropertyRow => {
         dispatch({
            type: 'relationship:customProperty:update',
            customPropertyIdx: customProperty.idx,
            customProperty: GridComponentRow.getData(customProperty)
         });
         return customProperty;
      },
      [dispatch]
   );

   const handleAddCustomProperty = React.useCallback(
      (customProperty: CustomPropertyRow): void => {
         if (customProperty.name) {
            const id = findNextUnique(
               toId(findNextUnique(customProperty.name, relationship.customProperties!, identifier)),
               relationship.customProperties!,
               identifier
            );
            dispatch({
               type: 'relationship:customProperty:add-customProperty',
               customProperty: { ...customProperty, id }
            });
         }
      },
      [dispatch, relationship.customProperties]
   );

   const handleCustomPropertyUpward = React.useCallback(
      (customProperty: CustomPropertyRow): void => {
         dispatch({
            type: 'relationship:customProperty:move-customProperty-up',
            customPropertyIdx: customProperty.idx
         });
      },
      [dispatch]
   );

   const handleCustomPropertyDownward = React.useCallback(
      (customProperty: CustomPropertyRow): void => {
         dispatch({
            type: 'relationship:customProperty:move-customProperty-down',
            customPropertyIdx: customProperty.idx
         });
      },
      [dispatch]
   );

   const handleCustomPropertyDelete = React.useCallback(
      (customProperty: CustomPropertyRow): void => {
         dispatch({
            type: 'relationship:customProperty:delete-customProperty',
            customPropertyIdx: customProperty.idx
         });
      },
      [dispatch]
   );

   const validateCustomProperty = React.useCallback<ValidationFunction<CustomProperty>>(
      <P extends keyof CustomProperty, V extends CustomProperty[P]>(field: P, value: V): string | undefined => {
         if (field === 'name' && !value) {
            return 'Invalid Name';
         }
         return undefined;
      },
      []
   );

   const columns = React.useMemo<GridColDef<CustomProperty>[]>(
      () => [
         {
            field: 'name',
            headerName: 'Name',
            flex: 200,
            editable: !readonly,
            type: 'string'
         },
         {
            field: 'value',
            headerName: 'Value',
            flex: 200,
            editable: !readonly,
            type: 'string'
         },
         { field: 'description', headerName: 'Description', editable: !readonly, flex: 200 }
      ],
      [readonly]
   );

   const defaultEntry = React.useMemo<CustomProperty>(
      () => ({
         $type: CustomPropertyType,
         id: findNextUnique('customProperty', relationship.customProperties!, customProperty => customProperty.id!),
         $globalId: 'toBeAssigned',
         name: findNextUnique('New custom property', relationship.customProperties!, customProperty => customProperty.name!)
      }),
      [relationship.customProperties]
   );

   // Check if model initialized. Has to be here otherwise the compiler complains.
   if (relationship === undefined) {
      return <ErrorView errorMessage='No relationship!' />;
   }
   return (
      <GridComponent<CustomProperty>
         key={relationship.id + '-grid'}
         gridColumns={columns}
         gridData={relationship.customProperties!}
         defaultEntry={defaultEntry}
         onDelete={handleCustomPropertyDelete}
         onMoveDown={handleCustomPropertyDownward}
         onMoveUp={handleCustomPropertyUpward}
         noEntriesText='No Custom Properties'
         newEntryText='Add custom property'
         onAdd={handleAddCustomProperty}
         onUpdate={handleRowUpdate}
         validateField={validateCustomProperty}
      />
   );
}
