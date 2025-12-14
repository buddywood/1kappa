import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, API_URL } from "../lib/constants";
import { useAuth } from "../lib/auth";
import ScreenHeader from "./ScreenHeader";
import { authenticatedFetch } from "../lib/api-utils";
import FormCard from "./ui/FormCard";

interface SettingsScreenProps {
  onBack: () => void;
}

interface UserInfo {
  id: number;
  email: string;
  role: string;
  is_fraternity_member: boolean;
  is_seller: boolean;
  is_promoter: boolean;
  is_steward: boolean;
  last_login: string | null;
  created_at: string;
}

interface SellerProfile {
  id: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  sponsoring_chapter_id: number | null;
}

interface StewardProfile {
  id: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  sponsoring_chapter_id: number | null;
}

interface PromoterProfile {
  id: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  sponsoring_chapter_id: number | null;
}

interface SellerMetrics {
  totalSalesCents: number;
  totalPayoutsCents: number;
  totalUndergradDonationsCents: number;
}

interface StripeAccountStatus {
  connected: boolean;
  accountId: string | null;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  requirements: {
    currently_due: string[];
  } | null;
}

type SettingsTab =
  | "roles"
  | "chapters"
  | "payments"
  | "notifications"
  | "security"
  | "connected"
  | "delete";

