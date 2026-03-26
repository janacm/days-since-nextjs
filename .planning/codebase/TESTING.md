# Testing Patterns

**Analysis Date:** 2026-03-26

## Test Framework

**Runner:**
- Jest 29.7.0
- Config: `jest.config.js` (CommonJS, uses `next/jest` helper)
- Environment: `jest-environment-jsdom` 30.0.0-beta.3
- Setup file: `jest.setup.js`

**Assertion Library:**
- Jest built-in assertions (`expect`, `toBe`, `toHaveBeenCalled`)
- `@testing-library/jest-dom` 6.6.3 for DOM assertions (`toBeInTheDocument`, `toHaveAttribute`, `toHaveValue`, `toBeRequired`)

**Rendering:**
- `@testing-library/react` 16.3.0 (`render`, `screen`, `fireEvent`, `waitFor`)
- `@testing-library/user-event` 14.6.1 for realistic user interaction simulation
- `renderHook` from `@testing-library/react` for testing custom hooks

**HTTP Mocking (available but unused in current tests):**
- `nock` 14.0.1 (installed as devDependency)
- `node-mocks-http` 1.17.2 (installed as devDependency)

**Run Commands:**
```bash
pnpm test              # Run all tests
pnpm test:watch        # Watch mode
pnpm test:coverage     # Coverage report
```

## Test File Organization

**Location:**
- Co-located `__tests__/` directories adjacent to the code being tested
- NOT alongside files directly -- always inside a `__tests__` subdirectory

**Naming:**
- `{feature-name}.test.tsx` for component tests
- `{module-name}.test.ts` for utility/logic tests

**Structure:**
```
app/(dashboard)/__tests__/
  admin-page.test.tsx        # Tests app/(dashboard)/admin/page.tsx
  add-event-page.test.tsx    # Tests app/(dashboard)/add/page.tsx

app/(dashboard)/events/[id]/__tests__/
  analytics-charts.test.tsx  # Tests app/(dashboard)/events/[id]/analytics-charts.tsx

lib/__tests__/
  date-utils.test.ts         # Tests date formatting utilities
  auth-helpers.test.ts       # Tests lib/auth-helpers.ts

lib/hooks/__tests__/
  use-long-press.test.ts     # Tests lib/hooks/use-long-press.ts
```

**Total test files:** 6 (all in the project source, not counting node_modules)

## Test Structure

**Suite Organization:**
```typescript
describe('ComponentName', () => {
  // Optional: shared mock data at describe scope
  const mockEvent = { id: 1, name: 'Test Event', date: '2024-01-01T00:00:00.000Z' };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();  // When using fake timers
  });

  it('describes expected behavior', () => {
    render(<Component />);
    expect(screen.getByText('Expected text')).toBeInTheDocument();
  });
});
```

**Nested describes for grouping:**
```typescript
describe('Add Event Page', () => {
  describe('Default Date Functionality', () => { ... });
  describe('Form Rendering', () => { ... });
  describe('User Interactions', () => { ... });
  describe('Navigation', () => { ... });
  describe('Form Validation', () => { ... });
  describe('Accessibility', () => { ... });
});
```

**Patterns:**
- Setup: `beforeEach` for clearing mocks, `afterEach` for restoring real timers
- Each test focuses on one assertion concept (though may contain multiple `expect` calls)
- Use `screen.getByText`, `screen.getByLabelText`, `screen.getByRole` for querying
- Use `screen.queryByText` for asserting absence (`not.toBeInTheDocument()`)

## Global Test Setup

**File:** `jest.setup.js`

```javascript
import '@testing-library/jest-dom';

// Mock Next.js router (global)
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn()
    };
  },
  useSearchParams() { return new URLSearchParams(); },
  usePathname() { return ''; }
}));

// Mock browser APIs
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(), unobserve: jest.fn(), disconnect: jest.fn()
}));
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(), unobserve: jest.fn(), disconnect: jest.fn()
}));
```

