# 🎨 Pixelora AI

> **AI-Powered Thumbnail Generator for Content Creators**

A modern, scalable web application built with Next.js 14 that generates stunning thumbnails using artificial intelligence. Perfect for YouTubers, content creators, and social media professionals.

## ✨ Features

- 🤖 **AI-Powered Generation** - Create stunning thumbnails with advanced AI models
- 👤 **Persona Management** - Upload and manage character personas for consistent branding
- 🎨 **Style References** - Define visual styles with multiple reference images
- 📱 **Responsive Design** - Works seamlessly across all devices
- ⚡ **Real-time Processing** - Fast thumbnail generation with live previews
- 💳 **Credit System** - Flexible credit-based pricing model
- 🔐 **Secure Authentication** - Powered by Clerk with webhook synchronization
- 📊 **Usage Analytics** - Track your generation history and usage patterns

## 🚀 Live Demo

**[View Live Application →](https://pixelora-ai.vercel.app/)**

### Demo Accounts

```
Creator: creator@pixelora.dev / TestCreator123!
Admin: admin@pixelora.dev / TestAdmin123!
```

## 🏗️ Tech Stack

### Frontend

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Custom components with Lucide Icons
- **State Management**: React Server Components

### Backend

- **Runtime**: Node.js
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Clerk (with webhooks)
- **Image Processing**: ImageKit.io
- **Payments**: Stripe

### Infrastructure

- **Hosting**: Vercel
- **Database**: Neon/Supabase PostgreSQL
- **CDN**: Vercel Edge Network
- **Monitoring**: Vercel Analytics

## 📦 Installation

### Prerequisites

- Node.js 18.x or higher
- PostgreSQL database
- Clerk account for authentication
- ImageKit.io account for image processing

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/pixelora-ai.git
cd pixelora-ai
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Environment Setup

Create a `.env.local` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/pixelora"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
CLERK_WEBHOOK_SECRET="whsec_..."

# ImageKit
NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT="https://ik.imagekit.io/yourapp"
IMAGEKIT_PRIVATE_KEY="private_..."
IMAGEKIT_PUBLIC_KEY="public_..."

# Stripe (optional)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

### 4. Database Setup

```bash
# Push database schema
npx drizzle-kit push

# Optional: Seed with test data
npm run db:seed
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
pixelora-ai/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard pages
│   └── globals.css        # Global styles
├── components/            # Reusable UI components
├── lib/                   # Utility functions
│   ├── db/               # Database schema & config
│   └── utils.ts          # Helper functions
├── hooks/                 # Custom React hooks
├── middleware.ts          # Clerk middleware
└── public/               # Static assets
```

## 🔧 Configuration

### Database Schema

The application uses Drizzle ORM with the following main entities:

- **Users** - User accounts and preferences
- **Personas** - Character images for consistent branding
- **Styles** - Visual style references
- **Generations** - AI generation history
- **Credits** - User credit transactions

### Authentication Flow

1. User signs up/in via Clerk
2. Webhook creates user record in database
3. User receives default credits
4. Protected routes accessible via middleware

### AI Generation Pipeline

1. User submits prompt with optional persona/style
2. System processes and enhances prompt
3. AI model generates thumbnail
4. Image processed and stored via ImageKit
5. Generation record saved to database

## 🧪 Testing

### Run Tests

```bash
# Unit tests
npm run test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e
```

### Test Accounts

Use the demo accounts listed above for testing functionality without creating new accounts.

## 🚢 Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Connect repository to Vercel
3. Configure environment variables
4. Deploy automatically on push

### Environment Variables

Ensure all production environment variables are set in your deployment platform.

### Database Migration

```bash
# Production migration
npx drizzle-kit push --config=drizzle.config.ts
```

## 📚 API Documentation

### Authentication

All API routes require authentication via Clerk:

```bash
Authorization: Bearer <clerk-session-token>
```

### Key Endpoints

- `POST /api/generations` - Create new thumbnail
- `GET /api/generations/history` - Get user's generation history
- `GET /api/personas` - Get user's personas
- `POST /api/personas` - Create new persona
- `GET /api/styles` - Get user's styles

### Webhooks

- `POST /api/webhooks/clerk` - User sync webhook
- `POST /api/webhooks/stripe` - Payment webhook

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Code Style

- Use TypeScript for type safety
- Follow ESLint configuration
- Format with Prettier
- Write meaningful commit messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
