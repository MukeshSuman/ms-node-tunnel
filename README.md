# Local Tunnel Service

A Node.js-based tunneling service similar to ngrok that allows you to expose your localhost to the internet through a custom domain.

## Features

- Custom subdomain support
- WebSocket support
- Automatic reconnection
- TypeScript support
- Development mode with hot reloading

## Prerequisites

- Node.js (v14 or higher)
- A domain name with wildcard DNS configuration
- A server with a static IP address

## Installation

1. Clone the repository:

```bash
git clone [repository-url]
cd ms-node-tunnel
```

2. Install dependencies:

```bash
npm install
```

3. Configure your environment:
   - Copy `.env.example` to `.env`
   - Update the SERVER_HOST to your domain
   - Set your desired PORT and other configurations

## Usage

1. Build the project:

```bash
npm run build
```

2. Start the tunnel server (on your server with static IP):

```bash
npm run tunnel
```

3. Start the client (on your local machine):

```bash
npm run client
```

Your local application will be accessible at `http://[subdomain].[your-domain].com`

## Development

For development with hot reloading:

- Start the tunnel server in dev mode:

```bash
npm run dev:tunnel
```

- Start the client in dev mode:

```bash
npm run dev:client
```

## License

MIT
