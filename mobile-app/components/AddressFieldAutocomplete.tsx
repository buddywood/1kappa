import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../lib/constants";

const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "";
const GOOGLE_PLACES_AUTOCOMPLETE_URL =
  "https://maps.googleapis.com/maps/api/place/autocomplete/json";
const GOOGLE_PLACES_DETAILS_URL =
  "https://maps.googleapis.com/maps/api/place/details/json";

interface AddressFieldAutocompleteProps {
  value: string;
  onChangeText: (address: string) => void;
  label?: string;
  placeholder?: string;
  multiline?: boolean;
  disabled?: boolean;
}

interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

interface PlaceDetails {
  result: {
    formatted_address: string;
    address_components: Array<{
      long_name: string;
      short_name: string;
      types: string[];
    }>;
  };
}

export default function AddressFieldAutocomplete({
  value,
  onChangeText,
  label,
  placeholder = "Start typing an address...",
  multiline = false,
  disabled = false,
}: AddressFieldAutocompleteProps) {
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState(value);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setSearchQuery(value);
  }, [value]);

  const fetchPredictions = async (input: string) => {
    if (!input.trim() || input.length < 3) {
      setPredictions([]);
      setShowSuggestions(false);
      return;
    }

    if (!GOOGLE_PLACES_API_KEY) {
      console.warn(
        "Google Places API key not found. Make sure EXPO_PUBLIC_GOOGLE_MAPS_API_KEY is set."
      );
      return;
    }

    setLoading(true);
    try {
      const url = `${GOOGLE_PLACES_AUTOCOMPLETE_URL}?input=${encodeURIComponent(
        input
      )}&key=${GOOGLE_PLACES_API_KEY}&types=address`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === "OK" && data.predictions) {
        setPredictions(data.predictions);
        setShowSuggestions(true);
      } else if (data.status === "ZERO_RESULTS") {
        setPredictions([]);
        setShowSuggestions(false);
      } else {
        console.warn("Places API error:", data.status, data.error_message);
        setPredictions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error("Error fetching predictions:", error);
      setPredictions([]);
      setShowSuggestions(false);
    } finally {
      setLoading(false);
    }
  };

  const handleTextChange = (text: string) => {
    setSearchQuery(text);
    onChangeText(text);

    // Debounce API calls
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      fetchPredictions(text);
    }, 300);
  };

  const fetchPlaceDetails = async (placeId: string) => {
    if (!GOOGLE_PLACES_API_KEY) {
      return;
    }

    setLoading(true);
    try {
      const url = `${GOOGLE_PLACES_DETAILS_URL}?place_id=${placeId}&key=${GOOGLE_PLACES_API_KEY}&fields=formatted_address,address_components`;
      const response = await fetch(url);
      const data: PlaceDetails = await response.json();

      if (data.result && data.result.formatted_address) {
        onChangeText(data.result.formatted_address);
        setSearchQuery(data.result.formatted_address);
      }
    } catch (error) {
      console.error("Error fetching place details:", error);
    } finally {
      setLoading(false);
      setShowSuggestions(false);
      setPredictions([]);
    }
  };

  const handleSelectPlace = (prediction: PlacePrediction) => {
    setSearchQuery(prediction.description);
    fetchPlaceDetails(prediction.place_id);
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, multiline && styles.inputMultiline]}
          value={searchQuery}
          onChangeText={handleTextChange}
          placeholder={placeholder}
          placeholderTextColor={COLORS.midnightNavy + "50"}
          editable={!disabled}
          multiline={multiline}
          numberOfLines={multiline ? 3 : 1}
          onFocus={() => {
            if (predictions.length > 0) {
              setShowSuggestions(true);
            }
          }}
        />
        {loading && (
          <ActivityIndicator
            size="small"
            color={COLORS.crimson}
            style={styles.loader}
          />
        )}
      </View>

      {/* Suggestions Modal */}
      <Modal
        visible={showSuggestions && predictions.length > 0}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSuggestions(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSuggestions(false)}
        >
          <View style={styles.suggestionsContainer}>
            <View style={styles.suggestionsHeader}>
              <Text style={styles.suggestionsHeaderText}>
                Select an address ({predictions.length})
              </Text>
              <TouchableOpacity
                onPress={() => setShowSuggestions(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={COLORS.midnightNavy} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={predictions}
              keyExtractor={(item) => item.place_id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.suggestionItem}
                  onPress={() => handleSelectPlace(item)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="location-outline"
                    size={20}
                    color={COLORS.crimson}
                    style={styles.suggestionIcon}
                  />
                  <View style={styles.suggestionTextContainer}>
                    <Text style={styles.suggestionMainText}>
                      {item.structured_formatting?.main_text ||
                        item.description}
                    </Text>
                    {item.structured_formatting?.secondary_text && (
                      <Text style={styles.suggestionSecondaryText}>
                        {item.structured_formatting.secondary_text}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              )}
              style={styles.suggestionsList}
              keyboardShouldPersistTaps="handled"
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.midnightNavy,
    marginBottom: 8,
  },
  inputContainer: {
    position: "relative",
  },
  input: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    fontSize: 16,
    color: COLORS.midnightNavy,
    borderWidth: 1,
    borderColor: COLORS.frostGray + "AA",
  },
  inputMultiline: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  loader: {
    position: "absolute",
    right: 12,
    top: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  suggestionsContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.frostGray,
    maxHeight: 400,
    width: "90%",
    elevation: 10,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  suggestionsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.frostGray,
  },
  suggestionsHeaderText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.midnightNavy,
  },
  closeButton: {
    padding: 4,
  },
  suggestionsList: {
    maxHeight: 300,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.frostGray,
  },
  suggestionIcon: {
    marginRight: 12,
  },
  suggestionTextContainer: {
    flex: 1,
  },
  suggestionMainText: {
    fontSize: 16,
    fontWeight: "500",
    color: COLORS.midnightNavy,
    marginBottom: 2,
  },
  suggestionSecondaryText: {
    fontSize: 14,
    color: COLORS.midnightNavy + "99",
  },
});
