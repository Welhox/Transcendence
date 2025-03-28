
FROM alpine:3.20

RUN apk update && apk upgrade && apk add --no-cache nginx npm

RUN mkdir ssl

COPY ./frontend/nginx/nginx.conf /etc/nginx/nginx.conf
COPY ./frontend/nginx/ssl/transcendence.crt /ssl/transcendence.crt
COPY ./frontend/nginx/ssl/transcendence.key /ssl/transcendence.key

EXPOSE 8443
CMD ["nginx", "-g", "daemon off;"]
