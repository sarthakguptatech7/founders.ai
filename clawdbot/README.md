# Clawdbot — WhatsApp Automation Agent

Local agent that runs on your device to automate WhatsApp Web messaging.

## Quick Start

```bash
# 1. Install dependencies
cd clawdbot
npm install

# 2. Install Chromium browser for Playwright
npm run install-browser

# 3. Start the agent
node agent.js
```

## What Happens

1. Agent registers with your OpenClaw server
2. Chromium browser opens → navigates to WhatsApp Web
3. First time: scan QR code with your phone
4. Agent connects to server via SSE stream
5. When you trigger a campaign from the dashboard, the agent receives tasks and sends messages automatically

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SERVER_URL` | `http://localhost:3000` | Your OpenClaw server URL |

## Session Persistence

WhatsApp session is saved in `.wa-session/` folder. After the first QR scan, subsequent runs won't ask for QR again.

## Safety Features

- Human-like typing delays (5-15s between messages)
- Configurable throttle (2-8 msgs/min)
- Only sends to opted-in contacts
- 3-attempt retry with exponential backoff
- Graceful shutdown on Ctrl+C
