import fs from 'fs';
import path from 'path';

describe('App Registration Configuration', () => {
  let appJsonContent: any;
  let packageJsonContent: any;
  let indexJsContent: string;

  beforeAll(() => {
    // Read configuration files
    const appJsonPath = path.join(__dirname, '../app.json');
    const packageJsonPath = path.join(__dirname, '../package.json');
    const indexJsPath = path.join(__dirname, '../index.js');

    appJsonContent = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
    packageJsonContent = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    indexJsContent = fs.readFileSync(indexJsPath, 'utf8');
  });

  describe('Configuration Consistency', () => {
    it('should have consistent app name between app.json and index.js registration', () => {
      const appName = appJsonContent.expo.name;
      const slug = appJsonContent.expo.slug;

      // Extract the registered component name from index.js
      const registerComponentRegex =
        /AppRegistry\.registerComponent\(['"`]([^'"`]+)['"`]/;
      const match = indexJsContent.match(registerComponentRegex);

      expect(match).toBeTruthy();
      const registeredName = match?.[1];

      // The registered component name should match either the app name or slug
      expect([appName, slug]).toContain(registeredName);
    });

    it('should have consistent app name between app.json and package.json', () => {
      const appName = appJsonContent.expo.name;
      const packageName = packageJsonContent.name;

      // Normalize names for comparison (handle dashes, underscores, etc.)
      const normalizeAppName = (name: string) =>
        name.toLowerCase().replace(/[-_\s]/g, '');

      expect(normalizeAppName(appName)).toBe(normalizeAppName(packageName));
    });

    it('should have matching runApplication call in index.js if present', () => {
      const appName = appJsonContent.expo.name;

      // Extract the runApplication call from index.js
      const runApplicationRegex =
        /AppRegistry\.runApplication\(['"`]([^'"`]+)['"`]/;
      const match = indexJsContent.match(runApplicationRegex);

      if (match) {
        const runAppName = match[1];
        expect([appName, appName.replace(/-/g, '')]).toContain(runAppName);
      }
    });
  });

  describe('iOS Configuration', () => {
    it('should have valid iOS bundle identifier format', () => {
      const bundleId = appJsonContent.expo.ios?.bundleIdentifier;

      if (bundleId) {
        // Bundle identifier should follow reverse domain notation
        expect(bundleId).toMatch(/^[a-zA-Z0-9.-]+\.[a-zA-Z0-9.-]+$/);

        // Should not contain underscores (iOS requirement)
        expect(bundleId).not.toContain('_');

        // Should not start or end with dots or hyphens
        expect(bundleId).not.toMatch(/^[.-]|[.-]$/);
      }
    });

    it('should have bundle identifier that reflects the app name', () => {
      const bundleId = appJsonContent.expo.ios?.bundleIdentifier;
      const appName = appJsonContent.expo.name;

      if (bundleId && appName) {
        // Extract the app name part from bundle identifier (last component)
        const appNameFromBundle = bundleId.split('.').pop();

        // Should match the app name (allowing for format differences)
        const normalizedAppName = appName.toLowerCase().replace(/[-_\s]/g, '');
        const normalizedBundleName = appNameFromBundle
          ?.toLowerCase()
          .replace(/[-_\s]/g, '');

        expect(normalizedBundleName).toBe(normalizedAppName);
      }
    });
  });

  describe('Entry Point Validation', () => {
    it('should have correct main entry point in package.json', () => {
      expect(packageJsonContent.main).toBe('index.js');
    });

    it('should have index.js file that imports and registers the App component', () => {
      // Check that App is imported
      expect(indexJsContent).toMatch(/import\s+App\s+from\s+['"]\.\//);

      // Check that AppRegistry is imported
      expect(indexJsContent).toMatch(
        /import\s+.*AppRegistry.*from\s+['"]react-native['"]/
      );

      // Check that registerComponent is called
      expect(indexJsContent).toMatch(/AppRegistry\.registerComponent/);
    });
  });

  describe('Expo Configuration Validation', () => {
    it('should have required Expo configuration fields', () => {
      expect(appJsonContent.expo).toBeDefined();
      expect(appJsonContent.expo.name).toBeDefined();
      expect(appJsonContent.expo.slug).toBeDefined();
      expect(appJsonContent.expo.version).toBeDefined();
    });

    it('should have valid platform configuration', () => {
      const platforms = appJsonContent.expo.platforms;

      if (platforms) {
        expect(Array.isArray(platforms)).toBe(true);
        expect(platforms.length).toBeGreaterThan(0);

        // Should contain at least one valid platform
        const validPlatforms = ['ios', 'android', 'web'];
        const hasValidPlatform = platforms.some((platform: string) =>
          validPlatforms.includes(platform)
        );
        expect(hasValidPlatform).toBe(true);
      }
    });

    it('should have consistent slug format', () => {
      const slug = appJsonContent.expo.slug;

      // Slug should be URL-safe (lowercase, no spaces, hyphens okay)
      expect(slug).toMatch(/^[a-z0-9-]+$/);
      expect(slug).not.toContain(' ');
      expect(slug).not.toContain('_');
    });
  });

  describe('Prevention of Registration Errors', () => {
    it('should prevent "main has not been registered" error by ensuring consistent naming', () => {
      // This test validates that all naming conventions are consistent
      // to prevent the error we fixed

      const appName = appJsonContent.expo.name;
      const packageName = packageJsonContent.name;

      // Extract registered component name
      const registerComponentRegex =
        /AppRegistry\.registerComponent\(['"`]([^'"`]+)['"`]/;
      const match = indexJsContent.match(registerComponentRegex);
      const registeredName = match?.[1];

      expect(registeredName).toBeDefined();

      // Normalize all names for comparison
      const normalize = (name: string) =>
        name.toLowerCase().replace(/[-_\s]/g, '');

      const normalizedAppName = normalize(appName);
      const normalizedPackageName = normalize(packageName);
      const normalizedRegisteredName = normalize(registeredName!);

      // All should normalize to the same value
      expect(normalizedRegisteredName).toBe(normalizedAppName);
      expect(normalizedPackageName).toBe(normalizedAppName);
    });

    it('should have iOS project structure matching the registered name', () => {
      // Extract registered component name
      const registerComponentRegex =
        /AppRegistry\.registerComponent\(['"`]([^'"`]+)['"`]/;
      const match = indexJsContent.match(registerComponentRegex);
      const registeredName = match?.[1];

      expect(registeredName).toBeDefined();

      // Check if iOS directory exists with expected name
      const iosProjectPath = path.join(__dirname, '../ios', registeredName!);

      // This should exist (it's the iOS project directory)
      if (fs.existsSync(iosProjectPath)) {
        expect(fs.statSync(iosProjectPath).isDirectory()).toBe(true);
      }
    });
  });
});
