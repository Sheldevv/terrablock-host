# This image runs the existing LÖVE server under Xvfb-less headless mode.
# Validate that your LÖVE package supports headless operation on your target host.
FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y --no-install-recommends \
    love xvfb xauth ca-certificates nodejs npm \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json ./
COPY bridge ./bridge
COPY game ./game

EXPOSE 22120/tcp
CMD ["npm", "start"]
