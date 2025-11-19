import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import { useLocalSearchParams, router } from 'expo-router';

const CarParkDetail = () => {
  const { carParkId } = useLocalSearchParams();
  const [park, setPark] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchPark = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/car-parks/${carParkId}`);
      setPark(res.data.data);
    } catch (err) {
      console.log('Error fetching park', err.message);
      Alert.alert('Error', 'Could not load car park');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPark(); }, []);

  // Poll for updates every 5 seconds
  const poll = useRef(null);
  useEffect(() => {
    poll.current = setInterval(fetchPark, 5000);
    return () => clearInterval(poll.current);
  }, []);

  const setPercent = async (percent) => {
    if (!park) return;
    const newCount = Math.round(park.capacity * percent);
    try {
      const res = await axios.patch(`${API_BASE_URL}/car-parks/${park._id}/current`, { currentCars: newCount });
      setPark(res.data.data);
    } catch (err) {
      console.log('Error updating', err.message);
      Alert.alert('Error', 'Could not update car park');
    }
  };

  if (loading || !park) return <View style={styles.center}><ActivityIndicator size="large" color="#1e40af" /></View>;

  const percent = park.capacity > 0 ? park.currentCars / park.capacity : 0;
  const color = percent >= 0.8 ? '#dc2626' : percent >= 0.5 ? '#f59e0b' : '#16a34a';

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>{park.name}</Text>
        <Text style={[styles.count, { color }]}>{park.currentCars}/{park.capacity}</Text>

        <View style={styles.row}>
          <TouchableOpacity style={[styles.btn, { backgroundColor: '#e5e7eb' }]} onPress={() => setPercent(0)}>
            <Text>Empty</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, { backgroundColor: '#fee2b3' }]} onPress={() => setPercent(0.25)}>
            <Text>25%</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, { backgroundColor: '#fde68a' }]} onPress={() => setPercent(0.5)}>
            <Text>50%</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, { backgroundColor: '#fecaca' }]} onPress={() => setPercent(1)}>
            <Text>Full</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={[styles.close, { backgroundColor: color }]} onPress={() => router.back()}>
          <Text style={{ color: 'white' }}>Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6fa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { padding: 16, backgroundColor: '#fff', margin: 16, borderRadius: 8, elevation: 2 },
  title: { fontSize: 20, fontWeight: '700' },
  count: { fontSize: 18, fontWeight: '700', marginVertical: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  btn: { padding: 10, backgroundColor: '#e5e7eb', borderRadius: 6 },
  close: { marginTop: 20, padding: 12, alignItems: 'center', borderRadius: 6 }
});

export default CarParkDetail;
