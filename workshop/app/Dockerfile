FROM node:24-alpine

WORKDIR /app
COPY --chown=node:node server.js ./server.js

USER node
EXPOSE 8080
HEALTHCHECK --interval=10s --timeout=3s --retries=3 CMD wget -qO- http://127.0.0.1:8080/health/live || exit 1

CMD ["node", "server.js"]