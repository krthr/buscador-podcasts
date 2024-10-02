import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'episodes'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table.text('title').notNullable()
      table.text('guid').unique()
      table.text('slug').notNullable().unique()
      table.text('link')
      table.text('description')

      table.text('image_url')
      table.text('media_url')

      table.integer('podcast_id').references('id').inTable('podcasts')

      table.timestamp('published_at')
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
