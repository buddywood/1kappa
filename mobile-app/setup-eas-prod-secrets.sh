#!/bin/bash
# Setup script for EAS production environment variables
# Run this after logging in to EAS with: eas login

set -e

echo "Setting up EAS production environment variables..."
echo ""

# Create EXPO_PUBLIC_API_URL secret for production
echo "Creating EXPO_PUBLIC_API_URL secret..."
eas env:create production --name EXPO_PUBLIC_API_URL --value https://onekappa.herokuapp.com --scope project

# Create EXPO_PUBLIC_WEB_URL secret for production
echo "Creating EXPO_PUBLIC_WEB_URL secret..."
eas env:create production --name EXPO_PUBLIC_WEB_URL --value https://www.one-kappa.com --scope project

echo ""
echo "✅ Production environment variables created successfully!"
echo ""
echo "To verify, run: eas env:list"




