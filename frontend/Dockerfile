
FROM alpine:3.20

RUN apk update && apk upgrade && apk add --no-cache nginx npm curl

RUN mkdir ssl

COPY ./frontend/nginx/nginx.conf /etc/nginx/nginx.conf
COPY ./frontend/nginx/ssl/transcendence.crt /ssl/transcendence.crt
COPY ./frontend/nginx/ssl/transcendence.key /ssl/transcendence.key
COPY ./frontend/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 8443

ENTRYPOINT [ "/entrypoint.sh" ]
