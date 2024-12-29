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
  SERVER_HOST: process.env.SERVER_HOST || 'localhost:3001',
  TUNNEL_DOMAIN: process.env.TUNNEL_DOMAIN || 'tunnel.mydomain.com',
  PUBLIC_DOMAIN: process.env.PUBLIC_DOMAIN || 'mydomain.com',
};
