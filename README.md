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
VITE_SUPABASE_ANON_KEY=your-anon-key
```

These environment variables are required for authentication:

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon/public key |

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
