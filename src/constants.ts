import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

export const CONSTANTS = {
  PORT: process.env.PORT || 3000,
  RELAY_SERVER_URL: process.env.RELAY_SERVER_URL || '',
  LOCAL_SERVER_PORT: process.env.LOCAL_SERVER_PORT || process.env.PORT || 3001,
  RELAY_SERVER_PORT: process.env.RELAY_SERVER_PORT || process.env.PORT || 3002,
};
