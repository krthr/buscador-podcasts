import type { BelongsTo } from '@adonisjs/lucid/types/relations'

import { DateTime } from 'luxon'
import { BaseModel, beforeSave, belongsTo, column, computed, scope } from '@adonisjs/lucid/orm'
import { init as initCuid } from '@paralleldrive/cuid2'
import logger from '@adonisjs/core/services/logger'
import stringHelpers from '@adonisjs/core/helpers/string'

import Podcast from '#models/podcast'
import { TranscriptionBody } from '#services/replicate_service'
import { buildImageUrl } from '#utils/imagekit'
import { srtFormatTimestamp } from '#utils/episodes'

const cuid = initCuid({ length: 5 })

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

      return null
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
    }

    return { url, preview }
  }

  ///

  @beforeSave()
  static async slugify(episode: Episode) {
    if (episode.$dirty.title) {
      const slug = stringHelpers.slug(episode.title, { trim: true, lower: true }) + '-' + cuid()
      episode.slug = slug
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
}
