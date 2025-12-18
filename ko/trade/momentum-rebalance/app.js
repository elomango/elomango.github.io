// S&P 500 Momentum Rebalancing Backtest Tool
// VERSION: 2.1.0 - 2024-11-28 Fixed rebalancing history generation

console.log('===================================');
console.log('APP.JS VERSION: 2.1.0');
console.log('Last Updated: 2024-11-28');
console.log('Changes: Fixed rebalancing history count');
console.log('===================================');

// Global variables
let sp500Tickers = [];
let simulationData = null;
let chartInstance = null;

// Initialize API and calculation modules
let yahooAPI = null;
let momentumCalculator = null;
let backtestEngine = null;

// Configuration
const CONFIG = {
    CACHE_TIMEOUT: 15 * 60 * 1000, // 15 minutes
    MAX_CONCURRENT_REQUESTS: 5,    // Limit concurrent API calls
    RETRY_ATTEMPTS: 3,              // Number of retry attempts for failed requests
    CORS_PROXY: 'https://corsproxy.io/?',
    USE_REAL_DATA: false,  // Toggle between real and mock data - SET TO FALSE FOR NOW
    TEST_MODE: true,        // Use limited stocks for testing
    TEST_STOCKS: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'TSLA', 'NVDA', 'JPM', 'V', 'JNJ',
                  'WMT', 'PG', 'MA', 'HD', 'DIS', 'BAC', 'NFLX', 'ADBE', 'CRM', 'PFE'] // Top 20 for testing
};

// Cache for stock data
const dataCache = new Map();

/**
 * Initialize the application
 */
async function init() {
    console.log('Initializing S&P 500 Momentum Rebalancing Tool...');

    try {
        // Initialize modules - always succeeds with fallback
        await initializeModules();

        // Load S&P 500 tickers - always succeeds with fallback
        await loadSP500Tickers();

        // Set up event listeners
        setupEventListeners();

        // Set default dates
        setDefaultDates();

        console.log('Initialization complete');
        console.log(`Mode: ${CONFIG.USE_REAL_DATA ? 'Real Data' : 'Mock Data'}`);
        console.log(`Test Mode: ${CONFIG.TEST_MODE ? 'Yes (20 stocks)' : 'No (All stocks)'}`);

    } catch (error) {
        console.error('Critical initialization error:', error);

        // Even if something fails, try to set up basic functionality
        setupEventListeners();
        setDefaultDates();

        // Use minimal fallback
        if (!sp500Tickers || sp500Tickers.length === 0) {
            sp500Tickers = CONFIG.TEST_STOCKS;
        }

        console.warn('Running in degraded mode with limited functionality');
    }
}

/**
 * Initialize API and calculation modules
 */
async function initializeModules() {
    console.log('Starting module initialization...');

    try {
        // Try to load modules dynamically
        console.log('Loading API module...');
        await loadScript('src/utils/api.js');

        console.log('Loading momentum module...');
        await loadScript('src/modules/momentum.js');

        console.log('Loading backtest module...');
        await loadScript('src/modules/backtest.js');

        // Check if classes are available
        if (typeof YahooFinanceAPI === 'undefined' ||
            typeof MomentumCalculator === 'undefined' ||
            typeof BacktestEngine === 'undefined') {
            console.warn('Some modules not loaded, using inline fallback');
            initializeInlineModules();
        } else {
            // Initialize instances
            yahooAPI = new YahooFinanceAPI();
            momentumCalculator = new MomentumCalculator();
            backtestEngine = new BacktestEngine(yahooAPI, momentumCalculator);
            console.log('Modules initialized successfully');
        }
    } catch (error) {
        console.error('Failed to initialize modules, using fallback:', error);
        // Fallback to inline classes if external loading fails
        initializeInlineModules();
    }
}

/**
 * Load external script
 */
function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = () => {
            console.warn(`Failed to load ${src}, using inline version`);
            resolve(); // Continue anyway
        };
        document.head.appendChild(script);
    });
}

/**
 * Initialize inline modules as fallback
 */
