# Deploying Clawdbot (Vercel + VPS)

To deploy this entire Customer Support Intelligence system, you must split it into two parts because **Vercel is serverless** and cannot run a continuous background browser process like Playwright (WhatsApp Web).

## 1. Deploy the Next.js App to Vercel
Deploy your `openclaw` Next.js frontend to Vercel as usual.
Once deployed, you will get a production URL. Example: `https://your-openclaw-app.vercel.app`.

## 2. Deploy Clawdbot to a Virtual Private Server (VPS)
You need a small server that can run Docker continuously. Cheap options include:
- DigitalOcean Droplet ($5/mo)
- Hetzner ($4/mo)
- AWS EC2 Micro (Free tier)
- Render (Background worker)

### Steps to Deploy Clawdbot via Docker:

1. **Install Docker** on your VPS.
2. **Copy the `clawdbot` directory** to your server.
3. Open the `docker-compose.yml` file and change `SERVER_URL` to your Vercel URL:
   ```yaml
   environment:
     - SERVER_URL=https://your-openclaw-app.vercel.app
   ```
4. **Run the container in the background**:
   ```bash
   cd clawdbot
   docker-compose up -d
   ```
5. **Initial Login (QR Code)**:
   The first time the container starts, it needs you to scan the WhatsApp QR code. To see the QR code, check the container logs:
   ```bash
   docker logs -f clawdbot-agent
   ```
   *(Note: Because it runs headless inside Docker, you might need to temporarily map a port or use a tool like `wwebjs` to extract the QR code as a terminal string. Alternatively, run it locally once to generate the `.wa-session` folder, then copy that folder to your server before running docker-compose.)*

### Best Practice for Initial WhatsApp Web Login

Since Playwright runs a real Chromium browser, the easiest way to solve the QR code problem for a remote VPS Docker container is:
1. Run `node agent.js` locally on your Mac.
2. Scan the QR code with your phone. 
3. This creates a hidden folder: `clawdbot/.wa-session` containing the login tokens.
4. Stop the local agent.
5. Create a `wa-session-data` folder next to your `docker-compose.yml` on the server.
6. Copy the contents of your local `.wa-session` into the server's `wa-session-data` folder.
7. Run `docker-compose up -d`. The container will boot up already logged in!
