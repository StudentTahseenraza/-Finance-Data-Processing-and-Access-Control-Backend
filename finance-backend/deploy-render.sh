#!/bin/bash

echo "🚀 Deploying Finance Backend to Render..."

# Check if render-cli is installed
if ! command -v render &> /dev/null; then
    echo "Installing Render CLI..."
    npm install -g @render/cli
fi

# Login to Render (will prompt for API key)
render login

# Deploy using render.yaml
render deploy --config render.yaml

echo "✅ Deployment initiated!"
echo "📊 Check deployment status: https://dashboard.render.com"