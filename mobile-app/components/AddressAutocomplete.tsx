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

interface AddressAutocompleteProps {
  location: string;
  onLocationChange: (location: string) => void;
  required?: boolean;
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

export default function AddressAutocomplete({
  location,
  onLocationChange,
  required = false,
  disabled = false,
}: AddressAutocompleteProps) {
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState(location);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Debug: Log API key status on mount
  useEffect(() => {
    console.log("AddressAutocomplete mounted");
    console.log("API Key present:", !!GOOGLE_PLACES_API_KEY);
    console.log("API Key length:", GOOGLE_PLACES_API_KEY?.length || 0);
  }, []);

  useEffect(() => {
    setSearchQuery(location);
  }, [location]);

  const fetchPredictions = async (input: string) => {
    if (!input.trim() || input.length < 3) {
      setPredictions([]);
      setShowSuggestions(false);
      return;
    }

    if (!GOOGLE_PLACES_API_KEY) {
      console.warn("Google Places API key not found. Make sure EXPO_PUBLIC_GOOGLE_MAPS_API_KEY is set.");
      return;
    }

    setLoading(true);
    try {
      const url = `${GOOGLE_PLACES_AUTOCOMPLETE_URL}?input=${encodeURIComponent(
        input
      )}&key=${GOOGLE_PLACES_API_KEY}&types=address`;
      console.log("Fetching predictions for:", input);
      const response = await fetch(url);
      const data = await response.json();
      console.log("Predictions response:", data);

      if (data.status === "OK" && data.predictions) {
        setPredictions(data.predictions);
        setShowSuggestions(true);
        console.log("Found", data.predictions.length, "predictions");
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
    console.log("🔍 Text changed:", text, "Length:", text.length);
    setSearchQuery(text);
    onLocationChange(text);

    // Debounce API calls
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      console.log("⏰ Debounce triggered, fetching predictions for:", text);
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

      if (data.result) {
        const place = data.result;
        
        // Just set the location field with the formatted address
        // Backend will parse city and state when saving
        if (place.formatted_address) {
          onLocationChange(place.formatted_address);
        } else if (data.result.formatted_address) {
          onLocationChange(data.result.formatted_address);
        }
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
      {/* Location Input */}
      <View style={styles.section}>
        <Text style={styles.label}>
          Location {required && "*"}
        </Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={searchQuery}
            onChangeText={handleTextChange}
            placeholder="Start typing an address..."
            placeholderTextColor={COLORS.midnightNavy + "66"}
            editable={!disabled}
            onFocus={() => {
              console.log("Input focused, predictions:", predictions.length);
              if (predictions.length > 0) {
                setShowSuggestions(true);
              }
            }}
            onBlur={() => {
              // Don't hide immediately on blur - let user select
              // setTimeout(() => setShowSuggestions(false), 300);
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
      </View>

      {/* Suggestions List - Using Modal for better visibility */}
      <Modal
        visible={showSuggestions && predictions.length > 0}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          console.log("Modal close requested");
          setShowSuggestions(false);
        }}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => {
            console.log("Overlay pressed, closing suggestions");
            setShowSuggestions(false);
          }}
        >
          <View style={styles.suggestionsContainer} onStartShouldSetResponder={() => true}>
            <View style={styles.suggestionsHeader}>
              <Text style={styles.suggestionsHeaderText}>
                Select an address ({predictions.length})
              </Text>
              <TouchableOpacity
                onPress={() => {
                  console.log("Close button pressed");
                  setShowSuggestions(false);
                }}
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
                  onPress={() => {
                    console.log("Place selected:", item.description);
                    handleSelectPlace(item);
                  }}
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
                      {item.structured_formatting?.main_text || item.description}
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
  },
  section: {
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.midnightNavy,
    marginBottom: 8,
  },
  inputContainer: {
    position: "relative",
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.frostGray,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.midnightNavy,
    backgroundColor: COLORS.white,
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
    maxHeight: 200,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
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

