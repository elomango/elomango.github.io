/**
 * Yahoo Finance API Integration Module
 * S&P 500 Momentum Rebalancing Tool
 */

class YahooFinanceAPI {
    constructor() {
        this.corsProxy = 'https://corsproxy.io/?';
        this.baseUrl = 'https://query1.finance.yahoo.com/v8/finance/chart/';

        // Rate limiting configuration
        this.requestQueue = [];
        this.isProcessing = false;
        this.requestDelay = 100; // 100ms between requests (10 requests/second)
        this.maxRetries = 3;

        // Cache configuration
        this.cache = new Map();
        this.cacheTimeout = 15 * 60 * 1000; // 15 minutes

        // Statistics
        this.stats = {
            totalRequests: 0,
            cacheHits: 0,
            failures: 0
        };
    }

    /**
     * Fetch stock data with caching and rate limiting
     */
    async fetchStockData(ticker, startDate, endDate) {
        const cacheKey = `${ticker}_${startDate}_${endDate}`;

        // Check cache first
        const cached = this.getFromCache(cacheKey);
        if (cached) {
            this.stats.cacheHits++;
            console.log(`Cache hit for ${ticker}`);
            return cached;
        }

        // Add to queue for rate-limited processing
        return new Promise((resolve, reject) => {
            this.requestQueue.push({
                ticker,
                startDate,
                endDate,
                resolve,
                reject,
                retries: 0
            });

            this.processQueue();
        });
    }

    /**
     * Process request queue with rate limiting
     */
    async processQueue() {
        if (this.isProcessing || this.requestQueue.length === 0) {
            return;
        }

        this.isProcessing = true;

        while (this.requestQueue.length > 0) {
            const request = this.requestQueue.shift();

            try {
                const data = await this.fetchSingleStock(
                    request.ticker,
                    request.startDate,
                    request.endDate
                );

                // Cache the result
                const cacheKey = `${request.ticker}_${request.startDate}_${request.endDate}`;
                this.saveToCache(cacheKey, data);

                request.resolve(data);

            } catch (error) {
                console.error(`Failed to fetch ${request.ticker}:`, error);

                if (request.retries < this.maxRetries) {
                    request.retries++;
                    console.log(`Retrying ${request.ticker} (attempt ${request.retries})`);
                    this.requestQueue.unshift(request); // Add back to front of queue
                } else {
                    this.stats.failures++;
                    request.reject(error);
                }
            }

            // Rate limiting delay
            if (this.requestQueue.length > 0) {
                await this.sleep(this.requestDelay);
            }
        }

        this.isProcessing = false;
    }

    /**
     * Fetch data for a single stock
     */
    async fetchSingleStock(ticker, startDate, endDate) {
        this.stats.totalRequests++;

        const from = Math.floor(new Date(startDate).getTime() / 1000);
        const to = Math.floor(new Date(endDate).getTime() / 1000);

        const url = `${this.baseUrl}${ticker}?period1=${from}&period2=${to}&interval=1d`;
        const proxyUrl = `${this.corsProxy}${encodeURIComponent(url)}`;

        console.log(`Fetching ${ticker} from ${startDate} to ${endDate}`);

        const response = await fetch(proxyUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.chart || !data.chart.result || data.chart.result.length === 0) {
            throw new Error('Invalid response format');
        }

        const quotes = data.chart.result[0];

        if (!quotes.timestamp || !quotes.indicators || !quotes.indicators.quote) {
            throw new Error('Missing price data');
        }

        return this.parseStockData(quotes);
    }

    /**
     * Parse Yahoo Finance response into usable format
     */
    parseStockData(quotes) {
        const timestamps = quotes.timestamp;
        const priceData = quotes.indicators.quote[0];

        const result = {
            symbol: quotes.meta.symbol,
            currency: quotes.meta.currency,
            dates: [],
            prices: [],
            volumes: [],
            highs: [],
            lows: [],
            opens: []
        };

        for (let i = 0; i < timestamps.length; i++) {
            // Skip null values (holidays, etc.)
            if (priceData.close[i] === null) {
                continue;
            }

            const date = new Date(timestamps[i] * 1000);
            result.dates.push(date.toISOString().split('T')[0]);
            result.prices.push(priceData.close[i]);
            result.volumes.push(priceData.volume[i] || 0);
            result.highs.push(priceData.high[i] || priceData.close[i]);
            result.lows.push(priceData.low[i] || priceData.close[i]);
            result.opens.push(priceData.open[i] || priceData.close[i]);
        }

        return result;
    }

