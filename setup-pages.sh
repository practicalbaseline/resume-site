#!/usr/bin/env bash
# Run once: bash setup-pages.sh
set -euo pipefail

REPO="practicalbaseline/resume-site"

if ! command -v gh >/dev/null; then
  echo "Install GitHub CLI: brew install gh"
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "Log in first:"
  gh auth login
fi

VISIBILITY=$(gh repo view "$REPO" --json visibility -q .visibility)
echo "Current visibility: $VISIBILITY"

if [ "$VISIBILITY" != "PUBLIC" ]; then
  echo "Making repo public (required for free GitHub Pages)..."
  gh repo edit "$REPO" --visibility public --accept-visibility-change-consequences
fi

echo ""
echo "Done. Now in your browser:"
echo "  https://github.com/$REPO/settings/pages"
echo ""
echo "  1. Source: Deploy from a branch"
echo "  2. Branch: main  /  folder: / (root)"
echo "  3. Custom domain: www.itsjakegray.com"
echo "  4. Enable Enforce HTTPS (after DNS check)"
echo ""
echo "Cloudflare DNS — delete www A records, add:"
echo "  CNAME  www  →  practicalbaseline.github.io  (DNS only / grey cloud)"