import { AppRegistry } from 'react-native';
import App from './App';

// Register the main component
AppRegistry.registerComponent('dayssincemobile', () => App);

// For web compatibility
if (typeof document !== 'undefined') {
  const rootTag =
    document.getElementById('main') || document.getElementById('root');
  if (rootTag) {
    AppRegistry.runApplication('dayssincemobile', {
      initialProps: {},
      rootTag
    });
  }
}
