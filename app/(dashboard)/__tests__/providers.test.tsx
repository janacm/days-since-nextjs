import React from 'react';
import { render, screen } from '@testing-library/react';
import Providers from '../providers';

const mockThemeProvider = jest.fn(
  ({ children }: { children: React.ReactNode }) => (
    <div data-testid="theme-provider">{children}</div>
  )
);

jest.mock('next-themes', () => ({
  ThemeProvider: (props: { children: React.ReactNode }) =>
    mockThemeProvider(props)
}));

jest.mock('@/components/ui/tooltip', () => ({
  TooltipProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="tooltip-provider">{children}</div>
  )
}));

describe('Providers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('configures ThemeProvider for class-based system theming', () => {
    render(
      <Providers>
        <span>content</span>
      </Providers>
    );

    expect(mockThemeProvider).toHaveBeenCalledTimes(1);
    expect(mockThemeProvider.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        attribute: 'class',
        defaultTheme: 'system',
        enableSystem: true
      })
    );
  });

  it('wraps children with tooltip and theme providers', () => {
    render(
      <Providers>
        <span data-testid="child">content</span>
      </Providers>
    );

    const theme = screen.getByTestId('theme-provider');
    const tooltip = screen.getByTestId('tooltip-provider');
    const child = screen.getByTestId('child');

    expect(theme).toContainElement(tooltip);
    expect(tooltip).toContainElement(child);
  });
});
