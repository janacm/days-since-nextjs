import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, StyleSheet } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../App';
import { getEvent, updateEvent } from '../services/api';

interface Props {
  navigation: StackNavigationProp<RootStackParamList, 'EditEvent'>;
  route: RouteProp<RootStackParamList, 'EditEvent'>;
}

export default function EditEventScreen({ navigation, route }: Props) {
  const { id } = route.params;
  const [name, setName] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => {
    getEvent(id).then((event) => {
      if (event) {
        setName(event.name);
        setDate(event.date.split('T')[0]);
      }
    });
  }, [id]);

  const handleSave = async () => {
    await updateEvent(id, name, new Date(date));
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Event Name"
        value={name}
        onChangeText={setName}
        style={styles.input}
      />
      <TextInput
        placeholder="Date (YYYY-MM-DD)"
        value={date}
        onChangeText={setDate}
        style={styles.input}
      />
      <Button title="Save" onPress={handleSave} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 16 },
  input: {
    borderColor: '#ccc',
    borderWidth: 1,
    padding: 8,
    marginBottom: 12,
    borderRadius: 4
  }
});
