import type { CommandOptions } from '@adonisjs/core/types/ace'
import { BaseCommand, flags } from '@adonisjs/core/ace'
import ace from '@adonisjs/core/services/ace'
import logger from '@adonisjs/core/services/logger'

import Podcast from '#models/podcast'

export default class PodcastAll extends BaseCommand {
  static commandName = 'podcast:all'
  static description = ''

  static options: CommandOptions = {
    startApp: true,
  }

  @flags.string({ required: false })
  declare id?: string

  @flags.number({ default: 1 })
  declare limit: number

  async processPodcast(podcast: Podcast) {
    logger.info({ id: podcast.id, title: podcast.title }, 'processing')

    const episodes = await podcast
      .related('episodes')
      .query()
      .where((q) => {
        q.whereNull('transcription_text').orWhereNull('transcription_chunks')
      })
      .orWhere((q) => {
        q.whereNull('structured_data')
      })
      .limit(this.limit)

    while (true) {
      const chunks = episodes.splice(0, 3)

      await Promise.allSettled(
        chunks.map(async (episode) => {
          await ace.exec('episode:transcribe-all', ['--id', episode.id.toString()])
          await ace.exec('episode:extract-data', ['--id', episode.id.toString()])
        })
      )
    }
  }

  async run() {
    logger.info({ id: this.id }, 'podcast all using arguments')

    let query = Podcast.query()
    if (this.id) {
      query = query.where('id', this.id).orWhere('slug', this.id)
    }

    const podcasts = await query

    logger.info(`found ${podcasts.length} podcasts`)

    for (const podcast of podcasts) {
      await ace.exec('podcast:process-rss', ['--id', podcast.id.toString()])
      await this.processPodcast(podcast)
    }
  }
}
