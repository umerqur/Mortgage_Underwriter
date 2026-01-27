# Mortgage Agent Intake

A React + TypeScript + Vite application for mortgage agent document intake automation.

## Setup

### Prerequisites

- Node.js 18+
- npm

### Environment Variables

Create a `.env` file in the project root with the following variables:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

These environment variables are required for authentication:

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Your Supabase project URL (e.g., `https://knqeeylsvurtgdjkszhu.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase **anon public** key (starts with `eyJ...`) |

**Finding your Supabase anon key:**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Project Settings** > **API**
4. Copy the **anon public** key (under "Project API keys")

⚠️ **Important:** The anon key is a JWT that starts with `eyJ...`. Do NOT use:
- Stripe keys (which start with `sb_publishable_...` or `sk_...`)
- The Supabase service_role key (keep this secret, server-side only)

For Netlify deployments, set these in the Netlify dashboard under Site settings > Environment variables.

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Preview

```bash
npm run preview
```

## Authentication

This application uses Supabase Auth with email/password authentication. Access is restricted to approved email addresses only. Contact admin for access.
