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
- **Task Summarization**: Get quick overviews of your workload and statistics
- **Priority Suggestions**: AI analyzes tasks and recommends focus areas
- **Task Breakdown**: Convert vague tasks into actionable subtasks with descriptions
- **Natural Language Actions**: Create, update, and delete tasks through conversation
- **Context-Aware**: Copilot has real-time access to all tasks, statuses, and due dates
- **Smart Task Lookup**: Find tasks by partial title match before performing operations

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

### Available Tools

The copilot has access to 6 frontend tools:

| Tool | Description |
|------|-------------|
| `findTask` | Search tasks by title (partial match) to get task ID |
| `createTask` | Create a new task with title, description, priority, status, due date |
| `updateTask` | Update any field of an existing task |
| `markTaskComplete` | Quick action to mark a task as done |
| `deleteTask` | Remove a task (with confirmation) |
| `breakdownTask` | Split a task into subtasks with titles and descriptions |

### Context Available to AI

The copilot has real-time access to:
- All tasks with their IDs, titles, statuses, priorities, and due dates
- Task statistics (total, by status, high priority count, overdue count)
- Parent/subtask relationships

### Example Prompts

| What to Say | What Happens |
|-------------|--------------|
| "Summarize my tasks" | Overview of all tasks by status with statistics |
| "What should I focus on?" | Priority-based recommendations considering due dates |
| "Break down 'Build MVP' into subtasks" | Creates subtasks with titles and descriptions |
| "Create a high priority task to review PR #42" | Adds new task with specified priority |
| "Mark 'Setup database' as done" | Finds task and updates status to done |
| "Change the API task to urgent" | Updates task priority |
| "Delete the old demo task" | Removes task after confirmation |

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

### Copilot Architecture

The AI copilot uses CopilotKit's hooks for a clean separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                    use-copilot-actions.ts                   │
├─────────────────────────────────────────────────────────────┤
│  useCopilotReadable        │  Exposes task data & stats    │
│  useCopilotAdditionalInstructions │  AI behavior rules     │
│  useFrontendTool (x6)      │  Task operations              │
│  useCopilotChatSuggestions │  Quick action buttons         │
├─────────────────────────────────────────────────────────────┤
│                    copilot-prompts.ts                       │
│  └─ COPILOT_INSTRUCTIONS   │  Main system prompt           │
│  └─ COPILOT_ADDITIONAL_INSTRUCTIONS │  Parameter rules     │
└─────────────────────────────────────────────────────────────┘
```

Key implementation details:
- **Normalized inputs**: Status/priority values are normalized (e.g., "In Progress" → "in_progress")
- **Flexible task lookup**: `findTaskByIdOrTitle()` accepts both UUID and partial title match
- **Structured subtasks**: Breakdown creates subtasks with both title and description
- **Error recovery**: Handlers return helpful error messages with available task suggestions

### AI Safety Guardrails

1. **Two-Step Operations**: For updates/deletes, AI must first use `findTask` to locate the task
2. **Action Preview**: Before any change, copilot explains what it will do
3. **Toast Notifications**: All actions show success/error feedback
4. **No Bulk Deletes**: AI cannot delete multiple tasks at once
5. **Explicit Confirmation**: Destructive actions require user approval
6. **Input Validation**: Status/priority values are normalized to prevent invalid states
7. **Scoped Instructions**: AI is instructed to only handle task-related queries

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
│   │   ├── CopilotSidebar.tsx     # AI copilot UI wrapper
│   │   ├── CopilotHeader.tsx      # Custom sidebar header
│   │   ├── CopilotSuggestionsList.tsx
│   │   ├── CopilotUserMessage.tsx
│   │   └── CopilotErrorMessage.tsx
│   ├── providers/
│   │   ├── copilot-provider.tsx   # CopilotKit wrapper
│   │   └── query-provider.tsx     # React Query wrapper
│   ├── tasks/
│   │   ├── TaskBoard.tsx          # Kanban board
│   │   ├── TaskCard.tsx           # Task card component
│   │   ├── TaskColumn.tsx         # Status column
│   │   ├── TaskGroupCard.tsx      # Parent task with subtasks
│   │   ├── TaskModal.tsx          # Create/edit modal
│   │   └── DeleteConfirmDialog.tsx
│   └── ui/                         # Shadcn components
├── hooks/
│   ├── use-tasks.ts               # React Query hooks for CRUD
│   └── use-copilot-actions.ts     # Copilot tools & context
├── lib/
│   ├── supabase/
│   │   ├── client.ts              # Browser client
│   │   ├── server.ts              # Server client
│   │   └── migrations/
│   │       └── schema.sql         # Database schema
│   ├── copilot-prompts.ts          # AI instructions & labels
│   ├── constants.ts                # Status/priority configs
│   ├── types.ts                    # TypeScript interfaces
│   └── utils.ts                    # Utility functions
```


### Links
- [Demo](https://dar5y10gv8dj8.cloudfront.net/others/Task_Copilot_Intro.mp4)
- [Live](https://task-copilot.vamsi.app/)

