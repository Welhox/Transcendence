#!/bin/sh

cd /var/www/html

npm install && npm run build

nginx -g "daemon off;"