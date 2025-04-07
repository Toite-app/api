#!/bin/bash

set -e

HASH_FILE="/data/credentials.hash"

hash_credentials() {
  echo -n "$MONGO_INITDB_ROOT_USERNAME:$MONGO_INITDB_ROOT_PASSWORD" | sha256sum | awk '{print $1}'
}

user_needs_update() {
  local current_hash
  current_hash=$(hash_credentials)
  if [ -f "$HASH_FILE" ]; then
    local stored_hash
    stored_hash=$(cat "$HASH_FILE")
    if [ "$current_hash" == "$stored_hash" ]; then
      return 1 # No update needed
    fi
  fi
  return 0 # Update needed
}

shutdown_mongo() {
  echo "SHUTTING DOWN MONGO"
  mongosh --port $MONGO_REPLICA_PORT --eval "db.adminCommand({ shutdown: 1 })"

  wait $MONGO_PID
}

start_mongo_no_auth() {
  mongod --port $MONGO_REPLICA_PORT --replSet rs0 --bind_ip 0.0.0.0 &
  MONGO_PID=$!
  echo "REPLICA SET ONLINE WITHOUT AUTHENTICATION"

  until mongosh --port $MONGO_REPLICA_PORT --eval "print(\"waited for connection\")" > /dev/null 2>&1
  do
      sleep 2
  done
}

start_mongo_with_auth() {
  mongod --port $MONGO_REPLICA_PORT --replSet rs0 --bind_ip 0.0.0.0 --auth --keyFile /data/keyfile &
  MONGO_PID=$!
  echo "REPLICA SET ONLINE WITH AUTHENTICATION"

  until mongosh --port $MONGO_REPLICA_PORT -u "$MONGO_INITDB_ROOT_USERNAME" -p "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase "admin" --eval "print(\"waited for connection\")" > /dev/null 2>&1
  do
      sleep 2
  done
}

create_user_from_env() {
  echo "Creating new user from environment variables..."
  mongosh --port $MONGO_REPLICA_PORT --eval "db.getSiblingDB('admin').createUser({user: '$MONGO_INITDB_ROOT_USERNAME', pwd: '$MONGO_INITDB_ROOT_PASSWORD', roles: ['root'], passwordDigestor: 'server'})"

  hash_credentials > "$HASH_FILE"
}

delete_all_users() {
  echo "Deleting all users from the admin database..."
  mongosh --port $MONGO_REPLICA_PORT --eval "
    db.getSiblingDB('admin').dropAllUsers();
  "
}

init_replica_set() {
  echo "Initializing replica set..."
  mongosh --port $MONGO_REPLICA_PORT --eval "rs.initiate({ _id: 'rs0', members: [{ _id: 0, host: '$MONGO_REPLICA_HOST:$MONGO_REPLICA_PORT' }] })"
  sleep 5
}

if [ ! -d "/data/db/diagnostic.data" ]; then
  echo "First time setup..."

  start_mongo_no_auth
  init_replica_set
  
  if user_needs_update; then
    echo "Creating or updating root user..."
    create_user_from_env
  else
    echo "User credentials have not changed."
  fi

  sleep 5

  echo "Shutting down MongoDB after initial setup..."
  shutdown_mongo
else
  echo "Replica set already initialized."

  if user_needs_update; then
    start_mongo_no_auth

    delete_all_users
    create_user_from_env

    sleep 5

    shutdown_mongo
  else
    echo "User credentials have not changed."
  fi
fi

start_mongo_with_auth

echo "EVERYTHING IS READY"

# Keep the container running
tail -f /dev/null & wait