 #!/bin/bash
 
 # Load configuration from .env file
 set -o allexport
 source utils/seed/.env
 set +o allexport
 
 # Container name
 CONTAINER_NAME="${POSTGRES_CONTAINER_NAME:-postgres_db}"
 
 # Check if container exists and remove it
 if docker ps -aq -f "name=${CONTAINER_NAME}" | grep -q .; then
  echo "Stopping and removing existing container: ${CONTAINER_NAME}"
  docker stop "${CONTAINER_NAME}" >/dev/null 2>&1
  docker rm "${CONTAINER_NAME}" >/dev/null 2>&1
  echo "Existing container removed."
 else
  echo "No existing container found with name: ${CONTAINER_NAME}"
 fi
 
 # Run the new container
 echo "Starting new container: ${CONTAINER_NAME}"
 docker run -d \
  --name="${CONTAINER_NAME}" \
  -p "${POSTGRES_PORT:-5432}:5432" \
  -e POSTGRES_USER="${POSTGRES_USER:-postgres}" \
  -e POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-password}" \
  -e POSTGRES_DB="${POSTGRES_DB:-mydatabase}" \
  "${POSTGRES_IMAGE:-postgres:latest}"
 
 echo "Container ${CONTAINER_NAME} started in background. Waiting for it to be ready..."
 
 # Wait for the container to be ready
 timeout 60 sh -c '
  until pg_isready -h localhost -p "${POSTGRES_PORT:-5432}" -U "${POSTGRES_USER:-postgres}"; do
  echo "Waiting for PostgreSQL to be ready..."
  sleep 2
  done
 '
 
 if [ $? -eq 0 ]; then
  echo "PostgreSQL is ready to accept connections."
 else
  echo "Timed out waiting for PostgreSQL to be ready."
  exit 1
 fi
 
 echo "Container ${CONTAINER_NAME} started successfully and is ready."
