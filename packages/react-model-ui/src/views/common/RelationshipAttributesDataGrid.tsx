/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { CrossReferenceContext, EntityType, RelationshipAttribute, RelationshipAttributeType } from '@crossbreeze/protocol';
import { GridColDef, GridRenderEditCellParams, useGridApiContext } from '@mui/x-data-grid';
import * as React from 'react';
import { useModelDispatch, useModelQueryApi, useRelationship } from '../../ModelContext';
import AsyncAutoComplete from './AsyncAutoComplete';
import GridComponent, { GridComponentRow } from './GridComponent';

export interface EditAttributePropertyComponentProps extends GridRenderEditCellParams {
   property: 'child' | 'parent';
}

export function EditAttributePropertyComponent({
   id,
   value,
   field,
   hasFocus,
   property
}: EditAttributePropertyComponentProps): React.ReactElement {
   const relationship = useRelationship();
   const queryApi = useModelQueryApi();
   const gridApi = useGridApiContext();

   const referenceCtx: CrossReferenceContext = React.useMemo(
      () => ({
         container: { globalId: relationship!.id! },
         syntheticElements: [{ property: 'attributes', type: 'RelationshipAttribute' }],
         property
      }),
      [relationship, property]
   );
   const referenceableElements = React.useCallback(() => queryApi.findReferenceableElements(referenceCtx), [queryApi, referenceCtx]);

   const handleValueChange = React.useCallback(
      (newValue: string): void => {
         gridApi.current.setEditCellValue({ id, field, value: newValue });
      },
      [field, gridApi, id]
   );

   return (
      <AsyncAutoComplete
         autoFocus={hasFocus}
         fullWidth={true}
         label=''
         optionLoader={referenceableElements}
         onChange={(_evt, newReference) => handleValueChange(newReference.label)}
         value={{ uri: '', label: value ?? '', type: EntityType }}
         clearOnBlur={true}
         selectOnFocus={true}
         textFieldProps={{ sx: { margin: '0' } }}
      />
   );
}

export type RelationshipAttributeRow = GridComponentRow<RelationshipAttribute>;

export function RelationshipAttributesDataGrid(): React.ReactElement {
   const relationship = useRelationship();
   const dispatch = useModelDispatch();

   // Callback for when the user stops editing a cell.
   const handleRowUpdate = React.useCallback(
      (attribute: RelationshipAttributeRow): RelationshipAttributeRow => {
         // Handle change of name property.
         dispatch({
            type: 'relationship:attribute:update',
            attributeIdx: attribute.idx,
            attribute: GridComponentRow.getData(attribute)
         });
         return attribute;
      },
      [dispatch]
   );

   const handleAddAttribute = React.useCallback(
      (attribute: RelationshipAttributeRow): void => {
         if (attribute.child && attribute.parent) {
            dispatch({ type: 'relationship:attribute:add-relationship', attribute });
         }
      },
      [dispatch]
   );

   const handleAttributeUpward = React.useCallback(
      (attribute: RelationshipAttributeRow): void => {
         dispatch({
            type: 'relationship:attribute:move-attribute-up',
            attributeIdx: attribute.idx
         });
      },
      [dispatch]
   );

   const handleAttributeDownward = React.useCallback(
      (attribute: RelationshipAttributeRow): void => {
         dispatch({
            type: 'relationship:attribute:move-attribute-down',
            attributeIdx: attribute.idx
         });
      },
      [dispatch]
   );

   const handleAttributeDelete = React.useCallback(
      (attribute: RelationshipAttributeRow): void => {
         dispatch({
            type: 'relationship:attribute:delete-attribute',
            attributeIdx: attribute.idx
         });
      },
      [dispatch]
   );

   const columns: GridColDef[] = React.useMemo(
      () => [
         {
            field: 'parent',
            headerName: 'Parent',
            flex: 200,
            editable: true,
            renderEditCell: params => <EditAttributePropertyComponent {...params} property='parent' />,
            type: 'singleSelect'
         },
         {
            field: 'child',
            headerName: 'Child',
            flex: 200,
            editable: true,
            renderEditCell: params => <EditAttributePropertyComponent {...params} property='child' />,
            type: 'singleSelect'
         }
      ],
      []
   );

   return (
      <GridComponent
         autoHeight
         gridColumns={columns}
         gridData={relationship.attributes}
         defaultEntry={{ $type: RelationshipAttributeType }}
         onDelete={handleAttributeDelete}
         onMoveDown={handleAttributeDownward}
         onMoveUp={handleAttributeUpward}
         noEntriesText='No Attributes'
         newEntryText='Add Attribute'
         onAdd={handleAddAttribute}
         onUpdate={handleRowUpdate}
      />
   );
}
