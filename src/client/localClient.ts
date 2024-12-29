// localClient.ts
import WebSocket from 'ws';
import http from 'http';
import { CONSTANTS } from '../constants';

// WebSocket connection to the relay server
const relayServerUrl = CONSTANTS.RELAY_SERVER_URL  // 'ws://your-vps-domain-or-ip:8080';
console.log(`Connecting to relay server at ${relayServerUrl}`);
const ws = new WebSocket(relayServerUrl);

// Start a local HTTP server
const localServer = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Hello from the local server!');
});

const PORT = CONSTANTS.LOCAL_SERVER_PORT;

localServer.listen(PORT, () => {
    console.log(`Local server running on port ${PORT}`);
});

// Handle WebSocket connection
ws.on('open', () => {
    console.log('Connected to relay server');
    ws.send('Hello from the local client!');
});

// Handle messages from the relay server
ws.on('message', (message: string) => {
    console.log(`Message from relay server: ${message}`);
});

// Handle connection errors
ws.on('error', (err) => {
    console.error('WebSocket error:', err);
});
