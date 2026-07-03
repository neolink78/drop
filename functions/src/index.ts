import express from 'express';
import router from './routes';
import cors from "cors"
import { createDefaultAdmin } from './services/Auth.service';

const app = express()
const port = parseInt(process.env.PORT || '4000', 10)

// Restrict CORS to the configured frontend origin in production; allow all in dev.
const corsOrigin = process.env.CORS_ORIGIN || process.env.FRONTEND_URL || '*'

app.use(express.json())
app.use(cors({ origin: corsOrigin }))
app.use(router)


app.listen(port, async () => {
  console.log(`Listening on port ${port}`)
  
  // Create default admin if none exists
  await createDefaultAdmin();
})