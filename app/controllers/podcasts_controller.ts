import type { HttpContext } from '@adonisjs/core/http'

import Podcast from '#models/podcast'

export default class PodcastsController {
  async index({ view }: HttpContext) {
    const podcasts = await Podcast.query().preload('episodes', (q) => {
      q.groupLimit(4)
        .groupOrderBy('published_at', 'desc')
        .withScopes((s) => s.simple())
    })

    return view.render('pages/index', { podcasts })
  }
}
