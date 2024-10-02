import type { BelongsTo } from '@adonisjs/lucid/types/relations'

import { DateTime } from 'luxon'
import { BaseModel, beforeSave, belongsTo, column } from '@adonisjs/lucid/orm'
import { init as initCuid } from '@paralleldrive/cuid2'
import stringHelpers from '@adonisjs/core/helpers/string'

import Podcast from './podcast.js'

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

  @column.dateTime()
  declare publishedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Podcast)
  declare podcast: BelongsTo<typeof Podcast>

  @beforeSave()
  static async slugify(episode: Episode) {
    if (episode.$dirty.title) {
      const slug = stringHelpers.slug(episode.title, { trim: true, lower: true }) + '-' + cuid()
      episode.slug = slug
    }
  }
}
