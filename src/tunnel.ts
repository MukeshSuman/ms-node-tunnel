// tunnel.ts
import express from 'express';
import { createServer } from 'http';
import { Server as WebSocketServer } from 'ws';
import { createProxyMiddleware } from 'http-proxy-middleware';
import dotenv from 'dotenv';
import { CONSTANTS } from './constants';

dotenv.config();

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

interface TunnelInfo {
  subdomain: string;
  targetUrl: string;
  clientWs?: WebSocket;
}

const tunnels = new Map<string, TunnelInfo>();

// Client registration endpoint
app.post('/register', express.json(), (req:any, res:any) => {
  const { subdomain, targetUrl } = req.body;
  
  if (tunnels.has(subdomain)) {
    return res.status(400).json({ error: 'Subdomain already in use' });
  }

  tunnels.set(subdomain, { subdomain, targetUrl });
  res.json({ message: 'Registered successfully', connectUrl: `ws://${process.env.SERVER_HOST}/connect/${subdomain}` });
});

// WebSocket connection handler
wss.on('connection', (ws, req) => {
  const subdomain = req.url?.split('/connect/')[1];
  
  if (!subdomain || !tunnels.has(subdomain)) {
    ws.close();
    return;
  }

  const tunnelInfo:any = tunnels.get(subdomain)!;
  tunnelInfo.clientWs = ws;

  ws.on('close', () => {
    if (tunnels.has(subdomain)) {
      const info = tunnels.get(subdomain)!;
      info.clientWs = undefined;
    }
  });
});

// Proxy middleware for handling tunnel requests
app.use('/', (req:any, res:any, next) => {
  const host = req.headers.host;
  const subdomain = host?.split('.')[0];

  if (!subdomain || !tunnels.has(subdomain)) {
    return res.status(404).send('Tunnel not found');
  }

  const tunnel = tunnels.get(subdomain)!;
  
  if (!tunnel.clientWs) {
    return res.status(503).send('Tunnel client not connected');
  }

  const proxy = createProxyMiddleware({
    target: tunnel.targetUrl,
    ws: true,
    changeOrigin: true
  });

  return proxy(req, res, next);
});

const PORT = CONSTANTS.TUNNEL_SERVER_PORT || 3001;
server.listen(PORT, () => {
  console.log(`Tunnel server running on port ${PORT}`);
});