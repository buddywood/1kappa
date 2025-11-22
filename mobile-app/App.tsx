import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { COLORS } from './lib/constants';
import Header from './components/Header';
import HeroBanner from './components/HeroBanner';
import FeaturedProducts from './components/FeaturedProducts';
import ImpactBanner from './components/ImpactBanner';
import FeaturedBrothers from './components/FeaturedBrothers';
import EventsSection from './components/EventsSection';
import { Product, Event } from './lib/api';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function App() {
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
    // Placeholder for menu navigation
    console.log('Menu pressed');
  };

  const handleUserPress = () => {
    // Placeholder for user menu
    console.log('User pressed');
  };

  const handleShopPress = () => {
    // Placeholder for shop navigation
    console.log('Shop pressed');
  };

  const handleProductPress = (product: Product) => {
    // Placeholder for product detail navigation
    console.log('Product pressed:', product.id);
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <Header onMenuPress={handleMenuPress} onUserPress={handleUserPress} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <HeroBanner onShopPress={handleShopPress} />
        <FeaturedProducts onProductPress={handleProductPress} />
        <ImpactBanner />
        <FeaturedBrothers onSellerPress={handleSellerPress} />
        <EventsSection
          onEventPress={handleEventPress}
          onRSVPPress={handleRSVPPress}
        />
      </ScrollView>
    </SafeAreaView>
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
