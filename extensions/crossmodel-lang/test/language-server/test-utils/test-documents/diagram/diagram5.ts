/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
export const diagram5 = `systemDiagram:
    id: Systemdiagram1
    name: "System diagram 1"
    description: "This is a basic diagram with nodes and edges"
    nodes:
        - id: CustomerNode
          entity: Customer
          x: 100
          y: 100
          width: 100
          height: 100
    edges:  
        - id: OrderCustomerEdge
          relationship: Order_Customer
          sourceNode: Anything
          targetNode: IsPossible`;
