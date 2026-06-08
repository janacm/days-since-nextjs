import React from 'react';
import { render, screen } from '@testing-library/react';
import Providers from '../providers';

const mockThemeProvider = jest.fn(
  ({
    children
  }: {
    attribute: string;
    defaultTheme: string;
    enableSystem: boolean;
    children: React.ReactNode;
  }) => <div data-testid="theme-provider">{children}</div>
);

const mockTooltipProvider = jest.fn(
  ({ children }: { children: React.ReactNode }) => (
    <div data-testid="tooltip-provider">{children}</div>
  )
);

jest.mock('next-themes', () => ({
  ThemeProvider: (props: {
    attribute: string;
    defaultTheme: string;
    enableSystem: boolean;
    children: React.ReactNode;
  }) => mockThemeProvider(props)
}));

jest.mock('@/components/ui/tooltip', () => ({
  TooltipProvider: ({ children }: { children: React.ReactNode }) =>
    mockTooltipProvider({ children })
}));

describe('Dashboard Providers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('configures theme provider to follow system preference by default', () => {
    render(
      <Providers>
        <div>child content</div>
      </Providers>
    );

    expect(mockThemeProvider).toHaveBeenCalledWith(
      expect.objectContaining({
        attribute: 'class',
        defaultTheme: 'system',
        enableSystem: true
      })
    );
  });

  it('nests children inside tooltip provider', () => {
    render(
      <Providers>
        <div>child content</div>
      </Providers>
    );

    expect(screen.getByTestId('theme-provider')).toBeInTheDocument();
    expect(screen.getByTestId('tooltip-provider')).toBeInTheDocument();
    expect(screen.getByText('child content')).toBeInTheDocument();
  });
});
