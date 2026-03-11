import React from 'react';
import { render, screen } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import { NavItem } from '../nav-item';

jest.mock('next/navigation', () => ({
  usePathname: jest.fn()
}));

jest.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  TooltipContent: ({ children }: { children: React.ReactNode }) => (
    <span data-testid="tooltip-content">{children}</span>
  )
}));

const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;

describe('NavItem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows active styles on current route', () => {
    mockUsePathname.mockReturnValue('/admin');

    render(
      <NavItem href="/admin" label="Admin">
        <svg data-testid="admin-icon" />
      </NavItem>
    );

    const link = screen.getByRole('link', { name: 'Admin' });
    expect(link).toHaveClass('bg-accent', 'text-accent-foreground');
    expect(link).not.toHaveClass('text-black');
    expect(screen.getByTestId('tooltip-content')).toHaveTextContent('Admin');
  });

  it('does not show active styles on different route', () => {
    mockUsePathname.mockReturnValue('/add');

    render(
      <NavItem href="/admin" label="Admin">
        <svg data-testid="admin-icon" />
      </NavItem>
    );

    const link = screen.getByRole('link', { name: 'Admin' });
    expect(link).not.toHaveClass('bg-accent', 'text-accent-foreground');
  });
});
