import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'podcasts'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('embedding_template')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('embedding_template')
    })
  }
}
