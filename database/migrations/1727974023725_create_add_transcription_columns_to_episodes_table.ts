import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'episodes'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.text('transcription_text')
      table.json('transcription_chunks')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumns('transcription_text', 'transcription_chunks')
    })
  }
}
