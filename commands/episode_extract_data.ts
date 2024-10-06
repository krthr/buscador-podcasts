import type { CommandOptions } from '@adonisjs/core/types/ace'
import { BaseCommand, flags } from '@adonisjs/core/ace'
import { inject } from '@adonisjs/core'
import logger from '@adonisjs/core/services/logger'

import Episode from '#models/episode'
import OpenAiService from '#services/open_ai_service'
import { z } from 'zod'
import { ChatCompletionMessageParam } from 'openai/resources/index.mjs'

export const PodcastExtractedData = z
  .object({
    titulo: z.string(),
    introduccion: z.string(),
    menciones: z
      .array(z.string())
      .describe('Lista de menciones, eventos y referencias importantes en el documento.'),
    capitulos: z
      .array(
        z.object({
          titulo_capitulo: z.string(),
          contenido: z.string(),
        })
      )
      .describe('Lista de capítulos'),
    conclusion: z.string(),
  })
  .strict()

export type StructuredData = z.infer<typeof PodcastExtractedData>

export default class EpisodeExtractData extends BaseCommand {
  static commandName = 'episode:extract-data'
  static description = ''

  static options: CommandOptions = {
    startApp: true,
  }

  @flags.string({ required: false })
  declare id?: string

  @flags.string({ required: false })
  declare podcastId?: string

  @flags.number({ default: 1 })
  declare limit: number

  @flags.boolean({ default: false })
  declare force: boolean

  @flags.number({ default: 3 })
  declare concurrency: number

  @inject()
  async run(openAiService: OpenAiService) {
    logger.info(
      {
        limit: this.limit,
        id: this.id,
        podcastId: this.podcastId,
      },
      'episode transcribe all using arguments'
    )

    let query = Episode.query()

    if (this.id) {
      query = query.where((q) => {
        q.where('id', this.id!).orWhere('guid', this.id!)
      })
    } else if (this.podcastId) {
      query = query.where((q) => {
        q.where('podcast_id', this.podcastId!)
      })
    }

    if (!this.force) {
      query = query.where((q) => {
        q.whereNull('structured_data')
      })
    }

    const episodes = await query
      .limit(this.limit)
      .preload('podcast')
      .orderBy('published_at', 'desc')

    logger.info(`found ${episodes.length} episodes`)

    for (const episode of episodes) {
      logger.info({ id: episode.id, guid: episode.guid, title: episode.title }, 'extracting data')

      const messages: ChatCompletionMessageParam[] = [
        {
          role: 'system',
          content:
            'Eres un periodista que se encarga de resumir capítulos de diferentes reconocidos podcasts colombianos. La transcripción de dichos podcasts te será brindada, tú tendrás que escribir un documento con las información más importante, siguiendo el formato suministrado.',
        },
        {
          role: 'user',
          content: episode.transcriptionText!,
        },
      ]

      const response = await openAiService.generateChat(
        messages,
        PodcastExtractedData,
        'podcast_extracted_data'
      )

      const validationResult = PodcastExtractedData.safeParse(response?.parsed)
      if (validationResult.success) {
        episode.structuredData = validationResult.data
        await episode.save()
      }
    }
  }
}
