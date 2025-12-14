import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
  FlatList,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, API_URL } from "../lib/constants";
import { useAuth } from "../lib/auth";
import ScreenHeader from "./ScreenHeader";
import PrimaryButton from "./ui/PrimaryButton";
import TextField from "./ui/TextField";
import FormCard from "./ui/FormCard";
import {
  fetchMemberProfile,
  updateMemberProfile,
  fetchIndustries,
  fetchProfessions,
  fetchChapters,
  type MemberProfile,
  type Industry,
  type Profession,
  type Chapter,
} from "../lib/api";
import AddressFieldAutocomplete from "./AddressFieldAutocomplete";
import AddressAutocomplete from "./AddressAutocomplete";

interface EditProfileScreenProps {
  onBack: () => void;
  onProfileUpdated?: () => void;
}

export default function EditProfileScreen({
  onBack,
  onProfileUpdated,
}: EditProfileScreenProps) {
  const { user, token } = useAuth();
  const [profile, setProfile] = React.useState<MemberProfile | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [detectingLocation, setDetectingLocation] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [headshotUri, setHeadshotUri] = React.useState<string | null>(null);
  const [headshotFile, setHeadshotFile] = React.useState<{
    uri: string;
    type: string;
    name: string;
  } | null>(null);
  const [industries, setIndustries] = React.useState<Industry[]>([]);
  const [showIndustryPicker, setShowIndustryPicker] = React.useState(false);
  const [professions, setProfessions] = React.useState<Profession[]>([]);
  const [showProfessionPicker, setShowProfessionPicker] = React.useState(false);
  const [chapters, setChapters] = React.useState<Chapter[]>([]);
  const [showChapterPicker, setShowChapterPicker] = React.useState(false);
  const [showSeasonPicker, setShowSeasonPicker] = React.useState(false);

  const [formData, setFormData] = React.useState({
    name: "",
    membership_number: "",
    initiated_chapter_id: null as number | null,
    initiated_season: "",
    initiated_year: "",
    ship_name: "",
    line_name: "",
    location: "",
    address: "",
    address_is_private: false,
    phone_number: "",
    phone_is_private: false,
    industry: "",
    profession_id: null as number | null,
    job_title: "",
    bio: "",
    social_links: {
      instagram: "",
      twitter: "",
      linkedin: "",
      website: "",
    },
  });

  React.useEffect(() => {
    if (token) {
      loadProfile();
    }
    // Load industries, professions, and chapters on mount
    loadIndustries();
    loadProfessions();
    loadChapters();
  }, [token]);

  const loadIndustries = async () => {
    try {
      const industriesData = await fetchIndustries();
      setIndustries(industriesData);
    } catch (err) {
      console.error("Error loading industries:", err);
      // Don't show error to user, just log it
    }
  };

  const loadProfessions = async () => {
    try {
      const professionsData = await fetchProfessions();
      setProfessions(professionsData);
    } catch (err) {
      console.error("Error loading professions:", err);
      // Don't show error to user, just log it
    }
  };

  const loadChapters = async () => {
    try {
      const chaptersData = await fetchChapters();
      setChapters(chaptersData);
    } catch (err) {
      console.error("Error loading chapters:", err);
      // Don't show error to user, just log it
    }
  };

  const loadProfile = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);
      const profileData = await fetchMemberProfile(token);
      setProfile(profileData);
      setFormData({
        name: profileData.name || "",
        membership_number: profileData.membership_number || "",
        initiated_chapter_id: profileData.initiated_chapter_id || null,
        initiated_season: profileData.initiated_season || "",
        initiated_year: profileData.initiated_year?.toString() || "",
        ship_name: profileData.ship_name || "",
        line_name: profileData.line_name || "",
        location: profileData.location || "",
        address: profileData.address || "",
        address_is_private: profileData.address_is_private || false,
        phone_number: profileData.phone_number || "",
        phone_is_private: profileData.phone_is_private || false,
        industry: profileData.industry || "",
        profession_id: profileData.profession_id || null,
        job_title: profileData.job_title || "",
        bio: profileData.bio || "",
        social_links: {
          instagram: profileData.social_links?.instagram || "",
          twitter: profileData.social_links?.twitter || "",
          linkedin: profileData.social_links?.linkedin || "",
          website: profileData.social_links?.website || "",
        },
      });
      if (profileData.headshot_url) {
        setHeadshotUri(profileData.headshot_url);
      }
    } catch (err: any) {
      console.error("Error loading profile:", err);
      setError(err.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "We need access to your photos to upload a profile picture."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setHeadshotUri(asset.uri);
        setHeadshotFile({
          uri: asset.uri,
          type: "image/jpeg",
          name: "headshot.jpg",
        });
      }
    } catch (err) {
      console.error("Error picking image:", err);
      Alert.alert("Error", "Failed to pick image. Please try again.");
    }
  };

  const handleDetectLocation = async () => {
    setDetectingLocation(true);
    setError(null);

    try {
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "We need access to your location to auto-detect it. Please enable location permissions in your device settings."
        );
        setDetectingLocation(false);
        return;
      }

      // Get current position
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = location.coords;

      // Call backend to reverse geocode
      const response = await fetch(`${API_URL}/api/location/reverse-geocode`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          latitude,
          longitude,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || "Failed to get location information"
        );
      }

      const locationData = await response.json();

      // Auto-fill location and address fields
      setFormData((prev) => ({
        ...prev,
        location: locationData.location || "",
        address: locationData.address || prev.address,
      }));

      setSuccess("Location detected successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      console.error("Error detecting location:", err);

      let errorMessage = "Failed to detect your location.";
      if (
        err.message?.includes("denied") ||
        err.message?.includes("permission")
      ) {
        errorMessage =
          "Location access denied. Please enable location permissions in your device settings.";
      } else if (err.message?.includes("timeout")) {
        errorMessage = "Location detection timed out. Please try again.";
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setDetectingLocation(false);
    }
  };

  const handleSubmit = async () => {
    if (!token || !profile) return;

    if (!formData.name.trim()) {
      setError("Name is required");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const updateData: any = {
        name: formData.name,
        membership_number: formData.membership_number || null,
        initiated_chapter_id: formData.initiated_chapter_id || null,
        initiated_season: formData.initiated_season || null,
        initiated_year: formData.initiated_year
          ? parseInt(formData.initiated_year)
          : null,
        ship_name: formData.ship_name || null,
        line_name: formData.line_name || null,
        location: formData.location || null,
        address: formData.address || null,
        address_is_private: formData.address_is_private,
        phone_number: formData.phone_number || null,
        phone_is_private: formData.phone_is_private,
        industry: formData.industry || null,
        profession_id: formData.profession_id || null,
        job_title: formData.job_title || null,
        bio: formData.bio || null,
        social_links: formData.social_links,
      };

      if (headshotFile) {
        updateData.headshot = headshotFile;
      }

      const updatedProfile = await updateMemberProfile(token, updateData);
      setProfile(updatedProfile);
      setSuccess("Profile updated successfully!");
      setHeadshotFile(null);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);

      // Notify parent component
      if (onProfileUpdated) {
        onProfileUpdated();
      }
    } catch (err: any) {
      console.error("Error updating profile:", err);
      setError(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Edit Profile" onBack={onBack} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.crimson} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Edit Profile" onBack={onBack} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || "Profile not found"}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="Edit Profile" onBack={onBack} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {success && (
          <View style={styles.successContainer}>
            <Text style={styles.successText}>{success}</Text>
          </View>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <FormCard style={styles.formCard}>
          {/* Profile Photo */}
          <View style={styles.photoSection}>
            <Text style={styles.sectionLabel}>Profile Photo</Text>
            <View style={styles.photoContainer}>
              <View style={styles.avatarContainer}>
                {headshotUri ? (
                  <Image
                    source={{ uri: headshotUri }}
                    style={styles.avatarImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarPlaceholderText}>
                      {formData.name
                        ? formData.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)
                        : "U"}
                    </Text>
                  </View>
                )}
              </View>
              <TouchableOpacity
                style={styles.changePhotoButton}
                onPress={pickImage}
              >
                <Text style={styles.changePhotoText}>
                  {headshotUri ? "Change Photo" : "Add Photo"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Basic Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>

            <TextField
              label="Name *"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholder="Enter your name"
            />

            <View>
              <Text style={styles.readOnlyLabel}>Email</Text>
              <View style={styles.readOnlyValue}>
                <Text style={styles.readOnlyText}>{profile.email}</Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Location & Contact */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location & Contact</Text>

            <View style={styles.locationContainer}>
              <AddressAutocomplete
                location={formData.location}
                onLocationChange={(location) =>
                  setFormData({ ...formData, location })
                }
                rightIcon={
                  detectingLocation ? (
                    <ActivityIndicator size="small" color={COLORS.crimson} />
                  ) : (
                    <Ionicons
                      name="location"
                      size={20}
                      color={COLORS.crimson}
                    />
                  )
                }
                onRightIconPress={handleDetectLocation}
              />
            </View>

            <AddressFieldAutocomplete
              label="Address"
              value={formData.address}
              onChangeText={(text) =>
                setFormData({ ...formData, address: text })
              }
              placeholder="Start typing an address..."
              multiline
            />

            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() =>
                setFormData({
                  ...formData,
                  address_is_private: !formData.address_is_private,
                })
              }
            >
              <View
                style={[
                  styles.checkbox,
                  formData.address_is_private && styles.checkboxChecked,
                ]}
              >
                {formData.address_is_private && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </View>
              <Text style={styles.checkboxLabel}>Keep address private</Text>
            </TouchableOpacity>

            <TextField
              label="Phone Number"
              value={formData.phone_number}
              onChangeText={(text) =>
                setFormData({ ...formData, phone_number: text })
              }
              placeholder="(555) 123-4567"
              keyboardType="phone-pad"
            />

            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() =>
                setFormData({
                  ...formData,
                  phone_is_private: !formData.phone_is_private,
                })
              }
            >
              <View
                style={[
                  styles.checkbox,
                  formData.phone_is_private && styles.checkboxChecked,
                ]}
              >
                {formData.phone_is_private && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </View>
              <Text style={styles.checkboxLabel}>
                Keep phone number private
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          {/* Fraternity Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Fraternity Information</Text>

            <View>
              <View style={styles.labelRow}>
                <Text style={styles.industryLabel}>Membership Number</Text>
                {profile.verification_status === "VERIFIED" && (
                  <View style={styles.verificationBadge}>
                    <Text style={styles.verificationBadgeText}>Verified</Text>
                  </View>
                )}
              </View>
              {profile.verification_status === "VERIFIED" ? (
                <View style={styles.readOnlyValue}>
                  <Text style={styles.readOnlyText}>
                    {formData.membership_number || "Not set"}
                  </Text>
                </View>
              ) : (
                <TextInput
                  style={styles.editableInput}
                  value={formData.membership_number}
                  onChangeText={(text) =>
                    setFormData({ ...formData, membership_number: text })
                  }
                  placeholder="Enter your membership number"
                  placeholderTextColor={COLORS.midnightNavy + "50"}
                />
              )}
            </View>

            <View>
              <Text style={styles.industryLabel}>Initiated Chapter</Text>
              <TouchableOpacity
                style={styles.industryPickerButton}
                onPress={() => setShowChapterPicker(true)}
              >
                <Text
                  style={[
                    styles.industryPickerText,
                    !formData.initiated_chapter_id &&
                      styles.industryPickerPlaceholder,
                  ]}
                >
                  {formData.initiated_chapter_id
                    ? chapters.find(
                        (c) => c.id === formData.initiated_chapter_id
                      )?.name || "Select your chapter"
                    : "Select your chapter"}
                </Text>
                <Ionicons
                  name="chevron-down"
                  size={20}
                  color={COLORS.midnightNavy}
                />
              </TouchableOpacity>
            </View>

            <View>
              <Text style={styles.industryLabel}>Initiation Season</Text>
              <TouchableOpacity
                style={styles.industryPickerButton}
                onPress={() => setShowSeasonPicker(true)}
              >
                <Text
                  style={[
                    styles.industryPickerText,
                    !formData.initiated_season &&
                      styles.industryPickerPlaceholder,
                  ]}
                >
                  {formData.initiated_season || "Select season"}
                </Text>
                <Ionicons
                  name="chevron-down"
                  size={20}
                  color={COLORS.midnightNavy}
                />
              </TouchableOpacity>
            </View>

            <TextField
              label="Initiation Year"
              value={formData.initiated_year}
              onChangeText={(text) =>
                setFormData({ ...formData, initiated_year: text })
              }
              placeholder="YYYY"
              keyboardType="number-pad"
            />

            <TextField
              label="Ship Name"
              value={formData.ship_name}
              onChangeText={(text) =>
                setFormData({ ...formData, ship_name: text })
              }
              placeholder="Enter your ship name"
            />

            <TextField
              label="Line Name"
              value={formData.line_name}
              onChangeText={(text) =>
                setFormData({ ...formData, line_name: text })
              }
              placeholder="Enter your line name"
            />
          </View>

          <View style={styles.divider} />

          {/* Professional Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Professional Information</Text>

            <View>
              <Text style={styles.industryLabel}>Industry</Text>
              <TouchableOpacity
                style={styles.industryPickerButton}
                onPress={() => setShowIndustryPicker(true)}
              >
                <Text
                  style={[
                    styles.industryPickerText,
                    !formData.industry && styles.industryPickerPlaceholder,
                  ]}
                >
                  {formData.industry || "Select your industry"}
                </Text>
                <Ionicons
                  name="chevron-down"
                  size={20}
                  color={COLORS.midnightNavy}
                />
              </TouchableOpacity>
            </View>

            <View>
              <Text style={styles.industryLabel}>Profession</Text>
              <TouchableOpacity
                style={styles.industryPickerButton}
                onPress={() => setShowProfessionPicker(true)}
              >
                <Text
                  style={[
                    styles.industryPickerText,
                    !formData.profession_id && styles.industryPickerPlaceholder,
                  ]}
                >
                  {formData.profession_id
                    ? professions.find((p) => p.id === formData.profession_id)
                        ?.name || "Select your profession"
                    : "Select your profession"}
                </Text>
                <Ionicons
                  name="chevron-down"
                  size={20}
                  color={COLORS.midnightNavy}
                />
              </TouchableOpacity>
            </View>

            <TextField
              label="Job Title"
              value={formData.job_title}
              onChangeText={(text) =>
                setFormData({ ...formData, job_title: text })
              }
              placeholder="Your current job title"
            />

            <TextField
              label="Bio"
              value={formData.bio}
              onChangeText={(text) => setFormData({ ...formData, bio: text })}
              placeholder="Tell us about yourself"
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.divider} />

          {/* Social Links */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Social Links</Text>

            <TextField
              label="Instagram"
              value={formData.social_links.instagram}
              onChangeText={(text) =>
                setFormData({
                  ...formData,
                  social_links: {
                    ...formData.social_links,
                    instagram: text,
                  },
                })
              }
              placeholder="https://instagram.com/username"
              keyboardType="url"
              autoCapitalize="none"
            />

            <TextField
              label="Twitter"
              value={formData.social_links.twitter}
              onChangeText={(text) =>
                setFormData({
                  ...formData,
                  social_links: {
                    ...formData.social_links,
                    twitter: text,
                  },
                })
              }
              placeholder="https://twitter.com/username"
              keyboardType="url"
              autoCapitalize="none"
            />

            <TextField
              label="LinkedIn"
              value={formData.social_links.linkedin}
              onChangeText={(text) =>
                setFormData({
                  ...formData,
                  social_links: {
                    ...formData.social_links,
                    linkedin: text,
                  },
                })
              }
              placeholder="https://linkedin.com/in/username"
              keyboardType="url"
              autoCapitalize="none"
            />

            <TextField
              label="Website"
              value={formData.social_links.website}
              onChangeText={(text) =>
                setFormData({
                  ...formData,
                  social_links: {
                    ...formData.social_links,
                    website: text,
                  },
                })
              }
              placeholder="https://yourwebsite.com"
              keyboardType="url"
              autoCapitalize="none"
            />
          </View>

          <PrimaryButton
            title={saving ? "Saving..." : "Save Changes"}
            onPress={handleSubmit}
            loading={saving}
            loadingText="Saving..."
            style={styles.saveButton}
          />
        </FormCard>

        {/* Industry Picker Modal */}
        <Modal
          visible={showIndustryPicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowIndustryPicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Industry</Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowIndustryPicker(false);
                  }}
                  style={styles.modalCloseButton}
                >
                  <Ionicons
                    name="close"
                    size={24}
                    color={COLORS.midnightNavy}
                  />
                </TouchableOpacity>
              </View>
              <FlatList
                data={industries}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => {
                  const isSelected = formData.industry === item.name;
                  return (
                    <TouchableOpacity
                      style={[
                        styles.industryItem,
                        isSelected && styles.industryItemSelected,
                      ]}
                      onPress={() => {
                        setFormData({ ...formData, industry: item.name });
                        setShowIndustryPicker(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.industryItemText,
                          isSelected && styles.industryItemTextSelected,
                        ]}
                      >
                        {item.name}
                      </Text>
                      {isSelected && (
                        <Ionicons
                          name="checkmark"
                          size={20}
                          color={COLORS.white}
                        />
                      )}
                    </TouchableOpacity>
                  );
                }}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>
                      No industries available
                    </Text>
                  </View>
                }
              />
            </View>
          </View>
        </Modal>

        {/* Profession Picker Modal */}
        <Modal
          visible={showProfessionPicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowProfessionPicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Profession</Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowProfessionPicker(false);
                  }}
                  style={styles.modalCloseButton}
                >
                  <Ionicons
                    name="close"
                    size={24}
                    color={COLORS.midnightNavy}
                  />
                </TouchableOpacity>
              </View>
              <FlatList
                data={professions}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => {
                  const isSelected = formData.profession_id === item.id;
                  return (
                    <TouchableOpacity
                      style={[
                        styles.industryItem,
                        isSelected && styles.industryItemSelected,
                      ]}
                      onPress={() => {
                        setFormData({ ...formData, profession_id: item.id });
                        setShowProfessionPicker(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.industryItemText,
                          isSelected && styles.industryItemTextSelected,
                        ]}
                      >
                        {item.name}
                      </Text>
                      {isSelected && (
                        <Ionicons
                          name="checkmark"
                          size={20}
                          color={COLORS.white}
                        />
                      )}
                    </TouchableOpacity>
                  );
                }}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>
                      No professions available
                    </Text>
                  </View>
                }
              />
            </View>
          </View>
        </Modal>

        {/* Chapter Picker Modal */}
        <Modal
          visible={showChapterPicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowChapterPicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Chapter</Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowChapterPicker(false);
                  }}
                  style={styles.modalCloseButton}
                >
                  <Ionicons
                    name="close"
                    size={24}
                    color={COLORS.midnightNavy}
                  />
                </TouchableOpacity>
              </View>
              <FlatList
                data={chapters}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => {
                  const isSelected = formData.initiated_chapter_id === item.id;
                  return (
                    <TouchableOpacity
                      style={[
                        styles.industryItem,
                        isSelected && styles.industryItemSelected,
                      ]}
                      onPress={() => {
                        setFormData({
                          ...formData,
                          initiated_chapter_id: item.id,
                        });
                        setShowChapterPicker(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.industryItemText,
                          isSelected && styles.industryItemTextSelected,
                        ]}
                      >
                        {item.name}
                      </Text>
                      {isSelected && (
                        <Ionicons
                          name="checkmark"
                          size={20}
                          color={COLORS.white}
                        />
                      )}
                    </TouchableOpacity>
                  );
                }}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No chapters available</Text>
                  </View>
                }
              />
            </View>
          </View>
        </Modal>

        {/* Season Picker Modal */}
        <Modal
          visible={showSeasonPicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowSeasonPicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Season</Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowSeasonPicker(false);
                  }}
                  style={styles.modalCloseButton}
                >
                  <Ionicons
                    name="close"
                    size={24}
                    color={COLORS.midnightNavy}
                  />
                </TouchableOpacity>
              </View>
              <FlatList
                data={["Fall", "Spring", "Summer", "Winter"]}
                keyExtractor={(item) => item}
                renderItem={({ item }) => {
                  const isSelected = formData.initiated_season === item;
                  return (
                    <TouchableOpacity
                      style={[
                        styles.industryItem,
                        isSelected && styles.industryItemSelected,
                      ]}
                      onPress={() => {
                        setFormData({ ...formData, initiated_season: item });
                        setShowSeasonPicker(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.industryItemText,
                          isSelected && styles.industryItemTextSelected,
                        ]}
                      >
                        {item}
                      </Text>
                      {isSelected && (
                        <Ionicons
                          name="checkmark"
                          size={20}
                          color={COLORS.white}
                        />
                      )}
                    </TouchableOpacity>
                  );
                }}
              />
            </View>
          </View>
        </Modal>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 0,
    paddingTop: 12,
    paddingBottom: 80,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.midnightNavy,
  },
  formCard: {
    width: "92%",
    alignSelf: "center",
    marginTop: 12,
  },
  successContainer: {
    backgroundColor: "#D1FAE5",
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#10B981",
  },
  successText: {
    color: "#065F46",
    fontSize: 14,
    textAlign: "center",
  },
  errorContainer: {
    backgroundColor: "#FEE2E2",
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  errorText: {
    color: "#DC2626",
    fontSize: 14,
    textAlign: "center",
  },
  photoSection: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.midnightNavy,
    marginBottom: 12,
  },
  photoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: "hidden",
    backgroundColor: COLORS.crimson,
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarPlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarPlaceholderText: {
    color: COLORS.white,
    fontSize: 32,
    fontWeight: "bold",
  },
  changePhotoButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: COLORS.frostGray,
    borderRadius: 8,
  },
  changePhotoText: {
    color: COLORS.midnightNavy,
    fontSize: 14,
    fontWeight: "500",
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.frostGray,
    marginVertical: 24,
    opacity: 0.5,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.midnightNavy,
    marginBottom: 16,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    marginBottom: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: COLORS.frostGray,
    borderRadius: 4,
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.white,
  },
  checkboxChecked: {
    backgroundColor: COLORS.crimson,
    borderColor: COLORS.crimson,
  },
  checkmark: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "bold",
  },
  checkboxLabel: {
    fontSize: 14,
    color: COLORS.midnightNavy,
  },
  saveButton: {
    marginTop: 24,
    marginBottom: 12,
  },
  locationContainer: {
    marginBottom: 20,
  },
  industryLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.midnightNavy,
    marginBottom: 8,
  },
  industryPickerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.frostGray + "AA",
    marginBottom: 20,
  },
  industryPickerText: {
    fontSize: 16,
    color: COLORS.midnightNavy,
    flex: 1,
  },
  industryPickerPlaceholder: {
    opacity: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: COLORS.cream,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.frostGray,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.midnightNavy,
  },
  modalCloseButton: {
    padding: 4,
  },
  industryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.frostGray,
  },
  industryItemSelected: {
    backgroundColor: COLORS.crimson,
  },
  industryItemText: {
    fontSize: 16,
    color: COLORS.midnightNavy,
  },
  industryItemTextSelected: {
    fontWeight: "600",
    color: COLORS.white,
  },
  emptyContainer: {
    padding: 32,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.midnightNavy,
    opacity: 0.6,
  },
  readOnlyLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.midnightNavy,
    marginBottom: 8,
  },
  readOnlyValue: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.frostGray + "AA",
    marginBottom: 20,
  },
  readOnlyText: {
    fontSize: 16,
    color: COLORS.midnightNavy,
    opacity: 0.7,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  verificationBadge: {
    backgroundColor: "#10B981",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verificationBadgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "600",
  },
  editableInput: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    fontSize: 16,
    color: COLORS.midnightNavy,
    borderWidth: 1,
    borderColor: COLORS.frostGray + "AA",
    marginBottom: 20,
  },
});