export default function SettingsScreen({ onBack }: SettingsScreenProps) {
  const { user, token, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<SettingsTab>("roles");
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [sellerProfile, setSellerProfile] = useState<SellerProfile | null>(
    null
  );
  const [sellerMetrics, setSellerMetrics] = useState<SellerMetrics | null>(
    null
  );
  const [stripeStatus, setStripeStatus] = useState<StripeAccountStatus | null>(
    null
  );
  const [stewardProfile, setStewardProfile] = useState<StewardProfile | null>(
    null
  );
  const [promoterProfile, setPromoterProfile] =
    useState<PromoterProfile | null>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteEmailConfirm, setDeleteEmailConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (token) {
      loadSettings();
    }
  }, [token]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError("");

      // Fetch user info
      const userRes = await authenticatedFetch(`${API_URL}/api/users/me`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!userRes.ok) {
        const errorData = await userRes.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to fetch user info");
      }
      const userData = await userRes.json();
      setUserInfo(userData);

      // Fetch role-specific data in parallel
      const promises: Promise<any>[] = [];

      // Fetch seller data if user is a seller
      if (userData.is_seller) {
        promises.push(
          fetchSellerProfile()
            .then(setSellerProfile)
            .catch(() => null),
          fetchSellerMetrics()
            .then(setSellerMetrics)
            .catch(() => null),
          fetchStripeStatus()
            .then(setStripeStatus)
            .catch(() => null)
        );
      }

      // Fetch steward data if user is a steward
      if (userData.is_steward) {
        promises.push(
          fetchStewardProfile()
            .then(setStewardProfile)
            .catch(() => null)
        );
      }

      // Fetch promoter data if user is a promoter
      if (userData.is_promoter) {
        promises.push(
          fetchPromoterProfile()
            .then(setPromoterProfile)
            .catch(() => null)
        );
      }

      // Fetch notification count
      if (user?.email) {
        promises.push(
          fetchUnreadNotificationCount(user.email)
            .then(setUnreadNotifications)
            .catch(() => setUnreadNotifications(0))
        );
      }

      await Promise.all(promises);
    } catch (err: any) {
      console.error("Error loading settings:", err);
      setError(err.message || "Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const fetchSellerProfile = async (): Promise<SellerProfile> => {
    const res = await authenticatedFetch(`${API_URL}/api/sellers/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) throw new Error("Failed to fetch seller profile");
    return res.json();
  };

  const fetchSellerMetrics = async (): Promise<SellerMetrics> => {
    const res = await authenticatedFetch(`${API_URL}/api/sellers/me/metrics`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) throw new Error("Failed to fetch seller metrics");
    return res.json();
  };

  const fetchStripeStatus = async (): Promise<StripeAccountStatus> => {
    const res = await authenticatedFetch(
      `${API_URL}/api/sellers/me/stripe-status`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (!res.ok) throw new Error("Failed to fetch Stripe status");
    return res.json();
  };

  const fetchStewardProfile = async (): Promise<StewardProfile> => {
    const res = await authenticatedFetch(`${API_URL}/api/stewards/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) throw new Error("Failed to fetch steward profile");
    return res.json();
  };

  const fetchPromoterProfile = async (): Promise<PromoterProfile> => {
    const res = await authenticatedFetch(`${API_URL}/api/promoters/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) throw new Error("Failed to fetch promoter profile");
    return res.json();
  };

  const fetchUnreadNotificationCount = async (
    email: string
  ): Promise<number> => {
    const res = await authenticatedFetch(
      `${API_URL}/api/notifications/unread-count/${email}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (!res.ok) return 0;
    const data = await res.json();
    return data.count || 0;
  };

  const handleDeleteAccount = async () => {
    if (deleteEmailConfirm !== userInfo?.email) {
      setError("Email confirmation does not match");
      return;
    }

    try {
      setDeleting(true);
      setError("");

      const res = await authenticatedFetch(`${API_URL}/api/users/me/delete`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to delete account");
      }

      // Sign out and show success message
      Alert.alert(
        "Account Deleted",
        "Your account has been permanently deleted.",
        [
          {
            text: "OK",
            onPress: () => {
              logout();
            },
          },
        ]
      );
    } catch (err: any) {
      console.error("Error deleting account:", err);
      setError(err.message || "Failed to delete account");
      setDeleting(false);
    }
  };

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getRoleStatusBadge = (status: string | undefined) => {
    if (!status) return null;
    const statusColors: Record<string, string> = {
      APPROVED: COLORS.green || "#10B981",
      PENDING: COLORS.auroraGold || "#F59E0B",
      REJECTED: "#EF4444",
    };
    const color = statusColors[status] || COLORS.auroraGold;
    return (
      <View style={[styles.badge, { backgroundColor: color + "20" }]}>
        <Text style={[styles.badgeText, { color }]}>{status}</Text>
      </View>
    );
  };

  const tabs: { id: SettingsTab; label: string; icon: string }[] = [
    { id: "roles", label: "Roles", icon: "shield" },
    { id: "chapters", label: "Chapters", icon: "business" },
    { id: "payments", label: "Payments", icon: "card" },
    { id: "notifications", label: "Notifications", icon: "notifications" },
    { id: "security", label: "Security", icon: "lock-closed" },
    { id: "connected", label: "Connected", icon: "link" },
    { id: "delete", label: "Delete", icon: "trash" },
  ];

  if (loading) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Settings" onBack={onBack} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.crimson} />
          <Text style={styles.loadingText}>Loading settings...</Text>
        </View>
      </View>
    );
  }

  if (!userInfo) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Settings" onBack={onBack} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {error || "Failed to load settings"}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="Settings" onBack={onBack} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
        )}

        {/* Tab Selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabScrollView}
          contentContainerStyle={styles.tabScrollContent}
        >
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, activeTab === tab.id && styles.tabActive]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Ionicons
                name={tab.icon as any}
                size={18}
                color={
                  activeTab === tab.id ? COLORS.crimson : COLORS.midnightNavy
                }
                style={styles.tabIcon}
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab.id && styles.tabTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <FormCard style={styles.formCard}>
          {/* Roles & Access */}
          {activeTab === "roles" && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Roles & Access</Text>
              <Text style={styles.sectionDescription}>
                Your current roles and access levels on the platform
              </Text>

              {userInfo.is_fraternity_member && (
                <View style={styles.roleCard}>
                  <View style={styles.roleHeader}>
                    <Text style={styles.roleTitle}>Member</Text>
                    <View
                      style={[
                        styles.badge,
                        { backgroundColor: COLORS.crimson + "20" },
                      ]}
                    >
                      <Text
                        style={[styles.badgeText, { color: COLORS.crimson }]}
                      >
                        Active
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.roleDescription}>
                    Verified fraternity member
                  </Text>
                </View>
              )}

              {userInfo.is_seller && (
                <View style={styles.roleCard}>
                  <View style={styles.roleHeader}>
                    <Text style={styles.roleTitle}>Seller</Text>
                    {getRoleStatusBadge(sellerProfile?.status)}
                  </View>
                  <Text style={styles.roleDescription}>
                    {sellerProfile?.status === "APPROVED"
                      ? "You can list and sell products"
                      : sellerProfile?.status === "PENDING"
                      ? "Your seller application is pending approval"
                      : "Your seller application was rejected"}
                  </Text>
                </View>
              )}

              {userInfo.is_promoter && (
                <View style={styles.roleCard}>
                  <View style={styles.roleHeader}>
                    <Text style={styles.roleTitle}>Promoter</Text>
                    {getRoleStatusBadge(promoterProfile?.status)}
                  </View>
                  <Text style={styles.roleDescription}>
                    {promoterProfile?.status === "APPROVED"
                      ? "You can create and manage events"
                      : promoterProfile?.status === "PENDING"
                      ? "Your promoter application is pending approval"
                      : "Your promoter application was rejected"}
                  </Text>
                </View>
              )}

              {userInfo.is_steward && (
                <View style={styles.roleCard}>
                  <View style={styles.roleHeader}>
                    <Text style={styles.roleTitle}>Steward</Text>
                    {getRoleStatusBadge(stewardProfile?.status)}
                  </View>
                  <Text style={styles.roleDescription}>
                    {stewardProfile?.status === "APPROVED"
                      ? "You can list legacy fraternity paraphernalia"
                      : stewardProfile?.status === "PENDING"
                      ? "Your steward application is pending approval"
                      : "Your steward application was rejected"}
                  </Text>
                </View>
              )}

              {!userInfo.is_fraternity_member &&
                !userInfo.is_seller &&
                !userInfo.is_promoter &&
                !userInfo.is_steward && (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>
                      You don't have any active roles. Complete your member
                      profile or apply for a role to get started.
                    </Text>
                  </View>
                )}
            </View>
          )}

          {/* Chapters */}
          {activeTab === "chapters" && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sponsoring Chapters</Text>
              <Text style={styles.sectionDescription}>
                Chapters associated with your roles
              </Text>

              {sellerProfile?.sponsoring_chapter_id && (
                <View style={styles.chapterCard}>
                  <View style={styles.chapterHeader}>
                    <Text style={styles.chapterTitle}>
                      Seller Sponsoring Chapter
                    </Text>
                    <View style={styles.chapterBadge}>
                      <Text style={styles.chapterBadgeText}>Seller</Text>
                    </View>
                  </View>
                  <Text style={styles.chapterId}>
                    Chapter ID: {sellerProfile.sponsoring_chapter_id}
                  </Text>
                  <Text style={styles.chapterNote}>
                    Set during seller application process
                  </Text>
                </View>
              )}

              {promoterProfile?.sponsoring_chapter_id && (
                <View style={styles.chapterCard}>
                  <View style={styles.chapterHeader}>
                    <Text style={styles.chapterTitle}>
                      Promoter Sponsoring Chapter
                    </Text>
                    <View style={styles.chapterBadge}>
                      <Text style={styles.chapterBadgeText}>Promoter</Text>
                    </View>
                  </View>
                  <Text style={styles.chapterId}>
                    Chapter ID: {promoterProfile.sponsoring_chapter_id}
                  </Text>
                  <Text style={styles.chapterNote}>
                    Set during promoter application process
                  </Text>
                </View>
              )}

              {stewardProfile?.sponsoring_chapter_id && (
                <View style={styles.chapterCard}>
                  <View style={styles.chapterHeader}>
                    <Text style={styles.chapterTitle}>
                      Steward Sponsoring Chapter
                    </Text>
                    <View style={styles.chapterBadge}>
                      <Text style={styles.chapterBadgeText}>Steward</Text>
                    </View>
                  </View>
                  <Text style={styles.chapterId}>
                    Chapter ID: {stewardProfile.sponsoring_chapter_id}
                  </Text>
                  <Text style={styles.chapterNote}>
                    Set during steward application process
                  </Text>
                </View>
              )}

              {!sellerProfile?.sponsoring_chapter_id &&
                !promoterProfile?.sponsoring_chapter_id &&
                !stewardProfile?.sponsoring_chapter_id && (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>
                      You don't have any sponsoring chapters. Sponsoring
                      chapters are set when you apply for seller, promoter, or
                      steward roles.
                    </Text>
                  </View>
                )}
            </View>
          )}

          {/* Payments */}
          {activeTab === "payments" && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Payments & Payouts</Text>
              <Text style={styles.sectionDescription}>
                Manage your payment information and view earnings
              </Text>

              {userInfo.is_seller ? (
                <>
                  {sellerMetrics && (
                    <View style={styles.metricsContainer}>
                      <View style={styles.metricCard}>
                        <Ionicons
                          name="wallet"
                          size={20}
                          color={COLORS.midnightNavy}
                        />
                        <Text style={styles.metricLabel}>Total Sales</Text>
                        <Text
                          style={[
                            styles.metricValue,
                            { color: COLORS.crimson },
                          ]}
                        >
                          {formatPrice(sellerMetrics.totalSalesCents)}
                        </Text>
                      </View>
                      <View style={styles.metricCard}>
                        <Ionicons
                          name="card"
                          size={20}
                          color={COLORS.midnightNavy}
                        />
                        <Text style={styles.metricLabel}>Pending Payouts</Text>
                        <Text
                          style={[styles.metricValue, { color: "#10B981" }]}
                        >
                          {formatPrice(sellerMetrics.totalPayoutsCents)}
                        </Text>
                        <Text style={styles.metricNote}>
                          After platform fees
                        </Text>
                      </View>
                      <View style={styles.metricCard}>
                        <Ionicons
                          name="business"
                          size={20}
                          color={COLORS.midnightNavy}
                        />
                        <Text style={styles.metricLabel}>
                          Chapter Donations
                        </Text>
                        <Text
                          style={[
                            styles.metricValue,
                            { color: COLORS.crimson },
                          ]}
                        >
                          {formatPrice(
                            sellerMetrics.totalUndergradDonationsCents || 0
                          )}
                        </Text>
                        <Text style={styles.metricNote}>
                          To collegiate chapters
                        </Text>
                      </View>
                    </View>
                  )}

                  {stripeStatus && (
                    <View style={styles.stripeCard}>
                      <View style={styles.stripeHeader}>
                        <Text style={styles.stripeTitle}>Stripe Account</Text>
                        {stripeStatus.connected ? (
                          <View
                            style={[
                              styles.badge,
                              { backgroundColor: "#10B98120" },
                            ]}
                          >
                            <Text
                              style={[styles.badgeText, { color: "#10B981" }]}
                            >
                              Connected
                            </Text>
                          </View>
                        ) : (
                          <View
                            style={[
                              styles.badge,
                              { backgroundColor: COLORS.auroraGold + "20" },
                            ]}
                          >
                            <Text
                              style={[
                                styles.badgeText,
                                { color: COLORS.auroraGold },
                              ]}
                            >
                              Not Connected
                            </Text>
                          </View>
                        )}
                      </View>
                      {stripeStatus.connected ? (
                        <View style={styles.stripeDetails}>
                          <Text style={styles.stripeDetailText}>
                            Account ID:{" "}
                            {stripeStatus.accountId?.substring(0, 20)}...
                          </Text>
                          <View style={styles.stripeStatusRow}>
                            <View style={styles.stripeStatusItem}>
                              <Ionicons
                                name={
                                  stripeStatus.chargesEnabled
                                    ? "checkmark-circle"
                                    : "close-circle"
                                }
                                size={16}
                                color={
                                  stripeStatus.chargesEnabled
                                    ? "#10B981"
                                    : "#EF4444"
                                }
                              />
                              <Text style={styles.stripeStatusText}>
                                Charges Enabled
                              </Text>
                            </View>
                            <View style={styles.stripeStatusItem}>
                              <Ionicons
                                name={
                                  stripeStatus.payoutsEnabled
                                    ? "checkmark-circle"
                                    : "close-circle"
                                }
                                size={16}
                                color={
                                  stripeStatus.payoutsEnabled
                                    ? "#10B981"
                                    : "#EF4444"
                                }
                              />
                              <Text style={styles.stripeStatusText}>
                                Payouts Enabled
                              </Text>
                            </View>
                          </View>
                        </View>
                      ) : (
                        <Text style={styles.stripeNote}>
                          Connect your Stripe account to receive payouts
                        </Text>
                      )}
                    </View>
                  )}
                </>
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>
                    Payment and payout information is only available for
                    sellers. Apply to become a seller to start earning.
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Notifications */}
          {activeTab === "notifications" && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Notifications</Text>
              <Text style={styles.sectionDescription}>
                Manage your notification preferences
              </Text>

              <View style={styles.notificationCard}>
                <View style={styles.notificationHeader}>
                  <Text style={styles.notificationTitle}>
                    Notification Center
                  </Text>
                  {unreadNotifications > 0 && (
                    <View
                      style={[
                        styles.badge,
                        { backgroundColor: COLORS.crimson + "20" },
                      ]}
                    >
                      <Text
                        style={[styles.badgeText, { color: COLORS.crimson }]}
                      >
                        {unreadNotifications}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={styles.notificationText}>
                  {unreadNotifications > 0
                    ? `You have ${unreadNotifications} unread notification${
                        unreadNotifications > 1 ? "s" : ""
                      }`
                    : "You have no unread notifications"}
                </Text>
              </View>

              <View style={styles.notificationTypes}>
                <Text style={styles.notificationTypesTitle}>
                  Notification Types
                </Text>
                {[
                  "Purchase Blocked",
                  "Item Available",
                  "Order Confirmed",
                  "Order Shipped",
                ].map((type) => (
                  <View key={type} style={styles.notificationTypeItem}>
                    <Text style={styles.notificationTypeText}>{type}</Text>
                    <View style={styles.notificationTypeBadge}>
                      <Text style={styles.notificationTypeBadgeText}>
                        Active
                      </Text>
                    </View>
                  </View>
                ))}
                <Text style={styles.notificationNote}>
                  Notification preferences are managed automatically. All
                  notification types are enabled.
                </Text>
              </View>
            </View>
          )}

          {/* Security */}
          {activeTab === "security" && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Security</Text>
              <Text style={styles.sectionDescription}>
                Manage your account security settings
              </Text>

              <View style={styles.securityCard}>
                <Text style={styles.securityTitle}>Email Address</Text>
                <Text style={styles.securityValue}>{userInfo.email}</Text>
                <Text style={styles.securityNote}>
                  Your email address is used for authentication and cannot be
                  changed here.
                </Text>
              </View>

              <View style={styles.securityCard}>
                <Text style={styles.securityTitle}>Last Login</Text>
                <Text style={styles.securityValue}>
                  {formatDate(userInfo.last_login)}
                </Text>
              </View>

              <View style={styles.securityCard}>
                <Text style={styles.securityTitle}>Account Created</Text>
                <Text style={styles.securityValue}>
                  {formatDate(userInfo.created_at)}
                </Text>
              </View>

              <View style={styles.securityCard}>
                <Text style={styles.securityTitle}>Password</Text>
                <Text style={styles.securityNote}>
                  Change your password using the forgot password flow
                </Text>
              </View>
            </View>
          )}

          {/* Connected */}
          {activeTab === "connected" && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Connected Accounts</Text>
              <Text style={styles.sectionDescription}>
                Manage your connected third-party accounts
              </Text>

              <View style={styles.connectedCard}>
                <View style={styles.connectedHeader}>
                  <View>
                    <Text style={styles.connectedTitle}>AWS Cognito</Text>
                    <Text style={styles.connectedSubtitle}>
                      Authentication provider
                    </Text>
                  </View>
                  <View
                    style={[styles.badge, { backgroundColor: "#10B98120" }]}
                  >
                    <Text style={[styles.badgeText, { color: "#10B981" }]}>
                      Connected
                    </Text>
                  </View>
                </View>
                <Text style={styles.connectedNote}>
                  Your account is authenticated through AWS Cognito. This
                  connection is required and cannot be disconnected.
                </Text>
              </View>

              {userInfo.is_seller && (
                <View style={styles.connectedCard}>
                  <View style={styles.connectedHeader}>
                    <View>
                      <Text style={styles.connectedTitle}>Stripe</Text>
                      <Text style={styles.connectedSubtitle}>
                        Payment processing
                      </Text>
                    </View>
                    {stripeStatus?.connected ? (
                      <View
                        style={[styles.badge, { backgroundColor: "#10B98120" }]}
                      >
                        <Text style={[styles.badgeText, { color: "#10B981" }]}>
                          Connected
                        </Text>
                      </View>
                    ) : (
                      <View
                        style={[
                          styles.badge,
                          { backgroundColor: COLORS.auroraGold + "20" },
                        ]}
                      >
                        <Text
                          style={[
                            styles.badgeText,
                            { color: COLORS.auroraGold },
                          ]}
                        >
                          Not Connected
                        </Text>
                      </View>
                    )}
                  </View>
                  {stripeStatus?.connected ? (
                    <Text style={styles.connectedNote}>
                      Account ID: {stripeStatus.accountId?.substring(0, 20)}...
                    </Text>
                  ) : (
                    <Text style={styles.connectedNote}>
                      Connect your Stripe account to receive payouts
                    </Text>
                  )}
                </View>
              )}
            </View>
          )}

          {/* Delete */}
          {activeTab === "delete" && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: "#EF4444" }]}>
                Delete Account
              </Text>
              <Text style={styles.sectionDescription}>
                Permanently delete your account and all associated data
              </Text>

              <View style={styles.deleteWarning}>
                <Text style={styles.deleteWarningTitle}>Warning</Text>
                <Text style={styles.deleteWarningText}>
                  This action cannot be undone. Deleting your account will
                  permanently remove:
                </Text>
                <View style={styles.deleteWarningList}>
                  <Text style={styles.deleteWarningItem}>
                    • Your user account and profile
                  </Text>
                  <Text style={styles.deleteWarningItem}>
                    • All your listings, products, or events (if applicable)
                  </Text>
                  <Text style={styles.deleteWarningItem}>
                    • Your order history and transaction data
                  </Text>
                  <Text style={styles.deleteWarningItem}>
                    • All associated data and preferences
                  </Text>
                </View>
              </View>

              <Text style={styles.deleteInstructions}>
                If you're sure you want to delete your account, click the button
                below and confirm by entering your email address.
              </Text>

              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => setDeleteDialogOpen(true)}
              >
                <Text style={styles.deleteButtonText}>Delete My Account</Text>
              </TouchableOpacity>
            </View>
          )}
        </FormCard>
      </ScrollView>

      {/* Delete Account Dialog */}
      <Modal
        visible={deleteDialogOpen}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setDeleteDialogOpen(false);
          setDeleteEmailConfirm("");
          setError("");
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Delete Account</Text>
            <Text style={styles.modalDescription}>
              This action cannot be undone. Please enter your email address to
              confirm.
            </Text>

            <Text style={styles.modalLabel}>Email Address</Text>
            <TextInput
              style={styles.modalInput}
              value={deleteEmailConfirm}
              onChangeText={setDeleteEmailConfirm}
              placeholder={userInfo.email}
              placeholderTextColor={COLORS.midnightNavy + "50"}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Text style={styles.modalHint}>
              Enter <Text style={styles.modalHintBold}>{userInfo.email}</Text>{" "}
              to confirm
            </Text>

            {error && <Text style={styles.modalError}>{error}</Text>}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setDeleteDialogOpen(false);
                  setDeleteEmailConfirm("");
                  setError("");
                }}
                disabled={deleting}
              >
                <Text style={styles.modalButtonCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.modalButtonDelete,
                  (deleting || deleteEmailConfirm !== userInfo.email) &&
                    styles.modalButtonDisabled,
                ]}
                onPress={handleDeleteAccount}
                disabled={deleting || deleteEmailConfirm !== userInfo.email}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Text style={styles.modalButtonDeleteText}>
                    Delete Account
                  </Text>
                )}
              </TouchableOpacity>
            </View>
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
    paddingBottom: 20,
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
  errorText: {
    fontSize: 16,
    color: "#EF4444",
    textAlign: "center",
  },
  errorBanner: {
    backgroundColor: "#FEE2E2",
    borderLeftWidth: 4,
    borderLeftColor: "#EF4444",
    padding: 12,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 8,
  },
  errorBannerText: {
    color: "#DC2626",
    fontSize: 14,
  },
  tabScrollView: {
    maxHeight: 60,
    marginBottom: 12,
  },
  tabScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.frostGray,
    marginRight: 8,
  },
  tabActive: {
    backgroundColor: COLORS.crimson + "10",
    borderColor: COLORS.crimson,
  },
  tabIcon: {
    marginRight: 6,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.midnightNavy,
  },
  tabTextActive: {
    color: COLORS.crimson,
    fontWeight: "600",
  },
  formCard: {
    width: "92%",
    alignSelf: "center",
    marginTop: 8,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: COLORS.midnightNavy,
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    color: COLORS.midnightNavy,
    opacity: 0.7,
    marginBottom: 20,
  },
  roleCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.frostGray,
  },
  roleHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  roleTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.midnightNavy,
  },
  roleDescription: {
    fontSize: 14,
    color: COLORS.midnightNavy,
    opacity: 0.7,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  emptyState: {
    padding: 20,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.frostGray,
  },
  emptyStateText: {
    fontSize: 14,
    color: COLORS.midnightNavy,
    opacity: 0.7,
    textAlign: "center",
  },
  chapterCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.frostGray,
  },
  chapterHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  chapterTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.midnightNavy,
  },
  chapterBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: COLORS.frostGray,
  },
  chapterBadgeText: {
    fontSize: 12,
    fontWeight: "500",
    color: COLORS.midnightNavy,
  },
  chapterId: {
    fontSize: 14,
    color: COLORS.midnightNavy,
    opacity: 0.7,
    marginBottom: 4,
  },
  chapterNote: {
    fontSize: 12,
    color: COLORS.midnightNavy,
    opacity: 0.5,
  },
  metricsContainer: {
    gap: 12,
    marginBottom: 16,
  },
  metricCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.frostGray,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: COLORS.midnightNavy,
    opacity: 0.7,
    marginTop: 8,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: "bold",
  },
  metricNote: {
    fontSize: 12,
    color: COLORS.midnightNavy,
    opacity: 0.5,
    marginTop: 4,
  },
  stripeCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.frostGray,
  },
  stripeHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  stripeTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.midnightNavy,
  },
  stripeDetails: {
    marginTop: 8,
  },
  stripeDetailText: {
    fontSize: 14,
    color: COLORS.midnightNavy,
    opacity: 0.7,
    marginBottom: 12,
  },
  stripeStatusRow: {
    flexDirection: "row",
    gap: 16,
  },
  stripeStatusItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  stripeStatusText: {
    fontSize: 12,
    color: COLORS.midnightNavy,
    opacity: 0.7,
  },
  stripeNote: {
    fontSize: 14,
    color: COLORS.midnightNavy,
    opacity: 0.7,
  },
  notificationCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.frostGray,
  },
  notificationHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.midnightNavy,
  },
  notificationText: {
    fontSize: 14,
    color: COLORS.midnightNavy,
    opacity: 0.7,
  },
  notificationTypes: {
    marginTop: 8,
  },
  notificationTypesTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.midnightNavy,
    marginBottom: 12,
  },
  notificationTypeItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.frostGray,
    marginBottom: 8,
  },
  notificationTypeText: {
    fontSize: 14,
    color: COLORS.midnightNavy,
  },
  notificationTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: COLORS.frostGray,
  },
  notificationTypeBadgeText: {
    fontSize: 12,
    fontWeight: "500",
    color: COLORS.midnightNavy,
  },
  notificationNote: {
    fontSize: 12,
    color: COLORS.midnightNavy,
    opacity: 0.5,
    marginTop: 8,
  },
  securityCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.frostGray,
  },
  securityTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.midnightNavy,
    marginBottom: 8,
  },
  securityValue: {
    fontSize: 14,
    color: COLORS.midnightNavy,
    opacity: 0.7,
    marginBottom: 8,
  },
  securityNote: {
    fontSize: 12,
    color: COLORS.midnightNavy,
    opacity: 0.5,
  },
  connectedCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.frostGray,
  },
  connectedHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  connectedTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.midnightNavy,
    marginBottom: 4,
  },
  connectedSubtitle: {
    fontSize: 14,
    color: COLORS.midnightNavy,
    opacity: 0.7,
  },
  connectedNote: {
    fontSize: 12,
    color: COLORS.midnightNavy,
    opacity: 0.5,
    marginTop: 8,
  },
  deleteWarning: {
    backgroundColor: "#FEE2E2",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  deleteWarningTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#DC2626",
    marginBottom: 8,
  },
  deleteWarningText: {
    fontSize: 14,
    color: "#991B1B",
    marginBottom: 12,
  },
  deleteWarningList: {
    gap: 6,
  },
  deleteWarningItem: {
    fontSize: 14,
    color: "#991B1B",
  },
  deleteInstructions: {
    fontSize: 14,
    color: COLORS.midnightNavy,
    opacity: 0.7,
    marginBottom: 16,
  },
  deleteButton: {
    backgroundColor: "#EF4444",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.white,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: COLORS.midnightNavy,
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 14,
    color: COLORS.midnightNavy,
    opacity: 0.7,
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.midnightNavy,
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: COLORS.midnightNavy,
    borderWidth: 1,
    borderColor: COLORS.frostGray,
    marginBottom: 8,
  },
  modalHint: {
    fontSize: 12,
    color: COLORS.midnightNavy,
    opacity: 0.5,
    marginBottom: 16,
  },
  modalHintBold: {
    fontWeight: "600",
  },
  modalError: {
    fontSize: 14,
    color: "#EF4444",
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  modalButtonCancel: {
    backgroundColor: COLORS.frostGray,
  },
  modalButtonCancelText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.midnightNavy,
  },
  modalButtonDelete: {
    backgroundColor: "#EF4444",
  },
  modalButtonDeleteText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.white,
  },
  modalButtonDisabled: {
    opacity: 0.5,
  },
});
