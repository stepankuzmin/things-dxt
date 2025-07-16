#!/bin/bash

# Things DXT Setup Script
# This script helps set up the Things Desktop Extension for Claude Desktop

set -e

echo "🔧 Things DXT Setup"
echo "==================="

# Check if we're on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "❌ Error: This extension only works on macOS"
    exit 1
fi

# Check if Things 3 is installed
if ! osascript -e 'tell application "System Events" to exists application process "Things3"' 2>/dev/null; then
    if ! ls /Applications/Things3.app 2>/dev/null; then
        echo "⚠️  Warning: Things 3 not found in /Applications/"
        echo "   Please ensure Things 3 is installed before using this extension"
    fi
fi

# Check Node.js version
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed"
    echo "   Please install Node.js 18.0.0 or higher"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2)
REQUIRED_VERSION="18.0.0"

if ! node -e "process.exit(process.version.slice(1).split('.').map(Number).some((v,i) => v > [18,0,0][i]) || process.version.slice(1).split('.').map(Number).every((v,i) => v >= [18,0,0][i]) ? 0 : 1)"; then
    echo "❌ Error: Node.js version $NODE_VERSION is too old"
    echo "   Please install Node.js 18.0.0 or higher"
    exit 1
fi

echo "✅ Node.js version $NODE_VERSION is compatible"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Error: Failed to install dependencies"
    exit 1
fi

# Test Things 3 AppleScript access
echo "🔍 Testing Things 3 access..."
if osascript -e 'tell application "Things3" to get version' 2>/dev/null; then
    echo "✅ Things 3 is accessible via AppleScript"
else
    echo "⚠️  Warning: Cannot access Things 3 via AppleScript"
    echo "   Things 3 may not be running or AppleScript access may be restricted"
    echo "   Try launching Things 3 and running this test again"
fi

# Check for required permissions
echo "🔐 Checking system permissions..."
echo "   If prompted, please grant permission for AppleScript automation"

# Test a simple AppleScript command
if osascript -e 'tell application "System Events" to get name of processes' >/dev/null 2>&1; then
    echo "✅ System Events access granted"
else
    echo "⚠️  System Events access may be restricted"
    echo "   Go to System Preferences > Security & Privacy > Privacy > Automation"
    echo "   Ensure your terminal app has permission to control System Events"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Package the extension: dxt pack ."
echo "2. Install in Claude Desktop following DXT installation guide"
echo "3. Ensure Things 3 is running when using the extension"
echo ""
echo "For help, see README.md or run: npm start (for development testing)"