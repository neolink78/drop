import express from 'express';
import router from './routes';
import cors from "cors"
import { createDefaultAdmin } from './services/Auth.service';

const app = express()
const port = parseInt(process.env.PORT || '4000', 10)

// Restrict CORS to the configured frontend origin in production; allow all in dev.
const corsOrigin = process.env.CORS_ORIGIN || process.env.FRONTEND_URL || '*'

app.use(cors({ origin: corsOrigin }))

// Stripe webhooks must receive the untouched raw body to verify the signature.
// Skip the global JSON parser for the webhook path; that route applies its own
// express.raw() middleware. All other routes still get JSON parsing.
app.use((req, res, next) => {
  if (req.originalUrl.startsWith('/webhook')) {
    next();
  } else {
    express.json()(req, res, next);
  }
});

app.use(router)


app.listen(port, async () => {
  console.log(`Listening on port ${port}`)
  
  // Create default admin if none exists
  await createDefaultAdmin();
})