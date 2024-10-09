import { inject } from '@adonisjs/core'

import logger from '@adonisjs/core/services/logger'

import TypesenseService from '#services/typesense_service'
import { parsePage } from '#utils/paginate'

import { EPISODES_INDEX, EpisodesSchema } from '#commands/podcast_index'
import router from '@adonisjs/core/services/router'

@inject()
export default class SearchService {
  constructor(private typesenseService: TypesenseService) {}

  async search(q: string, p: any) {
    try {
      const page = parsePage(p)

      const results = await this.typesenseService.client
        .collections<EpisodesSchema>(EPISODES_INDEX)
        .documents()
        .search({
          q,
          query_by: 'title,description,excerpt,transcriptionText',
          page,
          per_page: 24,
          highlight_affix_num_tokens: 10,
          max_candidates: 10,
          sort_by: '_text_match:desc,publishedAt:desc',
        })

      const perPage = results.request_params.per_page || 24
      const totalFound = results.found
      const totalPages = Math.ceil(totalFound / perPage)

      let nextPage: string | undefined
      let prevPage: string | undefined

      if (page > 1) {
        prevPage = router
          .builder()
          .qs({ page: page - 1, q })
          .make('search')
      }

      if (page < totalPages) {
        nextPage = router
          .builder()
          .qs({ page: page + 1, q })
          .make('search')
      }

      return {
        hits: results.hits || [],
        currentPage: results.page,
        perPage,
        totalPages,
        totalFound,
        nextPage,
        prevPage,
        q,
      }
    } catch (error) {
      logger.error({ q, error: error.toString() })
      return {}
    }
  }
}
