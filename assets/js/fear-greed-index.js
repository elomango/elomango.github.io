class FearGreedIndex {
    constructor() {
        this.cnnData = null;
        this.cryptoData = null;
        this.isLoading = true;
    }

    async fetchStockFearGreed() {
        try {
            console.log('Fetching CNN Fear & Greed data...');
            
            // Try different CORS bypass methods
            const corsProxies = [
                'https://api.codetabs.com/v1/proxy?quest=',
                'https://cors-proxy.htmldriven.com/?url=',
                'https://thingproxy.freeboard.io/fetch/'
            ];
            
            const cnnUrl = 'https://production.dataviz.cnn.io/index/fearandgreed/graphdata';
            
            // First try direct access (might work in some cases)
            try {
                console.log('Trying direct CNN API...');
                const directResponse = await fetch(cnnUrl, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                    }
                });
                
                if (directResponse.ok) {
                    const data = await directResponse.json();
                    if (data.fear_and_greed && data.fear_and_greed.length > 0) {
                        const latest = data.fear_and_greed[0];
                        this.cnnData = {
                            value: Math.round(latest.score),
                            rating: latest.rating,
                            timestamp: latest.timestamp,
                            source: 'CNN (direct)'
                        };
                        console.log('CNN data loaded (direct):', this.cnnData);
                        return;
                    }
                }
            } catch (directError) {
                console.warn('Direct access failed:', directError.message);
            }
            
            // Try CORS proxies
            for (const proxy of corsProxies) {
                try {
                    console.log('Trying proxy:', proxy);
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 5000);
                    
                    const response = await fetch(proxy + encodeURIComponent(cnnUrl), {
                        signal: controller.signal
                    });
                    clearTimeout(timeoutId);
                    
                    if (response.ok) {
                        const data = await response.json();
                        
                        if (data.fear_and_greed && data.fear_and_greed.length > 0) {
                            const latest = data.fear_and_greed[0];
                            this.cnnData = {
                                value: Math.round(latest.score),
                                rating: latest.rating,
                                timestamp: latest.timestamp,
                                source: 'CNN (via proxy)'
                            };
                            console.log('CNN data loaded via proxy:', this.cnnData);
                            return;
                        }
                    }
                } catch (proxyError) {
                    console.warn(`Proxy ${proxy} failed:`, proxyError.message);
                    continue;
                }
            }
            
            // If all proxies fail, hide the widget - don't show potentially wrong data
            console.log('All attempts failed, hiding Stock Market widget');
            this.cnnData = null;
            
        } catch (error) {
            console.warn('Failed to fetch CNN Fear & Greed data:', error);
            this.cnnData = null;
        }
    }

    async fetchCryptoFearGreed() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
            
            const response = await fetch('https://api.alternative.me/fng/?limit=1', {
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            
            const data = await response.json();
            
            if (data.data && data.data.length > 0) {
                const latest = data.data[0];
                this.cryptoData = {
                    value: parseInt(latest.value),
                    rating: latest.value_classification,
                    timestamp: latest.timestamp
                };
            }
        } catch (error) {
            console.warn('Failed to fetch Crypto Fear & Greed data:', error);
            // Set to null to hide the widget
            this.cryptoData = null;
        }
    }

    getColorClass(value) {
        if (typeof value !== 'number') return 'neutral';
        
        if (value <= 24) return 'extreme-fear';
        if (value <= 44) return 'fear';
        if (value <= 55) return 'neutral';
        if (value <= 74) return 'greed';
        return 'extreme-greed';
    }

    getEmoji(value) {
        if (typeof value !== 'number') return '❓';
        
        if (value <= 24) return '😨';
        if (value <= 44) return '😟';
        if (value <= 55) return '😐';
        if (value <= 74) return '😊';
        return '🤑';
    }

    renderWidget(containerId, data, title, subtitle) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const colorClass = this.getColorClass(data.value);
        const emoji = this.getEmoji(data.value);
        const isDemo = data.demo;

        container.innerHTML = `
            <div class="fear-greed-widget ${colorClass}">
                <div class="widget-header">
                    <h3>${title}</h3>
                    <p class="widget-subtitle">${subtitle}</p>
                    ${isDemo ? '<span class="demo-badge">DEMO</span>' : ''}
                </div>
                <div class="widget-content">
                    <div class="fear-greed-score">
                        <div class="score-value">
                            <span class="emoji">${emoji}</span>
                            <span class="value">${data.value}</span>
                        </div>
                        <div class="score-rating">${data.rating}</div>
                    </div>
                    ${data.timestamp && !isDemo ? `
                        <div class="widget-footer">
                            <small>Updated: ${new Date(data.timestamp * 1000).toLocaleDateString()}</small>
                        </div>
                    ` : isDemo ? `
                        <div class="widget-footer">
                            <small>Real-time data unavailable</small>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    async init() {
        // Show loading state
        const containers = ['cnn-fear-greed', 'crypto-fear-greed'];
        containers.forEach(id => {
            const container = document.getElementById(id);
            if (container) {
                container.innerHTML = `
                    <div class="fear-greed-widget loading">
                        <div class="widget-header">
                            <h3>${id === 'cnn-fear-greed' ? 'Stock Market' : 'Crypto Market'}</h3>
                            <p class="widget-subtitle">Fear & Greed Index</p>
                        </div>
                        <div class="widget-content">
                            <div class="loading-spinner">
                                <div class="spinner"></div>
                                <p>Loading...</p>
                            </div>
                        </div>
                    </div>
                `;
            }
        });

        // Fetch data concurrently with overall timeout
        const fetchPromise = Promise.allSettled([
            this.fetchStockFearGreed(),
            this.fetchCryptoFearGreed()
        ]);
        
        // Overall timeout of 4 seconds
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Overall timeout')), 4000)
        );
        
        try {
            await Promise.race([fetchPromise, timeoutPromise]);
        } catch (error) {
            console.warn('API fetch timeout, using demo data');
        }

        // Render widgets and adjust layout
        let visibleCount = 0;
        
        if (this.cnnData) {
            let subtitle = 'Fear & Greed Index';
            if (this.cnnData.source === 'CNN') {
                subtitle = 'CNN Fear & Greed Index';
            } else if (this.cnnData.lastUpdated) {
                const hours = Math.round((Date.now() - new Date(this.cnnData.lastUpdated).getTime()) / (1000 * 60 * 60));
                subtitle = `Updated ${hours}h ago`;
            }
            this.renderWidget('cnn-fear-greed', this.cnnData, 'Stock Market', subtitle);
            visibleCount++;
        } else {
            // Show fallback button to CNN page
            const container = document.getElementById('cnn-fear-greed');
            if (container) {
                container.innerHTML = `
                    <div class="fear-greed-widget fallback">
                        <div class="widget-header">
                            <h3>Stock Market</h3>
                            <p class="widget-subtitle">Fear & Greed Index</p>
                        </div>
                        <div class="widget-content">
                            <div class="fallback-content">
                                <p>Data temporarily unavailable</p>
                                <a href="https://www.cnn.com/markets/fear-and-greed" 
                                   target="_blank" 
                                   rel="noopener noreferrer" 
                                   class="cnn-button">
                                    View on CNN
                                </a>
                            </div>
                        </div>
                    </div>
                `;
                visibleCount++;
            }
        }

        if (this.cryptoData) {
            this.renderWidget('crypto-fear-greed', this.cryptoData, 'Crypto Market', 'Fear & Greed Index');
            visibleCount++;
        } else {
            // Hide the container
            const container = document.getElementById('crypto-fear-greed');
            if (container) container.style.display = 'none';
        }
        
        // Adjust grid layout based on visible widgets
        const fearGreedContainer = document.querySelector('.fear-greed-container');
        if (fearGreedContainer) {
            if (visibleCount === 0) {
                // Hide the entire section if no widgets are available
                fearGreedContainer.style.display = 'none';
            } else {
                // Always maintain side-by-side layout for 1 or 2 widgets
                fearGreedContainer.style.display = 'grid';
                fearGreedContainer.style.gridTemplateColumns = '1fr 1fr';
                fearGreedContainer.style.maxWidth = '800px';
                fearGreedContainer.style.margin = '40px auto';
            }
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const fearGreedIndex = new FearGreedIndex();
    fearGreedIndex.init();
});