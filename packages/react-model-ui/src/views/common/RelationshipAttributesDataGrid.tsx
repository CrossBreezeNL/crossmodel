/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { CrossReferenceContext, ModelDiagnostic, RelationshipAttribute, RelationshipAttributeType } from '@crossbreezenl/protocol';
import { GridColDef, GridRenderCellParams, GridRenderEditCellParams, useGridApiContext } from '@mui/x-data-grid';
import * as React from 'react';
import { useModelDispatch, useModelQueryApi, useReadonly, useRelationship } from '../../ModelContext';
import AsyncAutoComplete from './AsyncAutoComplete';
import GridComponent, { GridComponentRow } from './GridComponent';

export interface EditAttributePropertyComponentProps extends GridRenderEditCellParams {
   property: 'child' | 'parent';
}

function getDiagnosticKey(props: { row: { idx: number }; field: string }): string {
   return `attributes[${props.row.idx}].${props.field}`;
}

export function AttributePropertyComponent(
   props: GridRenderCellParams & { diagnostics: Record<string, ModelDiagnostic[] | undefined> }
): React.ReactNode {
   const relevantDiagnostics = props.diagnostics[getDiagnosticKey(props)];
   const content = props.row[props.field];
   const title = relevantDiagnostics?.at(0)?.message || content;
   return <div title={title}>{content}</div>;
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
   const readonly = useReadonly();

   const referenceCtx: CrossReferenceContext = React.useMemo(
      () => ({
         container: { globalId: relationship!.id! },
         syntheticElements: [{ property: 'attributes', type: 'RelationshipAttribute' }],
         property
      }),
      [relationship, property]
   );
   const referenceableElements = React.useCallback(
      () => queryApi.findReferenceableElements(referenceCtx).then(elements => elements.map(element => element.label)),
      [queryApi, referenceCtx]
   );

   const handleValueChange = React.useCallback(
      (newValue: string): void => {
         gridApi.current.setEditCellValue({ id, field, value: newValue });
      },
      [field, gridApi, id]
   );

   const handleOptionsLoaded = React.useCallback(
      (options: string[]) => {
         if (options.length && !value) {
            gridApi.current.setEditCellValue({ id, field, value: options[0] });
         }
      },
      [value, field, gridApi, id]
   );

   return (
      <AsyncAutoComplete
         autoFocus={hasFocus}
         fullWidth={true}
         label=''
         optionLoader={referenceableElements}
         onOptionsLoaded={handleOptionsLoaded}
         onChange={(_evt, newReference) => handleValueChange(newReference)}
         value={value ?? ''}
         clearOnBlur={true}
         selectOnFocus={true}
         disabled={readonly}
         textFieldProps={{ sx: { margin: '0' } }}
      />
   );
}

export type RelationshipAttributeRow = GridComponentRow<RelationshipAttribute>;
export interface RelationshipAttributeDataGridProps {
   diagnostics: Record<string, ModelDiagnostic[] | undefined>;
}

export function RelationshipAttributesDataGrid({ diagnostics }: RelationshipAttributeDataGridProps): React.ReactElement {
   const relationship = useRelationship();
   const dispatch = useModelDispatch();
   const readonly = useReadonly();

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
            editable: !readonly,
            renderEditCell: params => <EditAttributePropertyComponent {...params} property='parent' />,
            renderCell: params => <AttributePropertyComponent {...params} diagnostics={diagnostics} />,
            type: 'singleSelect',
            cellClassName: params => (diagnostics[getDiagnosticKey(params)] && 'Mui-error') || ''
         },
         {
            field: 'child',
            headerName: 'Child',
            flex: 200,
            editable: !readonly,
            renderEditCell: params => <EditAttributePropertyComponent {...params} property='child' />,
            renderCell: params => <AttributePropertyComponent {...params} diagnostics={diagnostics} />,
            type: 'singleSelect',
            cellClassName: params => (diagnostics[getDiagnosticKey(params)] && 'Mui-error') || ''
         }
      ],
      [readonly, diagnostics]
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
