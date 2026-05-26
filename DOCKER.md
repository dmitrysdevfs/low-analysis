Docker Setup

Requirements
-------------
Before starting, make sure the following are installed:

- Docker
- Docker Compose

Check installation:

docker --version
docker compose version


Build Containers
----------------
Initial build or regular rebuild:

docker compose build


Run Project
-----------
Start all services:

docker compose up

Run in background mode:

docker compose up -d


Rebuild After Adding New Node.js Modules
----------------------------------------
If package.json or package-lock.json was changed:

docker compose build --no-cache

Then restart containers:

docker compose up -d


Stop Containers
---------------
docker compose down


View Logs
---------
All services:

docker compose logs -f

Specific service:

docker compose logs -f frontend


Useful Commands
---------------
Restart services:

docker compose restart

Show running containers:

docker ps

Remove unused Docker resources:

docker system prune -f


Common Issues
-------------
Changes are not applied:

docker compose down
docker compose build --no-cache
docker compose up

Port is already in use:

sudo lsof -i :3000

Or change the port in docker-compose.yml.


Startup Flow
------------
1. Build containers
2. Start services
3. Work with the project
4. Rebuild after dependency changes
