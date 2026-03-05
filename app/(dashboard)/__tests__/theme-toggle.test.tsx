import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeToggle, ThemeToggleMobile } from '../theme-toggle';

// Mock next-themes
const mockSetTheme = jest.fn();
let mockTheme = 'system';

jest.mock('next-themes', () => ({
  useTheme: () => ({
    theme: mockTheme,
    setTheme: mockSetTheme
  })
}));

// Mock tooltip to simplify testing (renders children directly)
jest.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  TooltipContent: ({ children }: { children: React.ReactNode }) => (
    <span data-testid="tooltip-content">{children}</span>
  )
}));

describe('ThemeToggle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTheme = 'system';
  });

  it('renders toggle button with accessible label', () => {
    render(<ThemeToggle />);

    const button = screen.getByRole('button', { name: 'Toggle theme' });
    expect(button).toBeInTheDocument();
  });

  it('renders sun and moon icons', () => {
    render(<ThemeToggle />);

    const button = screen.getByRole('button');
    const svgs = button.querySelectorAll('svg');
    expect(svgs).toHaveLength(2);
  });

  it('shows "System" in tooltip when theme is system', () => {
    mockTheme = 'system';
    render(<ThemeToggle />);

    expect(screen.getByTestId('tooltip-content')).toHaveTextContent('System');
  });

  it('shows "Light" in tooltip when theme is light', () => {
    mockTheme = 'light';
    render(<ThemeToggle />);

    expect(screen.getByTestId('tooltip-content')).toHaveTextContent('Light');
  });

  it('shows "Dark" in tooltip when theme is dark', () => {
    mockTheme = 'dark';
    render(<ThemeToggle />);

    expect(screen.getByTestId('tooltip-content')).toHaveTextContent('Dark');
  });

  it('cycles from light to dark on click', async () => {
    mockTheme = 'light';
    render(<ThemeToggle />);

    await userEvent.click(screen.getByRole('button'));
    expect(mockSetTheme).toHaveBeenCalledWith('dark');
  });

  it('cycles from dark to system on click', async () => {
    mockTheme = 'dark';
    render(<ThemeToggle />);

    await userEvent.click(screen.getByRole('button'));
    expect(mockSetTheme).toHaveBeenCalledWith('system');
  });

  it('cycles from system to light on click', async () => {
    mockTheme = 'system';
    render(<ThemeToggle />);

    await userEvent.click(screen.getByRole('button'));
    expect(mockSetTheme).toHaveBeenCalledWith('light');
  });
});

describe('ThemeToggleMobile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTheme = 'system';
  });

  it('renders all three theme buttons', () => {
    render(<ThemeToggleMobile />);

    expect(screen.getByText('Light')).toBeInTheDocument();
    expect(screen.getByText('Dark')).toBeInTheDocument();
    expect(screen.getByText('System')).toBeInTheDocument();
  });

  it('renders an icon in each button', () => {
    render(<ThemeToggleMobile />);

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(3);

    buttons.forEach((button) => {
      expect(button.querySelector('svg')).toBeInTheDocument();
    });
  });

  it('highlights the active theme button', () => {
    mockTheme = 'dark';
    render(<ThemeToggleMobile />);

    const darkButton = screen.getByText('Dark').closest('button')!;
    const lightButton = screen.getByText('Light').closest('button')!;

    expect(darkButton.className).toContain('bg-background');
    expect(lightButton.className).not.toContain('bg-background');
  });

  it('sets theme to light when Light is clicked', async () => {
    mockTheme = 'dark';
    render(<ThemeToggleMobile />);

    await userEvent.click(screen.getByText('Light'));
    expect(mockSetTheme).toHaveBeenCalledWith('light');
  });

  it('sets theme to dark when Dark is clicked', async () => {
    mockTheme = 'light';
    render(<ThemeToggleMobile />);

    await userEvent.click(screen.getByText('Dark'));
    expect(mockSetTheme).toHaveBeenCalledWith('dark');
  });

  it('sets theme to system when System is clicked', async () => {
    mockTheme = 'light';
    render(<ThemeToggleMobile />);

    await userEvent.click(screen.getByText('System'));
    expect(mockSetTheme).toHaveBeenCalledWith('system');
  });
});
