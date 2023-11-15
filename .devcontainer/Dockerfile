# We use the Node-16 on Debian Bullseye.
ARG VARIANT="16-bullseye"
FROM mcr.microsoft.com/devcontainers/typescript-node:0-${VARIANT}
#FROM mcr.microsoft.com/playwright:v1.37.1-jammy

# Install OS packages needed for building Theia.
RUN apt-get update \
    && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends \
    libsecret-1-dev \
    libxkbfile-dev