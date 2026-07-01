# Single-Product Dropshipping Store with AliExpress Integration

A streamlined dropshipping solution designed to sell ONE product at a time. Provide an AliExpress URL, set your markup, and start selling immediately. Product data and order placement use the official **AliExpress Open Platform Dropshipping API**. Built with Next.js, Express, Prisma, and Stripe.

## How It Works

1. **Add Your Product**: Enter an AliExpress product URL in the admin panel. The app fetches full product data (title, images, variants/SKUs, specs, reviews, seller) via `aliexpress.ds.product.get`.
2. **Set Your Price**: Choose your markup percentage (default 50%)
3. **Start Selling**: Your store homepage displays the product with its gallery, variants and specifications at your price.
4. **Automated Fulfillment**: When a customer pays through Stripe, the Stripe webhook automatically places the order on AliExpress (`aliexpress.ds.order.create`) using the customer's shipping address. You receive the Stripe payment; the AliExpress purchase is paid by your connected dropshipping account.

## AliExpress API Setup

1. Register a **buyer** account and join the **AliExpress Dropshipping Center** (required: `aliexpress.ds.*` APIs only work for Dropshipping Center members).
2. Create a developer app at https://console.aliexpress.com and choose the **"Drop Shipping"** application type. You will receive an App Key and App Secret.
3. Register the callback URL `http://<your-host>/api/admin/aliexpress/callback` on the console.
4. Fill `ALIEXPRESS_APP_KEY`, `ALIEXPRESS_APP_SECRET` and `ALIEXPRESS_CALLBACK_URL` in `functions/.env`.
5. From the admin, hit `GET /api/admin/aliexpress/authorize` to connect your account (OAuth). The access token is stored and auto-refreshed.

If the API keys are not configured, the app falls back to a mock product so you can develop locally.

## Features

- **Single Product Focus**
  - One product store for maximum conversion
  - Direct scraping from AliExpress URL
  - Automatic price and image extraction
  - Easy product switching

- **Simple Storefront**
  - Clean, conversion-optimized product page
  - Direct checkout with Stripe
  - Mobile-responsive design
  - Trust badges and guarantees

- **Admin Dashboard**
  - Protected admin area with JWT authentication
  - Product management interface
  - Order management and fulfillment
  - Analytics and statistics

- **Automation**
  - Automated AliExpress order placement (Puppeteer)
  - Order status tracking
  - Refund management

## Tech Stack

### Frontend
- Next.js 14
- React 18
- TypeScript
- TailwindCSS
- SWR for data fetching
- Stripe Elements for payments

### Backend
- Express.js
- TypeScript
- Prisma ORM
- PostgreSQL
- Puppeteer for web scraping
- JWT authentication
- Stripe SDK

## Prerequisites

- Node.js 18+
- PostgreSQL database
- Stripe account
- AliExpress account (for automation)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd drop
```

2. Install dependencies:
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd functions
npm install
cd ..
```

3. Set up environment variables:
```bash
# Frontend (.env.local)
cp .env.example .env.local

# Backend (functions/.env)
cd functions
cp .env.sample .env
```

4. Configure environment variables:
   - Update database connection in `functions/.env`
   - Add Stripe keys in both frontend and backend
   - Set JWT secret and admin credentials
   - Configure AliExpress credentials if using automation

5. Set up database:
```bash
cd functions
npx prisma generate
npx prisma migrate dev
cd ..
```

## Running the Application

1. Start the backend server:
```bash
cd functions
npm run dev
```

2. In a new terminal, start the frontend:
```bash
npm run dev
```

3. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:4000
   - Admin Dashboard: http://localhost:3000/admin

## Default Admin Credentials

- Email: admin@example.com
- Password: admin123

**Important:** Change these credentials immediately after first login.

## API Endpoints

### Public Endpoints
- `GET /api/public/products` - List products
- `GET /api/public/products/:id` - Get product details
- `POST /api/checkout/session` - Create checkout session
- `POST /api/auth/login` - Admin login

### Protected Admin Endpoints
- `POST /api/admin/products` - Create product from AliExpress URL
- `PUT /api/admin/products/:id/markup` - Update product markup
- `GET /api/admin/orders` - List orders
- `POST /api/admin/orders/:id/fulfill` - Fulfill order on AliExpress

## Stripe Webhook Setup

1. Install Stripe CLI:
```bash
stripe listen --forward-to localhost:4000/webhook/stripe
```

2. Copy the webhook signing secret to your `.env` file

3. Test webhook:
```bash
stripe trigger payment_intent.succeeded
```

## Deployment

### Backend Deployment

1. Set production environment variables
2. Build the TypeScript code:
```bash
cd functions
npm run build
```

3. Run migrations:
```bash
npx prisma migrate deploy
```

4. Start with PM2 or similar:
```bash
pm2 start dist/index.js --name dropshipping-api
```

### Frontend Deployment

1. Build the Next.js app:
```bash
npm run build
```

2. Deploy to Vercel:
```bash
vercel
```

Or deploy to any Node.js hosting platform.

## Security Considerations

- Always use HTTPS in production
- Keep JWT secret secure
- Use strong passwords for admin accounts
- Implement rate limiting for scraping endpoints
- Validate Stripe webhook signatures
- Use environment variables for all secrets
- Enable CORS only for your frontend domain

## Testing

Run tests (to be implemented):
```bash
# Backend tests
cd functions
npm test

# Frontend tests
npm test
```

## Troubleshooting

### Common Issues

1. **Puppeteer fails to launch**
   - Install required dependencies: `sudo apt-get install chromium-browser`
   - Use `--no-sandbox` flag in production

2. **Database connection errors**
   - Verify PostgreSQL is running
   - Check DATABASE_URL format
   - Ensure database exists

3. **Stripe webhook failures**
   - Verify webhook secret is correct
   - Check request body is raw (not parsed)
   - Ensure webhook endpoint is accessible

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License
This project is licensed under the MIT License.
