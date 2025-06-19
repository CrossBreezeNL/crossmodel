/********************************************************************************
 * Copyright (c) 2025 CrossBreeze.
 ********************************************************************************/
import { AbstractStreamParsingChatAgent, ChatService } from '@theia/ai-chat';
import { LanguageModelRequirement } from '@theia/ai-core';
import { nls } from '@theia/core';
import { inject, injectable } from '@theia/core/shared/inversify';
import { CreateLogicalEntityToolProvider } from './create-logical-entity-tool-provider';
import { CROSSMODEL_SYSTEM_PROMPT } from './system-prompt';

@injectable()
export class ModelAssistantAgent extends AbstractStreamParsingChatAgent {
   @inject(ChatService) protected readonly chatService: ChatService;

   protected override defaultLanguageModelPurpose = 'chat';
   override id = 'ModelAssistant';
   name = 'ModelAssistant';
   override description = nls.localize(
      'theia/ai/workspace/workspaceAgent/description',
      'An AI Assistant integrated into CrossModel, a data modeling tool. This agent can access the users workspace, it can get a list of all available files \
       and folders and retrieve their content. It cannot modify files. It can therefore answer questions about the data models in the workspace, such as where entities from a certain subject area reside, where to model certain entities, etc.'
   );
   prompts = [CROSSMODEL_SYSTEM_PROMPT];
   override functions = ['getWorkspaceDirectoryStructure', 'getWorkspaceFileList', 'getFileContent', CreateLogicalEntityToolProvider.ID];
   protected override systemPromptId: string | undefined = CROSSMODEL_SYSTEM_PROMPT.id;

   override languageModelRequirements: LanguageModelRequirement[] = [
      {
         purpose: 'chat',
         identifier: 'openai/gpt-4o'
      }
   ];
}
