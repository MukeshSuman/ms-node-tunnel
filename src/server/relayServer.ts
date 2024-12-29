// relayServer.ts
import http from 'http';
import WebSocket, { WebSocketServer } from 'ws';
import httpProxy from 'http-proxy';
import { CONSTANTS } from '../constants';



// Store client connections with a unique ID
const clients: Map<number, WebSocket> = new Map();

// Create an HTTP server
const server = http.createServer();

// Create a WebSocket server
const wss = new WebSocketServer({ server });

// Handle WebSocket connections
wss.on('connection', (ws: WebSocket) => {
    console.log('Client connected');

    // Generate a unique ID for the client
    const clientId = Date.now();
    clients.set(clientId, ws);

    // Handle incoming messages from clients
    ws.on('message', (message: string) => {
        console.log(`Message from client ${clientId}: ${message}`);
    });

    // Handle client disconnection
    ws.on('close', () => {
        console.log(`Client ${clientId} disconnected`);
        clients.delete(clientId);
    });
});

// Handle HTTP requests with a proxy
const proxy = httpProxy.createProxyServer();
server.on('request', (req, res) => {
    // Forward to a target (e.g., a local server running on 3000)
    const targetUrl = 'http://localhost:3000';
    proxy.web(req, res, { target: targetUrl }, (err) => {
        console.error('Proxy error:', err);
        res.writeHead(500);
        res.end('Internal Server Error');
    });
});

// Start the server
const PORT = CONSTANTS.RELAY_SERVER_PORT;
server.listen(PORT, () => {
    console.log(`Relay server running on port ${PORT}`);
});
