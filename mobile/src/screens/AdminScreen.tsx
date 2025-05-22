import React from 'react';
import { View, Button, StyleSheet } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { sendTestEmail } from '../services/api';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'Admin'>;
};

export default function AdminScreen({ navigation }: Props) {
  const handleSendEmail = async () => {
    await sendTestEmail();
  };

  return (
    <View style={styles.container}>
      <Button title="Send Test Email" onPress={handleSendEmail} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 16 }
});
