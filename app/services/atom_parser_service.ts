import { DateTime } from 'luxon'
import logger from '@adonisjs/core/services/logger'

import { XMLParser } from 'fast-xml-parser'

interface Item {
  title: string
  guid: string
  enclosure: {
    url: string
  }
  description: string | null
  pubDate: DateTime | null
  link: string | null
  image: string | null
}

interface Data {
  title: string
  description: string | null
  link: string | null
  image: string | null
  items: Item[]
}

export default class AtomParserService {
  static async getRssFeed(url: string) {
    try {
      const response = await fetch(url)
      const text = await response.text()

      return text
    } catch (error) {
      logger.error({ error, url }, 'error getting rss feed')
    }
  }

  static async parse(url: string): Promise<Data | undefined> {
    const body = await this.getRssFeed(url)

    if (!body) {
      return
    }

    const parser = new XMLParser({ ignoreAttributes: false, parseAttributeValue: true })
    const xml = parser.parse(body)

    const channel = xml.rss?.channel
    if (!channel) {
      return
    }

    const title = channel.title?.toString()
    if (typeof title !== 'string') {
      return
    }

    const link: string = channel.link
    const description: string = channel.description
    const image = channel.image?.url

    const items: Item[] = []

    for (const item of channel?.item || []) {
      const itemTitle = item.title?.toString()
      const guid = item.guid['#text']

      if (!(typeof title === 'string' && typeof guid === 'string')) {
        continue
      }

      let pubDate: DateTime | null = null
      if (item.pubDate) {
        pubDate = DateTime.fromJSDate(new Date(item.pubDate))
      }

      items.push({
        title: itemTitle,
        guid,
        enclosure: { url: item.enclosure?.['@_url'] },
        image: item['itunes:image']?.['@_href'],
        description: item.description || '',
        pubDate,
        link: item.link,
      })
    }

    const data: Data = {
      title,
      description,
      image,
      link,
      items,
    }

    return data
  }
}
