import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Image,
  Dimensions,
  Animated,
} from "react-native";
import { Product } from "../lib/api";
import { COLORS } from "../lib/constants";
import { useAuth } from "../lib/auth";
import { useCart } from "../lib/CartContext";
import UserRoleBadges from "./UserRoleBadges";

interface ProductCardProps {
  product: Product;
  onPress?: () => void;
  onAddToCart?: () => void;
  isStewardItem?: boolean;
  badge?: string;
  badgeColor?: string;
}

const { width } = Dimensions.get("window");
const cardWidth = (width - 48) / 2; // 2 columns with padding

export default function ProductCard({
  product,
  onPress,
  onAddToCart,
  isStewardItem = false,
  badge,
  badgeColor,
}: ProductCardProps) {
  const { isGuest, isAuthenticated, user } = useAuth();
  const { items } = useCart();
  const priceValue = product.price_cents / 100;
  const [priceDollars, priceCents] = priceValue.toFixed(2).split(".");
  const sellerName = product.seller_fraternity_member_id
    ? `Brother ${product.seller_name}`
    : product.seller_business_name || product.seller_name;

  // Check if product is in cart
  const cartItem = items.find((item) => item.product.id === product.id);
  const isInCart = !!cartItem;
  const cartQuantity = cartItem?.quantity || 0;

  // Check if user can add to cart
  // Kappa branded products require member status
  const isKappaBranded = product.is_kappa_branded === true;
  // For guests or non-authenticated users, isMember is always false
  // For authenticated users, check if they are a member (must have is_fraternity_member === true OR memberId > 0)
  const isMember =
    isAuthenticated &&
    (user?.is_fraternity_member === true ||
      (user?.memberId !== null &&
        user?.memberId !== undefined &&
        user?.memberId > 0));
  // Non-Kappa products: everyone can add. Kappa products: only members can add
  // Explicitly block Kappa products for non-members
  const canAddToCart = isKappaBranded ? isMember : true;
  const shouldShowAddButton = onAddToCart && canAddToCart;

  // Animated entry
  const fade = useRef(new Animated.Value(0)).current;

  const imageOpacity = useRef(new Animated.Value(0)).current;

  const handleImageLoad = () => {
    Animated.timing(imageOpacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  useEffect(() => {
    Animated.timing(fade, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, []);

  const handlePress = () => {
    console.log(
      "ProductCard pressed:",
      product.id,
      product.name,
      "isStewardItem:",
      isStewardItem,
      "isGuest:",
      isGuest
    );
    // Allow guests to view steward items (they just can't claim)
    console.log("Calling onPress");
    onPress?.();
  };

  return (
    <Animated.View style={{ opacity: fade }}>
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          styles.container,
          isStewardItem && isGuest && styles.disabledContainer,
          pressed && styles.cardPressed,
        ]}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        accessibilityRole="button"
        accessibilityLabel={`View product: ${product.name}`}
      >
        {/* Product Image */}
        <View style={styles.imageContainer} pointerEvents="none">
          {product.image_url ? (
            <Animated.Image
              source={{ uri: product.image_url }}
              style={[styles.image, { opacity: imageOpacity }]}
              resizeMode="cover"
              onLoad={handleImageLoad}
            />
          ) : (
            <View style={styles.placeholder}>
              <Text style={styles.placeholderText}>No Image</Text>
            </View>
          )}
        </View>

        {/* Badge */}
        {badge && (
          <View
            style={[
              styles.badge,
              { backgroundColor: badgeColor || COLORS.crimson },
            ]}
            pointerEvents="none"
          >
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}

        {/* Members Only badge for steward items */}
        {isStewardItem && (
          <View style={styles.membersOnlyBadge} pointerEvents="none">
            <Text style={styles.membersOnlyText}>Members Only</Text>
          </View>
        )}

        {/* Product Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.productName} numberOfLines={2}>
            {product.name}
          </Text>

          {/* Seller Name and Role Badges */}
          {sellerName && (
            <View style={styles.sellerRow}>
              <Text
                style={styles.sellerName}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                by {sellerName}
              </Text>
              <UserRoleBadges
                is_member={product.is_fraternity_member}
                is_seller={product.is_seller}
                is_promoter={product.is_promoter}
                is_steward={product.is_steward}
                size="sm"
              />
            </View>
          )}

          {/* Price + Add to Cart */}
          <View style={styles.priceRow}>
            <View style={styles.priceContainer}>
              <Text style={styles.price}>${priceDollars}</Text>
              <Text style={styles.priceCents}>{priceCents}</Text>
            </View>
            {shouldShowAddButton && (
              <Pressable
                style={({ pressed }) => [
                  styles.addButton,
                  isInCart && styles.addButtonInCart,
                  pressed && styles.addButtonPressed,
                ]}
                onPress={onAddToCart}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                accessibilityRole="button"
                accessibilityLabel={
                  isInCart
                    ? `${product.name} in cart (${cartQuantity})`
                    : `Add ${product.name} to cart`
                }
              >
                <Text style={styles.addButtonText}>
                  {isInCart
                    ? cartQuantity > 1
                      ? `${cartQuantity}`
                      : "Added"
                    : "Add"}
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: cardWidth,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
    borderWidth: 1,
    borderColor: COLORS.frostGray + "55",
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  imageContainer: {
    width: "100%",
    aspectRatio: 1 / 1.2,
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
    opacity: 0.6,
  },
  placeholderText: {
    color: COLORS.midnightNavy,
    fontSize: 12,
    opacity: 0.7,
    fontWeight: "500",
  },
  infoContainer: {
    padding: 18,
  },
  productName: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.midnightNavy,
    marginBottom: 4,
    minHeight: 36,
    letterSpacing: 0.1,
  },
  sellerRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 6,
    flexShrink: 1,
  },
  sellerName: {
    fontSize: 12,
    color: COLORS.midnightNavy,
    opacity: 0.7,
    lineHeight: 18,
    flexShrink: 1,
  },
  price: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.crimson,
    letterSpacing: 0.2,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  priceCents: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.crimson,
    marginTop: 2,
    marginLeft: 1,
  },
  addButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: COLORS.midnightNavy,
    alignItems: "center",
    justifyContent: "center",
  },
  addButtonInCart: {
    backgroundColor: COLORS.crimson,
  },
  addButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.96 }],
  },
  addButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  disabledContainer: {
    opacity: 0.7,
  },
  membersOnlyBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: COLORS.crimson,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  membersOnlyText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: "600",
  },
  badge: {
    position: "absolute",
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: "600",
  },
});
