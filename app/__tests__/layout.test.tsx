jest.mock('@vercel/analytics/react', () => ({
  Analytics: () => null
}));

describe('Root layout metadata', () => {
  it('defines theme colors for both light and dark schemes', () => {
    const { metadata } = require('../layout');

    expect(metadata.themeColor).toEqual([
      { media: '(prefers-color-scheme: light)', color: '#ffffff' },
      { media: '(prefers-color-scheme: dark)', color: '#030711' }
    ]);
  });
});