    /**
     * Batch fetch multiple stocks
     */
    async fetchMultipleStocks(tickers, startDate, endDate, progressCallback) {
        const results = {};
        const batchSize = 5; // Process 5 stocks at a time

        for (let i = 0; i < tickers.length; i += batchSize) {
            const batch = tickers.slice(i, i + batchSize);

            // Fetch batch in parallel
            const batchPromises = batch.map(ticker =>
                this.fetchStockData(ticker, startDate, endDate)
                    .then(data => ({ ticker, data, success: true }))
                    .catch(error => ({ ticker, error, success: false }))
            );

            const batchResults = await Promise.all(batchPromises);

            // Process results
            for (const result of batchResults) {
                if (result.success) {
                    results[result.ticker] = result.data;
                } else {
                    console.error(`Failed to fetch ${result.ticker}:`, result.error);
                    results[result.ticker] = null;
                }
            }

            // Update progress
            if (progressCallback) {
                const progress = Math.min((i + batch.length) / tickers.length * 100, 100);
                progressCallback(progress, `${i + batch.length}/${tickers.length} 종목 데이터 수집`);
            }

            // Add delay between batches to avoid rate limiting
            if (i + batchSize < tickers.length) {
                await this.sleep(500); // 500ms between batches
            }
        }

        return results;
    }

    /**
     * Fetch data for momentum calculation (recent data only)
     */
    async fetchRecentData(ticker, lookbackDays = 20) {
        const endDate = new Date();
        const startDate = new Date();

        // Add extra days for weekends/holidays
        startDate.setDate(startDate.getDate() - lookbackDays - 10);

        const data = await this.fetchStockData(
            ticker,
            startDate.toISOString().split('T')[0],
            endDate.toISOString().split('T')[0]
        );

        // Return only the last lookbackDays of actual trading days
        if (data && data.prices.length > lookbackDays) {
            const startIndex = Math.max(0, data.prices.length - lookbackDays);
            return {
                ...data,
                dates: data.dates.slice(startIndex),
                prices: data.prices.slice(startIndex),
                volumes: data.volumes.slice(startIndex)
            };
        }

        return data;
    }

    /**
     * Calculate return between two dates
     */
    calculateReturn(data, startDate, endDate) {
        if (!data || !data.dates || !data.prices) {
            return null;
        }

        const startIndex = data.dates.indexOf(startDate);
        const endIndex = data.dates.indexOf(endDate);

        if (startIndex === -1 || endIndex === -1 || startIndex >= endIndex) {
            return null;
        }

        const startPrice = data.prices[startIndex];
        const endPrice = data.prices[endIndex];

        return ((endPrice - startPrice) / startPrice) * 100;
    }

    /**
     * Cache management
     */
    getFromCache(key) {
        const cached = this.cache.get(key);

        if (!cached) {
            return null;
        }

        // Check if cache expired
        if (Date.now() - cached.timestamp > this.cacheTimeout) {
            this.cache.delete(key);
            return null;
        }

        return cached.data;
    }

    saveToCache(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });

        // Limit cache size (keep last 1000 entries)
        if (this.cache.size > 1000) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
    }

    clearCache() {
        this.cache.clear();
        console.log('Cache cleared');
    }

    /**
     * Get cache statistics
     */
    getStats() {
        return {
            ...this.stats,
            cacheSize: this.cache.size,
            cacheHitRate: this.stats.cacheHits /
                         (this.stats.totalRequests + this.stats.cacheHits) * 100
        };
    }

    /**
     * Utility function for delays
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Export for use in main app
if (typeof module !== 'undefined' && module.exports) {
    module.exports = YahooFinanceAPI;
}