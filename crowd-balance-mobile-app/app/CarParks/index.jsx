import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Alert } from 'react-native';
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import { router } from 'expo-router';

const CarParksScreen = () => {
  const [parks, setParks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const fetchParks = async () => {
    setLoading(true);
    try {
      setErrorMessage(null);
      const res = await axios.get(`${API_BASE_URL}/car-parks`);
      setParks(res.data.data || []);
    } catch (err) {
      console.log('Error fetching car parks', err.message);
      setParks([]);
      const msg = `Could not load car parks. Tried: ${API_BASE_URL}/car-parks`;
      setErrorMessage(msg);
      // also show an alert for visibility
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParks();
  }, []);

  // Poll every 5 seconds for near real-time updates
  const pollRef = useRef(null);
  useEffect(() => {
    pollRef.current = setInterval(fetchParks, 5000);
    return () => clearInterval(pollRef.current);
  }, []);

  const updateCurrent = async (parkId, newCount) => {
    try {
      const res = await axios.patch(`${API_BASE_URL}/car-parks/${parkId}/current`, { currentCars: newCount });
      const updated = res.data.data;
      setParks((prev) => prev.map(p => p._id === updated._id ? updated : p));
    } catch (err) {
      console.log('Error updating park', err.message);
      Alert.alert('Error', 'Could not update car park');
    }
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

        <View style={styles.progressRow}>
          <View style={[styles.progressBar, { backgroundColor: '#e6e6e6' }]}>
            <View style={{ width: `${Math.round(percent*100)}%`, backgroundColor: color, height: '100%', borderRadius: 6 }} />
          </View>
        </View>

        <View style={styles.controlsRow}>
          <TouchableOpacity
            style={[styles.bigBtn, { backgroundColor: '#ef4444' }]}
            onPress={() => updateCurrent(item._id, Math.max(0, item.currentCars - 1))}
          >
            <Text style={styles.bigBtnText}>-</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.detailsBtn, { backgroundColor: color }]}
            onPress={() => router.push(`/CarParks/${item._id}`)}
          >
            <Text style={styles.detailsText}>Details</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.bigBtn, { backgroundColor: '#16a34a' }]}
            onPress={() => updateCurrent(item._id, Math.min(item.capacity, item.currentCars + 1))}
          >
            <Text style={styles.bigBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#1e40af" /></View>;

  if (errorMessage) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={{ fontSize: 16, color: '#333', marginBottom: 12, textAlign: 'center' }}>{errorMessage}</Text>
        <TouchableOpacity style={[styles.smallBtn, { paddingHorizontal: 16 }]} onPress={fetchParks}>
          <Text style={styles.smallBtnText}>Retry</Text>
        </TouchableOpacity>
        <Text style={{ marginTop: 18, color: '#666', fontSize: 13, textAlign: 'center' }}>
          Tips: make sure your backend is running and `API_BASE_URL` (in config.js) points to a reachable server.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={parks}
        keyExtractor={i => i._id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6fa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: '#fff', padding: 12, borderRadius: 8, marginBottom: 12, elevation: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 16, fontWeight: '600' },
  count: { fontSize: 14, fontWeight: '700' },
  controls: { flexDirection: 'row', marginTop: 12, alignItems: 'center' },
  smallBtn: { padding: 8, backgroundColor: '#e5e7eb', borderRadius: 6, marginRight: 8 },
  smallBtnText: { fontSize: 18, fontWeight: '700' },
  detailsBtn: { padding: 8, borderRadius: 6, marginLeft: 'auto' },
  detailsText: { color: 'white', fontWeight: '600' },
  progressBar: { height: 12, borderRadius: 6, overflow: 'hidden' },
  controlsRow: { flexDirection: 'row', marginTop: 12, alignItems: 'center', justifyContent: 'space-between' },
  bigBtn: { padding: 12, borderRadius: 8, width: 60, alignItems: 'center', justifyContent: 'center' },
  bigBtnText: { color: 'white', fontSize: 20, fontWeight: '700' },
  btn: { padding: 10, borderRadius: 6, marginRight: 8 }
});

// additional styles
const more = StyleSheet.create({
  progressRow: { marginTop: 10 },
});

export default CarParksScreen;
