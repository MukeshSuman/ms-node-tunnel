// client.ts
import WebSocket from 'ws';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

interface TunnelConfig {
  subdomain: string;
  localPort: number;
  serverHost: string;
}

class TunnelClient {
  private ws: WebSocket | null = null;
  private config: TunnelConfig;

  constructor(config: TunnelConfig) {
    this.config = config;
  }

  async connect() {
    try {
      // Register with tunnel server
      const response = await axios.post(`http://${this.config.serverHost}/register`, {
        subdomain: this.config.subdomain,
        targetUrl: `http://localhost:${this.config.localPort}`
      });

      // Connect via WebSocket
      this.ws = new WebSocket(response.data.connectUrl);

      this.ws.on('open', () => {
        console.log(`Tunnel established at: http://${this.config.subdomain}.${this.config.serverHost}`);
      });

      this.ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });

      this.ws.on('close', () => {
        console.log('Tunnel closed, attempting to reconnect...');
        setTimeout(() => this.connect(), 5000);
      });

    } catch (error) {
      console.error('Failed to establish tunnel:', error);
      setTimeout(() => this.connect(), 5000);
    }
  }
}

// Usage example
const client = new TunnelClient({
  subdomain: 'myapp', // Your desired subdomain
  localPort: 3000,    // Your local application port
  serverHost: process.env.SERVER_HOST || 'localhost:3001'
});

client.connect();