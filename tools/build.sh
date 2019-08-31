#!/usr/bin/env bash
touch /tmp/build-lock
cd ~/minter-earth/
git pull
npm run build
pm2 restart all
rm /tmp/build-lock