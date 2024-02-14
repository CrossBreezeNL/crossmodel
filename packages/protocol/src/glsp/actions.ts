/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { Operation, Point, hasArrayProp, hasObjectProp, hasStringProp } from '@eclipse-glsp/protocol';

export interface DropEntityOperation extends Operation {
   kind: typeof DropEntityOperation.KIND;

   /** Insert position for dropped entities. */
   position: Point;
   /** List of file paths that contain entities to be added.  */
   filePaths: string[];
}

export namespace DropEntityOperation {
   export const KIND = 'dropEntityOperation';

   export function is(object: any): object is DropEntityOperation {
      return Operation.hasKind(object, KIND) && hasArrayProp(object, 'filePaths') && hasObjectProp(object, 'position');
   }

   export function create(filePaths: string[], position: Point): DropEntityOperation {
      return {
         kind: KIND,
         isOperation: true,
         filePaths,
         position
      };
   }
}

export interface AddEntityOperation extends Operation {
   kind: typeof AddEntityOperation.KIND;

   /** Insert position for dropped entities. */
   position: Point;
   /** Name of the entity to be added. */
   entityName: string;
}

export namespace AddEntityOperation {
   export const KIND = 'addEntityOperation';

   export function is(object: any): object is AddEntityOperation {
      return Operation.hasKind(object, KIND) && hasStringProp(object, 'entityName') && hasObjectProp(object, 'position');
   }

   export function create(entityName: string, position: Point): AddEntityOperation {
      return {
         kind: KIND,
         isOperation: true,
         entityName,
         position
      };
   }
}

export interface AddSourceObjectOperation extends Operation {
   kind: typeof AddSourceObjectOperation.KIND;

   /** Insert position for dropped entities. */
   position: Point;
   /** Name of the entity to be added. */
   entityName: string;
}

export namespace AddSourceObjectOperation {
   export const KIND = 'addSourceObjectOperation';

   export function is(object: any): object is AddSourceObjectOperation {
      return Operation.hasKind(object, KIND) && hasStringProp(object, 'entityName') && hasObjectProp(object, 'position');
   }

   export function create(entityName: string, position: Point): AddSourceObjectOperation {
      return {
         kind: KIND,
         isOperation: true,
         entityName,
         position
      };
   }
}
