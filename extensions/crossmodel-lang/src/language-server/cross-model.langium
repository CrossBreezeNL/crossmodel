grammar CrossModel

import 'entity'
import 'relationship'
import 'system-diagram'
import 'mapping'

entry CrossModelRoot:
    (entity=Entity | 
    relationship=Relationship | 
    systemDiagram=SystemDiagram |
    mapping=Mapping)?;