**Module Name Mapper:**
- `@/` alias mapped to `<rootDir>/` in `jest.config.js`

## Mocking

**Framework:** Jest built-in `jest.mock()` and `jest.fn()`

**Patterns:**

**Mocking server actions (per-file):**
```typescript
jest.mock('../actions', () => ({
  addEvent: jest.fn(),
  sendTestEmail: jest.fn()
}));
```

**Mocking Next.js modules (per-file, overriding global):**
```typescript
jest.mock('next/navigation', () => ({
  redirect: jest.fn()
}));

jest.mock('next/link', () => {
  const MockLink = ({ children, href, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  );
  MockLink.displayName = 'MockLink';
  return MockLink;
});
```

**Mocking library modules:**
```typescript
jest.mock('@/lib/auth', () => ({
  auth: jest.fn(async () => ({ user: { email: 'test@example.com' } }))
}));

jest.mock('@/lib/db', () => ({
  getDatabaseInfo: jest.fn(async () => ({
    host: 'localhost', database: 'testdb',
    userCount: 1, eventCount: 2, productCount: 3
  }))
}));
```

**Mocking third-party components (Recharts):**
```typescript
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  AreaChart: (props: any) => areaChartMock(props),
  BarChart: (props: any) => barChartMock(props),
  // ... simplified DOM replacements
}));
```

**Mocking browser crypto:**
```typescript
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: jest.fn(() => mockSalt),
    subtle: require('crypto').webcrypto.subtle
  }
});
```

**What to Mock:**
- Next.js navigation (`next/navigation`, `next/link`)
- Server actions (always mock, they depend on server context)
- Database layer (`@/lib/db`) when testing UI components
- Auth layer (`@/lib/auth`) when testing pages that require auth
- Complex third-party rendering components (Recharts)
- Browser APIs not available in jsdom (ResizeObserver, IntersectionObserver, crypto)

**What NOT to Mock:**
- The component under test itself
- Simple utility functions (test them directly)
- UI component library primitives (shadcn/ui components render normally)
- `@testing-library` utilities

## Fake Timers

**Usage:** Heavily used for time-dependent tests

```typescript
beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2024-02-25T10:00:00.000Z'));
});

afterEach(() => {
  jest.useRealTimers();
});
```

**For hook testing with timer progression:**
```typescript
jest.useFakeTimers();

act(() => {
  result.current.onMouseDown(mockEvent);
});

act(() => {
  jest.advanceTimersByTime(600);  // Simulate time passage
});

expect(mockOnLongPress).toHaveBeenCalledTimes(1);
```

## Testing Async Server Components

**Pattern for testing async server components:**
```typescript
// Server components are called as functions, not rendered with JSX
it('renders database information', async () => {
  const result = await AdminPage();
  render(result as React.ReactElement);
  expect(screen.getByText('Database')).toBeInTheDocument();
});
```

This pattern is specific to this codebase -- async server components return JSX that is then passed to `render()`.

## Fixtures and Factories

**Test Data:**
```typescript
const mockEvent = {
  id: 1,
  name: 'Test Event',
  date: '2024-01-01T00:00:00.000Z'
};

const mockResets: EventReset[] = [
  { id: 1, eventId: 1, resetAt: new Date('2024-01-15T10:00:00.000Z') },
  { id: 2, eventId: 1, resetAt: new Date('2024-02-01T10:00:00.000Z') },
  { id: 3, eventId: 1, resetAt: new Date('2024-02-15T10:00:00.000Z') }
];
```

**Location:**
- Inline within test files (no shared fixtures directory)
- Mock data defined at `describe` block scope and reused across tests

## Coverage

**Requirements:** No enforced coverage threshold.

**View Coverage:**
```bash
pnpm test:coverage
```

## Test Types

**Unit Tests:**
- Pure utility functions: `lib/__tests__/date-utils.test.ts` (date formatting logic)
- Auth helpers: `lib/__tests__/auth-helpers.test.ts` (password hashing/comparison)
- Custom hooks: `lib/hooks/__tests__/use-long-press.test.ts` (long press interaction logic)

