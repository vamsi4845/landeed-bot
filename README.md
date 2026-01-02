# Task Copilot

A task management application with an embedded AI copilot that helps users plan, summarize, and act on their tasks.
## Features

### Task Management
- **Kanban Board**: Visual task organization with Todo, In Progress, and Done columns
- **Drag & Drop**: Move tasks between columns with smooth animations
- **Full CRUD**: Create, edit, and delete tasks with a clean modal interface
- **Priority Levels**: Low, Medium, High, and Urgent with color coding
- **Due Dates**: Track deadlines with overdue highlighting

### AI Copilot
- **Task Summarization**: Get quick overviews of your workload
- **Priority Suggestions**: AI analyzes tasks and recommends focus areas
- **Task Breakdown**: Convert vague tasks into actionable subtasks
- **Natural Language Actions**: Create and update tasks through conversation
- **Context-Aware**: Copilot understands your current tasks and their states

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js Application                      │
├─────────────────────────────────────────────────────────────┤
│  Frontend (React)           │  API Routes                   │
│  ├─ Task Board UI           │  ├─ /api/tasks (CRUD)         │
│  ├─ CopilotKit Provider     │  └─ /api/copilotkit           │
│  ├─ React Query State       │      ├─ CopilotRuntime        │
│  └─ Copilot Sidebar         │      └─ OpenAIAdapter         │
├─────────────────────────────────────────────────────────────┤
│                    Supabase (PostgreSQL)                    │
│  └─ tasks table with RLS policies                           │
└─────────────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| UI Components | Shadcn/ui, Radix UI |
| Styling | Tailwind CSS |
| State Management | React Query|
| Database | Supabase (PostgreSQL) |
| AI Copilot | CopilotKit |
| AI Model | OpenAI (GPT-3.5/GPT-4) |
| Drag & Drop | dnd-kit |

## Quick Start

### Prerequisites
- Node.js 18+
- npm or pnpm
- Supabase account (free tier works)
- OpenAI API key

### 1. Clone and Install

```bash
git clone <repository-url>
cd task-copilot
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the schema from [`src/lib/supabase/migrations/schema.sql`](src/lib/supabase/migrations/schema.sql)

3. Get your project URL and anon key from Settings > API

### 3. Configure Environment

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Demo Mode

If Supabase is not configured, the app runs in demo mode with sample tasks. This lets you explore the UI and copilot features without database setup.

## AI Copilot Usage

Press `Cmd+K` (Mac) or `Ctrl+K` (Windows) to open the copilot sidebar.

### Example Prompts

| What to Say | What Happens |
|-------------|--------------|
| "Summarize my tasks" | Overview of all tasks by status |
| "What should I focus on?" | Priority-based recommendations |
| "Break down 'Build MVP' into subtasks" | Creates actionable subtasks |
| "Create a task to review PR #42" | Adds new task to board |
| "Mark 'Setup database' as done" | Updates task status |

## Design Decisions

### Why Next.js over Vite + Express?
- **Single deployment**: API routes live with frontend
- **Seamless CopilotKit integration**: Runtime endpoint works out of box
- **Server Components**: Initial task load on server, faster first paint
- **Type sharing**: No need to sync types between frontend/backend

### Why Supabase over SQLite?
- **Production-ready**: Scales without migration
- **Real-time capable**: Can add live updates later
- **Auth-ready**: Easy to add user authentication
- **Hosted**: No database server to manage

### Why OpenAI over Google Gemini?
I initially started with the Google Gemini adapter, but encountered rate limiting issues. Switching to OpenAI was seamless—requiring only 2-3 lines of code changes—demonstrating CopilotKit's flexibility to use any model adapter you prefer.

### AI Safety Guardrails

1. **Read vs Write Separation**: Summarize/analyze are instant; mutations show confirmation
2. **Action Preview**: Before any change, copilot explains what it will do
3. **Toast Notifications**: All actions show success/error feedback
4. **No Bulk Deletes**: AI cannot delete multiple tasks at once
5. **Explicit Confirmation**: Destructive actions require user approval

## Tradeoffs Made

| Decision | Tradeoff | Reasoning |
|----------|----------|-----------|
| No auth in MVP | Less secure | Focus on core copilot experience |
| Demo mode fallback | Extra code | Better developer experience |
| Single-page app | No deep linking | Simpler for MVP scope |
| Optimistic updates | Potential inconsistency | Snappier UX |

## Limitations

- **No authentication**: All users see the same tasks
- **No real-time sync**: Requires refresh to see others' changes
- **No offline support**: Requires internet connection
- **No file attachments**: Tasks are text-only
- **No recurring tasks**: One-time tasks only

## What I Would Build Next (2 More Weeks)

### Week 1: Core Improvements
- **Authentication**: Supabase Auth with magic links
- **User-specific tasks**: RLS policies per user
- **Subtask hierarchy**: Nested tasks with progress tracking
- **Real-time updates**: Supabase subscriptions
- **Keyboard navigation**: Full keyboard-driven workflow

### Week 2: Advanced Features
- **Multiple workspaces**: Project/workspace switching
- **Analytics dashboard**: Productivity charts and trends
- **Due date reminders**: Email notifications
- **Mobile optimization**: Responsive touch interactions
- **E2E tests**: Playwright test suite

## Project Structure

```
├── app/
│   ├── api/
│   │   └── copilotkit/route.ts    # CopilotKit runtime
│   ├── globals.css                 # Dark theme styles
│   ├── layout.tsx                  # Providers wrapper
│   └── page.tsx                    # Main task board
├── components/
│   ├── copilot/
│   │   └── CopilotSidebar.tsx     # AI copilot UI + actions
│   ├── providers/
│   │   ├── copilot-provider.tsx   # CopilotKit wrapper
│   │   └── query-provider.tsx     # React Query wrapper
│   ├── tasks/
│   │   ├── TaskBoard.tsx          # Kanban board
│   │   ├── TaskCard.tsx           # Task card component
│   │   ├── TaskColumn.tsx         # Status column
│   │   ├── TaskModal.tsx          # Create/edit modal
│   │   └── DeleteConfirmDialog.tsx
│   └── ui/                         # Shadcn components
├── hooks/
│   └── use-tasks.ts               # React Query hooks
├── lib/
│   ├── supabase/
│   │   ├── client.ts              # Browser client
│   │   ├── server.ts              # Server client
│   │   └── migrations/
│   │       └── schema.sql         # Database schema
│   ├── actions.ts                  # Server actions
│   ├── constants.ts                # Status/priority configs
│   ├── types.ts                    # TypeScript interfaces
│   └── utils.ts                    # Utility functions
```


Link to the deployed app: [Task Copilot](https://task-copilot.vamsi.app/)
