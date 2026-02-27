FROM mcr.microsoft.com/playwright:v1.58.2-jammy

# Internal environment variables
ENV NODE_ENV=production
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
ENV SERVER_URL=http://host.docker.internal:3000

# Set timezone (optional, helps with message timestamps)
ENV TZ=UTC

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Node.js (Playwright image comes with a specific node version, but we can ensure standard npm is available)
RUN npm ci --only=production

# Copy agent code
COPY agent.js .
COPY whatsapp.js .

# Create volume mount point for WhatsApp session data
# This is crucial so we don't have to scan the QR code every time the container restarts
RUN mkdir -p /app/.wa-session
VOLUME /app/.wa-session

# Run the agent
CMD ["node", "agent.js"]
