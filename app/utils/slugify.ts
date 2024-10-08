import { LucidModel } from '@adonisjs/lucid/types/model'
import { init as initCuid } from '@paralleldrive/cuid2'
import stringHelpers from '@adonisjs/core/helpers/string'

const cuid = initCuid({ length: 5 })

export async function slugify(model: LucidModel, title: string, id?: string | number) {
  let slug = stringHelpers.slug(title, { trim: true, lower: true })

  let query = model.query().select('id').where('slug', slug)
  if (id) {
    query = query.whereNot('id', id)
  }

  const alreadyExists = await query.first()
  if (alreadyExists) {
    slug += cuid()
  }

  return slug
}
