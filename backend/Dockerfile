FROM node:23-bookworm-slim

# RUN apk update && apk add python3 make g++

WORKDIR /backend

COPY ./backend/backend_script.sh /backend_script.sh 

RUN chmod +x /backend_script.sh

RUN apt-get update -y && apt-get install -y openssl

# # Fix permissions
# RUN chown -R root:root /backend

# RUN chmod 777 backend/package.json

# RUN npm install

ENTRYPOINT [ "/backend_script.sh" ]