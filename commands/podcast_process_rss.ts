import type { CommandOptions } from '@adonisjs/core/types/ace'
import { args, BaseCommand } from '@adonisjs/core/ace'
import logger from '@adonisjs/core/services/logger'

import AtomParserService from '#services/atom_parser_service'
import Podcast from '#models/podcast'

export default class PodcastProcessRss extends BaseCommand {
  static commandName = 'podcast:process-rss'
  static description = ''

  static options: CommandOptions = {
    startApp: true,
  }

  @args.string()
  declare id: string

  async run() {
    const podcast = await Podcast.query().where('id', this.id).orWhere('slug', this.id).first()

    if (!podcast) {
      throw new Error(`No podcast found with id/slug = ${this.id}`)
    }

    logger.info(podcast.serialize(), 'found podcast')

    const parsed = await AtomParserService.parse(podcast.atomLink)
    if (!parsed) {
      throw new Error('No parsed data.')
    }

    podcast.title = parsed.title
    podcast.link = parsed.link
    podcast.imageUrl = parsed.image
    podcast.description = parsed.description

    logger.info('saving podcast')
    await podcast.save()

    for (const item of parsed.items) {
      logger.info({ title: item.title, guid: item.guid }, `saving episode`)
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
}
