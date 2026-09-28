#!/bin/bash
# Vercel Preview Helper Script
# Usage: ./scripts/vercel-preview.sh

set -e

echo "🚀 Setting up Vercel preview for stellar-hooks..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Navigate to the try-online example
cd examples/try-online

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm ci
fi

# Build the app
echo "🔨 Building application..."
npm run build

# Deploy to Vercel
echo "🌐 Deploying to Vercel..."
vercel --prod --yes

echo "✅ Preview deployment complete!"
echo "🔗 Preview URL: $(vercel ls --prod)"
