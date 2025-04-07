ARG MONGO_VERSION=6

FROM mongo:${MONGO_VERSION}

ENV MONGO_REPLICA_HOST=127.0.0.1
ENV MONGO_REPLICA_PORT=27017
ENV MONGO_COMMAND=mongosh

# Create keyFile for replica set authentication
RUN openssl rand -base64 756 > /data/keyfile && \
    chmod 400 /data/keyfile && \
    chown 999:999 /data/keyfile

# Copy the init script
COPY ./init.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/init.sh

# Set the entrypoint to our init script
ENTRYPOINT ["/usr/local/bin/init.sh"]