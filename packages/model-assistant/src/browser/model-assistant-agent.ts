/********************************************************************************
 * Copyright (c) 2025 CrossBreeze.
 ********************************************************************************/
import { AbstractStreamParsingChatAgent, SystemMessageDescription } from '@theia/ai-chat';
import { LanguageModelRequirement } from '@theia/ai-core';
import { injectable } from '@theia/core/shared/inversify';
import { CROSSMODEL_SYSTEM_PROMPT } from './system-prompt';

@injectable()
export class ModelAssistantAgent extends AbstractStreamParsingChatAgent {
   protected override defaultLanguageModelPurpose = 'chat';
   override id = 'ModelAssistant';
   name = 'ModelAssistant';
   override description = 'CrossModel Data Modeling Assistant';
   promptTemplate = [CROSSMODEL_SYSTEM_PROMPT];

   override languageModelRequirements: LanguageModelRequirement[] = [
      {
         purpose: 'chat',
         identifier: 'openai/gpt-4o'
      }
   ];

   protected override async getSystemMessageDescription(): Promise<SystemMessageDescription | undefined> {
      const resolvedPrompt = await this.promptService.getPrompt(CROSSMODEL_SYSTEM_PROMPT.id);
      return resolvedPrompt ? resolvedPrompt : undefined;
   }
}
