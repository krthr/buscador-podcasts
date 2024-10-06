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

  async run() {
    logger.info({ id: this.id }, 'podcast all using arguments')

    let query = Podcast.query()
    if (this.id) {
      query = query.where('id', this.id).orWhere('slug', this.id)
    }

    const podcasts = await query

    logger.info(`found ${podcasts.length} podcasts`)

    for (const podcast of podcasts) {
      logger.info({ id: podcast.id, title: podcast.title }, 'processing')

      await ace.exec('podcast:process-rss', ['--id', podcast.id.toString()])
      await ace.exec('episode:transcribe-all', [
        '--limit',
        this.limit.toString(),
        '--podcast-id',
        podcast.id.toString(),
      ])
    }
  }
}
