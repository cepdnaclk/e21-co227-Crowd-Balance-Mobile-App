import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Alert, TextInput } from 'react-native';
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import { router } from 'expo-router';

const AdminCarParks = () => {
  const [parks, setParks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState('');

  const fetchParks = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/car-parks`);
      setParks(res.data.data || []);
    } catch (err) {
      console.log('Error fetching car parks', err.message);
      Alert.alert('Error', `Could not load car parks. Tried: ${API_BASE_URL}/car-parks`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchParks(); }, []);
  const poll = useRef(null);
  useEffect(() => { poll.current = setInterval(fetchParks, 5000); return () => clearInterval(poll.current); }, []);

  const addPark = async () => {
    const cap = Number(capacity);
    if (!name.trim() || !cap || cap <= 0) {
      Alert.alert('Validation', 'Provide a name and a positive capacity');
      return;
    }
    try {
      const res = await axios.post(`${API_BASE_URL}/car-parks`, { name: name.trim(), capacity: cap });
      setName(''); setCapacity('');
      await fetchParks();
      Alert.alert('Success', 'Car park added');
    } catch (err) {
      console.log('Error adding car park', err.message);
      Alert.alert('Error', err.response?.data?.message || 'Failed to add car park');
    }
  };

  const removePark = async (id) => {
    Alert.alert('Confirm', 'Delete this car park?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await axios.delete(`${API_BASE_URL}/car-parks/${id}`);
          setParks(prev => prev.filter(p => p._id !== id));
        } catch (err) {
          console.log('Error deleting car park', err.message);
          Alert.alert('Error', 'Failed to delete car park');
        }
      }}
    ]);
  };

  const renderItem = ({ item }) => {
    const percent = item.capacity > 0 ? (item.currentCars / item.capacity) : 0;
    const color = percent >= 0.8 ? '#dc2626' : percent >= 0.5 ? '#f59e0b' : '#16a34a';

    return (
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={[styles.count, { color }]}>{item.currentCars}/{item.capacity}</Text>
        </View>
        <View style={styles.progressBar}><View style={{ width: `${Math.round(percent*100)}%`, height: '100%', backgroundColor: color, borderRadius: 6 }} /></View>
        <View style={styles.row}>
          <TouchableOpacity style={styles.deleteBtn} onPress={() => removePark(item._id)}>
            <Text style={styles.deleteText}>Remove</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Car Parks (Admin)</Text>
      <View style={styles.formRow}>
        <TextInput placeholder="Name" value={name} onChangeText={setName} style={styles.input} />
        <TextInput placeholder="Capacity" value={capacity} onChangeText={setCapacity} style={styles.input} keyboardType="numeric" />
        <TouchableOpacity style={styles.addBtn} onPress={addPark}><Text style={styles.addText}>Add</Text></TouchableOpacity>
      </View>
      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#1e40af" /></View>
      ) : (
        <FlatList data={parks} keyExtractor={i => i._id} renderItem={renderItem} contentContainerStyle={{ paddingBottom: 30 }} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6fa', padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  formRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  input: { flex: 1, backgroundColor: 'white', padding: 10, borderRadius: 8, marginRight: 8, borderWidth: 1, borderColor: '#e5e7eb' },
  addBtn: { backgroundColor: '#1e40af', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  addText: { color: 'white', fontWeight: '600' },
  card: { backgroundColor: '#fff', padding: 12, borderRadius: 8, marginBottom: 12, elevation: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 16, fontWeight: '600' },
  count: { fontSize: 14, fontWeight: '700' },
  progressBar: { height: 12, backgroundColor: '#e6e6e6', borderRadius: 6, overflow: 'hidden', marginTop: 8, marginBottom: 8 },
  deleteBtn: { backgroundColor: '#ef4444', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 6 },
  deleteText: { color: 'white', fontWeight: '600' }
});

export default AdminCarParks;
