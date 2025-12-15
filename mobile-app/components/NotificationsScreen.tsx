import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../lib/constants";
import { useAuth } from "../lib/auth";
import ScreenHeader from "./ScreenHeader";
import FormCard from "./ui/FormCard";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  type Notification,
} from "../lib/api";

interface NotificationsScreenProps {
  onBack: () => void;
  onProductPress?: (productId: number) => void;
}

export default function NotificationsScreen({
  onBack,
  onProductPress,
}: NotificationsScreenProps) {
  const { user, token } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (token && user?.email) {
      loadNotifications();
    }
  }, [token, user?.email]);

  const loadNotifications = async () => {
    if (!token || !user?.email) return;

    try {
      setLoading(true);
      setError("");
      const data = await getNotifications(token, user.email);
      setNotifications(data);
    } catch (err: any) {
      console.error("Error fetching notifications:", err);
      setError("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: number) => {
    if (!token || !user?.email) return;

    try {
      await markNotificationAsRead(token, notificationId, user.email!);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error("Error marking notification as read:", err);
      Alert.alert("Error", "Failed to mark notification as read");
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!token || !user?.email) return;

    try {
      await markAllNotificationsAsRead(token, user.email!);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
      Alert.alert("Error", "Failed to mark all notifications as read");
    }
  };

  const handleDelete = async (notificationId: number) => {
    if (!token || !user?.email) return;

    Alert.alert(
      "Delete Notification",
      "Are you sure you want to delete this notification?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteNotification(token, notificationId, user.email!);
              setNotifications((prev) =>
                prev.filter((n) => n.id !== notificationId)
              );
            } catch (err) {
              console.error("Error deleting notification:", err);
              Alert.alert("Error", "Failed to delete notification");
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "PURCHASE_BLOCKED":
        return "time-outline";
      case "ITEM_AVAILABLE":
        return "checkmark-circle-outline";
      case "ORDER_CONFIRMED":
        return "cube-outline";
      case "ORDER_SHIPPED":
        return "car-outline";
      default:
        return "notifications-outline";
    }
  };

  const getNotificationColor = (type: Notification["type"]) => {
    switch (type) {
      case "PURCHASE_BLOCKED":
        return COLORS.auroraGold || "#F59E0B";
      case "ITEM_AVAILABLE":
        return "#10B981";
      case "ORDER_CONFIRMED":
        return "#3B82F6";
      case "ORDER_SHIPPED":
        return "#8B5CF6";
      default:
        return COLORS.midnightNavy;
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Notifications" onBack={onBack} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.crimson} />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      </View>
    );
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <View style={styles.container}>
      <ScreenHeader title="Notifications" onBack={onBack} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
        )}

        {unreadCount > 0 && (
          <View style={styles.markAllContainer}>
            <TouchableOpacity
              style={styles.markAllButton}
              onPress={handleMarkAllAsRead}
            >
              <Text style={styles.markAllText}>Mark all as read</Text>
            </TouchableOpacity>
          </View>
        )}

        {notifications.length === 0 ? (
          <FormCard style={styles.emptyCard}>
            <View style={styles.emptyContainer}>
              <Ionicons
                name="notifications-outline"
                size={64}
                color={COLORS.midnightNavy + "40"}
              />
              <Text style={styles.emptyTitle}>No notifications</Text>
              <Text style={styles.emptyText}>
                You're all caught up! We'll notify you when there's something
                new.
              </Text>
            </View>
          </FormCard>
        ) : (
          <View style={styles.notificationsList}>
            {notifications.map((notification) => {
              const color = getNotificationColor(notification.type);
              const isUnread = !notification.is_read;

              return (
                <View
                  key={notification.id}
                  style={[
                    styles.notificationCard,
                    isUnread && {
                      borderLeftWidth: 4,
                      borderLeftColor: color,
                      backgroundColor: color + "10",
                    },
                  ]}
                >
                  <View style={styles.notificationContent}>
                    <View style={styles.notificationHeader}>
                      <View style={styles.notificationIconContainer}>
                        <Ionicons
                          name={getNotificationIcon(notification.type) as any}
                          size={24}
                          color={color}
                        />
                      </View>
                      <View style={styles.notificationTextContainer}>
                        <Text
                          style={[
                            styles.notificationTitle,
                            isUnread && styles.notificationTitleUnread,
                          ]}
                        >
                          {notification.title}
                        </Text>
                        <Text style={styles.notificationMessage}>
                          {notification.message}
                        </Text>
                        <View style={styles.notificationFooter}>
                          {notification.created_at && (
                            <Text style={styles.notificationDate}>
                              {formatDate(notification.created_at)}
                            </Text>
                          )}
                          {notification.related_product_id && (
                            <TouchableOpacity
                              style={styles.viewProductButton}
                              onPress={() => {
                                if (onProductPress) {
                                  onProductPress(
                                    notification.related_product_id!
                                  );
                                }
                                if (isUnread) {
                                  handleMarkAsRead(notification.id);
                                }
                              }}
                            >
                              <Text style={styles.viewProductText}>
                                View Product
                              </Text>
                              <Ionicons
                                name="arrow-forward"
                                size={14}
                                color={COLORS.crimson}
                              />
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    </View>
                    <View style={styles.notificationActions}>
                      {isUnread && (
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => handleMarkAsRead(notification.id)}
                        >
                          <Ionicons
                            name="checkmark-circle-outline"
                            size={20}
                            color={COLORS.crimson}
                          />
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleDelete(notification.id)}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={20}
                          color={COLORS.midnightNavy + "60"}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
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
  markAllContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: "flex-end",
  },
  markAllButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  markAllText: {
    fontSize: 14,
    color: COLORS.crimson,
    fontWeight: "500",
  },
  emptyCard: {
    width: "92%",
    alignSelf: "center",
    marginTop: 12,
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: COLORS.midnightNavy,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.midnightNavy,
    opacity: 0.7,
    textAlign: "center",
  },
  notificationsList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  notificationCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.frostGray,
    marginBottom: 8,
  },
  notificationContent: {
    flexDirection: "row",
    gap: 12,
  },
  notificationHeader: {
    flexDirection: "row",
    flex: 1,
    gap: 12,
  },
  notificationIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.frostGray,
    alignItems: "center",
    justifyContent: "center",
  },
  notificationTextContainer: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: COLORS.midnightNavy,
    marginBottom: 4,
  },
  notificationTitleUnread: {
    fontWeight: "600",
  },
  notificationMessage: {
    fontSize: 14,
    color: COLORS.midnightNavy,
    opacity: 0.7,
    marginBottom: 8,
    lineHeight: 20,
  },
  notificationFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 8,
  },
  notificationDate: {
    fontSize: 12,
    color: COLORS.midnightNavy,
    opacity: 0.5,
  },
  viewProductButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  viewProductText: {
    fontSize: 12,
    color: COLORS.crimson,
    fontWeight: "500",
  },
  notificationActions: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
  },
  actionButton: {
    padding: 4,
  },
});
