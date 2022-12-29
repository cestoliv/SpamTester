FROM node:alpine

# Install dependencies
RUN apk add --no-cache spamassassin

WORKDIR /spamtester
COPY package.json package.json
COPY package-lock.json package-lock.json

RUN npm install --omit=dev

COPY server.js server.js
COPY services ./services

# Create startup script
RUN echo '#!/bin/sh' > start.sh
RUN echo 'spamd &' >> start.sh
RUN echo 'npm run start' >> start.sh

# Configure spamassassin
RUN sa-update

EXPOSE 3060
CMD [ "sh", "start.sh" ]
