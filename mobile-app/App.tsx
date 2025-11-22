import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, ScrollView } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { COLORS } from './lib/constants';
import { AuthProvider } from './lib/auth';
import Header from './components/Header';
import HeroBanner from './components/HeroBanner';
import FeaturedProducts from './components/FeaturedProducts';
import ImpactBanner from './components/ImpactBanner';
import FeaturedBrothers from './components/FeaturedBrothers';
import EventsSection from './components/EventsSection';
import ProductDetail from './components/ProductDetail';
import ShopScreen from './components/ShopScreen';
import CollectionsScreen from './components/CollectionsScreen';
import StewardMarketplaceScreen from './components/StewardMarketplaceScreen';
import { Product, Event, StewardListing } from './lib/api';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

type Screen = 'home' | 'shop' | 'collections' | 'steward-marketplace';

export default function App() {
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');

  useEffect(() => {
    // Hide the splash screen after the app is ready
    const prepare = async () => {
      // Simulate a small delay to show the splash screen
      await new Promise(resolve => setTimeout(resolve, 2000));
      await SplashScreen.hideAsync();
    };

    prepare();
  }, []);

  const handleMenuPress = () => {
    // Menu toggle is handled in Header component
    console.log('Menu pressed');
  };

  const handleUserPress = () => {
    // Placeholder for user menu
    console.log('User pressed');
  };

  const handleShopPress = () => {
    setCurrentScreen('shop');
  };

  const handleCollectionsPress = () => {
    setCurrentScreen('collections');
  };

  const handleStewardMarketplacePress = () => {
    setCurrentScreen('steward-marketplace');
  };

  const handleBackToHome = () => {
    setCurrentScreen('home');
  };

  const handleSearchPress = () => {
    // TODO: Open search modal
    console.log('Search pressed');
  };

  const handleBecomeMemberPress = () => {
    console.log('Become Member pressed');
  };

  const handleBecomeSellerPress = () => {
    console.log('Become Seller pressed');
  };

  const handleBecomePromoterPress = () => {
    console.log('Become Promoter pressed');
  };

  const handleBecomeStewardPress = () => {
    console.log('Become Steward pressed');
  };

  const handleProductPress = (product: Product) => {
    // Show product detail modal
    setSelectedProductId(product.id);
  };

  const handleSellerPress = (sellerId: number) => {
    // Placeholder for seller collection navigation
    console.log('Seller pressed:', sellerId);
  };

  const handleEventPress = (event: Event) => {
    // Placeholder for event detail navigation
    console.log('Event pressed:', event.id);
  };

  const handleRSVPPress = (event: Event) => {
    // Placeholder for RSVP action
    console.log('RSVP pressed:', event.id);
  };

  const handleNotificationPress = () => {
    // TODO: Navigate to notifications screen when navigation is implemented
    console.log('Notifications pressed - navigate to Notifications screen');
  };

  // Render different screens based on currentScreen state
  const renderScreen = () => {
    switch (currentScreen) {
      case 'shop':
        return (
          <ShopScreen
            onBack={handleBackToHome}
            onProductPress={handleProductPress}
            onSearchPress={handleSearchPress}
            onUserPress={handleUserPress}
          />
        );
      case 'collections':
        return (
          <CollectionsScreen
            onBack={handleBackToHome}
            onSellerPress={handleSellerPress}
            onSearchPress={handleSearchPress}
            onUserPress={handleUserPress}
          />
        );
      case 'steward-marketplace':
        return (
          <StewardMarketplaceScreen
            onBack={handleBackToHome}
            onListingPress={(listing: StewardListing) => {
              // TODO: Handle steward listing press - show detail modal
              console.log('Steward listing pressed:', listing.id);
            }}
            onSearchPress={handleSearchPress}
            onUserPress={handleUserPress}
          />
        );
      case 'home':
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
              onCollectionsPress={handleCollectionsPress}
              onStewardMarketplacePress={handleStewardMarketplacePress}
              onShopPress={handleShopPress}
              onNotificationPress={handleNotificationPress}
              notificationCount={0}
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
    <AuthProvider>
      <SafeAreaProvider>
        <SafeAreaView style={styles.container}>
          <StatusBar style="auto" />
          {renderScreen()}

        {/* Product Detail Modal */}
        {selectedProductId !== null && (
          <ProductDetail
            productId={selectedProductId}
            onClose={() => setSelectedProductId(null)}
            onSellerPress={handleSellerPress}
          />
        )}
        </SafeAreaView>
      </SafeAreaProvider>
    </AuthProvider>
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
});
