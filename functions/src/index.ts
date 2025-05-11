import express from 'express';
//import router from './routes'
import cors from "cors"

const app = express()
const port = 4000


app.use(express.json())
app.use(cors())
//app.use(router)


app.listen(port, () => {
  console.log(`Listening on port ${port}`)
})