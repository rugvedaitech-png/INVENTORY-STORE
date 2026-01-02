#!/bin/bash

# Script to safely fix npm vulnerabilities
# This runs audit fix without --force to avoid breaking changes

set -e

echo "🔍 Checking npm vulnerabilities..."
npm audit

echo ""
echo "🔧 Attempting to fix vulnerabilities (safe mode)..."
npm audit fix

echo ""
echo "📊 Remaining vulnerabilities:"
npm audit

echo ""
echo "✅ If vulnerabilities remain, review them with: npm audit"
echo "⚠️  Do NOT run 'npm audit fix --force' without reviewing breaking changes"

