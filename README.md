# 🇨🇦 Canada PR Chat

A real-time chat application for Canada Permanent Residence (PR) applicants to connect with others who applied in the same month.

## What is this app?

Canada PR Chat allows PR applicants to join monthly chat groups (e.g., "November 2025 Applicants") and communicate in real-time with fellow applicants who are at the same stage of the process. Share tips, updates, and support each other through the journey to Canadian permanent residency.

## Screenshots

> _Add screenshots here after deploying the app_

| Landing Page | Groups | Chat Room |
|---|---|---|
| ![Landing](docs/landing.png) | ![Groups](docs/groups.png) | ![Chat](docs/chat.png) |

## Prerequisites

- [Node.js](https://nodejs.org/) 18+ and npm
- A [Supabase](https://supabase.com/) account (free tier works great)

## Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/CanadaPR.git
cd CanadaPR
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create a Supabase project

1. Go to [supabase.com](https://supabase.com/) and sign up/log in
2. Click **"New Project"** and fill in the details
3. Wait for the project to be ready (~1-2 minutes)

### 4. Run the database schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Copy the contents of `supabase/schema.sql`
3. Paste it into the SQL editor and click **Run**

### 5. Enable Realtime on the messages table

1. In your Supabase dashboard, go to **Database → Replication**
2. Under **"Source"**, find the `messages` table
3. Toggle it on to enable realtime updates

### 6. Set up environment variables

```bash
cp .env.example .env.local
```

Then edit `.env.local` and fill in your Supabase project credentials:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

You can find these values in your Supabase project under **Settings → API**.

### 7. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous/public API key |

## Project Structure

```
├── app/
│   ├── layout.tsx              # Root layout with Navbar
│   ├── page.tsx                # Landing page
│   ├── login/page.tsx          # Login page
│   ├── signup/page.tsx         # Sign up page
│   ├── profile/page.tsx        # Profile setup page
│   ├── groups/page.tsx         # List of monthly chat groups
│   └── chat/[month]/page.tsx   # Chat room for a specific month
├── components/
│   ├── AuthProvider.tsx        # Auth context provider
│   ├── Navbar.tsx              # Navigation bar
│   ├── ChatMessage.tsx         # Single chat message bubble
│   ├── ChatInput.tsx           # Message input component
│   └── GroupCard.tsx           # Card for each monthly group
├── lib/
│   └── supabase.ts             # Supabase client initialization
├── supabase/
│   └── schema.sql              # Database schema SQL
└── .env.example                # Example environment variables
```

## Tech Stack

- **Framework:** [Next.js 14](https://nextjs.org/) (App Router)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Backend/Database/Auth:** [Supabase](https://supabase.com/)
- **Language:** TypeScript

## Roadmap

- [ ] Direct messaging between users
- [ ] Push notifications for new messages
- [ ] File/image sharing in chat
- [ ] User avatars
- [ ] Message reactions (emoji)
- [ ] Status update announcements (e.g., "PPR received!")
- [ ] Search messages
- [ ] Dark mode
- [ ] Mobile app (React Native)
- [ ] Weekly digest emails for group activity
