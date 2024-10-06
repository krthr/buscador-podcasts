import type { CommandOptions } from '@adonisjs/core/types/ace'
import { BaseCommand, flags } from '@adonisjs/core/ace'
import logger from '@adonisjs/core/services/logger'

import AtomParserService from '#services/atom_parser_service'
import Podcast from '#models/podcast'

export default class PodcastProcessRss extends BaseCommand {
  static commandName = 'podcast:process-rss'
  static description = ''

  static options: CommandOptions = {
    startApp: true,
  }

  @flags.string({ required: false })
  declare id?: string

  async processPodcast(podcast: Podcast) {
    const parsed = await AtomParserService.parse(podcast.atomLink)
    if (!parsed) {
      throw new Error('No parsed data.')
    }

    podcast.title = parsed.title
    podcast.link = parsed.link
    podcast.imageUrl = parsed.image
    podcast.description = parsed.description

    await podcast.save()

    for (const item of parsed.items) {
      // logger.info({ title: item.title, guid: item.guid }, `saving episode`)
      await podcast.related('episodes').updateOrCreate(
        {
          guid: item.guid,
        },
        {
          title: item.title,
          imageUrl: item.image,
          link: item.link,
          description: item.description,
          mediaUrl: item.enclosure.url,
          publishedAt: item.pubDate,
        }
      )
    }
  }

  async run() {
    logger.info({ id: this.id }, 'podcast process rss using arguments')

    let query = Podcast.query()
    if (this.id) {
      query = query.where('id', this.id).orWhere('slug', this.id)
    }

    const podcasts = await query

    logger.info(`found ${podcasts.length} podcasts`)

    for (const podcast of podcasts) {
      await this.processPodcast(podcast)
    }
  }
}
