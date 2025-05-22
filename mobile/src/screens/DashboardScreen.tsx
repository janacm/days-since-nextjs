import React, { useEffect, useState } from 'react';
import { View, Text, Button, FlatList, StyleSheet } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { getEvents, logout } from '../services/api';
import { Event } from '@/shared/types';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'Dashboard'>;
};

export default function DashboardScreen({ navigation }: Props) {
  const [events, setEvents] = useState<Event[]>([]);

  const loadEvents = async () => {
    const data = await getEvents();
    setEvents(data);
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadEvents);
    return unsubscribe;
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Button title="Add Event" onPress={() => navigation.navigate('AddEvent')} />
      <Button title="Admin" onPress={() => navigation.navigate('Admin')} />
      <Button title="Logout" onPress={() => { logout(); navigation.replace('Login'); }} />
      <FlatList
        data={events}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.name}>{item.name}</Text>
            <Text>{new Date(item.date).toLocaleDateString()}</Text>
            <Button
              title="Edit"
              onPress={() => navigation.navigate('EditEvent', { id: item.id })}
            />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  item: {
    padding: 8,
    borderBottomColor: '#ccc',
    borderBottomWidth: 1,
    marginBottom: 8
  },
  name: { fontWeight: 'bold' }
});
