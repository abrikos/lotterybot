#!/usr/bin/env bash
touch /tmp/build-lock
git pull
npm run build
pm2 restart all
rm /tmp/build-lock