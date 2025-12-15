# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PM-OS is a Project Management Operating System built with Next.js 14, featuring AI-powered task extraction, GitHub integration for PR tracking, and a Kanban-style task board.

**Development Status:** ~85% complete. Dashboard, projects, and teams pages use real API data. Creative approval workflow, permissions system, inline lead assignment, Knowledge Base with AI chat, and GitHub codebase indexing implemented.

## Commands

```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build
npm run lint         # ESLint
npm run type-check   # TypeScript validation
```

**Database:**
```bash
npx prisma generate  # Generate Prisma client after schema changes
npx prisma db push   # Push schema to database
npx prisma studio    # Open database GUI
```

**Troubleshooting:**
```bash
rmdir /s /q .next    # Windows: Clear build cache if errors occur
rm -rf .next         # Mac/Linux: Clear build cache
```

## Architecture

### Directory Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth pages (login, register)
│   ├── (dashboard)/       # Protected dashboard routes
│   └── api/               # REST API routes
├── components/            # Atomic Design component library
│   ├── atoms/             # Button, Input, Badge, Card, etc.
│   ├── molecules/         # TaskCard, SearchBar, RepoSelector
│   ├── organisms/         # KanbanBoard, Header, Sidebar, TaskExtractor
│   └── templates/         # AuthLayout, DashboardLayout
├── features/              # Feature modules (auth, dashboard, projects)
├── shared/
│   ├── hooks/             # useProjects, useTasks, useGitHub, etc.
│   └── services/          # API client wrappers
└── lib/                   # Core integrations (auth, github, openrouter, prisma)
```

### Path Aliases

```typescript
@/*           → src/*
@/components/* → src/components/*
@/atoms/*     → src/components/atoms/*
@/molecules/* → src/components/molecules/*
@/organisms/* → src/components/organisms/*
@/templates/* → src/components/templates/*
@/features/*  → src/features/*
@/shared/*    → src/shared/*
@/hooks/*     → src/shared/hooks/*
@/services/*  → src/shared/services/*
@/types/*     → src/shared/types/*
@/utils/*     → src/shared/utils/*
@/config/*    → src/shared/config/*
@/styles/*    → src/styles/*
```

## Key Patterns

### Component Structure (Atomic Design + CVA)

Each component follows this pattern:
```
ComponentName/
├── ComponentName.tsx        # Implementation
├── ComponentName.types.ts   # TypeScript interfaces
├── ComponentName.variants.ts # CVA variant definitions
└── index.ts                 # Public export
```

**Styling:** Use `cn()` utility (clsx + tailwind-merge) for dynamic classes:
```typescript
import { cn } from "@/utils/cn";
className={cn(baseStyles, conditionalStyles, className)}
```

**Variants:** Use CVA for component variants:
```typescript
import { cva } from "class-variance-authority";
const buttonVariants = cva("base-styles", {
  variants: { variant: { primary: "...", secondary: "..." } }
});
```

### Design System Colors

- **Primary** (Deep Violet `#8b5cf6`): Main actions, branding
- **Accent** (Electric Cyan `#06b6d4`): Highlights, links
- **Surface** (Violet-tinted grays): Backgrounds with violet undertone

### Data Layer

- **Prisma ORM** with PostgreSQL
- **Key Models:** User, Project, Feature, Task, GitHubRepo, PullRequest, Team, UserTeam, KnowledgeBaseEntry, KBAttachment, CodeFile, CodeChunk, ProjectApproval, CodeIndexStatus
- **Enums:**
  - TaskStatus: BACKLOG, IN_PROGRESS, REVIEW, DONE
  - ProjectStatus: PLANNING, ACTIVE, PAUSED, PENDING_APPROVAL, COMPLETED
  - TeamType: DEVELOPMENT, QA, DESIGN, DEVOPS, UAT
  - TaskCategory: BACKEND, FRONTEND, DESIGN, QA, DEVOPS
  - TaskPriority: LOW, MEDIUM, HIGH, URGENT
  - ApprovalType: DEV, QA, UI, UAT (for multi-stage project approvals)
  - KBEntryCategory: DOCUMENTATION, GUIDE, REFERENCE, MEETING_NOTES, DECISION, OTHER

### Authentication

NextAuth.js v5 (Auth.js) with JWT strategy:
- **GitHub OAuth provider** - Direct login with GitHub
- **Credentials provider** - Email/password with bcryptjs
- **GitHub account linking** - Users who login with credentials can connect GitHub later via `/api/github/connect` to access repo features
- User roles: SUPER_ADMIN, ADMIN, LEAD, MEMBER
- **SessionProvider** wraps app in `src/app/providers.tsx` (required for `useSession` and `usePermissions` hooks)

**Making a user Super Admin:**
```bash
npx prisma studio  # Open GUI, edit User.role to SUPER_ADMIN
```

### Permissions System (`src/lib/permissions.ts`)

Role-based access control with permission checking:

```typescript
import { hasPermission } from "@/lib/permissions";
import { usePermissions } from "@/hooks/usePermissions";

// Server-side (API routes)
if (!hasPermission(session.user.role, "projects:assign-lead")) {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

// Client-side (React components)
const { can, isSuperAdmin, canApproveCreatives } = usePermissions();
if (can("projects:assign-lead")) { /* show UI */ }
```

**Key Permissions:**
- `projects:create/delete/view-all/import-github` - Project management
- `projects:assign-lead` - SUPER_ADMIN, ADMIN only
- `teams:manage/view` - Team administration
- `users:manage-roles` - SUPER_ADMIN only
- `users:view-all` - SUPER_ADMIN, ADMIN
- `tasks:create/assign/update-own` - Task management
- `creatives:approve` - SUPER_ADMIN or users with `canApproveCreatives` flag
- `kb:create/edit-own/edit-all/delete-own/delete-all` - Knowledge Base management

**Role Hierarchy:** SUPER_ADMIN > ADMIN > LEAD > MEMBER

**Conditional UI:** Use `<RoleGate permission="...">` component or `usePermissions()` hook

## API Routes

Key endpoints in `src/app/api/`:

**Projects:**
- `/api/projects/[id]` - Project CRUD
- `/api/projects/[id]/features` - Feature management
- `/api/projects/[id]/submit-for-approval` - Submit project for creative approval
- `/api/projects/[id]/approve` - Approve/reject project (POST with action: "approve" | "reject")
- `/api/projects/import-from-github` - Bulk import GitHub repos as projects
- `/api/projects/[id]/sync-prs` - Sync PRs from linked repo

**Tasks & Teams:**
- `/api/tasks` - List and create tasks
- `/api/tasks/[id]` - Task CRUD with status/ordering
- `/api/teams` - Team CRUD (Super Admin only for create)
- `/api/teams/[id]/members` - Add/remove team members
- `/api/users` - List users
- `/api/users/[id]` - Update user permissions (canApproveCreatives)

**Auth:**
- `/api/auth/register` - User registration (email/password)
- `/api/auth/[...nextauth]` - NextAuth handlers (login, session, providers)

**GitHub:**
- `/api/github/repos` - List user's GitHub repositories (requires connected GitHub account)
- `/api/github/connect` - Initiate GitHub OAuth to link account
- `/api/github/connect/callback` - OAuth callback, stores token
- `/api/github/status` - Check if GitHub account is connected
- `/api/github/webhook` - GitHub PR event handling

**Project Repo Linking:**
- `/api/projects/[id]/repo` - POST: link repo, DELETE: unlink repo

**Documents:**
- `/api/documents/parse` - Document upload (PDF, DOCX, TXT, MD) for task extraction

**Knowledge Base & Chat:**
- `/api/projects/[id]/knowledge-base` - KB entries CRUD
- `/api/projects/[id]/knowledge-base/[entryId]` - Single entry operations
- `/api/projects/[id]/knowledge-base/[entryId]/attachments` - File attachments
- `/api/projects/[id]/chat` - AI chat with KB + codebase context
- `/api/projects/[id]/index-code` - POST: trigger indexing, GET: status, DELETE: clear index
- `/api/projects/[id]/approvals` - Multi-stage project approval tracking
- `/api/projects/[id]/analyze-tasks` - AI-powered task analysis

## React Hooks (`src/shared/hooks/`)

- `useProjects` - CRUD operations for projects
- `useTasks` - Task management with status updates
- `useUsers` - User listing and management
- `useGitHub` - GitHub repo connection and status
- `usePermissions` - Role-based permission checks (`can()`, `isSuperAdmin`, `canApproveCreatives`)
- `useKnowledgeBase` - KB entry CRUD operations
- `useKBChat` - AI chat with knowledge base context
- `useDebounce`, `useLocalStorage`, `useMediaQuery` - Utility hooks

## Integrations

### GitHub Integration (`src/lib/github.ts`)

- **Repo linking:** Same GitHub repo can be linked to multiple projects (each project has at most one repo)
- PR auto-linking via branch naming: `PMOS-{taskId}-description`
- Webhook handling for PR events
- Task ID parsing from branches (supports: task-123, TASK-123, JIRA-style)
- **Code Indexing APIs:** `getRepoTree()`, `getFileContent()`, `getLatestCommitSha()` - with main/master branch fallback

### AI Integration (`src/lib/openrouter.ts`)

- Uses OpenRouter API (default: gpt-4o-mini, configurable via `OPENROUTER_MODEL`)
- **Task Extraction:** `extractTasksFromDocument()` - Extracts tasks from feature docs, auto-categorizes: BACKEND, FRONTEND, DESIGN, QA, DEVOPS. Has fallback parsing for non-JSON responses.
- **KB Chat:** `chatWithKnowledgeBase()` - RAG-based Q&A combining KB entries + code chunks as context
- **Project Chat:** `chatWithProjectContext()` - AI assistant with full project visibility (tasks, PRs, progress)

### Document Parsing (`src/app/api/documents/parse`)

- Supports PDF (pdfjs-dist), DOCX (mammoth), TXT, MD
- Max file size: 10MB
- Returns extracted text for AI task extraction

## Business Logic

### Knowledge Base & AI Chat

Per-project documentation system with AI-powered Q&A:
- **KnowledgeBaseEntry** - Markdown documents organized by category
- **AI Chat** (`src/lib/openrouter.ts: chatWithKnowledgeBase`) - Uses RAG pattern to answer questions from KB entries + indexed code
- **Codebase Indexing** (`src/lib/indexCodebase.ts`) - Indexes GitHub repo files into searchable chunks:
  - `CodeFile` - Indexed source files from linked repo
  - `CodeChunk` - 50-100 line chunks with extracted keywords
  - `CodeIndexStatus` - Tracks indexing progress
- **Search** - Keyword-based with scoring (keyword matches 3x, filepath matches 5x)

**IMPORTANT:** After modifying Prisma schema, restart dev server for new models to be available.

### Teams System

Skill-based groups for filtering task assignees:
- **TeamType** maps to **TaskCategory**: DEVELOPMENT (BACKEND/FRONTEND), QA, DESIGN, DEVOPS
- Users can belong to multiple teams
- Super Admin manages teams via `/teams` page

### Creative Approval Workflow

Project-level sign-off after development completion:
```
PLANNING → ACTIVE → PENDING_APPROVAL → COMPLETED
                  ↖ (rejected) ←────────┘
```

- Project Lead/Creator submits for approval when dev is done
- Users with `canApproveCreatives` permission or SUPER_ADMIN can approve
- Single approval moves project to COMPLETED
- Rejection sends back to ACTIVE for revisions

## Environment Variables

Required in `.env`:
```
DATABASE_URL=postgresql://...
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=...
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_WEBHOOK_SECRET=
OPENROUTER_API_KEY=
OPENROUTER_MODEL=openai/gpt-4o-mini  # Optional, defaults to gpt-4o-mini
NEXT_PUBLIC_APP_URL=http://localhost:3000
```
