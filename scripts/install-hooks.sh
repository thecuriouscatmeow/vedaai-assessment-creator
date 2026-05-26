#!/usr/bin/env bash
# Installs (or refreshes) the git hooks for this repo.
# Safe to re-run on every fresh clone.

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
HOOKS_SRC="$REPO_ROOT/scripts/hooks"
HOOKS_DEST="$REPO_ROOT/.git/hooks"

install_hook() {
  local name="$1"
  local src="$HOOKS_SRC/$name"
  local dest="$HOOKS_DEST/$name"

  if [[ ! -f "$src" ]]; then
    echo "  ✗ source not found: $src"
    return 1
  fi

  # Remove stale file/symlink before re-linking
  rm -f "$dest"
  ln -s "$src" "$dest"
  echo "  ✓ $name → $dest"
}

echo "Installing git hooks..."
install_hook "post-commit" || exit 1
echo "Done. Run: npm i -g @coderabbit/coderabbit-cli (once per machine) to enable reviews."
