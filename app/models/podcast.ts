import type { HasMany } from '@adonisjs/lucid/types/relations'

import { DateTime } from 'luxon'
import { BaseModel, beforeSave, column, hasMany } from '@adonisjs/lucid/orm'
import { init as initCuid } from '@paralleldrive/cuid2'
import stringHelpers from '@adonisjs/core/helpers/string'

import Episode from './episode.js'

const cuid = initCuid({ length: 5 })

export default class Podcast extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare title: string

  @column()
  declare link: string | null

  @column()
  declare slug: string

  @column()
  declare description: string | null

  @column()
  declare imageUrl: string | null

  @column()
  declare atomLink: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @hasMany(() => Episode)
  declare episodes: HasMany<typeof Episode>

  @beforeSave()
  static async slugify(podcast: Podcast) {
    if (podcast.$dirty.title) {
      const slug = stringHelpers.slug(podcast.title, { trim: true, lower: true }) + '-' + cuid()
      podcast.slug = slug
    }
  }
}
