// Mock expo modules
jest.mock('expo-font');
jest.mock('expo-asset');
jest.mock('expo-status-bar', () => ({
  StatusBar: 'StatusBar'
}));

// Global mocks
global.__DEV__ = true;
global.fetch = jest.fn();

// Mock our debug utility to avoid import issues during testing
jest.mock('./src/utils/debug', () => ({
  logInfo: jest.fn(),
  logError: jest.fn(),
  logDebug: jest.fn(),
  startTimer: jest.fn(),
  endTimer: jest.fn(),
  logMemoryUsage: jest.fn()
}));

// Mock console methods for cleaner test output
global.console = {
  ...console
  // Uncomment to ignore specific console outputs
  // log: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
};
