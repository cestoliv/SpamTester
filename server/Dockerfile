FROM node:alpine

# Install dependencies
RUN apk add --no-cache spamassassin rspamd

WORKDIR /spamtester
COPY package.json package.json
COPY package-lock.json package-lock.json

RUN npm install --omit=dev

COPY server.js server.js
COPY services ./services

# Create startup script
RUN echo '#!/bin/sh' > start.sh
RUN echo 'spamd &' >> start.sh
RUN echo 'rspamd --insecure' >> start.sh
RUN echo 'npm run start' >> start.sh

# SpamAssassin & Rspamd healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=2 \
	CMD (echo "PING SPAMC/1.2" | nc localhost 783 | grep -q PONG) || kill -s 9 -1; \
		(curl -s http://localhost:11333/ping | grep -q pong) || kill -s 9 -1

# Configure spamassassin
RUN sa-update

EXPOSE 3060
CMD [ "sh", "start.sh" ]
