import React from 'react';
import RootLayout, { metadata } from '../layout';

jest.mock('@vercel/analytics/react', () => ({
  Analytics: () => <div data-testid="analytics" />
}));

describe('RootLayout metadata', () => {
  it('defines light and dark theme colors for browser UI', () => {
    expect(metadata.themeColor).toEqual([
      { media: '(prefers-color-scheme: light)', color: '#ffffff' },
      { media: '(prefers-color-scheme: dark)', color: '#030711' }
    ]);
  });
});

describe('RootLayout structure', () => {
  it('sets hydration warning suppression on the html element', () => {
    const element = RootLayout({
      children: <main data-testid="page-content">Page</main>
    }) as React.ReactElement;

    expect(element.type).toBe('html');
    expect(element.props.lang).toBe('en');
    expect(element.props.className).toContain('antialiased');
    expect(element.props.suppressHydrationWarning).toBe(true);
  });

  it('renders children inside the body element', () => {
    const element = RootLayout({
      children: <main data-testid="page-content">Page</main>
    }) as React.ReactElement;

    const htmlChildren = React.Children.toArray(
      element.props.children
    ) as React.ReactElement[];
    const body = htmlChildren.find((child) => child.type === 'body');

    expect(body).toBeDefined();
    expect(body?.props.className).toContain('min-h-screen');

    const bodyChildren = React.Children.toArray(body?.props.children);
    const content = bodyChildren.find(
      (child) =>
        React.isValidElement(child) && child.props['data-testid'] === 'page-content'
    );

    expect(content).toBeDefined();
  });
});
