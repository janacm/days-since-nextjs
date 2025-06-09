const { device, expect, element, by } = require('detox');

describe('Days Since Mobile App', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should display the main app screen', async () => {
    // Check if the main title is visible
    await expect(element(by.text('Days Since Mobile'))).toBeVisible();

    // Check if the subtitle is visible
    await expect(
      element(by.text('React Native app is running!'))
    ).toBeVisible();
  });

  it('should show debug mode status', async () => {
    // Check if debug mode indicator is present
    await expect(element(by.text('Debug mode: ON'))).toBeVisible();
  });

  it('should handle app lifecycle correctly', async () => {
    // Put app in background and bring it back
    await device.sendToHome();
    await device.launchApp({ newInstance: false });

    // App should still be working
    await expect(element(by.text('Days Since Mobile'))).toBeVisible();
  });

  it('should be responsive to device orientation', async () => {
    // Test portrait orientation
    await device.setOrientation('portrait');
    await expect(element(by.text('Days Since Mobile'))).toBeVisible();

    // Test landscape orientation
    await device.setOrientation('landscape');
    await expect(element(by.text('Days Since Mobile'))).toBeVisible();

    // Return to portrait
    await device.setOrientation('portrait');
  });

  it('should handle deep linking (if applicable)', async () => {
    // This would be useful when navigation is added back
    // await device.openURL({ url: 'exp://localhost:8081/--/dashboard' });
    // await expect(element(by.id('dashboard-screen'))).toBeVisible();
  });
});
