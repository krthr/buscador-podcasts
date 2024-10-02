/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'

// const PodcastsController = () => import('#controllers/podcasts_controller')

router.on('/').render('pages/index')
// router.get('/', [PodcastsController, 'index'])
