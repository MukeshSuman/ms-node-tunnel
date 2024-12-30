import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

export const CONSTANTS = {
  PORT: process.env.PORT || 3000,
  RELAY_SERVER_URL: process.env.RELAY_SERVER_URL || '',
  LOCAL_SERVER_PORT: process.env.LOCAL_SERVER_PORT || process.env.PORT || 3001,
  RELAY_SERVER_PORT: process.env.RELAY_SERVER_PORT || process.env.PORT || 3002,
  TUNNEL_SERVER_PORT: process.env.TUNNEL_SERVER_PORT || process.env.PORT || 3003,
  CLIENT_SERVER_PORT: process.env.CLIENT_SERVER_PORT || process.env.PORT || 3004,
  SERVER_HOST: process.env.SERVER_HOST || 'localhost:3001', // Host of the tunnel server
  TUNNEL_DOMAIN: process.env.TUNNEL_DOMAIN || 'localhost', // Domain for the tunnel server
  PUBLIC_DOMAIN: process.env.PUBLIC_DOMAIN || 'localhost', // Domain for the public URL
  TUNNEL_SUBDOMAIN: process.env.TUNNEL_SUBDOMAIN || 'myapp', // Subdomain for the tunnel, to access the local service. EX: myapp.tunnel.mydomain.com
  LOCAL_PORT: process.env.LOCAL_PORT || '3000', // Port of the local running service to be exposed
};
