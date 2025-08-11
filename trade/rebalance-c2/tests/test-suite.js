// Test Suite for Shannon Rebalancing Strategy Application

// Helper function to load the main application code
async function loadApplicationCode() {
    // In a real scenario, we'd load app.js, but for testing we'll create test instances
    return new Promise((resolve) => {
        // Mock or actual loading logic here
        resolve();
    });
}

// API Tests - Testing external API calls
testFramework.describe('API Tests', () => {
    let api;

    testFramework.beforeEach(() => {
        // Create a fresh API instance for each test
        api = new StockDataAPI();
    });

    testFramework.it('should fetch real Yahoo Finance data successfully', async () => {
        const data = await api.fetchStockData('AAPL', '2024-01-01', '2024-01-31');
        
        testFramework.expect(data).toBeTruthy();
        testFramework.expect(Array.isArray(data)).toBe(true);
        if (data.length > 0) {
            testFramework.expect(data[0]).toBeTruthy();
            testFramework.expect(data[0].date).toBeTruthy();
            testFramework.expect(typeof data[0].close).toBe('number');
            testFramework.expect(data[0].close).toBeGreaterThan(0);
        }
    });

    testFramework.it('should handle API failures gracefully with mock data', async () => {
        // Test with invalid ticker that should trigger mock data
        const data = await api.fetchStockData('INVALID_TICKER_12345', '2024-01-01', '2024-01-31');
        
        testFramework.expect(data).toBeTruthy();
        testFramework.expect(Array.isArray(data)).toBe(true);
        testFramework.expect(data.length).toBeGreaterThan(0);
    });

    testFramework.it('should cache API responses', async () => {
        const ticker = 'QQQ';
        const from = '2024-01-01';
        const to = '2024-01-31';
        
        // First call
        const start1 = Date.now();
        const data1 = await api.fetchStockData(ticker, from, to);
        const time1 = Date.now() - start1;
        
        // Second call (should be cached)
        const start2 = Date.now();
        const data2 = await api.fetchStockData(ticker, from, to);
        const time2 = Date.now() - start2;
        
        testFramework.expect(JSON.stringify(data1)).toBe(JSON.stringify(data2));
        // Cached call should be much faster
        testFramework.expect(time2).toBeLessThan(time1 / 2);
    });

    testFramework.it('should validate date ranges in API calls', async () => {
        const invalidData = await api.fetchStockData('AAPL', '2024-01-31', '2024-01-01');
        // Should still return data (mock) even with invalid date range
        testFramework.expect(Array.isArray(invalidData)).toBe(true);
    });

    testFramework.it('should handle network timeouts', async () => {
        // Simulate network timeout by using a proxy that doesn't exist
        const originalFetch = window.fetch;
        window.fetch = () => new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Network timeout')), 100)
        );
        
        const data = await api.fetchStockData('AAPL', '2024-01-01', '2024-01-31');
        
        // Should fall back to mock data
        testFramework.expect(data).toBeTruthy();
        testFramework.expect(data.length).toBeGreaterThan(0);
        
        window.fetch = originalFetch;
    });
});

