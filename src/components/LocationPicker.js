import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../theme/colors';
import { Typography, Spacing, BorderRadius, Shadows } from '../theme/typography';
import { GOOGLE_MAPS_API_KEY } from '../config/keys';

const DEFAULT_RADIUS = 200;
const MIN_RADIUS = 50;
const MAX_RADIUS = 2000;

// Default center (New Delhi) if no location is available
const DEFAULT_REGION = {
  latitude: 28.6139,
  longitude: 77.209,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

/**
 * LocationPicker — Embedded map with Google Places search, radius slider,
 * and "Use My Location" button.
 *
 * Props:
 *   locationName (string)        — current location text
 *   onLocationChange (fn)        — callback({ name, latitude, longitude })
 *   radius (number)              — current radius in meters
 *   onRadiusChange (fn)          — callback(number)
 */
export default function LocationPicker({
  locationName = '',
  onLocationChange,
  radius = DEFAULT_RADIUS,
  onRadiusChange,
}) {
  const [query, setQuery] = useState(locationName);
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [selectedCoords, setSelectedCoords] = useState(null);
  const [mapRegion, setMapRegion] = useState(DEFAULT_REGION);
  const [showMap, setShowMap] = useState(!!locationName);

  const mapRef = useRef(null);
  const searchTimeout = useRef(null);
  const mapFadeAnim = useRef(new Animated.Value(0)).current;

  // Animate map in when it becomes visible
  useEffect(() => {
    if (showMap) {
      Animated.timing(mapFadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }
  }, [showMap]);

  // Sync external locationName changes
  useEffect(() => {
    if (locationName && locationName !== query) {
      setQuery(locationName);
    }
  }, [locationName]);

  // ─── GOOGLE PLACES AUTOCOMPLETE SEARCH ────────────────────────────────
  const handleSearchChange = useCallback((text) => {
    setQuery(text);

    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    if (text.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    setSearching(true);
    searchTimeout.current = setTimeout(async () => {
      try {
        const url =
          `https://maps.googleapis.com/maps/api/place/autocomplete/json` +
          `?input=${encodeURIComponent(text)}` +
          `&key=${GOOGLE_MAPS_API_KEY}` +
          `&language=en`;

        const res = await fetch(url);
        const data = await res.json();
        
        if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
          console.warn('PLACES API ERROR:', data);
        }

        if (data.status === 'OK' && data.predictions) {
          setSuggestions(
            data.predictions.map((p) => ({
              id: p.place_id,
              name: p.description,
              placeId: p.place_id,
            }))
          );
        } else {
          setSuggestions([]);
        }
      } catch (err) {
        console.warn('Google Places network error:', err);
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 350); // 350ms debounce
  }, []);

  // ─── GET PLACE DETAILS (lat/lng) FROM PLACE ID ────────────────────────
  const getPlaceDetails = useCallback(async (placeId) => {
    try {
      const url =
        `https://maps.googleapis.com/maps/api/place/details/json` +
        `?place_id=${placeId}` +
        `&fields=geometry,formatted_address,name` +
        `&key=${GOOGLE_MAPS_API_KEY}`;

      const res = await fetch(url);
      const data = await res.json();

      if (data.status === 'OK' && data.result?.geometry?.location) {
        return {
          latitude: data.result.geometry.location.lat,
          longitude: data.result.geometry.location.lng,
          name: data.result.formatted_address || data.result.name,
        };
      }
    } catch (err) {
      console.log('Google Place Details error:', err);
    }
    return null;
  }, []);

  // ─── SELECT A SUGGESTION ──────────────────────────────────────────────
  const handleSelectSuggestion = useCallback(async (item) => {
    setSuggestions([]);
    setSearching(true);
    setQuery(item.name);

    const details = await getPlaceDetails(item.placeId);
    setSearching(false);

    if (!details) return;

    const coords = { latitude: details.latitude, longitude: details.longitude };
    setSelectedCoords(coords);
    setShowMap(true);

    const newRegion = {
      ...coords,
      latitudeDelta: 0.008,
      longitudeDelta: 0.008,
    };
    setMapRegion(newRegion);

    setTimeout(() => {
      mapRef.current?.animateToRegion(newRegion, 500);
    }, 300);

    onLocationChange?.({
      name: item.name,
      latitude: details.latitude,
      longitude: details.longitude,
    });
  }, [onLocationChange, getPlaceDetails]);

  // ─── USE MY LOCATION ──────────────────────────────────────────────────
  const handleUseMyLocation = useCallback(async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocating(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const coords = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };

      // Reverse geocode using Google
      let addressName = `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`;
      try {
        const url =
          `https://maps.googleapis.com/maps/api/geocode/json` +
          `?latlng=${coords.latitude},${coords.longitude}` +
          `&key=${GOOGLE_MAPS_API_KEY}`;

        const res = await fetch(url);
        const data = await res.json();
        if (data.status === 'OK' && data.results?.length > 0) {
          addressName = data.results[0].formatted_address;
        }
      } catch (e) {
        // fallback to coords string — already set above
      }

      setSelectedCoords(coords);
      setQuery(addressName);
      setSuggestions([]);
      setShowMap(true);

      const newRegion = {
        ...coords,
        latitudeDelta: 0.008,
        longitudeDelta: 0.008,
      };
      setMapRegion(newRegion);

      setTimeout(() => {
        mapRef.current?.animateToRegion(newRegion, 500);
      }, 300);

      onLocationChange?.({
        name: addressName,
        latitude: coords.latitude,
        longitude: coords.longitude,
      });
    } catch (err) {
      console.log('Location error:', err);
    } finally {
      setLocating(false);
    }
  }, [onLocationChange]);

  // ─── RADIUS SLIDER LOGIC ─────────────────────────────────────────────
  const handleRadiusSlider = useCallback((value) => {
    const newRadius = Math.round(MIN_RADIUS + (value / 100) * (MAX_RADIUS - MIN_RADIUS));
    onRadiusChange?.(newRadius);
  }, [onRadiusChange]);

  const sliderPercent = ((radius - MIN_RADIUS) / (MAX_RADIUS - MIN_RADIUS)) * 100;

  // ─── RENDER ───────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* Search Input */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Ionicons name="search-outline" size={18} color={Colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={handleSearchChange}
            placeholder="Search a location..."
            placeholderTextColor={Colors.textMuted}
          />
          {searching && (
            <ActivityIndicator size="small" color={Colors.accentOrange} style={styles.searchSpinner} />
          )}
          {query.length > 0 && !searching && (
            <TouchableOpacity
              onPress={() => {
                setQuery('');
                setSuggestions([]);
                setSelectedCoords(null);
                setShowMap(false);
                onLocationChange?.({ name: '', latitude: null, longitude: null });
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Use My Location Button */}
        <TouchableOpacity
          style={styles.myLocationBtn}
          onPress={handleUseMyLocation}
          activeOpacity={0.7}
          disabled={locating}
        >
          {locating ? (
            <ActivityIndicator size="small" color={Colors.textLight} />
          ) : (
            <Ionicons name="navigate" size={18} color={Colors.textLight} />
          )}
        </TouchableOpacity>
      </View>

      {/* Suggestions Dropdown */}
      {suggestions.length > 0 && (
        <View style={[styles.suggestionsContainer, Shadows.medium]}>
          {suggestions.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.suggestionItem}
              onPress={() => handleSelectSuggestion(item)}
              activeOpacity={0.7}
            >
              <Ionicons name="location-outline" size={16} color={Colors.accentOrange} />
              <Text style={styles.suggestionText} numberOfLines={2}>
                {item.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Map View */}
      {showMap && selectedCoords && (
        <Animated.View style={[styles.mapContainer, Shadows.soft, { opacity: mapFadeAnim }]}>
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={mapRegion}
            showsUserLocation={true}
            showsMyLocationButton={false}
          >
            <Marker
              coordinate={selectedCoords}
              title={query}
            >
              <View style={styles.markerContainer}>
                <View style={styles.markerDot}>
                  <Ionicons name="location" size={20} color={Colors.white} />
                </View>
              </View>
            </Marker>

            <Circle
              center={selectedCoords}
              radius={radius}
              strokeColor="rgba(232, 113, 58, 0.8)"
              fillColor="rgba(232, 113, 58, 0.15)"
              strokeWidth={2}
            />
          </MapView>

          {/* Radius badge overlay on map */}
          <View style={styles.radiusBadge}>
            <Ionicons name="radio-outline" size={14} color={Colors.accentOrange} />
            <Text style={styles.radiusBadgeText}>{radius}m</Text>
          </View>
        </Animated.View>
      )}

      {/* Radius Slider */}
      {showMap && selectedCoords && (
        <View style={styles.sliderSection}>
          <View style={styles.sliderHeader}>
            <Text style={styles.sliderLabel}>Geofence Radius</Text>
            <View style={styles.radiusValueBubble}>
              <Text style={styles.radiusValueText}>{radius}m</Text>
            </View>
          </View>

          {/* Custom Slider Track */}
          <View style={styles.sliderTrackContainer}>
            <View style={styles.sliderTrack}>
              <View style={[styles.sliderFill, { width: `${sliderPercent}%` }]} />
              <View
                style={[styles.sliderThumb, { left: `${sliderPercent}%` }]}
              />
            </View>

            {/* Invisible touchable area for slider interaction */}
            <View
              style={styles.sliderTouchArea}
              onStartShouldSetResponder={() => true}
              onMoveShouldSetResponder={() => true}
              onResponderGrant={(evt) => {
                const x = evt.nativeEvent.locationX;
                const percent = Math.max(0, Math.min(100, (x / 280) * 100));
                handleRadiusSlider(percent);
              }}
              onResponderMove={(evt) => {
                const x = evt.nativeEvent.locationX;
                const percent = Math.max(0, Math.min(100, (x / 280) * 100));
                handleRadiusSlider(percent);
              }}
            />
          </View>

          <View style={styles.sliderLabels}>
            <Text style={styles.sliderMinMax}>{MIN_RADIUS}m</Text>
            <Text style={styles.sliderMinMax}>{MAX_RADIUS}m</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.chipBg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.chipBgAlt,
    paddingHorizontal: Spacing.md,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...Typography.input,
    color: Colors.textDark,
    paddingVertical: Spacing.md + 2,
  },
  searchSpinner: {
    marginLeft: Spacing.sm,
  },
  myLocationBtn: {
    width: 46,
    height: 46,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.accentOrange,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.soft,
  },

  // Suggestions
  suggestionsContainer: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.chipBgAlt,
    overflow: 'hidden',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  suggestionText: {
    ...Typography.small,
    color: Colors.textDark,
    marginLeft: Spacing.sm,
    flex: 1,
  },

  // Map
  mapContainer: {
    marginTop: Spacing.md,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    backgroundColor: Colors.chipBg,
  },
  map: {
    width: '100%',
    height: 200,
  },
  markerContainer: {
    alignItems: 'center',
  },
  markerDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.accentOrange,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.medium,
  },
  radiusBadge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.pill,
    ...Shadows.soft,
  },
  radiusBadgeText: {
    ...Typography.chip,
    color: Colors.accentOrange,
    fontWeight: '700',
    marginLeft: 4,
  },

  // Slider
  sliderSection: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.chipBg,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.chipBgAlt,
  },
  sliderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  sliderLabel: {
    ...Typography.label,
    color: Colors.textDark,
  },
  radiusValueBubble: {
    backgroundColor: Colors.accentOrange,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.pill,
  },
  radiusValueText: {
    ...Typography.chip,
    color: Colors.white,
    fontWeight: '700',
  },
  sliderTrackContainer: {
    position: 'relative',
    height: 40,
    justifyContent: 'center',
  },
  sliderTrack: {
    height: 6,
    backgroundColor: Colors.chipBgAlt,
    borderRadius: 3,
    position: 'relative',
  },
  sliderFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: Colors.accentOrange,
    borderRadius: 3,
  },
  sliderThumb: {
    position: 'absolute',
    top: -9,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.white,
    borderWidth: 3,
    borderColor: Colors.accentOrange,
    marginLeft: -12,
    ...Shadows.medium,
  },
  sliderTouchArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
  },
  sliderMinMax: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontSize: 11,
  },
});
