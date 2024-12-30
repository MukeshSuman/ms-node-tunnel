// tunnel-server.ts
import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

const PORT = process.env.PORT || 3001;
let tunnelSocket: Socket | null = null;

// Store active tunnel connection
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    tunnelSocket = socket;

    socket.on('disconnect', () => {
        if (tunnelSocket === socket) {
            tunnelSocket = null;
        }
        console.log('Client disconnected:', socket.id);
    });
});

// Proxy all requests to the tunnel client
app.use('/', (req, res, next) => {
    if (!tunnelSocket) {
        return res.status(503).send('Tunnel client not connected');
    }
    next();
}, createProxyMiddleware({
    target: 'http://localhost:3000',
    ws: true,
    router: () => 'http://localhost:3000',
    // onProxyReq: (proxyReq, req, res) => {
    //     // You can add custom headers here if needed
    // },
}));

httpServer.listen(PORT, () => {
    console.log(`Tunnel server running on port ${PORT}`);
});

