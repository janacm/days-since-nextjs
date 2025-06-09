const { device, expect } = require('detox');

describe('Simulator Test', () => {
  beforeAll(async () => {
    // Just try to prepare the device without launching an app
    console.log('Testing simulator availability...');
  });

  it('should be able to open and control the simulator', async () => {
    // Test basic device operations
    await device.setOrientation('portrait');
    console.log('✓ Simulator orientation set to portrait');

    await device.setOrientation('landscape');
    console.log('✓ Simulator orientation set to landscape');

    await device.setOrientation('portrait');
    console.log('✓ Simulator orientation reset to portrait');

    // This test passes if we can control the simulator
    expect(true).toBe(true);
  });
});
