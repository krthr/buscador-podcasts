import type { ChatCompletionMessageParam } from 'openai/resources/index.mjs'

import OpenAI from 'openai'
import { zodResponseFormat } from 'openai/helpers/zod'
import { z } from 'zod'

export default class OpenAiService {
  private openai: OpenAI

  constructor() {
    this.openai = new OpenAI({})
  }

  async generateChat(messages: ChatCompletionMessageParam[], zodObject: z.ZodType, name: string) {
    const response = await this.openai.beta.chat.completions.parse({
      model: 'gpt-4o',
      messages,
      response_format: zodResponseFormat(zodObject, name),
    })

    return response.choices.at(0)?.message
  }
}
