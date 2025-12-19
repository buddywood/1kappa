import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Linking,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, API_URL, WEB_URL } from "../lib/constants";
import { useAuth } from "../lib/auth";
import ScreenHeader from "./ScreenHeader";
import { authenticatedFetch } from "../lib/api-utils";
import FormCard from "./ui/FormCard";

interface SellerDashboardScreenProps {
  onBack: () => void;
  onCreateProductPress?: () => void;
  onEditProductPress?: (productId: number) => void;
  onSessionExpired?: () => void;
}

interface Product {
  id: number;
  name: string;
  description: string;
  price_cents: number;
  image_url: string | null;
  seller_status?: string;
  seller_stripe_account_id?: string | null;
}

interface SellerMetrics {
  totalSalesCents: number;
  orderCount: number;
  activeListings: number;
  totalPayoutsCents: number;
  totalUndergradDonationsCents: number;
}

interface SellerProfile {
  id: number;
  stripe_account_id: string | null;
  status: string;
}

export default function SellerDashboardScreen({
  onBack,
  onCreateProductPress,
  onEditProductPress,
  onSessionExpired,
}: SellerDashboardScreenProps) {
  const { token, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [metrics, setMetrics] = useState<SellerMetrics | null>(null);
  const [sellerProfile, setSellerProfile] = useState<SellerProfile | null>(
    null
  );

  useEffect(() => {
    if (token) {
      loadDashboard();
    }
  }, [token]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);

      const [productsRes, metricsRes, profileRes] = await Promise.all([
        authenticatedFetch(`${API_URL}/api/sellers/me/products`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
        authenticatedFetch(`${API_URL}/api/sellers/me/metrics`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
        authenticatedFetch(`${API_URL}/api/sellers/me`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      ]);

      // Check for session expiration first
      if (
        productsRes.status === 401 ||
        metricsRes.status === 401 ||
        profileRes.status === 401
      ) {
        const error = new Error(
          "Your session has expired. Please log in again."
        );
        (error as any).code = "SESSION_EXPIRED";
        throw error;
      }

      // Check which specific call failed and get error details
      if (!productsRes.ok) {
        const errorData = await productsRes.json().catch(() => ({}));
        throw new Error(
          errorData.error ||
            `Failed to load products: ${productsRes.status} ${productsRes.statusText}`
        );
      }
      if (!metricsRes.ok) {
        const errorData = await metricsRes.json().catch(() => ({}));
        throw new Error(
          errorData.error ||
            `Failed to load metrics: ${metricsRes.status} ${metricsRes.statusText}`
        );
      }
      if (!profileRes.ok) {
        const errorData = await profileRes.json().catch(() => ({}));
        throw new Error(
          errorData.error ||
            `Failed to load profile: ${profileRes.status} ${profileRes.statusText}`
        );
      }

      const [productsData, metricsData, profileData] = await Promise.all([
        productsRes.json(),
        metricsRes.json(),
        profileRes.json(),
      ]);

      setProducts(productsData);
      setMetrics(metricsData);
      setSellerProfile(profileData);
    } catch (err: any) {
      console.error("Error loading dashboard:", err);
      // Handle session expired errors
      if (err.code === "SESSION_EXPIRED") {
        if (onSessionExpired) {
          onSessionExpired();
        }
        return;
      }
      setError(err.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const getProductStatus = (product: Product) => {
    if (
      !product.seller_status ||
      product.seller_status !== "APPROVED" ||
      !product.seller_stripe_account_id
    ) {
      return { text: "Blocked: Stripe", color: "#EF4444" };
    }
    return { text: "Live", color: "#10B981" };
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Seller Dashboard" onBack={onBack} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.crimson} />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </View>
    );
  }

  const stripeConnected = sellerProfile?.stripe_account_id ? true : false;

  return (
    <View style={styles.container}>
      <ScreenHeader title="Seller Dashboard" onBack={onBack} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Stripe Warning */}
        {!stripeConnected && (
          <View style={styles.warningCard}>
            <View style={styles.warningHeader}>
              <Ionicons name="warning" size={20} color="#F59E0B" />
              <Text style={styles.warningTitle}>Stripe Setup Required</Text>
            </View>
            <Text style={styles.warningText}>
              Connect Stripe to enable sales. Your listings are currently
              blocked until Stripe is connected.
            </Text>
            <TouchableOpacity
              style={styles.stripeButton}
              onPress={() => {
                Linking.openURL(
                  `${WEB_URL}/seller-dashboard/stripe-setup`
                ).catch((err) => {
                  console.error("Failed to open Stripe setup:", err);
                  Alert.alert("Error", "Failed to open Stripe setup page");
                });
              }}
            >
              <Text style={styles.stripeButtonText}>Set up Stripe</Text>
              <Ionicons name="arrow-forward" size={16} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        )}

        {/* Metrics */}
        <View style={styles.metricsSection}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <Ionicons name="cash" size={24} color={COLORS.crimson} />
              <Text style={styles.metricValue}>
                {metrics ? formatPrice(metrics.totalSalesCents) : "$0.00"}
              </Text>
              <Text style={styles.metricLabel}>Total Sales</Text>
            </View>
            <View style={styles.metricCard}>
              <Ionicons name="wallet" size={24} color="#10B981" />
              <Text style={[styles.metricValue, { color: "#10B981" }]}>
                {metrics ? formatPrice(metrics.totalPayoutsCents) : "$0.00"}
              </Text>
              <Text style={styles.metricLabel}>Payouts</Text>
            </View>
            <View style={styles.metricCard}>
              <Ionicons name="cube" size={24} color={COLORS.midnightNavy} />
              <Text style={styles.metricValue}>
                {metrics?.activeListings || 0}
              </Text>
              <Text style={styles.metricLabel}>Listings</Text>
            </View>
            <View style={styles.metricCard}>
              <Ionicons name="cart" size={24} color={COLORS.auroraGold} />
              <Text style={styles.metricValue}>{metrics?.orderCount || 0}</Text>
              <Text style={styles.metricLabel}>Orders</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                if (onCreateProductPress) {
                  onCreateProductPress();
                } else {
                  Linking.openURL(
                    `${WEB_URL}/seller-dashboard/listings/create`
                  ).catch((err) => {
                    console.error("Failed to open create listing:", err);
                  });
                }
              }}
            >
              <Ionicons name="add-circle" size={24} color={COLORS.crimson} />
              <Text style={styles.actionButtonText}>New Listing</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                Linking.openURL(`${WEB_URL}/seller-dashboard`).catch((err) => {
                  console.error("Failed to open dashboard:", err);
                });
              }}
            >
              <Ionicons name="list" size={24} color={COLORS.crimson} />
              <Text style={styles.actionButtonText}>My Listings</Text>
            </TouchableOpacity>
            {stripeConnected && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => {
                  Linking.openURL(
                    `${WEB_URL}/seller-dashboard/stripe-setup`
                  ).catch((err) => {
                    console.error("Failed to open Stripe:", err);
                  });
                }}
              >
                <Ionicons name="card" size={24} color={COLORS.crimson} />
                <Text style={styles.actionButtonText}>Stripe Info</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Payouts Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Payouts</Text>
            <TouchableOpacity
              onPress={() => {
                Linking.openURL(`${WEB_URL}/seller-dashboard`).catch((err) => {
                  console.error("Failed to open dashboard:", err);
                });
              }}
            >
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          <FormCard className="mt-0">
            <View style={styles.payoutRow}>
              <View>
                <Text style={styles.payoutLabel}>Total Payouts</Text>
                <Text style={styles.payoutValue}>
                  {metrics ? formatPrice(metrics.totalPayoutsCents) : "$0.00"}
                </Text>
              </View>
              <Ionicons name="wallet" size={32} color={COLORS.crimson} />
            </View>
            <View style={styles.payoutDivider} />
            <View style={styles.payoutRow}>
              <View>
                <Text style={styles.payoutLabel}>Chapter Donations</Text>
                <Text style={[styles.payoutValue, { color: COLORS.crimson }]}>
                  {metrics
                    ? formatPrice(metrics.totalUndergradDonationsCents || 0)
                    : "$0.00"}
                </Text>
              </View>
              <Ionicons name="heart" size={32} color={COLORS.crimson} />
            </View>
          </FormCard>
        </View>

        {/* My Listings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Listings</Text>
            <TouchableOpacity
              onPress={() => {
                Linking.openURL(`${WEB_URL}/seller-dashboard`).catch((err) => {
                  console.error("Failed to open dashboard:", err);
                });
              }}
            >
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          {products.length === 0 ? (
            <FormCard className="items-center py-8">
              <Ionicons
                name="cube-outline"
                size={48}
                color={COLORS.midnightNavy}
                style={{ opacity: 0.3 }}
              />
              <Text style={styles.emptyText}>No listings yet</Text>
              <TouchableOpacity
                style={styles.createButton}
                onPress={() => {
                  if (onCreateProductPress) {
                    onCreateProductPress();
                  } else {
                    Linking.openURL(
                      `${WEB_URL}/seller-dashboard/listings/create`
                    ).catch((err) => {
                      console.error("Failed to open create listing:", err);
                    });
                  }
                }}
              >
                <Text style={styles.createButtonText}>
                  Create Your First Listing
                </Text>
              </TouchableOpacity>
            </FormCard>
          ) : (
            <View style={styles.listingsContainer}>
              {products.slice(0, 5).map((product) => {
                const status = getProductStatus(product);
                return (
                  <TouchableOpacity
                    key={product.id}
                    style={styles.listingCard}
                    onPress={() => {
                      if (onEditProductPress) {
                        onEditProductPress(product.id);
                      } else {
                        Linking.openURL(
                          `${WEB_URL}/seller-dashboard/listings/edit/${product.id}`
                        ).catch((err) => {
                          console.error("Failed to open edit:", err);
                        });
                      }
                    }}
                  >
                    <View style={styles.listingContent}>
                      {product.image_url ? (
                        <Image
                          source={{ uri: product.image_url }}
                          style={styles.listingImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.listingImagePlaceholder}>
                          <Ionicons
                            name="cube"
                            size={24}
                            color={COLORS.midnightNavy}
                            style={{ opacity: 0.3 }}
                          />
                        </View>
                      )}
                      <View style={styles.listingInfo}>
                        <Text style={styles.listingName} numberOfLines={2}>
                          {product.name}
                        </Text>
                        <Text style={styles.listingPrice}>
                          {formatPrice(product.price_cents)}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.listingActions}>
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: status.color + "20" },
                        ]}
                      >
                        <Text
                          style={[styles.statusText, { color: status.color }]}
                        >
                          {status.text}
                        </Text>
                      </View>
                      <Ionicons
                        name="chevron-forward"
                        size={20}
                        color={COLORS.midnightNavy}
                        style={{ opacity: 0.5 }}
                      />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
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
    backgroundColor: "#FEE2E2",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  errorText: {
    color: "#DC2626",
    fontSize: 14,
    textAlign: "center",
  },
  warningCard: {
    backgroundColor: "#FEF3C7",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#FCD34D",
  },
  warningHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.midnightNavy,
  },
  warningText: {
    fontSize: 14,
    color: COLORS.midnightNavy,
    opacity: 0.8,
    marginBottom: 12,
    lineHeight: 20,
  },
  stripeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.crimson,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  stripeButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "600",
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.midnightNavy,
    marginBottom: 12,
  },
  viewAllText: {
    fontSize: 14,
    color: COLORS.crimson,
    fontWeight: "500",
  },
  metricsSection: {
    marginBottom: 24,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  metricCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    width: "47%",
    borderWidth: 1,
    borderColor: COLORS.frostGray,
    alignItems: "center",
  },
  metricValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.midnightNavy,
    marginTop: 8,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: COLORS.midnightNavy,
    opacity: 0.6,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  actionButton: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    width: "47%",
    borderWidth: 1,
    borderColor: COLORS.frostGray,
    alignItems: "center",
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.midnightNavy,
  },
  payoutCard: {
    marginTop: 0,
  },
  payoutRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  payoutLabel: {
    fontSize: 14,
    color: COLORS.midnightNavy,
    opacity: 0.6,
    marginBottom: 4,
  },
  payoutValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.midnightNavy,
  },
  payoutDivider: {
    height: 1,
    backgroundColor: COLORS.frostGray,
    marginVertical: 8,
  },
  emptyCard: {
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.midnightNavy,
    opacity: 0.6,
    marginTop: 12,
    marginBottom: 16,
  },
  createButton: {
    backgroundColor: COLORS.crimson,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  createButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "600",
  },
  listingsContainer: {
    gap: 12,
  },
  listingCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.frostGray,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  listingContent: {
    flexDirection: "row",
    gap: 12,
    flex: 1,
  },
  listingImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  listingImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: COLORS.frostGray,
    justifyContent: "center",
    alignItems: "center",
  },
  listingInfo: {
    flex: 1,
    justifyContent: "center",
  },
  listingName: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.midnightNavy,
    marginBottom: 4,
  },
  listingPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.crimson,
  },
  listingActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
});
