import express from 'express';
import { createServer } from 'http';
import { Server as WebSocketServer } from 'ws';
import { createProxyMiddleware, debugProxyErrorsPlugin, loggerPlugin, errorResponsePlugin, proxyEventsPlugin } from 'http-proxy-middleware';
// debugProxyErrorsPlugin, // subscribe to proxy errors to prevent server from crashing
//   loggerPlugin, // log proxy events to a logger (ie. console)
//   errorResponsePlugin, // return 5xx response on proxy error
//   proxyEventsPlugin, // implements the "on:" option

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

const getAllTunnels = () => {
  return Array.from(tunnels.values());
};

const closeTunnel = (subdomain: string) => {
  if (tunnels.has(subdomain)) {
    tunnels.delete(subdomain);
  }
};

const closeAllTunnels = () => {
  tunnels.clear();
};

const getSelectObjectKeysFromMap = (map: Map<string, any>, keys: string[]) => {
  return Array.from(map).map(([key, value]) => {
    return {
      key,
      ...keys.reduce((acc:any, k) => {
        acc[k] = value[k];
        return acc;
      }, {})
    };
  });
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', tunnelsSize: tunnels.size, tunnels: getSelectObjectKeysFromMap(tunnels, ['subdomain', 'targetUrl']) });
});

app.get('/remove-tunnels', (req, res) => {
  closeAllTunnels();
  res.json({ status: 'removed'});
});

// Client registration endpoint
app.post('/register', (req:any, res:any) => {
  const { subdomain, targetUrl } = req.body;
  
  if (tunnels.has(subdomain)) {
    return res.status(400).json({ error: 'Subdomain already in use' });
  }

  tunnels.set(subdomain, { subdomain, targetUrl });
  
  // Generate WebSocket URL using the tunnel subdomain
  const wsProtocol = process.env.NODE_ENV === 'production' ? 'wss' : 'ws';
  const connectUrl = `${wsProtocol}://${CONSTANTS.TUNNEL_DOMAIN}/connect/${subdomain}`;
  
  res.json({ 
    message: 'Registered successfully',
    connectUrl,
    publicUrl: `https://${subdomain}.${CONSTANTS.PUBLIC_DOMAIN}`
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

// Main proxy handler
app.use('/', async (req, res, next) => {
  const host = req.headers.host;
  console.log('Host:', host);
  
  // Skip if this is the tunnel domain itself
  // if (host === CONSTANTS.TUNNEL_DOMAIN) {
  //   return next();
  // }
  
  // Extract subdomain from the public domain
  const subdomain = host?.replace(`.${CONSTANTS.PUBLIC_DOMAIN}`, '').split(':')[0];
  console.log('Subdomain:', subdomain);

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
    logger: console,
    plugins: [debugProxyErrorsPlugin, loggerPlugin, errorResponsePlugin, proxyEventsPlugin],
    // onError: (err, req, res) => {
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
  console.log(`Tunnel service available at: ${CONSTANTS.TUNNEL_DOMAIN}`);
});