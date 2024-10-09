import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'

import SearchService from '#services/search_service'

@inject()
export default class SearchController {
  constructor(protected searchService: SearchService) {}

  async search({ request, view }: HttpContext) {
    const q = request.input('q', '*')
    const page = request.input('page')

    const results = await this.searchService.search(q, page)

    return view.render('pages/search', results)
  }
}
