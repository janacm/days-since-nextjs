import React from 'react';
import { render, screen } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import { NavItem } from '../nav-item';

const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;

jest.mock('next/navigation', () => ({
  usePathname: jest.fn()
}));

jest.mock('next/link', () => {
  const MockLink = ({
    children,
    href,
    className
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  );
  MockLink.displayName = 'MockLink';
  return MockLink;
});

jest.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  TooltipContent: ({ children }: { children: React.ReactNode }) => (
    <span>{children}</span>
  )
}));

describe('NavItem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('applies active styling when current path matches href', () => {
    mockUsePathname.mockReturnValue('/admin');

    render(
      <NavItem href="/admin" label="Admin">
        <span>icon</span>
      </NavItem>
    );

    const link = screen.getByRole('link', { name: /Admin/ });
    expect(link.className).toContain('bg-accent');
    expect(link.className).toContain('text-accent-foreground');
  });

  it('does not apply active styling when path does not match href', () => {
    mockUsePathname.mockReturnValue('/');

    render(
      <NavItem href="/admin" label="Admin">
        <span>icon</span>
      </NavItem>
    );

    const link = screen.getByRole('link', { name: /Admin/ });
    expect(link.className).not.toContain('text-accent-foreground');
    expect(link.className).not.toContain('bg-accent');
  });
});
