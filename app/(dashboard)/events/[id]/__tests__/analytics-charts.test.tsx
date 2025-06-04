import React from 'react';
import { render, screen } from '@testing-library/react';
import { AnalyticsCharts } from '../analytics-charts';
import { EventReset } from '@/lib/db';

// Capture chart data passed to mocked components
const areaChartMock = jest.fn(({ children }) => (
  <div data-testid="area-chart">{children}</div>
));
const barChartMock = jest.fn(({ children }) => (
  <div data-testid="bar-chart">{children}</div>
));

// Mock Recharts components
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  AreaChart: (props: any) => areaChartMock(props),
  BarChart: (props: any) => barChartMock(props),
  Area: () => <div data-testid="area" />,
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />
}));

describe('AnalyticsCharts', () => {
  const mockEvent = {
    id: 1,
    name: 'Test Event',
    date: '2024-01-01T00:00:00.000Z'
  };

  const mockResets: EventReset[] = [
    {
      id: 1,
      eventId: 1,
      resetAt: new Date('2024-01-15T10:00:00.000Z')
    },
    {
      id: 2,
      eventId: 1,
      resetAt: new Date('2024-02-01T10:00:00.000Z')
    },
    {
      id: 3,
      eventId: 1,
      resetAt: new Date('2024-02-15T10:00:00.000Z')
    }
  ];

  beforeEach(() => {
    // Mock current date
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-02-25T10:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders progress indicator with correct current streak', () => {
    render(
      <AnalyticsCharts
        event={mockEvent}
        allResets={mockResets}
        currentStreak={10}
        totalResets={3}
      />
    );

    expect(screen.getByText('Current Progress')).toBeInTheDocument();
    expect(screen.getByText('Days Since Reset')).toBeInTheDocument();
    expect(screen.getByText('10 days')).toBeInTheDocument();
  });

  it('renders progress chart', () => {
    render(
      <AnalyticsCharts
        event={mockEvent}
        allResets={mockResets}
        currentStreak={10}
        totalResets={3}
      />
    );

    expect(screen.getByText('Progress Over Time')).toBeInTheDocument();
    expect(screen.getByTestId('area-chart')).toBeInTheDocument();
    expect(screen.getByTestId('area')).toBeInTheDocument();
  });

  it('renders reset frequency chart when resets exist', () => {
    render(
      <AnalyticsCharts
        event={mockEvent}
        allResets={mockResets}
        currentStreak={10}
        totalResets={3}
      />
    );

    expect(screen.getByText('Reset Frequency by Month')).toBeInTheDocument();
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    expect(screen.getByTestId('bar')).toBeInTheDocument();
  });

  it('does not render reset frequency chart when no resets', () => {
    render(
      <AnalyticsCharts
        event={mockEvent}
        allResets={[]}
        currentStreak={55}
        totalResets={0}
      />
    );

    expect(screen.getByText('Progress Over Time')).toBeInTheDocument();
    expect(
      screen.queryByText('Reset Frequency by Month')
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId('bar-chart')).not.toBeInTheDocument();
  });

  it('calculates correct progress bar width', () => {
    render(
      <AnalyticsCharts
        event={mockEvent}
        allResets={mockResets}
        currentStreak={10}
        totalResets={3}
      />
    );

    // Find the progress bar element
    const progressBar = document.querySelector('.bg-primary.h-2.rounded-full');
    expect(progressBar).toBeInTheDocument();

    // The width should be calculated based on current streak vs best performance
    const style = progressBar?.getAttribute('style');
    expect(style).toContain('width:');
  });

  it('displays correct best performance in progress indicator', () => {
    render(
      <AnalyticsCharts
        event={mockEvent}
        allResets={mockResets}
        currentStreak={10}
        totalResets={3}
      />
    );

    // Should show "Best: X days" where X is the maximum from chart data
    expect(screen.getByText(/Best: \d+ days/)).toBeInTheDocument();
  });

  it('handles single reset correctly', () => {
    const singleReset = [mockResets[0]];

    render(
      <AnalyticsCharts
        event={mockEvent}
        allResets={singleReset}
        currentStreak={20}
        totalResets={1}
      />
    );

    expect(screen.getByText('Progress Over Time')).toBeInTheDocument();
    expect(screen.getByText('Reset Frequency by Month')).toBeInTheDocument();
    expect(screen.getByText('20 days')).toBeInTheDocument();
  });

  it('handles event with no resets', () => {
    render(
      <AnalyticsCharts
        event={mockEvent}
        allResets={[]}
        currentStreak={55}
        totalResets={0}
      />
    );

    expect(screen.getByText('55 days')).toBeInTheDocument();
    expect(screen.getByText('Progress Over Time')).toBeInTheDocument();
    expect(
      screen.queryByText('Reset Frequency by Month')
    ).not.toBeInTheDocument();
  });
});

// Test the chart data preparation logic separately
describe('AnalyticsCharts - Data Preparation', () => {
  const mockEvent = {
    id: 1,
    name: 'Test Event',
    date: '2024-01-01T00:00:00.000Z'
  };
  const mockResets: EventReset[] = [
    {
      id: 1,
      eventId: 1,
      resetAt: new Date('2024-01-15T10:00:00.000Z')
    },
    {
      id: 2,
      eventId: 1,
      resetAt: new Date('2024-02-01T10:00:00.000Z')
    },
    {
      id: 3,
      eventId: 1,
      resetAt: new Date('2024-02-15T10:00:00.000Z')
    }
  ];
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-02-25T10:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // Note: These tests would be more comprehensive if the data preparation
  // functions were extracted to separate utility functions that could be tested independently

  it('should prepare chart data for event with no resets', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => children;

    render(
      <AnalyticsCharts
        event={{
          id: 1,
          name: 'Test Event',
          date: '2024-01-01T00:00:00.000Z'
        }}
        allResets={[]}
        currentStreak={55}
        totalResets={0}
      />,
      { wrapper }
    );

    // The chart should render without errors, indicating data preparation worked
    expect(screen.getByTestId('area-chart')).toBeInTheDocument();
  });

  it('should prepare monthly data correctly', () => {
    const resets: EventReset[] = [
      {
        id: 1,
        eventId: 1,
        resetAt: new Date('2024-01-15T10:00:00.000Z')
      },
      {
        id: 2,
        eventId: 1,
        resetAt: new Date('2024-01-20T10:00:00.000Z')
      },
      {
        id: 3,
        eventId: 1,
        resetAt: new Date('2024-02-10T10:00:00.000Z')
      }
    ];

    render(
      <AnalyticsCharts
        event={{
          id: 1,
          name: 'Test Event',
          date: '2024-01-01T00:00:00.000Z'
        }}
        allResets={resets}
        currentStreak={15}
        totalResets={3}
      />
    );

    // Should render the monthly chart since we have resets
    expect(screen.getByText('Reset Frequency by Month')).toBeInTheDocument();
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
  });

  it('generates chart data with UTC-formatted dates', () => {
    const originalTZ = process.env.TZ;
    process.env.TZ = 'America/New_York';

    render(
      <AnalyticsCharts
        event={mockEvent}
        allResets={mockResets}
        currentStreak={10}
        totalResets={3}
      />
    );

    const areaProps = areaChartMock.mock.calls[0][0];
    const barProps = barChartMock.mock.calls[0][0];

    expect(areaProps.data[0].date).toBe('Jan 1');
    expect(barProps.data[0].month).toBe('Jan 2024');

    process.env.TZ = originalTZ;
  });
});