// Unit Tests - Testing individual functions and components
testFramework.describe('Shannon Strategy Unit Tests', () => {
    let strategy;

    testFramework.beforeEach(() => {
        strategy = new ShannonStrategy({
            seed: 10000,
            aIncGap: 100,
            aIncSell: 20,
            aDecGap: 20,
            bDecSell: 20
        });
    });

    testFramework.it('should initialize with correct parameters', () => {
        testFramework.expect(strategy.params.seed).toBe(10000);
        testFramework.expect(strategy.params.aIncGap).toBe(100);
        testFramework.expect(strategy.params.aIncSell).toBe(20);
    });

    testFramework.it('should validate data correctly', () => {
        const validData = [{ date: '2024-01-01', close: 100 }];
        const emptyData = [];
        const nullData = null;
        
        testFramework.expect(strategy.validateData(validData, validData)).toBe(true);
        testFramework.expect(strategy.validateData(emptyData, validData)).toBe(false);
        testFramework.expect(strategy.validateData(nullData, validData)).toBe(false);
    });

    testFramework.it('should calculate rebalancing correctly', () => {
        const result = strategy.checkAndRebalance(
            100, // sharesA
            50,  // sharesB
            [100, 200], // pricesA
            [200, 200], // pricesB
            1,   // currentIndex
            0    // point1Index
        );
        
        testFramework.expect(result.rebalanced).toBe(true);
        testFramework.expect(result.type).toBe('increase');
        testFramework.expect(result.sharesA).toBeLessThan(100);
        testFramework.expect(result.sharesB).toBeGreaterThan(50);
    });

    testFramework.it('should handle edge cases in price calculations', () => {
        const prices = [0, -100, NaN, Infinity, undefined];
        
        prices.forEach(price => {
            const valid = strategy.validatePrices([price], [100]);
            testFramework.expect(valid).toBe(false);
        });
    });

    testFramework.it('should generate correct empty result structure', () => {
        const emptyResult = strategy.getEmptyResult();
        
        testFramework.expect(emptyResult.dates).toHaveLength(0);
        testFramework.expect(emptyResult.pricesA).toHaveLength(0);
        testFramework.expect(emptyResult.pricesB).toHaveLength(0);
        testFramework.expect(emptyResult.portfolioValues).toHaveLength(0);
    });
});

testFramework.describe('Input Manager Unit Tests', () => {
    let inputManager;

    testFramework.beforeEach(() => {
        // Create mock DOM elements
        document.body.innerHTML = `
            <input id="dateFrom" value="2023-01-01">
            <input id="dateTo" value="2024-01-01">
            <input id="seed" value="10000">
            <input id="tickerA" value="TQQQ">
            <input id="tickerB" value="QQQ">
            <input id="aIncGap" value="100">
            <input id="aIncSell" value="20">
            <input id="aDecGap" value="20">
            <input id="bDecSell" value="20">
        `;
        
        inputManager = new InputManager();
    });

    testFramework.it('should set default dates correctly', () => {
        const today = new Date();
        const oneYearAgo = new Date(today);
        oneYearAgo.setFullYear(today.getFullYear() - 1);
        
        testFramework.expect(inputManager.inputs.dateTo.value).toBe(today.toISOString().split('T')[0]);
        testFramework.expect(inputManager.inputs.dateFrom.value).toBe(oneYearAgo.toISOString().split('T')[0]);
    });

    testFramework.it('should get parameters correctly', () => {
        const params = inputManager.getParameters();
        
        testFramework.expect(params.seed).toBe(10000);
        testFramework.expect(params.tickerA).toBe('TQQQ');
        testFramework.expect(params.tickerB).toBe('QQQ');
        testFramework.expect(params.aIncGap).toBe(100);
    });

    testFramework.it('should validate parameters correctly', () => {
        const validParams = inputManager.getParameters();
        const errors = inputManager.validateParameters(validParams);
        
        testFramework.expect(errors).toHaveLength(0);
    });

    testFramework.it('should detect invalid parameters', () => {
        const invalidParams = {
            dateFrom: '2024-01-01',
            dateTo: '2023-01-01', // End before start
            seed: -100, // Negative seed
            tickerA: '',
            tickerB: '',
            aIncGap: 0,
            aIncSell: 150, // Over 100%
            aDecGap: -10,
            bDecSell: -20
        };
        
        const errors = inputManager.validateParameters(invalidParams);
        testFramework.expect(errors.length).toBeGreaterThan(0);
    });
});

