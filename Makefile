build:
	docker compose build
	docker compose run app bash -c 'yarn install'

clean:
	rm -rf node_modules package-lock.json
	docker compose down
	docker system prune -a -f --volumes