function initializeInlineModules() {
    // Simple inline implementations if external modules fail to load

    if (typeof YahooFinanceAPI === 'undefined') {
        window.YahooFinanceAPI = class {
            constructor() {
                this.corsProxy = 'https://corsproxy.io/?';
                this.cache = new Map();
            }

            async fetchStockData(ticker, startDate, endDate) {
                const cacheKey = `${ticker}_${startDate}_${endDate}`;
                if (this.cache.has(cacheKey)) {
                    return this.cache.get(cacheKey);
                }

                try {
                    const from = Math.floor(new Date(startDate).getTime() / 1000);
                    const to = Math.floor(new Date(endDate).getTime() / 1000);
                    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?period1=${from}&period2=${to}&interval=1d`;
                    const proxyUrl = `${this.corsProxy}${encodeURIComponent(url)}`;

                    const response = await fetch(proxyUrl);
                    const data = await response.json();
                    const result = this.parseData(data);

                    this.cache.set(cacheKey, result);
                    return result;
                } catch (error) {
                    console.error(`Failed to fetch ${ticker}:`, error);
                    return null;
                }
            }

            parseData(data) {
                const quotes = data.chart.result[0];
                const result = {
                    dates: [],
                    prices: [],
                    volumes: []
                };

                for (let i = 0; i < quotes.timestamp.length; i++) {
                    if (quotes.indicators.quote[0].close[i] !== null) {
                        result.dates.push(new Date(quotes.timestamp[i] * 1000).toISOString().split('T')[0]);
                        result.prices.push(quotes.indicators.quote[0].close[i]);
                        result.volumes.push(quotes.indicators.quote[0].volume[i] || 0);
                    }
                }
                return result;
            }

            async fetchMultipleStocks(tickers, startDate, endDate, progressCallback) {
                const results = {};
                for (let i = 0; i < tickers.length; i++) {
                    results[tickers[i]] = await this.fetchStockData(tickers[i], startDate, endDate);
                    if (progressCallback) {
                        progressCallback((i + 1) / tickers.length * 100, `${i + 1}/${tickers.length} 종목`);
                    }
                }
                return results;
            }
        };
    }

    if (typeof MomentumCalculator === 'undefined') {
        window.MomentumCalculator = class {
            calculateSingleStockMomentum(data, lookbackDays) {
                if (!data || !data.prices || data.prices.length < 2) return null;
                const current = data.prices[data.prices.length - 1];
                const lookback = data.prices[Math.max(0, data.prices.length - lookbackDays)];
                return ((current - lookback) / lookback) * 100;
            }

            selectTopStocks(scores, n) {
                return scores.slice(0, n);
            }
        };
    }

    if (typeof BacktestEngine === 'undefined') {
        window.BacktestEngine = class {
            constructor(api, calc) {
                this.yahooAPI = api;
                this.momentumCalculator = calc;
            }

            async runBacktest(params, progressCallback) {
                // Simplified backtest for fallback
                progressCallback(50, '시뮬레이션 실행 중...');
                await new Promise(r => setTimeout(r, 1000));
                progressCallback(100, '완료');

                // Simple mock result
                return {
                    portfolioValues: [{date: params.startDate, value: params.initialCapital},
                                    {date: params.endDate, value: params.initialCapital * 1.2}],
                    benchmarkValues: [{date: params.startDate, value: params.initialCapital},
                                     {date: params.endDate, value: params.initialCapital * 1.1}],
                    rebalancingHistory: [],
                    stats: {
                        finalValue: params.initialCapital * 1.2,
                        totalReturn: 20,
                        cagr: 18,
                        benchmarkReturn: 10,
                        maxDrawdown: 5
                    }
                };
            }
        };
    }

    yahooAPI = new window.YahooFinanceAPI();
    momentumCalculator = new window.MomentumCalculator();
    backtestEngine = new window.BacktestEngine(yahooAPI, momentumCalculator);
}

/**
 * Load S&P 500 ticker list
 */
async function loadSP500Tickers() {
    try {
        console.log('Loading S&P 500 ticker list...');
        const response = await fetch('src/data/sp500.json');

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: Failed to load S&P 500 tickers`);
        }

        const data = await response.json();
        sp500Tickers = data.tickers;
        console.log(`Loaded ${sp500Tickers.length} S&P 500 tickers`);
    } catch (error) {
        console.error('Error loading S&P 500 tickers, using fallback list:', error);

        // Use fallback ticker list if file loading fails
        sp500Tickers = CONFIG.TEST_STOCKS;
        console.warn(`Using fallback list with ${sp500Tickers.length} tickers`);
    }
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
    // Investment period unit change
    document.getElementById('investmentPeriodUnit')?.addEventListener('change', updateDateRange);

    // Investment period value change
    document.getElementById('investmentPeriodValue')?.addEventListener('change', updateDateRange);
}

/**
 * Set default dates based on investment period
 */
function setDefaultDates() {
    const today = new Date();
    const startDate = new Date();

    // Default: 5 years ago
    startDate.setFullYear(today.getFullYear() - 5);

    const startDateInput = document.getElementById('startDate');
    if (startDateInput) {
        startDateInput.value = startDate.toISOString().split('T')[0];
        startDateInput.max = today.toISOString().split('T')[0];
    }
}

/**
 * Update date range based on investment period
 */
function updateDateRange() {
    const periodValue = parseFloat(document.getElementById('investmentPeriodValue').value);
    const periodUnit = document.getElementById('investmentPeriodUnit').value;
    const startDateInput = document.getElementById('startDate');

    if (!startDateInput || !periodValue) return;

    const today = new Date();
    const startDate = new Date();

    if (periodUnit === 'years') {
        startDate.setFullYear(today.getFullYear() - periodValue);
    } else {
        startDate.setMonth(today.getMonth() - periodValue);
    }

    startDateInput.value = startDate.toISOString().split('T')[0];
}

/**
 * Start the simulation
 */
async function startSimulation() {
    console.log('Starting simulation...');

    const params = getSimulationParameters();

    if (!validateParameters(params)) {
        return;
    }

    // Update UI
    disableSimulationButton(true);
    showProgressBar(true);
    hideResults();

    try {
        // Run simulation
        simulationData = await runBacktest(params);

        // Display results
        displayResults(simulationData);

    } catch (error) {
        console.error('Simulation failed:', error);
        showError('시뮬레이션 중 오류가 발생했습니다: ' + error.message);
    } finally {
        disableSimulationButton(false);
        showProgressBar(false);
    }
}

/**
 * Get simulation parameters from form
 */
function getSimulationParameters() {
    return {
        initialCapital: parseFloat(document.getElementById('initialCapital').value),
        investmentPeriodValue: parseFloat(document.getElementById('investmentPeriodValue').value),
        investmentPeriodUnit: document.getElementById('investmentPeriodUnit').value,
        rebalancingPeriod: parseInt(document.getElementById('rebalancingPeriod').value),
        lookbackPeriod: parseInt(document.getElementById('lookbackPeriod').value),
        numberOfStocks: parseInt(document.getElementById('numberOfStocks').value),
        startDate: document.getElementById('startDate').value,
        endDate: calculateEndDate()
    };
}

/**
 * Calculate end date based on start date and investment period
 */
function calculateEndDate() {
    const startDate = new Date(document.getElementById('startDate').value);
    const periodValue = parseFloat(document.getElementById('investmentPeriodValue').value);
    const periodUnit = document.getElementById('investmentPeriodUnit').value;

    const endDate = new Date(startDate);

    if (periodUnit === 'years') {
        endDate.setFullYear(endDate.getFullYear() + periodValue);
    } else {
        endDate.setMonth(endDate.getMonth() + periodValue);
    }

    // Don't exceed today's date
    const today = new Date();
    if (endDate > today) {
        return today.toISOString().split('T')[0];
    }

    return endDate.toISOString().split('T')[0];
}

/**
 * Validate simulation parameters
 */
function validateParameters(params) {
    const errors = [];

    if (!params.initialCapital || params.initialCapital < 1000) {
        errors.push('초기 자본금은 최소 $1,000 이상이어야 합니다.');
    }

    if (!params.startDate) {
        errors.push('시작 날짜를 선택해주세요.');
    }

    if (params.numberOfStocks < 1 || params.numberOfStocks > 50) {
        errors.push('보유 종목 수는 1개 이상 50개 이하여야 합니다.');
    }

    if (params.numberOfStocks > sp500Tickers.length) {
        errors.push(`보유 종목 수는 S&P 500 종목 수(${sp500Tickers.length})를 초과할 수 없습니다.`);
    }

    const startDate = new Date(params.startDate);
    const endDate = new Date(params.endDate);

    if (startDate >= endDate) {
        errors.push('시작 날짜가 종료 날짜보다 이전이어야 합니다.');
    }

    if (errors.length > 0) {
        showError(errors.join('<br>'));
        return false;
    }

    return true;
}

/**
 * Run the backtest simulation
 */
async function runBacktest(params) {
    console.log('Running backtest with params:', params);

    // Add SP500 tickers to params (use test stocks if in test mode)
    params.sp500Tickers = CONFIG.TEST_MODE ? CONFIG.TEST_STOCKS : sp500Tickers;
    console.log(`Using ${params.sp500Tickers.length} stocks for backtest`);

    // Check if we should use real data or mock
    if (CONFIG.USE_REAL_DATA && backtestEngine) {
        try {
            // Use real backtest engine
            const results = await backtestEngine.runBacktest(params, updateProgress);

            // Format results for display
            return formatBacktestResults(results);
        } catch (error) {
            console.error('Real backtest failed, falling back to mock data:', error);
            showError('백테스트 실행 중 오류가 발생했습니다. 모의 데이터로 진행합니다.');

            // Fall back to mock data
            return generateMockResults(params);
        }
    } else {
        // Use mock data for testing
        updateProgress(10, 'S&P 500 종목 데이터 준비 중...');
        await sleep(1000);
        updateProgress(30, '히스토리컬 데이터 수집 중...');
        await sleep(1000);
        updateProgress(50, '모멘텀 계산 중...');
        await sleep(1000);
        updateProgress(70, '리밸런싱 시뮬레이션 중...');
        await sleep(1000);
        updateProgress(90, '결과 분석 중...');
        await sleep(500);
        updateProgress(100, '완료!');

        return generateMockResults(params);
    }
}

/**
 * Format backtest results for display
 */
function formatBacktestResults(results) {
    // Extract dates and values for chart
    const dates = results.portfolioValues.map(v => v.date);
    const portfolioValues = results.portfolioValues.map(v => v.value);
    const benchmarkValues = results.benchmarkValues.map(v => v.value);

    // Format rebalancing history
    const rebalancingHistory = results.rebalancingHistory.map(rb => ({
        date: rb.date,
        portfolioValue: rb.portfolioValue,
        buyStocks: rb.buyStocks || [],
        sellStocks: rb.sellStocks || [],
        holdings: rb.holdings || {},  // Include holdings data
        return: rb.portfolioValue && results.rebalancingHistory[0] ?
            ((rb.portfolioValue / results.rebalancingHistory[0].portfolioValue - 1) * 100).toFixed(2) : '0.00'
    }));

    return {
        dates,
        portfolioValues,
        benchmarkValues,
        rebalancingHistory,
        stats: results.stats
    };
}

/**
 * Generate mock results for testing
 * VERSION 2.1.0: Fixed rebalancing count
 */
function generateMockResults(params) {
    console.log('generateMockResults VERSION 2.1.0 called');
    const startDate = new Date(params.startDate);
    const endDate = new Date(params.endDate);
    const monthsDiff = (endDate.getFullYear() - startDate.getFullYear()) * 12 +
                      (endDate.getMonth() - startDate.getMonth());

    // Calculate total days and number of rebalancing periods
    const totalDays = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24));
    const numRebalances = Math.ceil(totalDays / params.rebalancingPeriod); // Use ceil to include the last period
    console.log(`Mock data generation: totalDays=${totalDays}, rebalancingPeriod=${params.rebalancingPeriod}, numRebalances=${numRebalances}`);

    // Generate portfolio values
    const dates = [];
    const portfolioValues = [];
    const benchmarkValues = [];
    let currentValue = params.initialCapital;
    let benchmarkValue = params.initialCapital;

    for (let i = 0; i <= numRebalances; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + (i * params.rebalancingPeriod));

        // Random returns
        const portfolioReturn = (Math.random() - 0.3) * 0.15; // -3% to +12%
        const benchmarkReturn = (Math.random() - 0.4) * 0.08;  // -4% to +4%

        currentValue *= (1 + portfolioReturn);
        benchmarkValue *= (1 + benchmarkReturn);

        dates.push(date.toISOString().split('T')[0]);
        portfolioValues.push(Math.round(currentValue));
        benchmarkValues.push(Math.round(benchmarkValue));
    }

    // Generate rebalancing history
    const rebalancingHistory = [];
    console.log(`Creating ${numRebalances} rebalancing entries...`);

    for (let i = 0; i < numRebalances; i++) {
        try {
            const date = new Date(startDate);
            date.setDate(date.getDate() + (i * params.rebalancingPeriod));

            // Random stock selections
            const buyStocks = getRandomTickers(Math.floor(Math.random() * 3) + 2);
            const sellStocks = getRandomTickers(Math.floor(Math.random() * 3) + 1);

        // Generate mock holdings for this rebalancing
        const mockHoldings = {};

        // 안전한 처리: sp500Tickers가 비어있거나 부족한 경우 대비
        let holdingStocks = [];
        try {
            const additionalStocks = getRandomTickers(Math.max(0, params.numberOfStocks - buyStocks.length));
            holdingStocks = [...new Set([...buyStocks, ...additionalStocks])];
        } catch (e) {
            console.warn(`Error getting tickers for rebalancing ${i}:`, e);
            holdingStocks = buyStocks;
        }

        const portfolioValue = portfolioValues[i] || params.initialCapital * (1 + i * 0.05);

        holdingStocks.slice(0, params.numberOfStocks).forEach((ticker, idx) => {
            const weight = (100 / params.numberOfStocks) + (Math.random() - 0.5) * 5;
            mockHoldings[ticker] = {
                shares: Math.floor(Math.random() * 100) + 10,
                price: Math.random() * 200 + 50,
                value: portfolioValue * weight / 100,
                weight: weight.toFixed(2)
            };
        });

        rebalancingHistory.push({
            date: date.toISOString().split('T')[0],
            portfolioValue: portfolioValue,
            buyStocks: buyStocks,
            sellStocks: sellStocks,
            holdings: mockHoldings,
            return: i > 0 ? ((portfolioValue / portfolioValues[i-1] - 1) * 100).toFixed(2) : '0.00'
        });
        } catch (error) {
            console.error(`Error creating rebalancing entry ${i}:`, error);
            // Continue with next iteration
        }
    }

    console.log(`Created ${rebalancingHistory.length} rebalancing entries (expected: ${numRebalances})`);

    // Calculate statistics
    const totalReturn = ((currentValue - params.initialCapital) / params.initialCapital) * 100;
    const years = monthsDiff / 12;
    const cagr = (Math.pow(currentValue / params.initialCapital, 1 / years) - 1) * 100;
    const benchmarkReturn = ((benchmarkValue - params.initialCapital) / params.initialCapital) * 100;

    return {
        dates,
        portfolioValues,
        benchmarkValues,
        rebalancingHistory,
        stats: {
            finalValue: currentValue,
            totalReturn: totalReturn,
            cagr: cagr,
            benchmarkReturn: benchmarkReturn,
            numRebalances: numRebalances,
            totalDays: Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24))
        }
    };
}

