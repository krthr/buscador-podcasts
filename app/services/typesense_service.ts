import type {
  CollectionCreateOptions,
  CollectionCreateSchema,
} from 'typesense/lib/Typesense/Collections.js'

import { Client } from 'typesense'
import env from '#start/env'
import { inject } from '@adonisjs/core'
import logger from '@adonisjs/core/services/logger'
import { SearchParams } from 'typesense/lib/Typesense/Documents.js'

@inject()
export default class TypesenseService {
  readonly client: Client

  constructor() {
    this.client = new Client({
      nodes: [{ url: env.get('TYPESENSE_URL', '') }],
      apiKey: env.get('TYPESENSE_API_KEY', ''),
    })
  }

  async getOrCreateCollection(schema: CollectionCreateSchema, options?: CollectionCreateOptions) {
    const name = schema.name

    logger.info(`getting or creating collection: ${name}`)

    const collections = await this.client.collections().retrieve()

    logger.info(`found ${collections.length} collections`)

    const col = collections.filter((c) => c.name === name)[0]

    if (col) {
      logger.info({ col }, 'collection found')
      return
    }

    logger.info(`collection not found. creating a new one`)
    await this.client.collections().create(schema, options)
  }

  async search<T extends object>(name: string, params: SearchParams) {
    const response = await this.client.collections<T>(name).documents().search(params)
    return response
  }

  async index(name: string, document: object) {
    logger.info(`indexing document in ${name}`)

    await this.client.collections(name).documents().upsert(document)
  }

  async indexBulk(name: string, documents: object[]) {
    logger.info(`bulk indexing ${documents.length} in ${name}`)

    try {
      await this.client.collections(name).documents().import(documents, { action: 'upsert' })
    } catch (error: any) {
      logger.error({ error })
    }
  }
}
