#!/usr/bin/env bash
touch /tmp/build-lock
rm -fr public/locales
rm package-lock.json
git pull
npm run build
pm2 restart all
rm /tmp/build-lock