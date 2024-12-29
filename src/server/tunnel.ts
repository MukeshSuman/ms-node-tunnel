import express, { Response } from 'express';
import { createServer } from 'http';
import { Server as WebSocketServer } from 'ws';
import { createProxyMiddleware } from 'http-proxy-middleware';
import dotenv from 'dotenv';
import { TunnelInfo } from './types';
import { CONSTANTS } from '../constants';

dotenv.config();

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

const tunnels = new Map<string, TunnelInfo>();

// Enable CORS for development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', tunnels: tunnels.size });
});

// Client registration endpoint
app.post('/register', (req:any, res:any) => {
  const { subdomain, targetUrl } = req.body;
  
  if (tunnels.has(subdomain)) {
    return res.status(400).json({ error: 'Subdomain already in use' });
  }

  tunnels.set(subdomain, { subdomain, targetUrl });
  res.json({ 
    message: 'Registered successfully', 
    connectUrl: `ws://${process.env.SERVER_HOST}/connect/${subdomain}` 
  });
});

// WebSocket connection handler
wss.on('connection', (ws: any, req) => {
  const subdomain = req.url?.split('/connect/')[1];
  
  if (!subdomain || !tunnels.has(subdomain)) {
    ws.close();
    return;
  }

  console.log(`Client connected for subdomain: ${subdomain}`);
  
  const tunnelInfo:TunnelInfo = tunnels.get(subdomain)!;
  tunnelInfo.clientWs = ws;

  ws.on('close', () => {
    console.log(`Client disconnected for subdomain: ${subdomain}`);
    if (tunnels.has(subdomain)) {
      const info = tunnels.get(subdomain)!;
      info.clientWs = undefined;
    }
  });
});

// Proxy middleware for handling tunnel requests
app.use('/', (req: any, res: any, next) => {
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
    changeOrigin: true,
    // onError: (err:any, req:any, res:any) => {
    //   console.error('Proxy error:', err);
    //   res.writeHead(502, { 'Content-Type': 'text/plain' });
    //   res.end('Proxy error: Unable to connect to local service');
    // }
  });

  return proxy(req, res, next);
});

const PORT = CONSTANTS.TUNNEL_SERVER_PORT || 3001;
server.listen(PORT, () => {
  console.log(`Tunnel server running on port ${PORT}`);
});