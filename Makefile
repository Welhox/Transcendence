COLOUR_RED=\033[0;31m
COLOUR_BLUE=\033[0;34m
COLOUR_END=\033[0m

# ------------ PROJECT -------#
name = transcendence

.DEFAULT_GOAL = all

#------------- COMMANDS ------#

all: ssl
	@docker compose -f docker-compose.yml up -d --build

# dev depends on package called concurrently; if prompted for installation, choose yes
dev:
	@npx concurrently "cd ./backend && npm install && npm run start" "cd ./frontend/react && npm install && npm run dev"

restart-front:
	@docker exec -it frontend pkill -f node || true
	@docker exec -it frontend sh -c "cd /var/www/html && npm run build"

# env:
# 	./make_env.sh

ssl:
	@if [ ! -f "./frontend/nginx/ssl/transcendence.crt" ] || [ ! -f "./frontend/nginx/ssl/transcendence.key" ]; then \
		echo "Generating self-signed SSL certificate..."; \
		openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
			-keyout "./frontend/nginx/ssl/transcendence.key" \
			-out "./frontend/nginx/ssl/transcendence.crt" \
			-subj "/CN=pong"; \
	fi
	
down:
	@docker compose -f docker-compose.yml down

fclean: down
	@printf "Clean of all docker configs\n"
	@docker system prune --all
	@rm -rf ./frontend/srcs/react/dist

re: fclean all

.PHONY: all down ssl dev re restart-front up



