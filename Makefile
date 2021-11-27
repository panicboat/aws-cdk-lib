build:
	docker compose build
	docker compose run aws-cdk bash -c 'npm install'

bash:
	docker compose run aws-cdk bash

clean:
	rm -rf node_modules package-lock.json
	docker compose down
	docker system prune -a -f --volumes
