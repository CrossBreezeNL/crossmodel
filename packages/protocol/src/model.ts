/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

export const ModelFileExtensions = {
   Entity: '.entity.cm',
   Relationship: '.relationship.cm',
   Mapping: '.mapping.cm',
   SystemDiagram: '.system-diagram.cm',
   /* @deprecated Use SystemDiagram instead */
   Diagram: '.diagram.cm',
   MappingDiagram: '.mapping-diagram.cm',

   isEntityFile(uri: string): boolean {
      return uri.endsWith(this.Entity);
   },

   isRelationshipFile(uri: string): boolean {
      return uri.endsWith(this.Relationship);
   },

   isMappingFile(uri: string): boolean {
      return uri.endsWith(this.Mapping);
   },

   isSystemDiagramFile(uri: string): boolean {
      return uri.endsWith(this.SystemDiagram) || uri.endsWith(this.Diagram);
   },

   isMappingDiagramFile(uri: string): boolean {
      return uri.endsWith(this.MappingDiagram) || uri.endsWith(this.Mapping);
   }
} as const;
