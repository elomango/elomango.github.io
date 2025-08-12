// Stock Data API
class StockDataAPI {
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

// Shannon Strategy
class ShannonStrategy {
    constructor(params) {
        this.params = params;
        this.rebalanceHistory = [];
        this.rebalancePoints = [];
    }

    run(dataA, dataB) {
        if (!this.validateData(dataA, dataB)) {
            return this.getEmptyResult();
        }

        const dates = dataA.map(d => d.date);
        const pricesA = dataA.map(d => d.close);
        const pricesB = dataB.map(d => d.close);

        if (!this.validatePrices(pricesA, pricesB)) {
            return this.getEmptyResult();
        }

        const result = this.executeStrategy(dates, pricesA, pricesB);
        return result;
    }

    validateData(dataA, dataB) {
        return dataA && dataB && dataA.length > 0 && dataB.length > 0;
    }

    validatePrices(pricesA, pricesB) {
        return !isNaN(pricesA[0]) && !isNaN(pricesB[0]) && 
               pricesA[0] > 0 && pricesB[0] > 0;
    }

    getEmptyResult() {
        return {
            dates: [],
            pricesA: [],
            pricesB: [],
            balanceRatios: [],
            portfolioValues: [],
            rebalanceHistory: [],
            rebalancePoints: [],
            buyAndHoldA: [],
            buyAndHoldB: []
        };
    }

    executeStrategy(dates, pricesA, pricesB) {
        let sharesA = this.params.seed / 2 / pricesA[0];
        let sharesB = this.params.seed / 2 / pricesB[0];
        let point1Index = 0;

        this.addInitialRebalance(dates[0], sharesA, sharesB, pricesA[0], pricesB[0]);

        const balanceRatios = [50];
        const portfolioValues = [this.params.seed];
        const rebalancePoints = [];
        const buyAndHoldA = [this.params.seed];
        const buyAndHoldB = [this.params.seed];

        const buyHoldSharesA = this.params.seed / pricesA[0];
        const buyHoldSharesB = this.params.seed / pricesB[0];

        for (let i = 1; i < dates.length; i++) {
            const rebalanceResult = this.checkAndRebalance(
                sharesA, sharesB, pricesA, pricesB, i, point1Index
            );

            if (rebalanceResult.rebalanced) {
                sharesA = rebalanceResult.sharesA;
                sharesB = rebalanceResult.sharesB;
                point1Index = i;

                this.addRebalance(
                    dates[i], sharesA, sharesB, pricesA[i], pricesB[i],
                    rebalanceResult.type
                );

                rebalancePoints.push({
                    index: i,
                    type: rebalanceResult.type
                });
            }

            const totalValue = sharesA * pricesA[i] + sharesB * pricesB[i];
            const ratioA = (sharesA * pricesA[i] / totalValue) * 100;

            balanceRatios.push(ratioA);
            portfolioValues.push(totalValue);
            buyAndHoldA.push(buyHoldSharesA * pricesA[i]);
            buyAndHoldB.push(buyHoldSharesB * pricesB[i]);
        }

        this.addFinalRebalance(
            dates[dates.length - 1],
            sharesA, sharesB,
            pricesA[pricesA.length - 1],
            pricesB[pricesB.length - 1]
        );

        return {
            dates,
            pricesA,
            pricesB,
            balanceRatios,
            portfolioValues,
            rebalanceHistory: this.rebalanceHistory,
            rebalancePoints,
            buyAndHoldA,
            buyAndHoldB
        };
    }

    checkAndRebalance(sharesA, sharesB, pricesA, pricesB, currentIndex, point1Index) {
        const currentValueA = sharesA * pricesA[currentIndex];
        const currentValueB = sharesB * pricesB[currentIndex];
        const percentChangeA = ((pricesA[currentIndex] - pricesA[point1Index]) / pricesA[point1Index]) * 100;

        let rebalanced = false;
        let type = '';
        let newSharesA = sharesA;
        let newSharesB = sharesB;

        if (percentChangeA >= this.params.aIncGap) {
            const sellValueA = currentValueA * (this.params.aIncSell / 100);
            newSharesA -= sellValueA / pricesA[currentIndex];
            newSharesB += sellValueA / pricesB[currentIndex];
            rebalanced = true;
            type = 'increase';
        } else if (percentChangeA <= -this.params.aDecGap) {
            const sellValueB = currentValueB * (this.params.bDecSell / 100);
            newSharesB -= sellValueB / pricesB[currentIndex];
            newSharesA += sellValueB / pricesA[currentIndex];
            rebalanced = true;
            type = 'decrease';
        }

        return {
            rebalanced,
            type,
            sharesA: newSharesA,
            sharesB: newSharesB
        };
    }

