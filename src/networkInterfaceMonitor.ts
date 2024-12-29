import { exec } from 'child_process';
import { EventEmitter } from 'events';

interface MonitorOptions {
    pollInterval?: number;
    interfaces?: string[];
}

interface NetworkInterfaceDetails {
    ip?: string;
    mac?: string;
}

interface NetworkInterfaceState {
    interface: string;
    status: 'up' | 'down';
    details: NetworkInterfaceDetails | null;
}

// Define the event types that this class can emit
interface NetworkMonitorEvents {
    initial: (state: NetworkInterfaceState) => void;
    connected: (state: NetworkInterfaceState) => void;
    disconnected: (state: NetworkInterfaceState) => void;
    changed: (state: NetworkInterfaceState) => void;
}

// Extend EventEmitter with our custom events
class NetworkMonitor extends EventEmitter {
    private options: Required<MonitorOptions>;
    private previousStates: Map<string, NetworkInterfaceState>;
    private isMonitoring: boolean;
    private intervalId: NodeJS.Timeout | null;

    constructor(options: MonitorOptions = {}) {
        super();
        this.options = {
            pollInterval: options.pollInterval ?? 2000,
            interfaces: options.interfaces ?? ['en0', 'en1']
        };
        this.previousStates = new Map();
        this.isMonitoring = false;
        this.intervalId = null;
    }

    // Add type declarations for EventEmitter methods
    public on<K extends keyof NetworkMonitorEvents>(
        event: K, 
        listener: NetworkMonitorEvents[K]
    ): this {
        return super.on(event, listener);
    }

    public emit<K extends keyof NetworkMonitorEvents>(
        event: K, 
        ...args: Parameters<NetworkMonitorEvents[K]>
    ): boolean {
        return super.emit(event, ...args);
    }

    private async getInterfaceState(interfaceName: string): Promise<NetworkInterfaceState> {
        return new Promise((resolve) => {
            exec(`/sbin/ifconfig ${interfaceName}`, (error, stdout, stderr) => {
                if (error || stderr) {
                    resolve({ 
                        interface: interfaceName, 
                        status: 'down', 
                        details: null 
                    });
                    return;
                }

                const status: NetworkInterfaceState = {
                    interface: interfaceName,
                    status: 'down',
                    details: {}
                };

                // Check if interface is up
                if (stdout.includes('status: active')) {
                    status.status = 'up';
                }

                // Extract IP address if available
                const ipMatch = stdout.match(/inet (\d+\.\d+\.\d+\.\d+)/);
                if (ipMatch) {
                    status.details!.ip = ipMatch[1];
                }

                // Extract MAC address if available
                const macMatch = stdout.match(/ether ([0-9a-fA-F:]+)/);
                if (macMatch) {
                    status.details!.mac = macMatch[1];
                }

                resolve(status);
            });
        });
    }

    private async checkInterfaces(): Promise<void> {
        for (const interfaceName of this.options.interfaces) {
            const currentState = await this.getInterfaceState(interfaceName);
            const previousState = this.previousStates.get(interfaceName);

            if (!previousState) {
                this.previousStates.set(interfaceName, currentState);
                this.emit('initial', currentState);
                continue;
            }

            if (previousState.status !== currentState.status) {
                if (currentState.status === 'up') {
                    this.emit('connected', currentState);
                } else {
                    this.emit('disconnected', currentState);
                }
                this.emit('changed', currentState);
                this.previousStates.set(interfaceName, currentState);
            }
        }
    }

    public start(): void {
        if (this.isMonitoring) return;
        
        this.isMonitoring = true;
        this.checkInterfaces();
        
        this.intervalId = setInterval(() => {
            this.checkInterfaces();
        }, this.options.pollInterval);
    }

    public stop(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.isMonitoring = false;
        this.previousStates.clear();
    }
}

export default NetworkMonitor;