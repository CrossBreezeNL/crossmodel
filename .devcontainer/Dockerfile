# We use the Node-16 on Debian Bullseye.
ARG VARIANT="20-bookworm"
FROM mcr.microsoft.com/devcontainers/typescript-node:${VARIANT}

# Install OS packages needed for building Theia.
RUN apt-get update \
    && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends \
    libsecret-1-dev \
    libxkbfile-dev