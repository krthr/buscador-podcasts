import type { HasMany } from '@adonisjs/lucid/types/relations'

import { DateTime } from 'luxon'
import { BaseModel, column, computed, hasMany } from '@adonisjs/lucid/orm'

import Episode from '#models/episode'
import { buildImageUrl } from '#utils/imagekit'
import path from 'node:path'

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

  @column()
  declare embeddingTemplate: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  ///

  @hasMany(() => Episode)
  declare episodes: HasMany<typeof Episode>

  ///

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

  @computed()
  get url() {
    return path.join('/podcast', this.slug || this.id.toString())
  }
}
