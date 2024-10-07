import type { LucidModel } from '@adonisjs/lucid/types/model'
import { init as initCuid } from '@paralleldrive/cuid2'
import stringHelpers from '@adonisjs/core/helpers/string'

import Episode from '#models/episode'
import Podcast from '#models/podcast'

const cuid = initCuid({ length: 5 })

export async function slugify(instance: Episode | Podcast, model: LucidModel) {
  if (instance.slug) {
    return
  }

  let slug = stringHelpers.slug(instance.title, { trim: true, lower: true })
  console.log({ slug })

  const alreadyExists = await model
    .query()
    .where('slug', slug)
    .whereNot('id', instance.id)
    .select('id')
    .first()
  console.log({ alreadyExists })

  if (alreadyExists) {
    slug += cuid()
  }

  instance.slug = slug
}
