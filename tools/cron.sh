#!/usr/bin/env bash
exit
if test -f /tmp/build-lock; then exit; fi
echo $1 $2
cd /home/abrikos/minter-earth

case "${1}" in
"minute" )
node -r esm server/cron/cron-launch.js --minute >~/log/minute.log.txt
;;

"minute5" )
node -r esm server/cron/cron-launch.js --minute5 >~/log/minute5.log.txt
;;

"day" )
node -r esm server/cron/cron-launch.js --day>>~/log/day.log.txt
;;

"hour" )
node -r esm server/cron/cron-launch.js --hour>>~/log/hour.log.txt
#git pull >log/pull.log
#npm i
#npm run build > log/build.log
;;
esac