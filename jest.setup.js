import '@testing-library/jest-dom';

// Mock the Notification API
const mockNotification = {
  requestPermission: jest.fn().mockResolvedValue('granted'),
  permission: 'granted'
};

Object.defineProperty(window, 'Notification', {
  value: mockNotification,
  writable: true
});

// Mock the ServiceWorkerRegistration
const mockServiceWorkerRegistration = {
  showNotification: jest.fn().mockResolvedValue(undefined)
};

Object.defineProperty(navigator, 'serviceWorker', {
  value: {
    ready: Promise.resolve(mockServiceWorkerRegistration),
    register: jest.fn().mockResolvedValue(mockServiceWorkerRegistration)
  },
  writable: true
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn()
  }))
});

// Mock window.alert
window.alert = jest.fn();

// Mock console.error
console.error = jest.fn();