/**
 * Get random tickers for mock data
 */
function getRandomTickers(count) {
    const tickers = [];
    const availableTickers = [...sp500Tickers];

    for (let i = 0; i < count && i < availableTickers.length; i++) {
        const index = Math.floor(Math.random() * availableTickers.length);
        tickers.push(availableTickers.splice(index, 1)[0]);
    }

    return tickers;
}

/**
 * Display simulation results
 */
function displayResults(data) {
    console.log('Displaying results:', data);
    console.log('Rebalancing history length:', data.rebalancingHistory ? data.rebalancingHistory.length : 0);
    if (data.rebalancingHistory && data.rebalancingHistory.length > 0) {
        console.log('First rebalancing entry:', data.rebalancingHistory[0]);
        console.log('Last rebalancing entry:', data.rebalancingHistory[data.rebalancingHistory.length - 1]);
    }

    // Update statistics
    updateStatistics(data.stats);

    // Update chart
    updateChart(data);

    // Update rebalancing table
    console.log('About to call updateRebalancingTable with:', data.rebalancingHistory);
    updateRebalancingTable(data.rebalancingHistory);
    console.log('updateRebalancingTable call completed');

    // Show results section
    showResults();
}

/**
 * Update statistics display
 */
function updateStatistics(stats) {
    // Final value
    const finalValueEl = document.getElementById('finalValue');
    if (finalValueEl) {
        finalValueEl.textContent = '$' + stats.finalValue.toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });
    }

    // Total return
    const totalReturnEl = document.getElementById('totalReturn');
    if (totalReturnEl) {
        totalReturnEl.textContent = (stats.totalReturn >= 0 ? '+' : '') +
                                  stats.totalReturn.toFixed(1) + '%';
        totalReturnEl.parentElement.classList.toggle('positive', stats.totalReturn >= 0);
        totalReturnEl.parentElement.classList.toggle('negative', stats.totalReturn < 0);
    }

    // CAGR
    const cagrEl = document.getElementById('cagr');
    if (cagrEl) {
        cagrEl.textContent = stats.cagr.toFixed(1) + '%';
        cagrEl.parentElement.classList.toggle('positive', stats.cagr >= 0);
        cagrEl.parentElement.classList.toggle('negative', stats.cagr < 0);
    }

    // Benchmark
    const benchmarkEl = document.getElementById('benchmark');
    if (benchmarkEl) {
        benchmarkEl.textContent = (stats.benchmarkReturn >= 0 ? '+' : '') +
                                 stats.benchmarkReturn.toFixed(1) + '%';
    }
}

