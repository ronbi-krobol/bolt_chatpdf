# ChatPDF Setup Guide

## Prerequisites

- Node.js 18+ and npm
- Supabase account
- **OpenAI API key (REQUIRED)** - Must be set in .env file

## Environment Setup

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Fill in your credentials in `.env`:
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_OPENAI_API_KEY=your_openai_api_key
```

⚠️ **IMPORTANT**: `VITE_OPENAI_API_KEY` is required for the app to work. Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys).

## Supabase Configuration

### 1. Database Migrations

All migrations are already applied in your Supabase database:
- ✅ Vector search function
- ✅ Folders and sharing
- ✅ Authentication and user tiers
- ✅ OAuth user profile auto-creation

### 2. Enable OAuth Providers

To enable Google and Facebook sign-in, configure OAuth in Supabase Dashboard:

#### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URIs: `https://your-project.supabase.co/auth/v1/callback`
5. Copy Client ID and Client Secret
6. In Supabase Dashboard:
   - Go to **Authentication** → **Providers**
   - Enable **Google**
   - Paste your Client ID and Client Secret
   - Save

#### Facebook OAuth Setup

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create an app (Consumer type)
3. Add Facebook Login product
4. Configure OAuth redirect URI: `https://your-project.supabase.co/auth/v1/callback`
5. Copy App ID and App Secret
6. In Supabase Dashboard:
   - Go to **Authentication** → **Providers**
   - Enable **Facebook**
   - Paste your App ID and App Secret
   - Save

### 3. Email Authentication

Email/Password authentication works out of the box. Email confirmation is **disabled by default**.

To enable email confirmation (optional):
1. Go to Supabase Dashboard → **Authentication** → **Settings**
2. Enable "Enable email confirmations"
3. Configure email templates if needed

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Build

```bash
npm run build
```

## Deploy to Vercel

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel
```

3. Add environment variables in Vercel dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_OPENAI_API_KEY` (required)

## Features

✅ **Multi-language support** - 26 languages
✅ **Authentication** - Email/Password, Google, Facebook OAuth
✅ **PDF Processing** - Upload, parse, and chat with PDFs
✅ **AI Chat** - Context-aware responses using OpenAI
✅ **Vector Search** - Semantic search with embeddings
✅ **Folders** - Organize PDFs into folders
✅ **Sharing** - Share PDFs and chats
✅ **Usage Limits** - Free tier (3 PDFs/day) vs Plus tier (unlimited)
✅ **PWA Support** - Installable on mobile/desktop
✅ **Mobile Responsive** - Works on all devices

## Troubleshooting

### OAuth Not Working

1. **Check Supabase Dashboard**: Ensure OAuth providers are enabled
2. **Verify Redirect URIs**: Must match exactly in provider console
3. **Check Console Errors**: Open browser DevTools for error messages

### Missing OpenAI API Key

If you get errors about missing OpenAI API key:
1. Ensure `VITE_OPENAI_API_KEY` is set in your `.env` file
2. Restart the dev server after adding the key
3. For production, ensure the environment variable is set in Vercel dashboard

### Build Errors

If you encounter build errors, try:
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

## Support

For issues or questions, check the console logs and Supabase Dashboard logs.