    addInitialRebalance(date, sharesA, sharesB, priceA, priceB) {
        this.rebalanceHistory.push({
            no: 1,
            date,
            sharesA,
            sharesB,
            priceA,
            priceB,
            ratioA: 50,
            value: this.params.seed,
            performance: 0,
            type: 'initial'
        });
    }

    addRebalance(date, sharesA, sharesB, priceA, priceB, type) {
        const totalValue = sharesA * priceA + sharesB * priceB;
        const ratioA = (sharesA * priceA / totalValue) * 100;
        const performance = ((totalValue - this.params.seed) / this.params.seed) * 100;

        this.rebalanceHistory.push({
            no: this.rebalanceHistory.length + 1,
            date,
            sharesA,
            sharesB,
            priceA,
            priceB,
            ratioA,
            value: totalValue,
            performance,
            type
        });
    }

    addFinalRebalance(date, sharesA, sharesB, priceA, priceB) {
        const totalValue = sharesA * priceA + sharesB * priceB;
        const ratioA = (sharesA * priceA / totalValue) * 100;
        const performance = ((totalValue - this.params.seed) / this.params.seed) * 100;

        this.rebalanceHistory.push({
            no: this.rebalanceHistory.length + 1,
            date,
            sharesA,
            sharesB,
            priceA,
            priceB,
            ratioA,
            value: totalValue,
            performance,
            type: 'final'
        });
    }
}

// Chart Manager
class ChartManager {
    constructor() {
        this.simulationChart = null;
        this.valueChart = null;
    }

    destroy() {
        if (this.simulationChart) {
            this.simulationChart.destroy();
            this.simulationChart = null;
        }
        if (this.valueChart) {
            this.valueChart.destroy();
            this.valueChart = null;
        }
    }

    updateCharts(results, tickerA, tickerB) {
        this.destroy();
        this.createSimulationChart(results, tickerA, tickerB);
        this.createValueChart(results, tickerA, tickerB);
    }

