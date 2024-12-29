interface CheckerOptions {
    timeout?: number;
    retries?: number;
    hosts?: string[];
}

class InternetChecker {
    private options: Required<CheckerOptions>;

    constructor(options: CheckerOptions = {}) {
        this.options = {
            timeout: options.timeout ?? 5000,
            retries: options.retries ?? 3,
            hosts: options.hosts ?? ['google.com', 'cloudflare.com', 'amazon.com']
        };
    }

    // Check connection using DNS lookup
    private async checkDns(): Promise<boolean> {
        return new Promise((resolve) => {
            require('dns').lookup('google.com', (err: Error | null) => {
                resolve(!err);
            });
        });
    }

    // Check connection using HTTPS request
    private async checkHttps(host: string): Promise<boolean> {
        return new Promise((resolve) => {
            const req = require('https').get(`https://${host}`, {
                timeout: this.options.timeout
            }, (res: any) => {
                res.destroy();
                resolve(true);
            });

            req.on('error', () => {
                resolve(false);
            });

            req.on('timeout', () => {
                req.destroy();
                resolve(false);
            });
        });
    }

    // Main check method with retries
    public async isConnected(): Promise<boolean> {
        for (let attempt = 0; attempt < this.options.retries; attempt++) {
            // First try DNS
            const dnsResult = await this.checkDns();
            if (dnsResult) {
                // Then try HTTPS requests
                for (const host of this.options.hosts) {
                    const httpsResult = await this.checkHttps(host);
                    if (httpsResult) {
                        return true;
                    }
                }
            }
            
            // Wait before retry if not last attempt
            if (attempt < this.options.retries - 1) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        
        return false;
    }
}

export default InternetChecker;