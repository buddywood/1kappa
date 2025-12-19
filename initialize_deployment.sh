#!/bin/bash
set -e

if [ -z "$1" ]; then
  echo "Error: Please provide a commit message."
  echo "Usage: ./initialize_deployment.sh \"Your commit message\""
  exit 1
fi

echo "🚀 Starting deployment initialization..."

# Ensure we are on development
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "development" ]; then
    echo "⚠️  You are not on the development branch. Switching to development..."
    git checkout development
fi

echo "📦 Committing and pushing to development..."
git add .
git commit -m "$1"
git push origin development

echo "🔀 Merging development into main..."
git checkout main
git pull origin main
git merge development

echo "🚀 Pushing main..."
git push origin main

echo "🔙 Switching back to development..."
git checkout development

echo "✅ Deployment initialized successfully!"
