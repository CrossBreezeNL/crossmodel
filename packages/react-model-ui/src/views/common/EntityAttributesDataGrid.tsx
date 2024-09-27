/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { EntityAttribute, EntityAttributeType, findNextUnique, toId } from '@crossbreeze/protocol';
import CheckBoxOutlineBlankOutlined from '@mui/icons-material/CheckBoxOutlineBlankOutlined';
import CheckBoxOutlined from '@mui/icons-material/CheckBoxOutlined';
import { GridColDef } from '@mui/x-data-grid';
import * as React from 'react';
import { useEntity, useModelDispatch, useReadonly } from '../../ModelContext';
import { ErrorView } from '../ErrorView';
import GridComponent, { GridComponentRow, ValidationFunction } from './GridComponent';
import { KeyIcon } from './Icons';

export type EntityAttributeRow = GridComponentRow<EntityAttribute>;

export function EntityAttributesDataGrid(): React.ReactElement {
   const entity = useEntity();
   const dispatch = useModelDispatch();
   const readonly = useReadonly();

   // Callback for when the user stops editing a cell.
   const handleRowUpdate = React.useCallback(
      (attribute: EntityAttributeRow): EntityAttributeRow => {
         dispatch({
            type: 'entity:attribute:update',
            attributeIdx: attribute.idx,
            attribute: GridComponentRow.getData(attribute)
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
               attribute: { ...attribute, id: findNextUnique(toId(attribute.name), entity.attributes, attr => attr.id!) }
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

   const columns = React.useMemo<GridColDef<EntityAttribute>[]>(
      () => [
         {
            field: 'name',
            headerName: 'Name',
            flex: 200,
            editable: !readonly,
            type: 'string'
         },
         {
            field: 'datatype',
            headerName: 'Data type',
            editable: !readonly,
            flex: 100,
            type: 'singleSelect',
            valueOptions: ['Integer', 'Float', 'Char', 'Varchar', 'Bool', 'Text']
         },
         {
            field: 'identifier',
            renderHeader: () => <KeyIcon className='header-icon' style={{ color: 'rgba(0, 0, 0, 0.6)' }} fontSize='small' />,
            renderCell: ({ row }) =>
               row.identifier ? (
                  <CheckBoxOutlined style={{ color: 'rgba(0, 0, 0, 0.6)' }} fontSize='small' />
               ) : (
                  <CheckBoxOutlineBlankOutlined style={{ color: 'rgba(0, 0, 0, 0.6)' }} fontSize='small' />
               ),
            maxWidth: 50,
            editable: !readonly,
            type: 'boolean'
         },
         { field: 'description', headerName: 'Description', editable: true, flex: 200 }
      ],
      [readonly]
   );

   const defaultEntry = React.useMemo<EntityAttribute>(
      () => ({
         $type: EntityAttributeType,
         id: findNextUnique('Attribute', entity.attributes, attr => attr.id!),
         $globalId: 'toBeAssigned',
         name: findNextUnique('New Attribute', entity.attributes, attr => attr.name!),
         datatype: 'Varchar'
      }),
      [entity.attributes]
   );

   // Check if model initialized. Has to be here otherwise the compiler complains.
   if (entity === undefined) {
      return <ErrorView errorMessage='No Entity!' />;
   }
   return (
      <GridComponent<EntityAttribute>
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
