import type { CommandOptions } from '@adonisjs/core/types/ace'
import { BaseCommand, flags } from '@adonisjs/core/ace'
import { inject } from '@adonisjs/core'
import logger from '@adonisjs/core/services/logger'

import Episode from '#models/episode'
import ReplicateService from '#services/replicate_service'

export default class EpisodeTranscribeAll extends BaseCommand {
  static commandName = 'episode:transcribe-all'
  static description = ''

  static options: CommandOptions = {
    startApp: true,
  }

  @flags.string({ required: false })
  declare id?: string

  @flags.string({ required: false })
  declare podcastId?: string

  @flags.number({ default: 1 })
  declare limit: number

  @flags.boolean({ default: false })
  declare force: boolean

  @flags.number({ default: 5 })
  declare concurrency: number

  async transcribe(episode: Episode, replicateService: ReplicateService) {
    const { id, title, guid, podcastId } = episode
    const obj = { id, title, guid, podcastId }

    try {
      if (episode.transcriptionChunks && episode.transcriptionText) {
        logger.info(obj, 'episode already transcribed')
        return
      }

      if (!episode.mediaUrl) {
        throw new Error('episode does not have mediaUrl')
      }

      logger.info(obj, 'found episode')

      const { chunks, text } = await replicateService.transcribeAudio(episode.mediaUrl)

      episode.transcriptionChunks = chunks
      episode.transcriptionText = text

      await episode.save()

      logger.info(obj, 'done')
    } catch (error) {
      logger.error({ error, ...obj })
    }
  }

  @inject()
  async run(replicateService: ReplicateService) {
    logger.info(
      {
        limit: this.limit,
        id: this.id,
        force: this.force,
        concurrency: this.concurrency,
      },
      'using arguments'
    )

    let query = Episode.query()

    if (this.id) {
      query = query.where('id', this.id).orWhere('guid', this.id)
      this.force = true
    } else if (this.podcastId) {
      query = query.where('podcast_id', this.podcastId).orWhereHas('podcast', (podcast) => {
        podcast.where('slug', this.podcastId!)
      })
    }

    if (!this.force) {
      query = query.whereNull('transcription_text').orWhereNull('transcription_chunks')
    }

    const episodes = await query.limit(this.limit)

    logger.info(`found ${episodes.length} episodes`)

    while (true) {
      const chunk = episodes.splice(0, this.concurrency)

      if (chunk.length === 0) {
        break
      }

      await Promise.all(chunk.map((episode) => this.transcribe(episode, replicateService)))
    }
  }
}
