/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/
import {
   ChildrenAccessor,
   EdgeMetadata,
   Mix,
   ModelElementMetadata,
   NodeMetadata,
   PEdge,
   PLabel,
   PModelElement,
   PModelElementSnapshot,
   PNode,
   SVGMetadataUtils,
   Selectable,
   SelectableOptions,
   defined,
   useClickableFlow,
   useCommandPaletteCapability,
   useDeletableFlow,
   useDraggableFlow,
   useHoverableFlow,
   usePopupCapability,
   useRenameableFlow,
   useResizeHandleCapability,
   useRoutingPointCapability,
   useSelectableFlow
} from '@eclipse-glsp/glsp-playwright/';
import { Locator } from '@playwright/test';

const LabelHeaderMixin = Mix(PLabel).flow(useClickableFlow).flow(useRenameableFlow).build();

@ModelElementMetadata({
   type: 'label:entity'
})
export class LabelLogicalEntity extends LabelHeaderMixin {}

const LogicalEntityMixin = Mix(PNode)
   .flow(useClickableFlow)
   .flow(useHoverableFlow)
   .flow(useDeletableFlow)
   .flow(useDraggableFlow)
   .flow(useRenameableFlow)
   .flow(useSelectableFlow)
   .capability(useResizeHandleCapability)
   .capability(usePopupCapability)
   .capability(useCommandPaletteCapability)
   .build();

@NodeMetadata({
   type: 'node:entity'
})
export class LogicalEntity extends LogicalEntityMixin {
   override readonly children = new LogicalEntityChildren(this);

   get label(): Promise<string> {
      return this.children.label().then(label => label.textContent());
   }
}

export class LogicalEntityChildren extends ChildrenAccessor {
   async label(): Promise<LabelLogicalEntity> {
      return this.ofType(LabelLogicalEntity, { selector: SVGMetadataUtils.typeAttrOf(LabelLogicalEntity) });
   }

   async attributes(): Promise<LogicalAttribute[]> {
      return this.allOfType(LogicalAttribute);
   }
}

@ModelElementMetadata({
   type: 'comp:attribute'
})
export class LogicalAttribute extends PModelElement {
   override async snapshot(): Promise<PModelElementSnapshot & { name: string; datatype: string }> {
      return {
         ...(await super.snapshot()),
         name: await this.name(),
         datatype: await this.datatype()
      };
   }

   async name(): Promise<string> {
      return defined(await this.locate().locator('.attribute').textContent());
   }

   async datatype(): Promise<string> {
      return defined(await this.locate().locator('.datatype').textContent());
   }
}

const RelationshipMixin = Mix(PEdge)
   .flow(useClickableFlow)
   .flow(useSelectableFlow)
   .flow(useDeletableFlow)
   .capability(useRoutingPointCapability)
   .build();
@EdgeMetadata({
   type: 'edge:relationship'
})
export class Relationship extends RelationshipMixin {
   override click(options?: Parameters<Locator['click']>[0] & { dispatch?: boolean }): Promise<void> {
      // custom: straight lines may be detected as invisible if they do not have a height so we use force click
      return super.click({ force: true, ...options });
   }

   override async select(options?: SelectableOptions): Promise<void> {
      // custom: straight lines may be detected as invisible if they do not have a height, so we wait for attached instead of visible
      await this.click();
      return this.locate()
         .and(this.page.locator(`.${Selectable.CSS}`))
         .waitFor({ state: 'attached' });
   }
}
