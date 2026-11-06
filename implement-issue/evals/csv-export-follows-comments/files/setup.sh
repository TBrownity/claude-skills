#!/usr/bin/env bash
# Turns the copied fixture into a git repository whose `origin` is a local bare
# repository standing in for GitHub. Run it once in the folder that holds repo/.
# The commits are listed in `history`: one line per commit, "<message>|<paths>",
# where the paths "*" mean everything not committed yet.
set -eu
cd "$(dirname "$0")"
git init -q --bare -b main origin.git
mkdir -p outputs
touch linear/actions.log
cd repo
git init -q -b main
git config user.name "Dev Example"
git config user.email "dev@example.com"
git config push.negotiate false
while IFS='|' read -r message paths; do
  [ -z "$message" ] && continue
  if [ "$paths" = "*" ]; then git add -A; else git add $paths; fi
  git commit -q -m "$message"
done < ../history
git remote add origin ../origin.git
git push -q -u origin main
git remote set-head origin main >/dev/null