testFramework.describe('Chart Manager Unit Tests', () => {
    let chartManager;

    testFramework.beforeEach(() => {
        // Create mock canvas elements
        document.body.innerHTML = `
            <canvas id="simulationChart"></canvas>
            <canvas id="valueChart"></canvas>
        `;
        
        // Mock Chart.js if not available
        if (typeof Chart === 'undefined') {
            window.Chart = class MockChart {
                constructor(ctx, config) {
                    this.ctx = ctx;
                    this.config = config;
                }
                destroy() {}
            };
        }
        
        chartManager = new ChartManager();
    });

    testFramework.it('should create chart datasets correctly', () => {
        const dataset = chartManager.createDataset('Test', [1, 2, 3], 'red', 'y-axis');
        
        testFramework.expect(dataset.label).toBe('Test');
        testFramework.expect(dataset.data).toHaveLength(3);
        testFramework.expect(dataset.borderColor).toBe('red');
        testFramework.expect(dataset.yAxisID).toBe('y-axis');
    });

    testFramework.it('should handle null yAxisID correctly', () => {
        const dataset = chartManager.createDataset('Test', [1, 2, 3], 'red', null);
        
        testFramework.expect(dataset.yAxisID).toBeFalsy();
    });

    testFramework.it('should extract rebalance points correctly', () => {
        const results = {
            dates: ['2024-01-01', '2024-01-02', '2024-01-03'],
            rebalancePoints: [
                { index: 0, type: 'increase' },
                { index: 2, type: 'decrease' }
            ]
        };
        const values = [100, 110, 95];
        
        const increasePoints = chartManager.getRebalancePoints(results, 'increase', values);
        
        testFramework.expect(increasePoints).toHaveLength(1);
        testFramework.expect(increasePoints[0].x).toBe('2024-01-01');
        testFramework.expect(increasePoints[0].y).toBe(100);
    });

    testFramework.it('should destroy existing charts before creating new ones', () => {
        let destroyCalled = false;
        chartManager.simulationChart = { destroy: () => { destroyCalled = true; } };
        
        chartManager.destroy();
        
        testFramework.expect(destroyCalled).toBe(true);
        testFramework.expect(chartManager.simulationChart).toBe(null);
    });
});

testFramework.describe('Performance and Integration Tests', () => {
    testFramework.it('should handle large datasets efficiently', () => {
        const largeData = [];
        const days = 1000;
        
        for (let i = 0; i < days; i++) {
            const date = new Date(2020, 0, i + 1);
            largeData.push({
                date: date.toISOString().split('T')[0],
                close: 100 + Math.random() * 50
            });
        }
        
        const strategy = new ShannonStrategy({
            seed: 10000,
            aIncGap: 50,
            aIncSell: 20,
            aDecGap: 20,
            bDecSell: 20
        });
        
        const start = Date.now();
        const result = strategy.run(largeData, largeData);
        const duration = Date.now() - start;
        
        testFramework.expect(result.dates).toHaveLength(days);
        testFramework.expect(duration).toBeLessThan(1000); // Should process in under 1 second
    });

    testFramework.it('should calculate correct performance metrics', () => {
        const comparison = new ComparisonDisplay();
        
        const dataA = [
            { close: 100 },
            { close: 150 }
        ];
        const dataB = [
            { close: 200 },
            { close: 220 }
        ];
        
        const performances = comparison.calculateBuyAndHoldPerformances(dataA, dataB, 10000);
        
        testFramework.expect(performances.tickerAOnly).toBeCloseTo(50, 1); // 50% gain
        testFramework.expect(performances.tickerBOnly).toBeCloseTo(10, 1); // 10% gain
    });

    testFramework.it('should format performance values correctly', () => {
        const comparison = new ComparisonDisplay();
        
        const positive = comparison.formatPerformance(25.5);
        const negative = comparison.formatPerformance(-10.3);
        const zero = comparison.formatPerformance(0);
        
        testFramework.expect(positive).toBe('+25.50%');
        testFramework.expect(negative).toBe('-10.30%');
        testFramework.expect(zero).toBe('+0.00%');
    });
});

// Memory leak tests
testFramework.describe('Memory and Resource Management Tests', () => {
    testFramework.it('should not create memory leaks with repeated API calls', async () => {
        const api = new StockDataAPI();
        
        // Make multiple calls
        for (let i = 0; i < 5; i++) {
            await api.fetchStockData('TEST', '2024-01-01', '2024-01-31');
        }
        
        // Cache should have limited entries
        testFramework.expect(api.cache.size).toBeLessThan(10);
    });

    testFramework.it('should clean up chart instances properly', () => {
        const chartManager = new ChartManager();
        
        // Create mock charts
        chartManager.simulationChart = { destroy: () => {} };
        chartManager.valueChart = { destroy: () => {} };
        
        chartManager.destroy();
        
        testFramework.expect(chartManager.simulationChart).toBe(null);
        testFramework.expect(chartManager.valueChart).toBe(null);
    });
});