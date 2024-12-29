// Internet Checker Usage
import InternetChecker from './internetConnectionChecker';
// Network Monitor Usage
import NetworkMonitor from './networkInterfaceMonitor';

async function checkConnection() {
    const checker = new InternetChecker({
        timeout: 5000,
        retries: 3,
        hosts: ['google.com', 'cloudflare.com']
    });

    try {
        const isConnected = await checker.isConnected();
        console.log(`Internet connection: ${isConnected ? 'Connected' : 'Disconnected'}`);
    } catch (error) {
        console.error('Error checking connection:', error);
    }
}



const monitor = new NetworkMonitor({
    pollInterval: 2000,
    interfaces: ['en0', 'en1']
});

monitor.on('initial', (state) => {
    console.log('Initial state:', state);
});

monitor.on('connected', (state) => {
    console.log(`Interface ${state.interface} connected:`, state);
});

monitor.on('disconnected', (state) => {
    console.log(`Interface ${state.interface} disconnected:`, state);
});

monitor.on('changed', (state) => {
    console.log(`Interface ${state.interface} changed state:`, state);
});

monitor.start();