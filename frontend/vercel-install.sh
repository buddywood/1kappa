#!/bin/bash
# Temporarily remove workspaces from root package.json to prevent dependency conflicts
cd ..
node -e "const pkg=require('./package.json'); delete pkg.workspaces; require('fs').writeFileSync('package.json.tmp', JSON.stringify(pkg, null, 2))"
mv package.json package.json.workspace
mv package.json.tmp package.json
cd frontend
npm install --legacy-peer-deps
cd ..
mv package.json.workspace package.json
