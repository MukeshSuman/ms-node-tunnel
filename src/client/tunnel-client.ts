// tunnel-client.ts
import { io } from 'socket.io-client';
import { config } from 'dotenv';

config();

const SERVER_URL = process.env.SERVER_URL || 'https://tunnel.msuman.in';
const LOCAL_URL = process.env.LOCAL_URL || 'http://localhost:3000';

const socket = io(SERVER_URL, {
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: Infinity,
});

socket.on('connect', () => {
    console.log('Connected to tunnel server');
});

socket.on('disconnect', () => {
    console.log('Disconnected from tunnel server');
});

socket.on('error', (error) => {
    console.error('Socket error:', error);
});

// Keep the connection alive
setInterval(() => {
    if (socket.connected) {
        socket.emit('ping');
    }
}, 30000);