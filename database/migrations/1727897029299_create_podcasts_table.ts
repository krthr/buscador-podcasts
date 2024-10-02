import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'podcasts'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table.text('title').notNullable()
      table.text('description')
      table.text('slug').notNullable().unique()
      table.text('link')

      table.text('image_url')
      table.text('atom_link').unique()

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
