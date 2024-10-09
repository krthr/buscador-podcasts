import type { CollectionCreateSchema } from 'typesense/lib/Typesense/Collections.js'
import type { CommandOptions } from '@adonisjs/core/types/ace'

import { inject } from '@adonisjs/core'
import { BaseCommand } from '@adonisjs/core/ace'

import TypesenseService from '#services/typesense_service'
import Podcast from '#models/podcast'
import logger from '@adonisjs/core/services/logger'
import Episode from '#models/episode'

export const EPISODES_INDEX = 'episodes_2024_10_09_23_57'

const EPISODES_SCHEMA: CollectionCreateSchema = {
  name: EPISODES_INDEX,
  fields: [
    {
      name: 'title',
      type: 'string',
    },
    {
      name: 'description',
      type: 'string',
      optional: true,
    },
    {
      name: 'excerpt',
      optional: true,
      type: 'string',
    },
    {
      name: 'images',
      type: 'object',
      index: false,
      optional: true,
    },
    {
      name: 'podcast.id',
      type: 'int64',
    },
    {
      name: 'podcast.title',
      type: 'string',
    },
    {
      name: 'podcast.slug',
      type: 'string',
    },
    {
      name: 'podcast.description',
      type: 'string',
      optional: true,
    },
    {
      name: 'podcast.images',
      type: 'object',
      index: false,
      optional: true,
    },
    {
      name: 'slug',
      type: 'string',
      index: false,
    },
    {
      name: 'url',
      type: 'string',
      index: false,
      optional: true,
    },
    {
      name: 'transcriptionText',
      type: 'string',
    },
    {
      name: 'structuredDataMarkdown',
      type: 'string',
    },
    {
      name: 'publishedAt',
      type: 'int64',
    },
  ],
  enable_nested_fields: true,
  // default_sorting_field: 'publishedAt',
}

export interface EpisodesSchema
  extends Pick<
    Episode,
    | 'title'
    | 'description'
    | 'excerpt'
    | 'images'
    | 'slug'
    | 'transcriptionText'
    | 'structuredDataMarkdown'
  > {
  id: string
  podcast: Pick<Podcast, 'id' | 'title' | 'description' | 'images' | 'slug'>
  publishedAt: number
}

export default class PodcastIndex extends BaseCommand {
  static commandName = 'podcast:index'
  static description = ''

  static options: CommandOptions = {
    startApp: true,
  }

  @inject()
  async run(typesenseService: TypesenseService) {
    logger.info('creating/updating collections')

    await typesenseService.getOrCreateCollection(EPISODES_SCHEMA)

    logger.info('indexing episodes')

    const episodes = await Episode.query()
      .whereNotNull('transcription_text')
      .andWhereNotNull('structured_data')
      .preload('podcast')

    const documents = episodes.map((episode) => {
      const {
        id,
        description,
        excerpt,
        images,
        podcast,
        slug,
        title,
        transcriptionText,
        publishedAt,
        url,
        structuredDataMarkdown,
      } = episode

      return {
        id: id.toString(),
        title,
        description,
        excerpt,
        images,
        slug,
        transcriptionText,
        structuredDataMarkdown,
        url,
        podcast: {
          id: podcast.id,
          title: podcast.title,
          slug: podcast.slug,
          url: podcast.url,
          description: podcast.description,
          images: podcast.images,
        },
        publishedAt: publishedAt?.toMillis(),
      } as EpisodesSchema
    })

    await typesenseService.indexBulk(EPISODES_SCHEMA.name, documents)
  }
}