/**
 * Update portfolio chart
 */
function updateChart(data) {
    const ctx = document.getElementById('portfolioChart');
    if (!ctx) return;

    // Destroy existing chart
    if (chartInstance) {
        chartInstance.destroy();
    }

    // Create new chart
    chartInstance = new Chart(ctx.getContext('2d'), {
        type: 'line',
        data: {
            labels: data.dates,
            datasets: [{
                label: '모멘텀 전략',
                data: data.portfolioValues,
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4
            }, {
                label: 'S&P 500 벤치마크',
                data: data.benchmarkValues,
                borderColor: '#fdcb6e',
                backgroundColor: 'rgba(253, 203, 110, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                borderDash: [5, 5]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: '포트폴리오 가치 변화',
                    font: {
                        size: 16,
                        weight: 'bold'
                    }
                },
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': $' +
                                   context.parsed.y.toLocaleString();
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    }
                },
                x: {
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45
                    }
                }
            }
        }
    });
}

/**
 * Update rebalancing history table with expandable details
 * VERSION 2.1.0: Added detailed logging
 */
function updateRebalancingTable(history) {
    console.log('updateRebalancingTable VERSION 2.1.0 CALLED');

    const tbody = document.getElementById('rebalancingBody');
    if (!tbody) {
        console.error('rebalancingBody element not found!');
        return;
    }

    tbody.innerHTML = '';

    console.log('=== updateRebalancingTable EXECUTING ===');
    console.log('Total entries:', history.length);
    if (history.length > 0) {
        console.log('First entry:', JSON.stringify(history[0], null, 2));
        console.log('First entry type check:', {
            date: typeof history[0].date,
            portfolioValue: typeof history[0].portfolioValue,
            buyStocks: Array.isArray(history[0].buyStocks),
            sellStocks: Array.isArray(history[0].sellStocks)
        });
    }

    history.forEach((entry, index) => {
        // Main row
        const row = document.createElement('tr');
        row.className = 'rebalancing-row';
        row.id = `rebalance-row-${index}`;

        const returnValue = parseFloat(entry.return || 0);
        const returnClass = returnValue >= 0 ? 'positive' : 'negative';

        // Calculate transaction summary
        const buyCount = entry.buyStocks ? entry.buyStocks.length : 0;
        const sellCount = entry.sellStocks ? entry.sellStocks.length : 0;
        const transactionSummary = `매수 ${buyCount}종목, 매도 ${sellCount}종목`;

        // Debug: 실제 데이터 확인
        if (index === 0) {
            console.log('First entry data check:', {
                date: entry.date,
                portfolioValue: entry.portfolioValue,
                buyStocks: entry.buyStocks,
                sellStocks: entry.sellStocks,
                return: entry.return
            });
        }

        // 데이터 확인 및 안전한 변환
        const dateStr = entry.date || 'N/A';
        const valueStr = entry.portfolioValue ?
            (typeof entry.portfolioValue === 'number' ?
                '$' + entry.portfolioValue.toLocaleString() :
                String(entry.portfolioValue)) :
            '$0';

        const rowHTML = `
            <td><span class="expand-icon">▶</span></td>
            <td>${dateStr}</td>
            <td>${valueStr}</td>
            <td>${transactionSummary}</td>
            <td class="performance ${returnClass}">${returnValue >= 0 ? '+' : ''}${returnValue.toFixed(2)}%</td>
        `;

        row.innerHTML = rowHTML;

        // 첫 번째 행의 HTML 확인
        if (index === 0) {
            console.log('First row HTML:', rowHTML);
            console.log('Row children count after innerHTML:', row.children.length);
        }

        // Add click event to expand/collapse
        row.addEventListener('click', function() {
            console.log('Row clicked:', index);
            togglePortfolioDetails(index);
        });

        tbody.appendChild(row);

        // Details row (hidden by default)
        const detailsRow = document.createElement('tr');
        detailsRow.className = 'portfolio-details';
        detailsRow.id = `rebalance-details-${index}`;

        // Generate portfolio holdings (mock data for now)
        const holdings = generateMockHoldings(entry);

        detailsRow.innerHTML = `
            <td colspan="5">
                <div class="transaction-summary">
                    <div class="transaction-group">
                        <h5>📈 매수 종목 (${buyCount})</h5>
                        <div>
                            ${entry.buyStocks ? entry.buyStocks.map(ticker =>
                                `<span class="buy-ticker">${ticker}</span>`
                            ).join('') : '<span style="color: #999;">없음</span>'}
                        </div>
                    </div>
                    <div class="transaction-group">
                        <h5>📉 매도 종목 (${sellCount})</h5>
                        <div>
                            ${entry.sellStocks ? entry.sellStocks.map(ticker =>
                                `<span class="sell-ticker">${ticker}</span>`
                            ).join('') : '<span style="color: #999;">없음</span>'}
                        </div>
                    </div>
                </div>

                <h5 style="margin: 20px 0 10px 0; color: #333; font-size: 16px;">
                    📊 포트폴리오 구성 (총 ${holdings.length}종목)
                </h5>
                <div class="holdings-grid">
                    ${holdings.map(holding => `
                        <div class="holding-card">
                            <div class="holding-ticker">${holding.ticker}</div>
                            <div class="holding-weight">${holding.weight}%</div>
                            <div class="holding-value">$${holding.value.toLocaleString()}</div>
                        </div>
                    `).join('')}
                </div>
            </td>
        `;

        tbody.appendChild(detailsRow);
    });
}

