import React from 'react';

// Mock our debug utilities before importing App
jest.mock('../src/utils/debug', () => ({
  logInfo: jest.fn(),
  logError: jest.fn(),
  logDebug: jest.fn(),
  startTimer: jest.fn(),
  endTimer: jest.fn(),
  logMemoryUsage: jest.fn()
}));

import App from '../App';

describe('App Component', () => {
  it('exports a valid React component', () => {
    expect(App).toBeDefined();
    expect(typeof App).toBe('function');
  });

  it('can be instantiated without throwing errors', () => {
    expect(() => {
      React.createElement(App);
    }).not.toThrow();
  });

  it('debug utilities are properly mocked', () => {
    const { logInfo, logDebug } = require('../src/utils/debug');

    // Create the component to trigger debug calls
    React.createElement(App);

    // Check that mocked functions exist
    expect(logInfo).toBeDefined();
    expect(logDebug).toBeDefined();
  });
});
