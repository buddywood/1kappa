#!/bin/bash
# Heroku prebuild script to prevent workspace dependency conflicts
# Temporarily removes workspace configuration to isolate backend dependencies

echo "📦 Preparing Heroku build environment..."

# Backup original package.json
cp package.json package.json.workspace

# Remove workspaces from root package.json and set dependencies to empty
node -e "const pkg=require('./package.json'); delete pkg.workspaces; delete pkg.overrides; pkg.dependencies = {}; pkg.devDependencies = {}; require('fs').writeFileSync('package.json', JSON.stringify(pkg, null, 2))"

# Remove root package-lock.json to prevent workspace dependency resolution
rm -f package-lock.json

echo "✅ Workspace configuration and dependencies removed from root"
echo "✅ Backend will install its own dependencies independently"
