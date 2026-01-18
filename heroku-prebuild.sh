#!/bin/bash
# Heroku prebuild script to prevent workspace dependency conflicts
# Temporarily removes workspace configuration to isolate backend dependencies

echo "📦 Preparing Heroku build environment..."

# Backup original package.json
cp package.json package.json.workspace

# Remove workspaces from root package.json
node -e "const pkg=require('./package.json'); delete pkg.workspaces; delete pkg.overrides; require('fs').writeFileSync('package.json', JSON.stringify(pkg, null, 2))"

echo "✅ Workspace configuration temporarily removed for build"
