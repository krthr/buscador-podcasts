import type { HttpContext } from '@adonisjs/core/http'

import Podcast from '#models/podcast'

export default class PodcastsController {
  async index({ view }: HttpContext) {
    const podcasts = await Podcast.query().preload('episodes', (q) => {
      q.groupLimit(4)
        .groupOrderBy('published_at', 'desc')
        .whereNotNull('structured_data')
        .withScopes((s) => s.simple())
    })

    return view.render('pages/index', { podcasts })
  }

  async show({ params, request, response, view }: HttpContext) {
    const id = params['id']
    const page = request.input('page')

    const podcast = await Podcast.query().where('id', id).orWhere('slug', id).first()
    if (!podcast) {
      return response.redirect('/')
    }

    const episodes = await podcast
      .related('episodes')
      .query()
      .withScopes((s) => s.simple())
      .withScopes((s) => s.public())
      .paginate(page)

    // episodes.getNextPageUrl()
    // episodes.getPreviousPageUrl()
    return view.render('pages/podcast', { podcast, episodes })
  }
}
