import Episode from '#models/episode'
import type { HttpContext } from '@adonisjs/core/http'

export default class EpisodesController {
  async show({ params, response, view }: HttpContext) {
    const id = params['id']

    const episode = await Episode.query()
      .withScopes((s) => s.withId(id))
      .preload('podcast')
      .first()

    if (!episode) {
      return response.redirect('/')
    }

    return view.render('pages/episode', { episode })
  }

  async transcription({ params }: HttpContext) {
    const id = params['id']

    const episode = await Episode.query()
      .withScopes((s) => s.withId(id))
      .select('transcription_text', 'transcription_chunks', 'id')
      .firstOrFail()

    const { transcriptionChunks: chunks, transcriptionText: text } = episode

    return {
      chunks,
      text,
    }
  }

  async markdown({ params }: HttpContext) {
    const id = params['id']

    const episode = await Episode.query()
      .withScopes((s) => s.withId(id))
      .select('structured_data', 'id')
      .firstOrFail()

    return episode.structuredDataMarkdown
  }
}
