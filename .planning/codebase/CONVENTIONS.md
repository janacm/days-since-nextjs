# Coding Conventions

**Analysis Date:** 2026-03-26

## Naming Patterns

**Files:**
- Components use kebab-case: `event-card.tsx`, `reset-button.tsx`, `theme-toggle.tsx`, `nav-item.tsx`
- UI primitives (shadcn/ui) use kebab-case: `components/ui/button.tsx`, `components/ui/dialog.tsx`
- Server action files are named `actions.ts` and co-located with the route that uses them
- Hooks use kebab-case with `use-` prefix: `lib/hooks/use-long-press.ts`
- Test directories use `__tests__/` alongside the code they test
- Test files use `.test.tsx` or `.test.ts` suffix: `analytics-charts.test.tsx`, `date-utils.test.ts`
- Database/utility modules use kebab-case: `auth-helpers.ts`, `db-migration.ts`

**Functions:**
- Use camelCase for all functions: `handleQuickReset`, `getEventResets`, `formatDateForInput`
- React components use PascalCase: `EventCard`, `ResetButton`, `DashboardPage`
- Server actions use camelCase verbs: `addEvent`, `deleteEvent`, `resetEvent`, `editEvent`
- Database query functions use `get`/`create`/`delete`/`update` prefixes: `getEventById`, `createUser`, `deleteEventById`

**Variables:**
- Use camelCase: `daysSince`, `isReminderDue`, `reminderBadgeText`
- Boolean variables use `is`/`has` prefix: `isLoggedIn`, `hasReminder`, `isPrivate`, `isPressed`
- State variables follow `[value, setValue]` pattern: `[isModalOpen, setIsModalOpen]`

**Types:**
- PascalCase for type names: `Event`, `User`, `SelectProduct`, `EventReset`
- Insert types prefixed with `Insert`: `InsertEvent`, `InsertUser`, `InsertEventReset`
- Interface names use PascalCase with `Props` suffix for component props: `ResetButtonProps`, `ButtonProps`

## Code Style

**Formatting:**
- Prettier with config in `package.json`:
  - `arrowParens`: `"always"`
  - `singleQuote`: `true`
  - `tabWidth`: `2`
  - `trailingComma`: `"none"`
- Use single quotes for all string literals
- No trailing commas in any context
- 2-space indentation

**Linting:**
- ESLint 9 flat config at `eslint.config.mjs`
- Extends `eslint-config-next/core-web-vitals`
- Several React hooks rules disabled: `react-hooks/error-boundaries`, `react-hooks/immutability`, `react-hooks/purity`, `react-hooks/static-components`
- `import/no-anonymous-default-export` is off

**TypeScript:**
- Strict mode enabled but `noImplicitAny: false` and `strictNullChecks: false` in `tsconfig.json`
- Target `es5`, module `esnext`, module resolution `bundler`
- Use `as` type assertions for FormData values: `formData.get('name') as string`
- Use `any` cast for mock event objects in tests: `as any`
- Drizzle `$inferSelect` and `$inferInsert` for DB type inference in `lib/db.ts`
- Zod used for runtime validation in auth flow at `lib/auth.ts`

## Import Organization

**Order:**
1. React/Next.js framework imports (`react`, `next/navigation`, `next/link`, `next/cache`)
2. Third-party library imports (`date-fns`, `lucide-react`, `drizzle-orm`, `zod`)
3. Internal `@/components/ui/` imports (shadcn primitives)
4. Internal `@/lib/` imports (utilities, DB, auth)
5. Relative imports for co-located files (`./actions`, `./search`, `../admin/page`)

**Path Aliases:**
- `@/*` maps to project root (`<rootDir>/*`) -- configured in `tsconfig.json`
- Always use `@/components/ui/button` for UI components, never relative paths from outside the component directory
- Use `@/lib/db`, `@/lib/auth`, `@/lib/utils` for library modules
- Use relative imports only for files in the same directory or immediate children

## Component Patterns

**Server Components (default in App Router):**
- Page components are async server components: `export default async function DashboardPage()`
- Fetch data directly using `await` in component body
- Auth check pattern: `const session = await auth(); if (!session?.user?.email) { redirect('/login'); }`
- Located at `app/(dashboard)/page.tsx`, `app/(dashboard)/admin/page.tsx`, etc.

**Client Components:**
- Marked with `'use client'` directive at top of file
- Used for interactive UI: `event-card.tsx`, `reset-button.tsx`, `search.tsx`, `theme-toggle.tsx`, `events-table.tsx`
- 13 client components in `app/` directory
- Use React hooks (`useState`, `useRouter`) for local state and navigation

