import React from 'react';
import { render, screen } from '@testing-library/react';
import Providers from '../providers';

const mockThemeProvider = jest.fn(
  ({ children }: { children: React.ReactNode }) => (
    <div data-testid="theme-provider">{children}</div>
  )
);

const mockTooltipProvider = jest.fn(
  ({ children }: { children: React.ReactNode }) => (
    <div data-testid="tooltip-provider">{children}</div>
  )
);

jest.mock('next-themes', () => ({
  ThemeProvider: (props: { children: React.ReactNode }) =>
    mockThemeProvider(props)
}));

jest.mock('@/components/ui/tooltip', () => ({
  TooltipProvider: (props: { children: React.ReactNode }) =>
    mockTooltipProvider(props)
}));

describe('Providers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('configures ThemeProvider for system dark mode', () => {
    render(
      <Providers>
        <span data-testid="child">Child Content</span>
      </Providers>
    );

    expect(mockThemeProvider).toHaveBeenCalledTimes(1);
    const themeProps = mockThemeProvider.mock.calls[0][0];
    expect(themeProps.attribute).toBe('class');
    expect(themeProps.defaultTheme).toBe('system');
    expect(themeProps.enableSystem).toBe(true);
  });

  it('wraps children with TooltipProvider inside ThemeProvider', () => {
    render(
      <Providers>
        <span data-testid="child">Child Content</span>
      </Providers>
    );

    expect(screen.getByTestId('theme-provider')).toBeInTheDocument();
    expect(screen.getByTestId('tooltip-provider')).toBeInTheDocument();
    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByTestId('theme-provider')).toContainElement(
      screen.getByTestId('tooltip-provider')
    );
  });
});