    createSimulationChart(results, tickerA, tickerB) {
        const ctx = document.getElementById('simulationChart').getContext('2d');
        
        const rebalanceIncrease = this.getRebalancePoints(results, 'increase', results.balanceRatios);
        const rebalanceDecrease = this.getRebalancePoints(results, 'decrease', results.balanceRatios);

        this.simulationChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: results.dates,
                datasets: [
                    this.createDataset(tickerA, results.pricesA, 'rgb(255, 99, 132)', 'y-price'),
                    this.createDataset(tickerB, results.pricesB, 'rgb(54, 162, 235)', 'y-price'),
                    this.createDataset('Rebalance', results.balanceRatios, 'rgb(75, 192, 192)', 'y-percentage'),
                    this.createPointDataset('Rebalance (Increase)', rebalanceIncrease, 'red', 'y-percentage'),
                    this.createPointDataset('Rebalance (Decrease)', rebalanceDecrease, 'green', 'y-percentage')
                ]
            },
            options: this.getSimulationChartOptions()
        });
    }

    createValueChart(results, tickerA, tickerB) {
        const ctx = document.getElementById('valueChart').getContext('2d');
        
        const valueRebalanceIncrease = this.getRebalancePoints(results, 'increase', results.portfolioValues);
        const valueRebalanceDecrease = this.getRebalancePoints(results, 'decrease', results.portfolioValues);

        this.valueChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: results.dates,
                datasets: [
                    this.createDataset('Rebalance', results.portfolioValues, 'rgb(153, 102, 255)'),
                    this.createDataset(tickerA, results.buyAndHoldA, 'rgb(255, 159, 64)'),
                    this.createDataset(tickerB, results.buyAndHoldB, 'rgb(54, 162, 235)'),
                    this.createPointDataset('Rebalance (Increase)', valueRebalanceIncrease, 'red'),
                    this.createPointDataset('Rebalance (Decrease)', valueRebalanceDecrease, 'green')
                ]
            },
            options: this.getValueChartOptions()
        });
    }

    getRebalancePoints(results, type, values) {
        return results.rebalancePoints
            .filter(p => p.type === type)
            .map(p => ({
                x: results.dates[p.index],
                y: values[p.index]
            }));
    }

    createDataset(label, data, borderColor, yAxisID = null, borderDash = null) {
        const dataset = {
            label,
            data,
            borderColor,
            backgroundColor: 'transparent',
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 3,
            tension: 0
        };
        
        if (yAxisID) {
            dataset.yAxisID = yAxisID;
        }
        
        // Remove borderDash - use solid lines only (per style guide)
        
        return dataset;
    }

    createPointDataset(label, data, backgroundColor, yAxisID = null) {
        const dataset = {
            label,
            data,
            borderColor: 'transparent',
            backgroundColor,
            pointStyle: 'circle',
            pointRadius: 5,
            pointHoverRadius: 7,
            showLine: false
        };
        
        if (yAxisID) {
            dataset.yAxisID = yAxisID;
        }
        
        return dataset;
    }

    getSimulationChartOptions() {
        return {
            responsive: true,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                title: {
                    display: true,
                    text: '시뮬레이션',
                    align: 'start',
                    font: {
                        size: 16,
                        weight: 'bold'
                    },
                    padding: {
                        bottom: 20
                    }
                },
                legend: {
                    display: true,
                    position: 'top',
                    align: 'end',
                    labels: {
                        usePointStyle: true,
                        pointStyleWidth: 15,
                        boxHeight: 6,
                        generateLabels: function(chart) {
                            const original = Chart.defaults.plugins.legend.labels.generateLabels;
                            const labels = original.call(this, chart);
                            labels.forEach((label) => {
                                // Check if it's a rebalance point dataset
                                if (label.text.includes('Rebalance (')) {
                                    label.pointStyle = 'circle';
                                } else {
                                    label.pointStyle = 'line';
                                }
                            });
                            return labels;
                        }
                    },
                    onClick: function(e, legendItem, legend) {
                        const index = legendItem.datasetIndex;
                        const chart = legend.chart;
                        const meta = chart.getDatasetMeta(index);
                        meta.hidden = meta.hidden === null ? !chart.data.datasets[index].hidden : null;
                        chart.update();
                    }
                },
                tooltip: {
                    enabled: true,
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: 'white',
                    bodyColor: 'white',
                    borderColor: 'white',
                    borderWidth: 1
                }
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Date'
                    }
                },
                'y-price': {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Price'
                    }
                },
                'y-percentage': {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Percentage (%)'
                    },
                    min: 0,
                    max: 100,
                    grid: {
                        drawOnChartArea: false,
                    },
                }
            }
        };
    }

    getValueChartOptions() {
        return {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: '가치',
                    align: 'start',
                    font: {
                        size: 16,
                        weight: 'bold'
                    },
                    padding: {
                        bottom: 20
                    }
                },
                legend: {
                    display: true,
                    position: 'top',
                    align: 'end',
                    labels: {
                        usePointStyle: true,
                        pointStyleWidth: 15,
                        boxHeight: 6,
                        generateLabels: function(chart) {
                            const original = Chart.defaults.plugins.legend.labels.generateLabels;
                            const labels = original.call(this, chart);
                            labels.forEach((label) => {
                                // Check if it's a rebalance point dataset
                                if (label.text.includes('Rebalance (')) {
                                    label.pointStyle = 'circle';
                                } else {
                                    label.pointStyle = 'line';
                                }
                            });
                            return labels;
                        }
                    },
                    onClick: function(e, legendItem, legend) {
                        const index = legendItem.datasetIndex;
                        const chart = legend.chart;
                        const meta = chart.getDatasetMeta(index);
                        meta.hidden = meta.hidden === null ? !chart.data.datasets[index].hidden : null;
                        chart.update();
                    }
                },
                tooltip: {
                    enabled: true,
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: 'white',
                    bodyColor: 'white',
                    borderColor: 'white',
                    borderWidth: 1
                }
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Date'
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Value'
                    }
                }
            }
        };
    }
}

// Table Manager
class TableManager {
    constructor() {
        this.tbody = document.getElementById('resultsBody');
    }

    updateTable(rebalanceHistory, tickerA, tickerB) {
        this.updateHeaders(tickerA, tickerB);
        this.clearTable();
        this.populateTable(rebalanceHistory);
    }

    updateHeaders(tickerA, tickerB) {
        document.getElementById('tickerACountHeader').textContent = `${tickerA} Count`;
        document.getElementById('tickerBCountHeader').textContent = `${tickerB} Count`;
        document.getElementById('tickerAPriceHeader').textContent = `${tickerA} Price`;
        document.getElementById('tickerBPriceHeader').textContent = `${tickerB} Price`;
        document.getElementById('tickerARatioHeader').textContent = `${tickerA} Ratio`;
    }

    clearTable() {
        this.tbody.innerHTML = '';
    }

    populateTable(rebalanceHistory) {
        rebalanceHistory.forEach(entry => {
            const row = this.createRow(entry);
            this.tbody.appendChild(row);
        });
    }

