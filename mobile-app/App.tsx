import "./global.css";
import { useEffect, useState, useRef } from "react";
import { StatusBar } from "expo-status-bar";
import {
  StyleSheet,
  ScrollView,
  View,
  Animated,
  Linking,
  Image,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";
import { COLORS } from "./lib/constants";
import { AuthProvider } from "./lib/auth";
import { CartProvider } from "./lib/CartContext";
import Header from "./components/Header";
import HeroBanner from "./components/HeroBanner";
import FeaturedProducts from "./components/FeaturedProducts";
import ImpactBanner from "./components/ImpactBanner";
import FeaturedBrothers from "./components/FeaturedBrothers";
import EventsSection from "./components/EventsSection";
import ProductDetail from "./components/ProductDetail";
import StewardListingDetail from "./components/StewardListingDetail";
import ShopScreen from "./components/ShopScreen";
import EventsScreen from "./components/EventsScreen";
import EventDetail from "./components/EventDetail";
import MyEventsScreen from "./components/MyEventsScreen";
import CreateEventScreen from "./components/CreateEventScreen";
import EditEventScreen from "./components/EditEventScreen";
import SellerStoreScreen from "./components/SellerStoreScreen";
import StewardMarketplaceScreen from "./components/StewardMarketplaceScreen";
import SellersScreen from "./components/SellersScreen";
import ProfileScreen from "./components/ProfileScreen";
import EditProfileScreen from "./components/EditProfileScreen";
import SettingsScreen from "./components/SettingsScreen";
import NotificationsScreen from "./components/NotificationsScreen";
import MemberSetupScreen from "./components/MemberSetupScreen";
import MemberDashboardScreen from "./components/MemberDashboardScreen";
import SellerSetupScreen from "./components/SellerSetupScreen";
import SellerDashboardScreen from "./components/SellerDashboardScreen";
import SellerListingScreen from "./components/SellerListingScreen";
import BottomTabBar from "./components/BottomTabBar";
import {
  Product,
  Event,
  StewardListing,
  getUnreadNotificationCount,
} from "./lib/api";
import { useAuth } from "./lib/auth";

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

type Screen =
  | "home"
  | "shop"
  | "events"
  | "event-detail"
  | "my-events"
  | "create-event"
  | "edit-event"
  | "seller-store"
  | "steward-marketplace"
  | "profile"
  | "edit-profile"
  | "settings"
  | "notifications"
  | "member-setup"
  | "member-dashboard"
  | "seller-setup"
  | "seller-dashboard"
  | "seller-listing";

function AppContent() {
  const { user, token } = useAuth();
  const [selectedProductId, setSelectedProductId] = useState<number | null>(
    null
  );
  const [selectedListingId, setSelectedListingId] = useState<number | null>(
    null
  );
  const [selectedSellerId, setSelectedSellerId] = useState<number | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [editingEventId, setEditingEventId] = useState<number | null>(null);
  const [currentScreen, setCurrentScreen] = useState<Screen>("home");
  const [profileInitialMode, setProfileInitialMode] = useState<
    "login" | "register" | "view"
  >("login");
  const [profileErrorMessage, setProfileErrorMessage] = useState<string | null>(
    null
  );
  const [notificationCount, setNotificationCount] = useState(0);

  // Fetch notification count when user is authenticated
  useEffect(() => {
    const loadNotificationCount = async () => {
      if (token && user?.email) {
        try {
          const count = await getUnreadNotificationCount(token, user.email);
          setNotificationCount(count);
        } catch (error) {
          console.error("Error fetching notification count:", error);
          setNotificationCount(0);
        }
      } else {
        setNotificationCount(0);
      }
    };

    loadNotificationCount();
    // Refresh notification count every 30 seconds
    const interval = setInterval(loadNotificationCount, 30000);
    return () => clearInterval(interval);
  }, [token, user?.email]);

  const handleMenuPress = () => {
    // Menu toggle is handled in Header component
    console.log("Menu pressed");
  };

  const handleUserPress = () => {
    // Placeholder for user menu
    console.log("User pressed");
  };

  const handleShopPress = () => {
    setCurrentScreen("shop");
  };

  const handleEventsPress = () => {
    setCurrentScreen("events");
  };

  const handleStewardMarketplacePress = () => {
    setCurrentScreen("steward-marketplace");
  };

  const handleBackToHome = () => {
    setCurrentScreen("home");
    setSelectedProductId(null);
    setSelectedListingId(null);
    setSelectedSellerId(null);
    setSelectedEventId(null);
  };

  const handleBackToEvents = () => {
    setCurrentScreen("events");
    setSelectedEventId(null);
  };

  const handleSearchPress = () => {
    // TODO: Open search modal
    console.log("Search pressed");
  };

  const handleBecomeMemberPress = () => {
    setCurrentScreen("member-setup");
  };

  const handleBecomeSellerPress = () => {
    setCurrentScreen("seller-setup");
  };

  const handleSellerSetupContinue = (chapterId: number) => {
    // TODO: Navigate to full seller application form with chapterId
    // For now, just show an alert
    const webUrl = process.env.EXPO_PUBLIC_WEB_URL || "http://localhost:3000";
    alert(
      `Would navigate to application form with chapter ${chapterId}. For now, please complete the application on the web at ${webUrl}/apply?sponsoring_chapter_id=${chapterId}`
    );
    setCurrentScreen("home");
  };

  const handleBecomePromoterPress = () => {
    // For guests, redirect to member-setup (they need to be a member first)
    // For authenticated users, could navigate to promoter-setup in the future
    setCurrentScreen("member-setup");
  };

  const handleBecomeStewardPress = () => {
    console.log("Become Steward pressed");
  };

  const handleProductPress = (product: Product) => {
    console.log("App: handleProductPress called", product.id, product.name);
    // Show product detail modal
    setSelectedProductId(product.id);
  };

  const handleSellerPress = (sellerId: number) => {
    // Navigate to seller store screen
    setSelectedSellerId(sellerId);
    setCurrentScreen("seller-store");
  };

  const handleEventPress = (event: Event) => {
    setSelectedEventId(event.id);
    setCurrentScreen("event-detail");
  };

  const handleEditEventPress = (eventId: number) => {
    setEditingEventId(eventId);
    setCurrentScreen("edit-event");
  };

  const handleRSVPPress = (event: Event) => {
    // Placeholder for RSVP action
    console.log("RSVP pressed:", event.id);
  };

  const handleNotificationPress = () => {
    setCurrentScreen("notifications");
  };

  // Fetch notification count when user is authenticated
  useEffect(() => {
    const loadNotificationCount = async () => {
      if (token && user?.email) {
        try {
          const count = await getUnreadNotificationCount(token, user.email);
          setNotificationCount(count);
        } catch (error) {
          console.error("Error fetching notification count:", error);
          setNotificationCount(0);
        }
      } else {
        setNotificationCount(0);
      }
    };

    loadNotificationCount();
    // Refresh notification count every 30 seconds
    const interval = setInterval(loadNotificationCount, 30000);
    return () => clearInterval(interval);
  }, [token, user?.email]);

  // Render different screens based on currentScreen state
  const renderScreen = () => {
    switch (currentScreen) {
      case "shop":
        return (
          <ShopScreen
            onBack={handleBackToHome}
            onProductPress={handleProductPress}
            onSearchPress={handleSearchPress}
            onUserPress={handleUserPress}
          />
        );
      case "events":
        return (
          <EventsScreen
            onBack={handleBackToHome}
            onEventPress={handleEventPress}
            onSearchPress={handleSearchPress}
            onUserPress={handleUserPress}
          />
        );
      case "event-detail":
        return selectedEventId ? (
          <EventDetail
            eventId={selectedEventId}
            onClose={handleBackToEvents}
            onRSVP={(event) => {
              // TODO: Implement RSVP functionality
              console.log("RSVP for event:", event.id);
            }}
            onEditPress={handleEditEventPress}
          />
        ) : null;
      case "my-events":
        return (
          <MyEventsScreen
            onBack={handleBackToHome}
            onEventPress={handleEventPress}
            onSearchPress={handleSearchPress}
            onUserPress={handleUserPress}
            onCreateEventPress={() => {
              setCurrentScreen("create-event");
            }}
          />
        );
      case "create-event":
        return (
          <CreateEventScreen
            onBack={handleBackToHome}
            onSuccess={() => {
              setCurrentScreen("my-events");
            }}
          />
        );
      case "edit-event":
        return editingEventId ? (
          <EditEventScreen
            eventId={editingEventId}
            onBack={handleBackToHome}
            onSuccess={() => {
              setCurrentScreen("my-events");
              setEditingEventId(null);
            }}
          />
        ) : null;
      case "seller-store":
        return selectedSellerId ? (
          <SellerStoreScreen
            sellerId={selectedSellerId}
            onBack={handleBackToHome}
            onProductPress={handleProductPress}
            onSearchPress={handleSearchPress}
            onUserPress={handleUserPress}
          />
        ) : null;
      case "steward-marketplace":
        return (
          <StewardMarketplaceScreen
            onBack={handleBackToHome}
            onListingPress={(listing: StewardListing) => {
              setSelectedListingId(listing.id);
            }}
            onSearchPress={handleSearchPress}
            onUserPress={handleUserPress}
          />
        );
      case "profile":
        return (
          <ProfileScreen
            onBack={handleBackToHome}
            initialMode={
              profileInitialMode === "view" ? undefined : profileInitialMode
            }
            initialErrorMessage={profileErrorMessage}
            onMyEventsPress={() => setCurrentScreen("my-events")}
            onEditProfilePress={() => setCurrentScreen("edit-profile")}
            onSettingsPress={() => setCurrentScreen("settings")}
            onMemberDashboardPress={() => setCurrentScreen("member-dashboard")}
            onSellerDashboardPress={() => setCurrentScreen("seller-dashboard")}
          />
        );
      case "edit-profile":
        return (
          <EditProfileScreen
            onBack={() => setCurrentScreen("profile")}
            onProfileUpdated={() => {
              setCurrentScreen("profile");
            }}
          />
        );
      case "settings":
        return (
          <SettingsScreen
            onBack={() => setCurrentScreen("profile")}
            onNotificationsPress={() => setCurrentScreen("notifications")}
          />
        );
      case "notifications":
        return (
          <NotificationsScreen
            onBack={() => setCurrentScreen("profile")}
            onProductPress={(productId: number) => {
              console.log("Notification tapped product", productId);
              setSelectedProductId(productId);
            }}
          />
        );
      case "member-setup":
        return (
          <MemberSetupScreen
            onBack={handleBackToHome}
            onStartRegistration={() => {
              setProfileInitialMode("register");
              setCurrentScreen("profile");
            }}
            onLogin={() => {
              setProfileInitialMode("login");
              setCurrentScreen("profile");
            }}
          />
        );
      case "member-dashboard":
        return (
          <MemberDashboardScreen
            onBack={handleBackToHome}
            onNavigateToProfile={() => {
              setProfileInitialMode("view");
              setCurrentScreen("profile");
            }}
            onNavigateToSellerSetup={() => setCurrentScreen("seller-setup")}
            onNavigateToPromoterSetup={() => {
              // Navigate to web app for promoter setup
              Linking.openURL(
                `${
                  process.env.EXPO_PUBLIC_WEB_URL || "http://localhost:3000"
                }/promoter-setup`
              );
            }}
            onNavigateToStewardSetup={() => {
              // Navigate to web app for steward setup
              Linking.openURL(
                `${
                  process.env.EXPO_PUBLIC_WEB_URL || "http://localhost:3000"
                }/steward-setup`
              );
            }}
          />
        );
      case "seller-setup":
        return (
          <SellerSetupScreen
            onBack={handleBackToHome}
            onContinue={handleSellerSetupContinue}
          />
        );
      case "seller-dashboard":
        return (
          <SellerDashboardScreen
            onBack={handleBackToHome}
            onCreateProductPress={() => {
              setCurrentScreen("seller-listing");
            }}
            onEditProductPress={(productId) => {
              // For now, edit opens web - can be implemented later
              Linking.openURL(
                `${
                  process.env.EXPO_PUBLIC_WEB_URL || "http://localhost:3000"
                }/seller-dashboard/listings/edit/${productId}`
              );
            }}
            onSessionExpired={() => {
              // Handle session expiration - route to login
              setProfileErrorMessage(
                "Your session has expired. Please log in again."
              );
              setProfileInitialMode("login");
              setCurrentScreen("profile");
            }}
          />
        );
      case "seller-listing":
        return (
          <SellerListingScreen
            onBack={() => setCurrentScreen("seller-dashboard")}
            onSuccess={() => {
              setCurrentScreen("seller-dashboard");
              // Refresh dashboard data by navigating away and back
            }}
          />
        );
      case "home":
      default:
        return (
          <>
            <Header
              onMenuPress={handleMenuPress}
              onUserPress={handleUserPress}
              onBecomeMemberPress={handleBecomeMemberPress}
              onBecomeSellerPress={handleBecomeSellerPress}
              onBecomePromoterPress={handleBecomePromoterPress}
              onBecomeStewardPress={handleBecomeStewardPress}
              onProductPress={handleProductPress}
              onEventPress={handleEventPress}
              onEventsPress={handleEventsPress}
              onStewardMarketplacePress={handleStewardMarketplacePress}
              onShopPress={handleShopPress}
              onNotificationPress={handleNotificationPress}
              notificationCount={notificationCount}
            />
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <HeroBanner />
              <FeaturedProducts onProductPress={handleProductPress} />
              <ImpactBanner />
              <FeaturedBrothers onSellerPress={handleSellerPress} />
              <EventsSection
                onEventPress={handleEventPress}
                onRSVPPress={handleRSVPPress}
              />
            </ScrollView>
          </>
        );
    }
  };

  return (
    <>
      <StatusBar style="auto" />
      <View style={styles.contentWrapper}>{renderScreen()}</View>

      {/* Bottom Tab Bar */}
      <BottomTabBar
        currentScreen={currentScreen}
        onScreenChange={setCurrentScreen}
      />

      {/* Product Detail Modal */}
      {selectedProductId !== null && (
        <ProductDetail
          productId={selectedProductId}
          onClose={() => setSelectedProductId(null)}
          onSellerPress={handleSellerPress}
        />
      )}

      {/* Steward Listing Detail Modal */}
      {selectedListingId !== null && (
        <StewardListingDetail
          listingId={selectedListingId}
          onClose={() => setSelectedListingId(null)}
          onSellerPress={handleSellerPress}
        />
      )}
    </>
  );
}

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Prepare app and animate splash screen
    const prepare = async () => {
      try {
        // Simulate loading tasks (fonts, data, etc.)
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (e) {
        console.warn(e);
      } finally {
        // App is ready, start fade animation
        setAppIsReady(true);

        // Animate splash screen fade out
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 500, // Animation duration in ms
          useNativeDriver: true,
        }).start(async () => {
          // Hide native splash screen after animation completes
          await SplashScreen.hideAsync();
        });
      }
    };

    prepare();
  }, [fadeAnim]);

  if (!appIsReady) {
    return (
      <View style={styles.splashContainer}>
        <Animated.View
          style={[
            styles.splashContainer,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <Image
            source={require("./assets/icon.png")}
            style={{ width: 100, height: 100 }}
          />
        </Animated.View>
      </View>
    );
  }

  return (
    <AuthProvider>
      <CartProvider>
        <SafeAreaProvider>
          <SafeAreaView style={styles.container} edges={["top"]}>
            <AppContent />
          </SafeAreaView>
        </SafeAreaProvider>
      </CartProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },
  contentWrapper: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
});