**Server Actions:**
- Marked with `'use server'` directive at top of file
- Located in `actions.ts` files co-located with routes: `app/(dashboard)/actions.ts`, `app/login/actions.ts`
- Accept `FormData` as parameter: `export async function addEvent(formData: FormData)`
- Pattern: auth check -> parse form data -> validate -> DB operation -> `revalidatePath('/')` -> `redirect('/')`
- Invoked via `<form action={addEvent}>` or programmatically with `new FormData()`

**Providers:**
- Single providers wrapper at `app/(dashboard)/providers.tsx`
- Wraps `ThemeProvider` (next-themes) and `TooltipProvider` (Radix)
- Applied in `app/(dashboard)/layout.tsx`

## UI Component Library & Styling

**Component System:**
- shadcn/ui (not a package dependency -- components copied into `components/ui/`)
- Configuration at `components.json`: style `"default"`, base color `"slate"`, RSC enabled
- 14 UI primitives: badge, breadcrumb, button, card, checkbox, dialog, dropdown-menu, input, label, sheet, switch, table, tabs, tooltip

**Styling Approach:**
- Tailwind CSS 3 with `tailwindcss-animate` plugin
- Dark mode via `class` strategy (toggled by `next-themes`)
- CSS variables for theme colors defined in `app/globals.css` using HSL format
- `cn()` utility at `lib/utils.ts` combines `clsx` + `tailwind-merge` for conditional class names
- `class-variance-authority` (cva) for component variants -- see `components/ui/button.tsx`
- Icons from `lucide-react`

**Tailwind Patterns:**
- Use semantic color tokens: `bg-primary`, `text-muted-foreground`, `border-border`
- Responsive: mobile-first with `sm:`, `md:` breakpoints
- Use `min-w-[44px]` and `h-11` for touch-friendly tap targets
- `sr-only` for screen reader text on icon buttons
- Custom CSS utilities in `globals.css`: `.no-scrollbar`, `.scroll-fade`, `.no-select`
- Additional component-specific CSS in `styles/button.css` and `styles/events.css`

## Error Handling

**Patterns:**
- Server actions throw errors with descriptive messages: `throw new Error('You must be logged in to add an event')`
- Database functions use try/catch with `console.error` and re-throw: see `lib/db.ts` functions
- Auth flow returns `null` on failure rather than throwing (NextAuth convention): see `lib/auth.ts` `authorize()`
- Error boundary component at `app/(dashboard)/error.tsx` (client component)
- No centralized error handling middleware -- errors bubble up per-route

## Logging

**Framework:** `console.log` / `console.error` directly

**Patterns:**
- Debug logging with emoji prefixes in server actions: `console.log('sendTestEmail: Function called')`
- Database operations log connection and query details: `console.log('Initializing database connection')`
- Auth flow logs each step: `console.log('Authentication successful')`
- No structured logging library; all console-based

## Comments

**When to Comment:**
- Inline comments explain business logic: `// Calculate days since`, `// Check if reminder is due`
- Block comments for protection patterns: `// ---- RESET PROTECTION ----`
- JSDoc-style comment headers on test suites: `/** Test suite for date utility functions */`

**JSDoc/TSDoc:**
- Minimal usage -- one JSDoc comment found in `lib/__tests__/date-utils.test.ts`
- No systematic JSDoc on exported functions

## Function Design

**Size:** Most functions are under 50 lines. Database query functions in `lib/db.ts` are concise. The largest function is `getEventAnalytics` (~110 lines) which combines multiple queries and calculations.

**Parameters:**
- Server actions always take `FormData`
- Database functions take primitive typed parameters: `(id: number)`, `(email: string)`
- Component props use inline types or named interfaces: `{ event }: { event: Event }`, `{ eventId, onOpenChange }: ResetButtonProps`

**Return Values:**
- Database functions return typed objects or arrays: `Promise<Event[]>`, `Promise<User | undefined>`
- Server actions return void (side effects via `revalidatePath`/`redirect`)

## Module Design

**Exports:**
- Components use named exports: `export function EventCard`, `export function ResetButton`
- Page components use default exports: `export default async function DashboardPage()`
- UI components export both component and variants: `export { Button, buttonVariants }`
- Database module (`lib/db.ts`) exports schema, types, insert schemas, and query functions
- Auth module (`lib/auth.ts`) exports destructured NextAuth result: `export const { handlers, signIn, signOut, auth }`

**Barrel Files:**
- No barrel files (index.ts re-exports) -- each module imported directly by path

---

*Convention analysis: 2026-03-26*