    createRow(entry) {
        const row = document.createElement('tr');
        
        const cells = [
            entry.no,
            entry.date,
            entry.sharesA.toFixed(2),
            entry.sharesB.toFixed(2),
            `$${entry.priceA.toFixed(2)}`,
            `$${entry.priceB.toFixed(2)}`,
            `${entry.ratioA.toFixed(2)}%`,
            `$${entry.value.toFixed(2)}`,
            `${entry.performance >= 0 ? '+' : ''}${entry.performance.toFixed(2)}%`
        ];

        cells.forEach(content => {
            const cell = document.createElement('td');
            cell.textContent = content;
            row.appendChild(cell);
        });

        this.applyRowStyle(row, entry.type);
        return row;
    }

    applyRowStyle(row, type) {
        switch(type) {
            case 'increase':
                row.style.backgroundColor = '#ffe6e6';
                break;
            case 'decrease':
                row.style.backgroundColor = '#e6ffe6';
                break;
            case 'final':
                row.style.backgroundColor = '#f0f0f0';
                row.style.fontWeight = 'bold';
                break;
        }
    }
}

// Comparison Display
class ComparisonDisplay {
    calculateBuyAndHoldPerformances(dataA, dataB, initialCapital) {
        if (!dataA || !dataB || dataA.length === 0 || dataB.length === 0) {
            return {
                tickerAOnly: 0,
                tickerBOnly: 0
            };
        }

        const initialPriceA = dataA[0].close;
        const finalPriceA = dataA[dataA.length - 1].close;
        const initialPriceB = dataB[0].close;
        const finalPriceB = dataB[dataB.length - 1].close;

        const sharesA = initialCapital / initialPriceA;
        const finalValueA = sharesA * finalPriceA;
        const performanceA = ((finalValueA - initialCapital) / initialCapital) * 100;

        const sharesB = initialCapital / initialPriceB;
        const finalValueB = sharesB * finalPriceB;
        const performanceB = ((finalValueB - initialCapital) / initialCapital) * 100;

        return {
            tickerAOnly: performanceA,
            tickerBOnly: performanceB
        };
    }

    update(dataA, dataB, rebalanceHistory, tickerA, tickerB, initialCapital) {
        this.updateTitles(tickerA, tickerB);
        
        const buyHoldPerformances = this.calculateBuyAndHoldPerformances(
            dataA, dataB, initialCapital
        );
        
        const rebalancePerformance = rebalanceHistory.length > 0 ? 
            rebalanceHistory[rebalanceHistory.length - 1].performance : 0;
        
        this.updatePerformanceValues(
            buyHoldPerformances.tickerAOnly,
            buyHoldPerformances.tickerBOnly,
            rebalancePerformance
        );
    }

    updateTitles(tickerA, tickerB) {
        document.getElementById('tickerAOnlyTitle').textContent = `Holding Only ${tickerA}`;
        document.getElementById('tickerBOnlyTitle').textContent = `Holding Only ${tickerB}`;
    }

    updatePerformanceValues(performanceA, performanceB, rebalancePerformance) {
        document.getElementById('tickerAOnlyPerformance').textContent = 
            this.formatPerformance(performanceA);
        document.getElementById('tickerBOnlyPerformance').textContent = 
            this.formatPerformance(performanceB);
        document.getElementById('rebalancePerformance').textContent = 
            this.formatPerformance(rebalancePerformance);
    }

    formatPerformance(value) {
        return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
    }
}

// Input Manager
class InputManager {
    constructor() {
        this.inputs = {
            dateFrom: document.getElementById('dateFrom'),
            dateTo: document.getElementById('dateTo'),
            seed: document.getElementById('seed'),
            tickerA: document.getElementById('tickerA'),
            tickerB: document.getElementById('tickerB'),
            aIncGap: document.getElementById('aIncGap'),
            aIncSell: document.getElementById('aIncSell'),
            aDecGap: document.getElementById('aDecGap'),
            bDecSell: document.getElementById('bDecSell')
        };
        
        this.setDefaultDates();
    }

    setDefaultDates() {
        const today = new Date();
        const fourYearsAgo = new Date(today);
        fourYearsAgo.setFullYear(today.getFullYear() - 4);
        
        this.inputs.dateTo.value = today.toISOString().split('T')[0];
        this.inputs.dateFrom.value = fourYearsAgo.toISOString().split('T')[0];
    }

    getParameters() {
        return {
            dateFrom: this.inputs.dateFrom.value,
            dateTo: this.inputs.dateTo.value,
            seed: parseFloat(this.inputs.seed.value),
            tickerA: this.inputs.tickerA.value,
            tickerB: this.inputs.tickerB.value,
            aIncGap: parseFloat(this.inputs.aIncGap.value),
            aIncSell: parseFloat(this.inputs.aIncSell.value),
            aDecGap: parseFloat(this.inputs.aDecGap.value),
            bDecSell: parseFloat(this.inputs.bDecSell.value)
        };
    }

