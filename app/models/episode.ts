import type { BelongsTo } from '@adonisjs/lucid/types/relations'

import { DateTime } from 'luxon'
import { BaseModel, beforeSave, belongsTo, column, computed, scope } from '@adonisjs/lucid/orm'
import logger from '@adonisjs/core/services/logger'
import * as marked from 'marked'
import router from '@adonisjs/core/services/router'
import stringHelpers from '@adonisjs/core/helpers/string'

import Podcast from '#models/podcast'
import { TranscriptionBody } from '#services/replicate_service'
import { buildImageUrl } from '#utils/imagekit'
import { srtFormatTimestamp } from '#utils/episodes'
import { PodcastExtractedData, StructuredData } from '../../commands/episode_extract_data.js'
import { slugify } from '#utils/slugify'

export default class Episode extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare title: string

  @column()
  declare guid: string

  @column()
  declare slug: string

  @column()
  declare description: string | null

  @column()
  declare link: string | null

  @column()
  declare imageUrl: string | null

  @column()
  declare mediaUrl: string | null

  @column()
  declare podcastId: number

  @column()
  declare transcriptionText: string | null

  @column({
    consume(value: string | null) {
      if (value) {
        try {
          return JSON.parse(value) as TranscriptionBody['chunks']
        } catch (error) {
          logger.error({ error })
        }
      }
    },
    prepare(value: TranscriptionBody['chunks'] | null) {
      if (value) {
        try {
          return JSON.stringify(value)
        } catch (error) {
          logger.error({ error })
        }
      }

      return null
    },
  })
  declare transcriptionChunks: TranscriptionBody['chunks'] | null

  @column({
    consume(value: string | null) {
      if (value) {
        try {
          return JSON.parse(value)
        } catch (error) {
          logger.error({ error })
        }
      }
    },
    prepare(value: StructuredData | null) {
      const result = PodcastExtractedData.safeParse(value)

      if (result.success) {
        return JSON.stringify(result.data)
      }
    },
  })
  declare structuredData: StructuredData | null

  @column.dateTime()
  declare publishedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Podcast)
  declare podcast: BelongsTo<typeof Podcast>

  ///

  @computed()
  get excerpt() {
    return this.description && stringHelpers.excerpt(this.description, 100)
  }

  @computed()
  get srt() {
    return this.transcriptionChunks
      ?.map(
        ({ text, timestamp }) =>
          `${srtFormatTimestamp(timestamp[0])} --> ${srtFormatTimestamp(timestamp[1])}\t${text}`
      )
      .join('\n')
  }

  @computed()
  get images() {
    let url: string | undefined
    let preview: string | undefined

    if (this.imageUrl) {
      url = buildImageUrl(this.imageUrl, { w: 400 })
      preview = buildImageUrl(this.imageUrl, { w: 1, blur: 20 })
    } else if (this.podcast?.images) {
      url = this.podcast?.images?.url
      preview = this.podcast?.images?.preview
    }

    return { url, preview }
  }

  @computed()
  get url() {
    return router
      .builder()
      .params({ id: this.slug || this.id })
      .make('episode')
  }

  @computed()
  get structuredDataMarkdown() {
    if (this.structuredData) {
      const markdwn: string[] = []

      markdwn.push(
        `## Introducción`,
        this.structuredData.introduccion,

        '## Capítulos'
      )

      for (const chapter of this.structuredData.capitulos) {
        markdwn.push(`### ${chapter.titulo_capitulo}`)
        markdwn.push(chapter.contenido)
      }

      markdwn.push('## Conclusión', this.structuredData.conclusion)
      markdwn.push('## Menciones', ...this.structuredData.menciones.map((m) => `- ${m}`))

      return markdwn.join('\n')
    }

    return null
  }

  @computed()
  get structuredDataMarkdownRendered() {
    if (this.structuredDataMarkdown) {
      try {
        return marked.parse(this.structuredDataMarkdown)
      } catch (error) {}
    }

    return ''
  }

  ///

  @beforeSave()
  static async slugify(episode: Episode) {
    await slugify(episode, Episode)
  }

  @beforeSave()
  static async generateTranscriptionText(episode: Episode) {
    const transcriptionChunks = episode.transcriptionChunks

    if (transcriptionChunks) {
      episode.transcriptionText = transcriptionChunks.map((chunk) => chunk.text).join('')
    }
  }

  ///

  static simple = scope((query) => {
    query.select(
      'id',
      'title',
      'guid',
      'slug',
      'link',
      'image_url',
      'description',
      'podcast_id',
      'published_at'
    )
  })

  static public = scope((query) => {
    query.whereNotNull('structured_data').orderBy('published_at', 'desc')
  })

  static withId = scope((query, id: string) => {
    query.where((q) => q.where('id', id).orWhere('guid', id).orWhere('slug', id))
  })
}
