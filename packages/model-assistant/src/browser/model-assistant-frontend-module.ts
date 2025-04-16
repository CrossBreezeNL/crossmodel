/********************************************************************************
 * Copyright (c) 2025 CrossBreeze.
 ********************************************************************************/
import { ChatAgent } from '@theia/ai-chat';
import { Agent, ToolProvider } from '@theia/ai-core';
import { ContainerModule } from '@theia/core/shared/inversify';
import { CreateLogicalEntityToolProvider } from './create-logical-entity-tool-provider';
import { ModelAssistantAgent } from './model-assistant-agent';

export default new ContainerModule((bind, _unbind, _isBound, rebind) => {
   bind(ModelAssistantAgent).toSelf().inSingletonScope();
   bind(Agent).toService(ModelAssistantAgent);
   bind(ChatAgent).toService(ModelAssistantAgent);
   bind(ToolProvider).to(CreateLogicalEntityToolProvider);
});
