#!/bin/sh

cd /var/www/html

rm -r dist

npm install && npm run build

nginx -g "daemon off;"