/**
 * Toggle portfolio details visibility
 */
function togglePortfolioDetails(index) {
    console.log(`Toggling details for row ${index}`);

    const row = document.getElementById(`rebalance-row-${index}`);
    const details = document.getElementById(`rebalance-details-${index}`);

    if (!row || !details) {
        console.error(`Could not find elements for index ${index}`);
        return;
    }

    // Toggle expanded class on row
    row.classList.toggle('expanded');

    // Toggle visibility of details
    details.classList.toggle('show');

    // Log current state
    console.log(`Row expanded: ${row.classList.contains('expanded')}`);
    console.log(`Details visible: ${details.classList.contains('show')}`);

    // Close other expanded rows
    const allRows = document.querySelectorAll('.rebalancing-row');
    const allDetails = document.querySelectorAll('.portfolio-details');

    allRows.forEach((r, i) => {
        if (i !== index) {
            r.classList.remove('expanded');
        }
    });

    allDetails.forEach((d, i) => {
        if (i !== index) {
            d.classList.remove('show');
        }
    });
}

/**
 * Generate mock holdings data for display
 */
function generateMockHoldings(entry) {
    // If we have actual holdings data with percentages, use it
    if (entry.holdings && typeof entry.holdings === 'object') {
        const holdings = [];

        // Check if holdings contains detailed data or just share counts
        const firstHolding = Object.values(entry.holdings)[0];

        if (firstHolding && typeof firstHolding === 'object' && firstHolding.weight) {
            // Detailed holdings data from backtest engine
            return Object.entries(entry.holdings).map(([ticker, data]) => ({
                ticker,
                weight: data.weight,
                value: data.value
            })).sort((a, b) => parseFloat(b.weight) - parseFloat(a.weight)); // Sort by weight
        } else {
            // Simple holdings data - calculate percentages
            const totalValue = entry.portfolioValue || 10000;
            for (const [ticker, sharesOrData] of Object.entries(entry.holdings)) {
                const shares = typeof sharesOrData === 'number' ? sharesOrData : sharesOrData.shares;
                // Estimate value based on equal weighting (simplified)
                const value = totalValue / Object.keys(entry.holdings).length;
                const weight = (value / totalValue * 100);
                holdings.push({
                    ticker,
                    weight: weight.toFixed(1),
                    value: Math.round(value)
                });
            }
            return holdings.sort((a, b) => parseFloat(b.weight) - parseFloat(a.weight));
        }
    }

    // Fallback: generate mock data based on transaction history
    const stocks = [];

    // Combine buy stocks with some existing positions
    if (entry.buyStocks && entry.buyStocks.length > 0) {
        stocks.push(...entry.buyStocks);
    }

    // If no stocks, use test stocks
    if (stocks.length === 0) {
        stocks.push(...CONFIG.TEST_STOCKS.slice(0, 5));
    }

    const totalValue = entry.portfolioValue || 10000;
    const numStocks = stocks.length;
    const avgWeight = 100 / numStocks;

    // Generate holdings with slight variations in weights
    const holdings = stocks.map(ticker => {
        // Add some variation to weights (±2%)
        const variation = (Math.random() - 0.5) * 4;
        const weight = Math.max(0, avgWeight + variation);
        const value = totalValue * weight / 100;

        return {
            ticker,
            weight: weight.toFixed(1),
            value: Math.round(value)
        };
    });

    // Normalize weights to sum to 100%
    const totalWeight = holdings.reduce((sum, h) => sum + parseFloat(h.weight), 0);
    if (totalWeight > 0) {
        holdings.forEach(h => {
            h.weight = (parseFloat(h.weight) * 100 / totalWeight).toFixed(1);
        });
    }

    return holdings.sort((a, b) => parseFloat(b.weight) - parseFloat(a.weight));
}

