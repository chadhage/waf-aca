FROM node:22-bookworm-slim AS build
WORKDIR /src
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build && npm prune --omit=dev

FROM mcr.microsoft.com/azure-functions/node:4-node22
ENV AzureWebJobsScriptRoot=/home/site/wwwroot \
    AzureFunctionsJobHost__Logging__Console__IsEnabled=true
COPY --from=build /src/package.json /home/site/wwwroot/package.json
COPY --from=build /src/node_modules /home/site/wwwroot/node_modules
COPY --from=build /src/dist /home/site/wwwroot/dist
COPY host.json /home/site/wwwroot/host.json
USER 1000