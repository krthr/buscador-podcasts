/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'

const EpisodesController = () => import('#controllers/episodes_controller')
const PodcastsController = () => import('#controllers/podcasts_controller')
const SearchController = () => import('#controllers/search_controller')

router.get('/', [PodcastsController, 'index']).as('index')
router.get('/search', [SearchController, 'search']).as('search')
router.get('/podcast/:id', [PodcastsController, 'show']).as('podcast')
router.get('/:id', [EpisodesController, 'show']).as('episode')
router.get('/:id/transcription', [EpisodesController, 'transcription']).as('episode.transcription')
router.get('/:id/markdown', [EpisodesController, 'markdown']).as('episode.markdown')
