import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
  TextInput,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, API_URL } from "../lib/constants";
import { useAuth } from "../lib/auth";
import ScreenHeader from "./ScreenHeader";
import { authenticatedFetch } from "../lib/api-utils";
import FormCard from "./ui/FormCard";
import TextField from "./ui/TextField";
import Checkbox from "./ui/Checkbox";
import PrimaryButton from "./ui/PrimaryButton";
import {
  fetchProductCategories,
  fetchCategoryAttributeDefinitions,
  getSellerProfile,
  type ProductCategory,
  type CategoryAttributeDefinition,
  type Seller,
} from "../lib/api";

interface SellerListingScreenProps {
  onBack: () => void;
  onSuccess?: () => void;
  productId?: number; // For editing existing product
}

export default function SellerListingScreen({
  onBack,
  onSuccess,
  productId,
}: SellerListingScreenProps) {
  const { token, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null
  );
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [categoryAttributes, setCategoryAttributes] = useState<
    CategoryAttributeDefinition[]
  >([]);
  const [attributeValues, setAttributeValues] = useState<Record<number, any>>(
    {}
  );
  const [images, setImages] = useState<string[]>([]);
  const [imageUris, setImageUris] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    is_kappa_branded: false,
  });

  useEffect(() => {
    if (token) {
      loadData();
    }
  }, [token]);

  useEffect(() => {
    const loadCategoryAttributes = async () => {
      if (selectedCategoryId) {
        try {
          const attrs = await fetchCategoryAttributeDefinitions(
            selectedCategoryId
          );
          setCategoryAttributes(attrs);
          // Initialize attribute values
          const initialValues: Record<number, any> = {};
          attrs.forEach((attr) => {
            initialValues[attr.id] =
              attr.attribute_type === "BOOLEAN" ? false : "";
          });
          setAttributeValues(initialValues);
        } catch (err) {
          console.error("Error loading category attributes:", err);
        }
      } else {
        setCategoryAttributes([]);
        setAttributeValues({});
      }
    };

    loadCategoryAttributes();
  }, [selectedCategoryId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [sellerData, categoriesData] = await Promise.all([
        getSellerProfile(token!),
        fetchProductCategories(),
      ]);

      if (sellerData.status !== "APPROVED") {
        setError("You must be an approved seller to create listings");
        return;
      }

      if (!sellerData.stripe_account_id) {
        setError(
          "You must connect your Stripe account before creating listings. Please complete Stripe setup first."
        );
        return;
      }

      setSeller(sellerData);
      setCategories(categoriesData);
    } catch (err: any) {
      console.error("Error loading data:", err);
      if (err.code === "SESSION_EXPIRED") {
        // Re-throw to be handled by parent component
        throw err;
      }
      setError(err.message || "Failed to load seller profile");
    } finally {
      setLoading(false);
    }
  };

  const pickImages = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "We need access to your photos to add product images."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets) {
        const newImages = result.assets.slice(0, 10 - images.length);
        const newUris = newImages.map((asset) => asset.uri);
        setImages([...images, ...newUris]);
        setImageUris([...imageUris, ...newUris]);
      }
    } catch (err) {
      console.error("Error picking images:", err);
      Alert.alert("Error", "Failed to pick images");
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    const newUris = imageUris.filter((_, i) => i !== index);
    setImages(newImages);
    setImageUris(newUris);
  };

  const handleAttributeChange = (attributeId: number, value: any) => {
    setAttributeValues((prev) => ({
      ...prev,
      [attributeId]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setError("Product name is required");
      return;
    }

    const priceCents = Math.round(parseFloat(formData.price) * 100);
    if (isNaN(priceCents) || priceCents <= 0) {
      setError("Please enter a valid price");
      return;
    }

    if (!seller) {
      setError("Seller profile not loaded");
      return;
    }

    // Validate required attributes
    for (const attr of categoryAttributes) {
      if (attr.is_required) {
        const value = attributeValues[attr.id];
        if (!value || value === "") {
          setError(`${attr.attribute_name} is required`);
          return;
        }
      }
    }

    setSubmitting(true);
    setError(null);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("seller_id", seller.id.toString());
      formDataToSend.append("name", formData.name);
      formDataToSend.append("description", formData.description || "");
      formDataToSend.append("price_cents", priceCents.toString());
      formDataToSend.append(
        "is_kappa_branded",
        formData.is_kappa_branded.toString()
      );

      if (selectedCategoryId) {
        formDataToSend.append("category_id", selectedCategoryId.toString());
      }

      // Add images
      for (const uri of imageUris) {
        const filename = uri.split("/").pop() || "image.jpg";
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : "image/jpeg";

        formDataToSend.append("images", {
          uri,
          name: filename,
          type,
        } as any);
      }

      // Add attribute values
      const attributes = categoryAttributes
        .filter((attr) => {
          const value = attributeValues[attr.id];
          if (attr.is_required && (!value || value === "")) {
            return false;
          }
          return value !== undefined && value !== "";
        })
        .map((attr) => {
          const value = attributeValues[attr.id];
          const attrData: any = {
            attribute_definition_id: attr.id.toString(),
          };

          switch (attr.attribute_type) {
            case "TEXT":
              attrData.value_text = value;
              break;
            case "NUMBER":
              attrData.value_number = parseFloat(value);
              break;
            case "BOOLEAN":
              attrData.value_boolean = value === true || value === "true";
              break;
            case "SELECT":
              attrData.value_text = value;
              break;
          }

          return attrData;
        });

      if (attributes.length > 0) {
        formDataToSend.append("attributes", JSON.stringify(attributes));
      }

      // Use fetch directly for FormData (authenticatedFetch may not handle it correctly)
      // But we need to handle 401 errors manually
      let res = await fetch(`${API_URL}/api/products`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          // Don't set Content-Type - let fetch set it with boundary for FormData
        },
        body: formDataToSend,
      });

      // Handle 401 - session expired
      if (res.status === 401) {
        const error = new Error(
          "Your session has expired. Please log in again."
        );
        (error as any).code = "SESSION_EXPIRED";
        throw error;
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to create product");
      }

      const product = await res.json();
      Alert.alert("Success", "Product created successfully!", [
        {
          text: "OK",
          onPress: () => {
            if (onSuccess) {
              onSuccess();
            } else {
              onBack();
            }
          },
        },
      ]);
    } catch (err: any) {
      console.error("Error creating product:", err);
      if (err.code === "SESSION_EXPIRED") {
        // Re-throw to be handled by parent
        throw err;
      }
      setError(err.message || "Failed to create product");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ScreenHeader
          title={productId ? "Edit Listing" : "Create Listing"}
          onBack={onBack}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.crimson} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  if (error && !seller) {
    return (
      <View style={styles.container}>
        <ScreenHeader
          title={productId ? "Edit Listing" : "Create Listing"}
          onBack={onBack}
        />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#DC2626" />
          <Text style={styles.errorTitle}>Error</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>Back to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);

  return (
    <View style={styles.container}>
      <ScreenHeader
        title={productId ? "Edit Listing" : "Create Listing"}
        onBack={onBack}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {error && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={20} color="#DC2626" />
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
        )}

        <FormCard style={styles.formCard}>
          <Text style={styles.sectionTitle}>Product Information</Text>
          <Text style={styles.sectionDescription}>
            Fill in the details for your new product listing
          </Text>

          <TextField
            label="Product Name *"
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
            placeholder="e.g., Kappa Alpha Psi Polo Shirt"
          />

          <View style={styles.textAreaContainer}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={styles.textArea}
              value={formData.description}
              onChangeText={(text) =>
                setFormData({ ...formData, description: text })
              }
              placeholder="Describe your product..."
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <TextField
            label="Price ($) *"
            value={formData.price}
            onChangeText={(text) => setFormData({ ...formData, price: text })}
            placeholder="0.00"
            keyboardType="decimal-pad"
          />

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Category</Text>
            <TouchableOpacity
              style={styles.categoryPicker}
              onPress={() => setShowCategoryPicker(true)}
            >
              <Text
                style={[
                  styles.categoryPickerText,
                  !selectedCategory && styles.placeholderText,
                ]}
              >
                {selectedCategory
                  ? selectedCategory.name
                  : "Select a category (optional)"}
              </Text>
              <Ionicons
                name="chevron-down"
                size={20}
                color={COLORS.midnightNavy}
              />
            </TouchableOpacity>
            <Text style={styles.hintText}>
              Choose a category to help customers find your product
            </Text>
          </View>

          {categoryAttributes.length > 0 && (
            <View style={styles.attributesSection}>
              <Text style={styles.sectionTitle}>Product Attributes</Text>
              {categoryAttributes.map((attr) => (
                <View key={attr.id} style={styles.attributeField}>
                  <Text style={styles.label}>
                    {attr.attribute_name}
                    {attr.is_required && (
                      <Text style={styles.required}> *</Text>
                    )}
                  </Text>
                  {attr.attribute_type === "TEXT" && (
                    <TextField
                      label=""
                      value={attributeValues[attr.id] || ""}
                      onChangeText={(text) =>
                        handleAttributeChange(attr.id, text)
                      }
                      placeholder={`Enter ${attr.attribute_name.toLowerCase()}`}
                    />
                  )}
                  {attr.attribute_type === "SELECT" && (
                    <View>
                      <TouchableOpacity
                        style={styles.selectPicker}
                        onPress={() => {
                          // Show options picker
                          Alert.alert(attr.attribute_name, "Select an option", [
                            ...(attr.options || []).map((option) => ({
                              text: option,
                              onPress: () =>
                                handleAttributeChange(attr.id, option),
                            })),
                            { text: "Cancel", style: "cancel" },
                          ]);
                        }}
                      >
                        <Text
                          style={[
                            styles.selectPickerText,
                            !attributeValues[attr.id] && styles.placeholderText,
                          ]}
                        >
                          {attributeValues[attr.id] || "Select..."}
                        </Text>
                        <Ionicons
                          name="chevron-down"
                          size={20}
                          color={COLORS.midnightNavy}
                        />
                      </TouchableOpacity>
                    </View>
                  )}
                  {attr.attribute_type === "NUMBER" && (
                    <TextField
                      label=""
                      value={attributeValues[attr.id] || ""}
                      onChangeText={(text) =>
                        handleAttributeChange(attr.id, text)
                      }
                      placeholder={`Enter ${attr.attribute_name.toLowerCase()}`}
                      keyboardType="numeric"
                    />
                  )}
                  {attr.attribute_type === "BOOLEAN" && (
                    <Checkbox
                      checked={attributeValues[attr.id] || false}
                      onPress={() =>
                        handleAttributeChange(
                          attr.id,
                          !attributeValues[attr.id]
                        )
                      }
                      label={attr.attribute_name}
                    />
                  )}
                </View>
              ))}
            </View>
          )}

          <View style={styles.checkboxContainer}>
            <View
              style={[
                styles.checkboxRow,
                seller?.verification_status !== "VERIFIED" &&
                  styles.checkboxRowDisabled,
              ]}
            >
              <Checkbox
                checked={formData.is_kappa_branded}
                onPress={() => {
                  if (seller?.verification_status === "VERIFIED") {
                    setFormData({
                      ...formData,
                      is_kappa_branded: !formData.is_kappa_branded,
                    });
                  }
                }}
                label="Kappa Alpha Psi Branded Merchandise"
              />
              {seller?.verification_status !== "VERIFIED" && (
                <Ionicons
                  name="information-circle-outline"
                  size={20}
                  color={COLORS.midnightNavy}
                  style={{ opacity: 0.4 }}
                />
              )}
            </View>
            {seller?.verification_status !== "VERIFIED" && (
              <Text style={styles.hintText}>
                Only verified sellers can list Kappa Alpha Psi branded
                merchandise. Your seller account must be verified by an
                administrator before you can use this option.
              </Text>
            )}
            {seller?.verification_status === "VERIFIED" && (
              <Text style={styles.hintText}>
                Check this if your product features Kappa Alpha Psi branding
              </Text>
            )}
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>
              Product Images (up to {10 - images.length} remaining)
            </Text>
            <TouchableOpacity
              style={styles.imagePickerButton}
              onPress={pickImages}
              disabled={images.length >= 10}
            >
              <Ionicons name="image-outline" size={24} color={COLORS.crimson} />
              <Text style={styles.imagePickerText}>
                {images.length > 0
                  ? `Add More Images (${images.length}/${10})`
                  : "Select Images"}
              </Text>
            </TouchableOpacity>
            {images.length > 0 && (
              <View style={styles.imageGrid}>
                {images.map((uri, index) => (
                  <View key={index} style={styles.imagePreviewContainer}>
                    <Image source={{ uri }} style={styles.imagePreview} />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => removeImage(index)}
                    >
                      <Ionicons name="close-circle" size={24} color="#DC2626" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onBack}
              disabled={submitting}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <PrimaryButton
              title={submitting ? "Creating..." : "Create Listing"}
              onPress={handleSubmit}
              loading={submitting}
              style={styles.submitButton}
            />
          </View>
        </FormCard>
      </ScrollView>

      {/* Category Picker Modal */}
      <Modal
        visible={showCategoryPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCategoryPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Category</Text>
              <TouchableOpacity
                onPress={() => setShowCategoryPicker(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={COLORS.midnightNavy} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={categories}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => {
                const isSelected = selectedCategoryId === item.id;
                return (
                  <TouchableOpacity
                    style={[
                      styles.categoryItem,
                      isSelected && styles.categoryItemSelected,
                    ]}
                    onPress={() => {
                      setSelectedCategoryId(isSelected ? null : item.id);
                      setShowCategoryPicker(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.categoryItemText,
                        isSelected && styles.categoryItemTextSelected,
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
                  <Text style={styles.emptyText}>No categories available</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: 16,
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#DC2626",
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: "#DC2626",
    textAlign: "center",
    marginBottom: 24,
  },
  errorBanner: {
    backgroundColor: "#FEE2E2",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#FCA5A5",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  errorBannerText: {
    color: "#DC2626",
    fontSize: 14,
    flex: 1,
  },
  backButton: {
    backgroundColor: COLORS.crimson,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  backButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
  },
  formCard: {
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.midnightNavy,
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    color: COLORS.midnightNavy,
    opacity: 0.6,
    marginBottom: 20,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.midnightNavy,
    marginBottom: 8,
  },
  required: {
    color: "#DC2626",
  },
  textAreaContainer: {
    marginBottom: 20,
  },
  textArea: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    fontSize: 16,
    color: COLORS.midnightNavy,
    borderWidth: 1,
    borderColor: COLORS.frostGray + "AA",
    minHeight: 100,
    textAlignVertical: "top",
  },
  categoryPicker: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.frostGray + "AA",
    marginBottom: 8,
  },
  categoryPickerText: {
    fontSize: 16,
    color: COLORS.midnightNavy,
    flex: 1,
  },
  placeholderText: {
    opacity: 0.5,
  },
  hintText: {
    fontSize: 12,
    color: COLORS.midnightNavy,
    opacity: 0.6,
    marginTop: 4,
  },
  attributesSection: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: COLORS.frostGray,
  },
  attributeField: {
    marginBottom: 20,
  },
  selectPicker: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.frostGray + "AA",
  },
  selectPickerText: {
    fontSize: 16,
    color: COLORS.midnightNavy,
    flex: 1,
  },
  checkboxContainer: {
    marginTop: 20,
    marginBottom: 20,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  checkboxRowDisabled: {
    opacity: 0.5,
  },
  imagePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.crimson,
    borderStyle: "dashed",
    marginBottom: 12,
  },
  imagePickerText: {
    fontSize: 16,
    color: COLORS.crimson,
    fontWeight: "500",
  },
  imageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  imagePreviewContainer: {
    width: 100,
    height: 100,
    borderRadius: 8,
    overflow: "hidden",
    position: "relative",
  },
  imagePreview: {
    width: "100%",
    height: "100%",
  },
  removeImageButton: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: COLORS.white,
    borderRadius: 12,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.frostGray,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.midnightNavy,
  },
  submitButton: {
    flex: 1,
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
  categoryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.frostGray,
  },
  categoryItemSelected: {
    backgroundColor: COLORS.crimson,
  },
  categoryItemText: {
    fontSize: 16,
    color: COLORS.midnightNavy,
  },
  categoryItemTextSelected: {
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
});
