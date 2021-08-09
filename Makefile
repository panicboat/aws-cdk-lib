build:
	docker compose build
	docker compose run aws-cdk bash -c 'npm install'

bash:
	docker compose run aws-cdk bash

clean:
	docker compose down
	docker system prune -a -f --volumes
