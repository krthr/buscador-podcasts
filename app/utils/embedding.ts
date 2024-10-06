import Episode from '#models/episode'
import edge from 'edge.js'

export function parseEmbeddingLink(episode: Episode) {
  if (!episode.podcast?.embeddingTemplate) {
    return
  }

  const embeddingTemplate = episode.podcast.embeddingTemplate

  if (embeddingTemplate.includes('acast.com')) {
    return edge.renderRawSync(embeddingTemplate, {
      episodeGuid: episode.guid,
    })
  } else if (embeddingTemplate.includes('megaphone.fm')) {
    const episodeId = episode.mediaUrl?.match(/[A-Z0-9]+.mp3/)?.[0]?.replace('.mp3', '')
    return edge.renderRawSync(embeddingTemplate, { episodeId })
  } else if (embeddingTemplate.includes('spreaker.com')) {
    const episodeId = episode.link?.split('--').at(-1)
    return edge.renderRawSync(embeddingTemplate, { episodeId })
  }
}