    validateParameters(params) {
        const errors = [];
        
        if (!params.dateFrom || !params.dateTo) {
            errors.push('Please select valid date range');
        }
        
        if (new Date(params.dateFrom) >= new Date(params.dateTo)) {
            errors.push('Start date must be before end date');
        }
        
        if (isNaN(params.seed) || params.seed <= 0) {
            errors.push('Initial capital must be a positive number');
        }
        
        if (!params.tickerA || !params.tickerB) {
            errors.push('Please enter valid ticker symbols');
        }
        
        if (isNaN(params.aIncGap) || params.aIncGap <= 0) {
            errors.push('L Increase Threshold must be a positive number');
        }
        
        if (isNaN(params.aIncSell) || params.aIncSell <= 0 || params.aIncSell > 100) {
            errors.push('L Sell Ratio must be between 0 and 100');
        }
        
        if (isNaN(params.aDecGap) || params.aDecGap <= 0) {
            errors.push('L Decrease Threshold must be a positive number');
        }
        
        if (isNaN(params.bDecSell) || params.bDecSell <= 0 || params.bDecSell > 100) {
            errors.push('B Sell Ratio must be between 0 and 100');
        }
        
        return errors;
    }
}

// Main Application
class Application {
    constructor() {
        this.api = new StockDataAPI();
        this.chartManager = new ChartManager();
        this.tableManager = new TableManager();
        this.comparisonDisplay = new ComparisonDisplay();
        this.inputManager = new InputManager();
        this.simulateBtn = document.getElementById('simulateBtn');
        
        this.initialize();
    }

    initialize() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.simulateBtn.addEventListener('click', () => this.runSimulation());
    }

    async runSimulation() {
        this.setButtonState(true);
        
        try {
            const params = this.inputManager.getParameters();
            const errors = this.inputManager.validateParameters(params);
            
            if (errors.length > 0) {
                alert(errors.join('\n'));
                return;
            }
            
            this.updateTitle(params.tickerA, params.tickerB);
            
            const [dataA, dataB] = await this.fetchData(params);
            
            if (!this.validateData(dataA, dataB)) {
                alert('Failed to fetch stock data. Please try again.');
                return;
            }
            
            const alignedData = this.alignData(dataA, dataB);
            const results = this.runStrategy(alignedData.dataA, alignedData.dataB, params);
            
            this.displayResults(results, alignedData, params);
            
        } catch (error) {
            console.error('Simulation error:', error);
            alert('Error during simulation. Please check the console for details.');
        } finally {
            this.setButtonState(false);
        }
    }

    setButtonState(isRunning) {
        this.simulateBtn.disabled = isRunning;
        this.simulateBtn.textContent = isRunning ? 'Simulating...' : 'Start Simulation';
    }

    updateTitle(tickerA, tickerB) {
        // Keep the title fixed as "Rebalance C2 Trading Strategy"
        // No longer updating based on ticker values
    }

    async fetchData(params) {
        const dataA = await this.api.fetchStockData(
            params.tickerA, params.dateFrom, params.dateTo
        );
        const dataB = await this.api.fetchStockData(
            params.tickerB, params.dateFrom, params.dateTo
        );
        
        console.log('Data A:', dataA.slice(0, 5));
        console.log('Data B:', dataB.slice(0, 5));
        
        return [dataA, dataB];
    }

    validateData(dataA, dataB) {
        return dataA && dataB && dataA.length > 0 && dataB.length > 0;
    }

    alignData(dataA, dataB) {
        const minLength = Math.min(dataA.length, dataB.length);
        return {
            dataA: dataA.slice(0, minLength),
            dataB: dataB.slice(0, minLength)
        };
    }

    runStrategy(dataA, dataB, params) {
        const strategy = new ShannonStrategy(params);
        return strategy.run(dataA, dataB);
    }

    displayResults(results, alignedData, params) {
        this.chartManager.updateCharts(results, params.tickerA, params.tickerB);
        this.tableManager.updateTable(results.rebalanceHistory, params.tickerA, params.tickerB);
        this.comparisonDisplay.update(
            alignedData.dataA, 
            alignedData.dataB, 
            results.rebalanceHistory,
            params.tickerA, 
            params.tickerB, 
            params.seed
        );
        
        document.getElementById('results').style.display = 'block';
    }
}

// Initialize application when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
    window.app = new Application();
    console.log('Application initialized');
});