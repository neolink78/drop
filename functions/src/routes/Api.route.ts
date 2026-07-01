import { Router } from 'express'
import * as ApiController from '../controllers/Api.controller'

const ApiRouter: Router = Router()

ApiRouter.get('/', ApiController.getApi)
ApiRouter.post('/scrape', ApiController.scrapeProduct)
ApiRouter.post('/test-scrape', ApiController.scrapeProduct)

export default ApiRouter