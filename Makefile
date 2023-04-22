build:
	docker compose run --rm app bash -c 'yarn install'

clean:
	rm -rf node_modules yarn.lock
	docker compose down
	docker system prune -a -f --volumes
