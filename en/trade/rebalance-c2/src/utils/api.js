export class StockDataAPI {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 15 * 60 * 1000;
    }

    async fetchStockData(ticker, fromDate, toDate) {
        const cacheKey = `${ticker}_${fromDate}_${toDate}`;
        
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                return cached.data;
            }
        }

        console.log(`Fetching data for ${ticker} from ${fromDate} to ${toDate}`);
        
        try {
            const data = await this.fetchRealData(ticker, fromDate, toDate);
            this.cache.set(cacheKey, { data, timestamp: Date.now() });
            return data;
        } catch (error) {
            console.error(`Failed to fetch real data for ${ticker}:`, error);
            return this.generateMockData(ticker, fromDate, toDate);
        }
    }

    async fetchRealData(ticker, fromDate, toDate) {
        const from = Math.floor(new Date(fromDate).getTime() / 1000);
        const to = Math.floor(new Date(toDate).getTime() / 1000);
        
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?period1=${from}&period2=${to}&interval=1d`;
        const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
        
        const response = await fetch(proxyUrl);
        if (!response.ok) throw new Error('Failed to fetch data');
        
        const data = await response.json();
        const quotes = data.chart.result[0];
        const timestamps = quotes.timestamp;
        const closes = quotes.indicators.quote[0].close;
        
        const stockData = [];
        for (let i = 0; i < timestamps.length; i++) {
            if (closes[i] !== null) {
                stockData.push({
                    date: new Date(timestamps[i] * 1000).toISOString().split('T')[0],
                    close: closes[i]
                });
            }
        }
        
        console.log(`Fetched ${stockData.length} real data points for ${ticker}`);
        return stockData;
    }

    generateMockData(ticker, fromDate, toDate) {
        console.log(`Using mock data for ${ticker} from ${fromDate} to ${toDate}`);
        const data = [];
        const startDate = new Date(fromDate);
        const endDate = new Date(toDate);
        
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            console.error('Invalid dates:', fromDate, toDate);
            return data;
        }
        
        const days = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24));
        let basePrice = ticker === 'TQQQ' ? 80 : 500;
        const volatility = ticker === 'TQQQ' ? 0.03 : 0.015;
        
        for (let i = 0; i <= days; i++) {
            const currentDate = new Date(startDate.getTime());
            currentDate.setDate(startDate.getDate() + i);
            
            if (currentDate.getDay() === 0 || currentDate.getDay() === 6) continue;
            
            const randomChange = (Math.random() - 0.5) * 2 * volatility;
            const trend = 0.0003;
            basePrice = basePrice * (1 + randomChange + trend);
            
            data.push({
                date: currentDate.toISOString().split('T')[0],
                close: parseFloat(basePrice.toFixed(2))
            });
        }
        
        console.log(`Generated ${data.length} data points for ${ticker}`);
        return data;
    }
}