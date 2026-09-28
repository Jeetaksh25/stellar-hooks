#!/usr/bin/env pwsh
# Vercel Preview Helper Script (Windows)
# Usage: .\scripts\vercel-preview.ps1

Set-StrictMode -Version 3

Write-Host "🚀 Setting up Vercel preview for stellar-hooks..." -ForegroundColor Cyan

# Check if Vercel CLI is installed
if (-not (Get-Command "vercel" -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Vercel CLI not found. Installing..." -ForegroundColor Yellow
    npm install -g vercel
}

# Navigate to the try-online example
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$exampleDir = Join-Path $scriptDir ".." "examples" "try-online"
Push-Location $exampleDir

try {
    # Install dependencies if needed
    if (-not (Test-Path "node_modules")) {
        Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
        npm ci
    }

    # Build the app
    Write-Host "🔨 Building application..." -ForegroundColor Yellow
    npm run build

    # Deploy to Vercel
    Write-Host "🌐 Deploying to Vercel..." -ForegroundColor Yellow
    vercel --prod --yes
}
finally {
    Pop-Location
}

Write-Host "✅ Preview deployment complete!" -ForegroundColor Green
Write-Host "🔗 Preview URL: " -NoNewline
vercel ls --prod
