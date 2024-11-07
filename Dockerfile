# Stage 1: Builder stage
FROM node:20-bookworm AS build-stage

# Install OS packages needed for building Theia.
RUN apt-get update && \
    export DEBIAN_FRONTEND=noninteractive && \
    apt-get -y install --no-install-recommends \
        libsecret-1-dev \
        libxkbfile-dev \
        make \
        python3 \
        build-essential

# Set the working directory
WORKDIR /home/crossmodel

# Copy the current directory contents to the container
COPY . .

# Run the build commands.
# - Download plugins and build application
# - Use yarn autoclean to remove unnecessary files from package dependencies
# - Remove unnecesarry files for the browser application
RUN yarn --pure-lockfile --skip-integrity-check --network-timeout 100000 && \
    yarn build:packages && \
    yarn build:extensions && \
    yarn theia:browser build && \
    yarn autoclean --init && \
    echo *.ts >> .yarnclean && \
    echo *.ts.map >> .yarnclean && \
    echo *.spec.* >> .yarnclean && \
    yarn autoclean --force && \
    yarn cache clean && \
    rm -rf .devcontainer .git .github .vscode applications/electron-app docs e2e-tests examples

# Stage 2: Production stage, using a slim image
FROM node:20-bookworm-slim AS production-stage

# Create a non-root user with a fixed user id and setup the environment
# Default workspace is located at /home/project
RUN adduser --system --group --home /home/crossmodel crossmodel && \
    chmod g+rw /home && \
    mkdir -p /home/project && \
    chown -R crossmodel:crossmodel /home/crossmodel

# Install required tools for application: Git, SSH, Bash
# Node is already available in base image
RUN apt-get update && \
    apt-get install -y \
        git \
        openssh-client \
        openssh-server \
        bash \
        libsecret-1-0 && \
    apt-get clean

# Copy the mapping example workspace into the project folder.
COPY examples/mapping-example /home/project

# Set the permission of the project folder.
RUN chown -R crossmodel:crossmodel /home/project

ENV HOME=/home/crossmodel
WORKDIR /home/crossmodel

# Copy the build output to the production environment
COPY --from=build-stage --chown=crossmodel:crossmodel /home/crossmodel /home/crossmodel

# Expose the default CrossModel port
EXPOSE 3000

# Specify default shell for Theia and the Built-In plugins directory
# Use installed git instead of dugite
ENV SHELL=/bin/bash \
    THEIA_DEFAULT_PLUGINS=local-dir:/home/theia/plugins \
    USE_LOCAL_GIT=true

# Use the non-root user
USER crossmodel

# Set the working directory to the browser application
WORKDIR /home/crossmodel/applications/browser-app

# Start the application
ENTRYPOINT ["node", "/home/crossmodel/applications/browser-app/lib/backend/main.js"]

# Arguments passed to the application
CMD [ "/home/project", "--hostname=0.0.0.0"]