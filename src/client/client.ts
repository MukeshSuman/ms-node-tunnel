import WebSocket from 'ws';
import axios from 'axios';
import dotenv from 'dotenv';
import { TunnelConfig } from '../server/types';

dotenv.config();

class TunnelClient {
  private ws: WebSocket | null = null;
  private config: TunnelConfig;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;

  constructor(config: TunnelConfig) {
    this.config = config;
  }

  async connect() {
    try {
      console.log('Registering with tunnel server...');
      
      // Register with tunnel server
      const response = await axios.post(`http://${this.config.serverHost}/register`, {
        subdomain: this.config.subdomain,
        targetUrl: `http://localhost:${this.config.localPort}`
      });

      console.log('Registration successful, establishing WebSocket connection...');

      // Connect via WebSocket
      this.ws = new WebSocket(response.data.connectUrl);

      this.ws.on('open', () => {
        console.log(`✓ Tunnel established successfully!`);
        console.log(`✓ Your local app is now available at: http://${this.config.subdomain}.${this.config.serverHost}`);
        this.reconnectAttempts = 0;
      });

      this.ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });

      this.ws.on('close', () => {
        console.log('Tunnel closed, attempting to reconnect...');
        this.reconnect();
      });

    } catch (error) {
      console.error('Failed to establish tunnel:', error);
      this.reconnect();
    }
  }

  private reconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached. Please check your configuration and try again.');
      process.exit(1);
    }

    this.reconnectAttempts++;
    console.log(`Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
    
    setTimeout(() => this.connect(), 5000);
  }
}

// Get configuration from environment variables or use defaults
const config: TunnelConfig = {
  subdomain: process.env.TUNNEL_SUBDOMAIN || 'myapp',
  localPort: parseInt(process.env.LOCAL_PORT || '3000'),
  serverHost: process.env.SERVER_HOST || 'localhost:3001'
};

console.log('Starting tunnel client with configuration:', config);
const client = new TunnelClient(config);
client.connect();