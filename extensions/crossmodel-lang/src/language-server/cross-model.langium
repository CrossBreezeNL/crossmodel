grammar CrossModel

import 'terminals'
import 'entity'
import 'relationship'
import 'diagram'
import 'mapping'

entry CrossModelRoot:
    (entity=Entity | 
    relationship=Relationship | 
    diagram=SystemDiagram |
    mapping=Mapping)?;
