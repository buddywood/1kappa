import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as WebBrowser from "expo-web-browser";
import {
  Product,
  createCheckoutSession,
  fetchCategoryAttributeDefinitions,
  CategoryAttributeDefinition,
} from "../lib/api";
import { COLORS } from "../lib/constants";
import { useAuth } from "../lib/auth";
import { fetchProduct } from "../lib/api";
import ScreenHeader from "./ScreenHeader";
import PrimaryButton from "./ui/PrimaryButton";

interface ProductDetailProps {
  productId: number;
  onClose: () => void;
  onSellerPress?: (sellerId: number) => void;
}

const { width } = Dimensions.get("window");

export default function ProductDetail({
  productId,
  onClose,
  onSellerPress,
}: ProductDetailProps) {
  const { isGuest, user, token } = useAuth();
  const insets = useSafeAreaInsets();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);
  const [attributeDefinitions, setAttributeDefinitions] = useState<
    CategoryAttributeDefinition[]
  >([]);

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchProduct(productId);
        setProduct(data);

        // Load attribute definitions as fallback if attributes don't have attribute_name
        if (data.category_id) {
          try {
            const definitions = await fetchCategoryAttributeDefinitions(
              data.category_id
            );
            setAttributeDefinitions(definitions);
          } catch (err) {
            console.error("Error loading attribute definitions:", err);
          }
        }
      } catch (err) {
        console.error("Error loading product:", err);
        setError("Failed to load product");
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [productId]);

  if (loading) {
    return (
      <Modal visible={true} animationType="slide" onRequestClose={onClose}>
        <View style={[styles.container, { paddingTop: insets.top }]}>
          <ScreenHeader title="Product" onBack={onClose} showUser={false} />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.crimson} />
            <Text style={styles.loadingText}>Loading product...</Text>
          </View>
        </View>
      </Modal>
    );
  }

  if (error || !product) {
    return (
      <Modal visible={true} animationType="slide" onRequestClose={onClose}>
        <View style={[styles.container, { paddingTop: insets.top }]}>
          <ScreenHeader title="Product" onBack={onClose} showUser={false} />
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error || "Product not found"}</Text>
            <TouchableOpacity onPress={onClose} style={styles.errorButton}>
              <Text style={styles.errorButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  const handleCheckout = async () => {
    if (!product) {
      setError("Product not available");
      return;
    }

    // Check if product is Kappa branded - if so, require authentication
    if (product.is_kappa_branded) {
      if (!user?.email) {
        setError(
          "Kappa Alpha Psi branded merchandise can only be purchased by verified members. Please sign in to continue."
        );
        return;
      }
    } else {
      // For non-kappa branded products, we still need an email for checkout
      // In a full implementation, you might collect email from guests
      if (!user?.email) {
        setError("Please sign in to purchase this item");
        return;
      }
    }

    setCheckingOut(true);
    setError(null);

    try {
      const { url } = await createCheckoutSession(
        product.id,
        user.email,
        token || undefined
      );

      // Open Stripe checkout URL in in-app browser
      // This keeps users in the app instead of opening external browser
      await WebBrowser.openBrowserAsync(url, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
        controlsColor: COLORS.crimson,
        toolbarColor: COLORS.white,
      });

      // Note: User will return to app after completing or canceling checkout
      // The success/cancel URLs will handle redirects via deep linking
    } catch (err: any) {
      console.error("Checkout error:", err);
      const errorData = (err as any).errorData || {};
      if (
        errorData.error === "AUTH_REQUIRED_FOR_KAPPA_BRANDED" ||
        errorData.code === "AUTH_REQUIRED_FOR_KAPPA_BRANDED"
      ) {
        setError(
          "Kappa Alpha Psi branded merchandise can only be purchased by verified members. Please sign in to continue."
        );
      } else {
        setError(err.message || "Failed to start checkout. Please try again.");
      }
      setCheckingOut(false);
    }
  };

  const price = (product.price_cents / 100).toFixed(2);
  const sellerName = product.seller_fraternity_member_id
    ? `Brother ${product.seller_name}`
    : product.seller_business_name || product.seller_name;

  return (
    <Modal visible={true} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <ScreenHeader
          title={product.name}
          onBack={onClose}
          showUser={false}
          rightAction={{
            icon: "mail-outline",
            onPress: () => {
              // TODO: Implement contact seller functionality
              console.log("Contact seller:", product.seller_id);
            },
          }}
        />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Product Image */}
          <View style={styles.imageContainer}>
            {product.image_url ? (
              <Image
                source={{ uri: product.image_url }}
                style={styles.image}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.placeholder}>
                <Text style={styles.placeholderText}>No Image</Text>
              </View>
            )}
          </View>

          {/* Product Info */}
          <View style={styles.infoContainer}>
            <Text style={styles.productName}>{product.name}</Text>

            {/* Seller Info */}
            {sellerName && (
              <TouchableOpacity
                onPress={() => {
                  if (onSellerPress && product.seller_id) {
                    onSellerPress(product.seller_id);
                    onClose();
                  }
                }}
                style={styles.sellerContainer}
                disabled={!onSellerPress || !product.seller_id}
                activeOpacity={onSellerPress && product.seller_id ? 0.7 : 1}
              >
                <Text style={styles.sellerLabel}>Sold by</Text>
                <Text style={styles.sellerName}>{sellerName}</Text>
                {onSellerPress && product.seller_id && (
                  <Text style={styles.viewCollectionText}>
                    View Collection →
                  </Text>
                )}
              </TouchableOpacity>
            )}

            {/* Price */}
            <View style={styles.priceContainer}>
              <Text style={styles.priceLabel}>Price</Text>
              <Text style={styles.price}>${price}</Text>
            </View>

            {/* Category */}
            {product.category_name && (
              <View style={styles.categoryContainer}>
                <Text style={styles.categoryLabel}>Category</Text>
                <Text style={styles.categoryName}>{product.category_name}</Text>
              </View>
            )}

            {/* Description */}
            {product.description && (
              <View style={styles.descriptionContainer}>
                <Text style={styles.descriptionLabel}>Description</Text>
                <Text style={styles.description}>{product.description}</Text>
              </View>
            )}

            {/* Product Attributes */}
            {(() => {
              if (!product.attributes || product.attributes.length === 0)
                return null;

              // Debug: log attributes to see what we're getting
              console.log("Product attributes:", product.attributes);
              console.log("Attribute definitions:", attributeDefinitions);

              const processedAttributes = product.attributes
                .map((attr) => {
                  // Try to get attribute name from the attribute itself first, then from definitions
                  let attributeName = attr.attribute_name;
                  let attributeType = attr.attribute_type;
                  let displayOrder = attr.display_order || 0;

                  // Fallback: look up in definitions if attribute_name not present
                  if (!attributeName && attributeDefinitions.length > 0) {
                    const definition = attributeDefinitions.find(
                      (def) => def.id === attr.attribute_definition_id
                    );
                    if (definition) {
                      attributeName = definition.attribute_name;
                      attributeType = definition.attribute_type;
                      displayOrder = definition.display_order || 0;
                    }
                  }

                  if (!attributeName) return null;

                  // Get display value based on attribute type
                  let displayValue = "";
                  if (attributeType === "BOOLEAN") {
                    displayValue = attr.value_boolean ? "Yes" : "No";
                  } else if (attributeType === "NUMBER") {
                    displayValue = attr.value_number?.toString() || "";
                  } else {
                    displayValue = attr.value_text || "";
                  }

                  if (!displayValue) return null;

                  return { attributeName, displayValue, displayOrder };
                })
                .filter(
                  (
                    item
                  ): item is {
                    attributeName: string;
                    displayValue: string;
                    displayOrder: number;
                  } => item !== null
                )
                .sort((a, b) => a.displayOrder - b.displayOrder);

              console.log("Processed attributes:", processedAttributes);

              if (processedAttributes.length === 0) return null;

              return (
                <View style={styles.attributesContainer}>
                  <Text style={styles.attributesTitle}>Product Details</Text>
                  {processedAttributes.map(
                    ({ attributeName, displayValue }, index) => (
                      <View key={index} style={styles.attributeItem}>
                        <Text style={styles.attributeLabel}>
                          {attributeName}
                        </Text>
                        <Text style={styles.attributeValue}>
                          {displayValue}
                        </Text>
                      </View>
                    )
                  )}
                </View>
              );
            })()}

            {/* Guest Message - only show for Kappa branded products */}
            {isGuest && product.is_kappa_branded && (
              <View style={styles.guestMessageContainer}>
                <Text style={styles.guestMessageText}>
                  Kappa Alpha Psi branded merchandise can only be purchased by
                  verified members. Please sign in to continue.
                </Text>
              </View>
            )}

            {/* Guest Message for non-kappa branded - still need sign in for now */}
            {isGuest && !product.is_kappa_branded && (
              <View style={styles.guestMessageContainer}>
                <Text style={styles.guestMessageText}>
                  Sign in to purchase this item
                </Text>
              </View>
            )}

            {/* Purchase Button - show for authenticated users, or for non-kappa branded (though still need email) */}
            {user?.email && (
              <PrimaryButton
                title="Buy Now"
                onPress={handleCheckout}
                loading={checkingOut}
                disabled={checkingOut}
                style={styles.purchaseButton}
              />
            )}

            {/* Error Message */}
            {error && !checkingOut && (
              <View style={styles.errorMessageContainer}>
                <Text style={styles.errorMessageText}>{error}</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
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
    paddingBottom: 24,
  },
  imageContainer: {
    width: width,
    height: width,
    backgroundColor: COLORS.frostGray,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  placeholder: {
    width: "100%",
    height: "100%",
    backgroundColor: COLORS.frostGray,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: {
    color: COLORS.midnightNavy,
    fontSize: 16,
    opacity: 0.5,
  },
  infoContainer: {
    padding: 20,
    backgroundColor: COLORS.white,
    marginTop: -20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: 400,
  },
  productName: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.midnightNavy,
    marginBottom: 16,
  },
  sellerContainer: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.frostGray,
  },
  sellerLabel: {
    fontSize: 12,
    color: COLORS.midnightNavy,
    opacity: 0.6,
    marginBottom: 4,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.midnightNavy,
    marginBottom: 4,
  },
  viewCollectionText: {
    fontSize: 14,
    color: COLORS.crimson,
    fontWeight: "600",
  },
  priceContainer: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.frostGray,
  },
  priceLabel: {
    fontSize: 12,
    color: COLORS.midnightNavy,
    opacity: 0.6,
    marginBottom: 4,
  },
  price: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.crimson,
  },
  categoryContainer: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.frostGray,
  },
  categoryLabel: {
    fontSize: 12,
    color: COLORS.midnightNavy,
    opacity: 0.6,
    marginBottom: 4,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.midnightNavy,
  },
  descriptionContainer: {
    marginBottom: 20,
  },
  descriptionLabel: {
    fontSize: 12,
    color: COLORS.midnightNavy,
    opacity: 0.6,
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: COLORS.midnightNavy,
    lineHeight: 24,
  },
  attributesContainer: {
    marginBottom: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.frostGray,
  },
  attributesTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.midnightNavy,
    marginBottom: 16,
  },
  attributeItem: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.frostGray,
  },
  attributeLabel: {
    fontSize: 12,
    color: COLORS.midnightNavy,
    opacity: 0.6,
    marginBottom: 4,
  },
  attributeValue: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.midnightNavy,
  },
  guestMessageContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: COLORS.frostGray,
    borderRadius: 12,
  },
  guestMessageText: {
    fontSize: 14,
    color: COLORS.midnightNavy,
    textAlign: "center",
  },
  purchaseButton: {
    marginTop: 20,
    borderRadius: 12,
    paddingHorizontal: 24,
  },
  errorMessageContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "#FEE2E2",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  errorMessageText: {
    color: "#DC2626",
    fontSize: 14,
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.midnightNavy,
    opacity: 0.6,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.midnightNavy,
    textAlign: "center",
    marginBottom: 20,
  },
  errorButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: COLORS.crimson,
    borderRadius: 8,
  },
  errorButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
  },
});
