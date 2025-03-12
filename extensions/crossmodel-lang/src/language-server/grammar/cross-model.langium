grammar CrossModel

import 'entity'
import 'relationship'
import 'system-diagram'
import 'mapping'

entry CrossModelRoot:
    (entity=LogicalEntity | 
    relationship=Relationship | 
    systemDiagram=SystemDiagram |
    mapping=Mapping)?;
