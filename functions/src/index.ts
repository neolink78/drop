import express from 'express';
import router from './routes';
import cors from "cors"
import { createDefaultAdmin } from './services/Auth.service';

const app = express()
const port = 4000


app.use(express.json())
app.use(cors())
app.use(router)


app.listen(port, async () => {
  console.log(`Listening on port ${port}`)
  
  // Create default admin if none exists
  await createDefaultAdmin();
})