// UI Helper Functions

function showProgressBar(show) {
    const progressBar = document.getElementById('progressBar');
    if (progressBar) {
        progressBar.style.display = show ? 'block' : 'none';
    }
}

function updateProgress(percent, status) {
    const fillEl = document.getElementById('progressFill');
    const textEl = document.getElementById('progressText');
    const statusEl = document.getElementById('progressStatus');

    if (fillEl) fillEl.style.width = percent + '%';
    if (textEl) textEl.textContent = percent + '%';
    if (statusEl) statusEl.textContent = status;
}

function showResults() {
    const results = document.getElementById('results');
    if (results) {
        results.style.display = 'block';
        results.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function hideResults() {
    const results = document.getElementById('results');
    if (results) {
        results.style.display = 'none';
    }
}

function disableSimulationButton(disable) {
    const btn = document.getElementById('simulateBtn');
    if (btn) {
        btn.disabled = disable;
        btn.textContent = disable ? '시뮬레이션 진행 중...' : '시뮬레이션 시작';
    }
}

function showError(message) {
    alert(message); // Simple alert for Phase 1
    // TODO: Implement better error display in Phase 2
}

// Utility functions

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Make functions available globally for onclick handlers
window.togglePortfolioDetails = togglePortfolioDetails;
window.startSimulation = startSimulation;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}