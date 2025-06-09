import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  logInfo,
  logError,
  logDebug,
  startTimer,
  endTimer,
  logMemoryUsage
} from './src/utils/debug';

function App() {
  logInfo('App', 'Component mounting');
  startTimer('App-Render');

  React.useEffect(() => {
    logInfo('App', 'Component mounted successfully');
    logMemoryUsage('App');

    return () => {
      logInfo('App', 'Component unmounting');
    };
  }, []);

  try {
    logDebug('App', 'Rendering App component');

    const result = (
      <View style={styles.container}>
        <Text style={styles.title}>Days Since Mobile</Text>
        <Text style={styles.subtitle}>React Native app is running!</Text>
        <Text style={styles.debug}>Debug mode: {__DEV__ ? 'ON' : 'OFF'}</Text>
        <Text style={styles.version}>SDK: Expo 53</Text>
      </View>
    );

    endTimer('App-Render');
    logDebug('App', 'App component rendered successfully');

    return result;
  } catch (error) {
    logError('App', 'Error in App component', error);
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error loading app</Text>
        <Text style={styles.errorDetails}>{String(error)}</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 10,
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 16,
    color: '#555',
    marginBottom: 10,
    textAlign: 'center'
  },
  debug: {
    fontSize: 14,
    color: '#888',
    marginTop: 20
  },
  version: {
    fontSize: 12,
    color: '#aaa',
    marginTop: 5
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#ffebee',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  errorText: {
    fontSize: 18,
    color: '#d32f2f',
    marginBottom: 10,
    textAlign: 'center'
  },
  errorDetails: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center'
  }
});

export default App;
