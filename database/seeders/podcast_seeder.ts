import { BaseSeeder } from '@adonisjs/lucid/seeders'
import logger from '@adonisjs/core/services/logger'

import Podcast from '#models/podcast'

const PODCASTS = [
  {
    title: 'Presunto Pódcast',
    atomLink: 'https://feeds.acast.com/public/shows/6076586f2baca55c5d26290c',
  },
  {
    title: 'A Fondo Con María Jimena Duzán',
    atomLink: 'https://feeds.megaphone.fm/MAFIALANDSAS7149486171',
  },
  {
    title: 'El Reporte Coronell',
    atomLink: 'https://www.spreaker.com/show/5323098/episodes/feed',
  },
  {
    title: 'DianaUribe.fm',
    atomLink: 'https://dianauribefm.libsyn.com/rss',
  },
]

export default class extends BaseSeeder {
  async run() {
    for (const { atomLink, title } of PODCASTS) {
      let episode = await Podcast.findBy('atom_link', atomLink)

      if (!episode) {
        logger.info({ atomLink, title }, 'creating new episode')
        episode = await Podcast.create({ title, atomLink })
      }
    }
  }
}