**Component Tests (Integration):**
- Page-level rendering: `app/(dashboard)/__tests__/admin-page.test.tsx`, `app/(dashboard)/__tests__/add-event-page.test.tsx`
- Feature components: `app/(dashboard)/events/[id]/__tests__/analytics-charts.test.tsx`
- These mock external dependencies but render real component trees with shadcn/ui primitives

**E2E Tests:**
- Not present. No Playwright, Cypress, or similar framework configured.

## CI/CD Test Pipeline

**GitHub Actions workflow:** `.github/workflows/pr-tests.yml`

```yaml
name: CI
on:
  pull_request:
    branches: [main]

jobs:
  build-test:
    runs-on: ubuntu-latest
    env:
      POSTGRES_URL: postgresql://postgres:postgres@localhost:5432/testdb
    services:
      postgres:
        image: postgres:15
    steps:
      - Install pnpm (v8)
      - Setup Node.js 20
      - Copy .env.example to .env
      - pnpm lint
      - pnpm test -- --runInBand    # Sequential test execution
      - pnpm build
```

**Key details:**
- Tests run sequentially with `--runInBand` in CI (avoids parallel test conflicts)
- Postgres 15 service container available (for integration tests that need it)
- Runs on pull requests to `main` branch only
- Full pipeline: lint -> test -> build

**Git Hooks (local via Husky):**
- Pre-commit (`.husky/pre-commit`): `pnpm lint` then `pnpm test`
- Pre-push (`.husky/pre-push`): `pnpm test && pnpm build`

## Common Patterns

**User Event Testing:**
```typescript
it('allows user to input event name', async () => {
  const user = userEvent.setup();
  render(<AddEventPage />);

  const nameInput = screen.getByLabelText('Event Name');
  await user.type(nameInput, 'Test Event');

  expect(nameInput).toHaveValue('Test Event');
});
```

**Accessibility Testing:**
```typescript
it('has proper semantic structure', () => {
  render(<AddEventPage />);

  expect(screen.getByRole('heading', { name: 'Add New Event' })).toBeInTheDocument();
  expect(document.querySelector('form')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Add Event' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Cancel' })).toBeInTheDocument();
});
```

**Hook Testing with renderHook:**
```typescript
const { result } = renderHook(() =>
  useLongPress({
    onLongPress: mockOnLongPress,
    onClick: mockOnClick,
    threshold: 500
  })
);

act(() => {
  result.current.onMouseDown(mockEvent);
});

expect(result.current.isPressed).toBe(true);
```

## Test Coverage Gaps

**Untested areas:**
- Server actions in `app/(dashboard)/actions.ts` (addEvent, deleteEvent, editEvent, resetEvent, etc.) -- these are mocked in tests but never tested directly
- Database query functions in `lib/db.ts` (getEvents, createEvent, etc.) -- no integration tests
- Authentication flow in `lib/auth.ts` -- NextAuth authorize callback not tested
- Middleware at `middleware.ts` -- no tests
- Client components: `event-card.tsx`, `event.tsx`, `events-table.tsx`, `search.tsx`, `reset-button.tsx`, `theme-toggle.tsx`, `products-table.tsx` -- no component tests
- API routes in `app/api/` -- no tests
- Login/signup pages at `app/login/`, `app/signup/` -- no tests
- Error boundary at `app/(dashboard)/error.tsx` -- no tests

**Priority gaps:**
- **High:** Server actions contain critical business logic (reset protection, form validation, email sending) with no direct test coverage
- **High:** Client components `event-card.tsx` and `events-table.tsx` are core UI with no tests
- **Medium:** Database functions -- currently only tested indirectly through mocked UI tests
- **Medium:** Auth middleware -- redirect logic untested
- **Low:** Login/signup pages, products table

---

*Testing analysis: 2026-03-26*
