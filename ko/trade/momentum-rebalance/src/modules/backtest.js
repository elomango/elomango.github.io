/**
 * Backtesting Engine Module
 * S&P 500 Momentum Rebalancing Tool
 */

class BacktestEngine {
    constructor(yahooAPI, momentumCalculator) {
        this.yahooAPI = yahooAPI;
        this.momentumCalculator = momentumCalculator;
        this.portfolio = null;
        this.history = [];
    }

    /**
     * Run complete backtest
     */
    async runBacktest(params, progressCallback) {
        console.log('Starting backtest with params:', params);

        // Initialize portfolio
        this.portfolio = {
            cash: params.initialCapital,
            holdings: {}, // {ticker: shares}
            value: params.initialCapital
        };

        this.history = [];

        try {
            // Step 1: Get all rebalancing dates
            const rebalancingDates = this.generateRebalancingDates(
                params.startDate,
                params.endDate,
                params.rebalancingPeriod
            );

            console.log(`Generated ${rebalancingDates.length} rebalancing dates`);

            // Step 2: Fetch initial screening data for all S&P 500 stocks
            progressCallback(10, 'S&P 500 종목 초기 데이터 수집 중...');

            // Calculate date range for initial screening
            const screeningStartDate = new Date(params.startDate);
            screeningStartDate.setDate(screeningStartDate.getDate() - params.lookbackPeriod - 30);

            // Fetch data for all stocks
            const allStocksData = await this.yahooAPI.fetchMultipleStocks(
                params.sp500Tickers,
                screeningStartDate.toISOString().split('T')[0],
                params.endDate,
                (progress, message) => progressCallback(10 + progress * 0.4, message)
            );

            // Step 3: Run simulation for each rebalancing date
            progressCallback(50, '리밸런싱 시뮬레이션 실행 중...');

            const portfolioValues = [];
            const rebalancingHistory = [];
            let benchmarkData = null;

            for (let i = 0; i < rebalancingDates.length; i++) {
                const currentDate = rebalancingDates[i];
                const progress = 50 + (i / rebalancingDates.length) * 40;
                progressCallback(progress, `리밸런싱 ${i + 1}/${rebalancingDates.length} 실행 중...`);

                // Calculate momentum for all stocks at this date
                const momentumScores = this.calculateMomentumAtDate(
                    allStocksData,
                    currentDate,
                    params.lookbackPeriod
                );

                // Select top N stocks
                const topStocks = this.momentumCalculator.selectTopStocks(
                    momentumScores,
                    params.numberOfStocks
                );

                // Rebalance portfolio
                const rebalanceResult = await this.rebalancePortfolio(
                    topStocks,
                    allStocksData,
                    currentDate,
                    params.numberOfStocks
                );

                rebalancingHistory.push(rebalanceResult);

                // Track portfolio value
                if (i < rebalancingDates.length - 1) {
                    // Update portfolio value until next rebalancing
                    const nextDate = rebalancingDates[i + 1];
                    const dailyValues = this.trackPortfolioValue(
                        this.portfolio.holdings,
                        allStocksData,
                        currentDate,
                        nextDate
                    );
                    portfolioValues.push(...dailyValues);
                } else {
                    // Last rebalancing - track until end date
                    const dailyValues = this.trackPortfolioValue(
                        this.portfolio.holdings,
                        allStocksData,
                        currentDate,
                        params.endDate
                    );
                    portfolioValues.push(...dailyValues);
                }
            }

            // Step 4: Calculate benchmark (S&P 500 index)
            progressCallback(90, '벤치마크 계산 중...');

            // Use SPY as benchmark
            benchmarkData = await this.yahooAPI.fetchStockData('SPY', params.startDate, params.endDate);
            const benchmarkValues = this.calculateBenchmarkValues(
                benchmarkData,
                params.initialCapital
            );

            // Step 5: Calculate statistics
            progressCallback(95, '통계 분석 중...');

            const stats = this.calculateFinalStats(
                portfolioValues,
                benchmarkValues,
                params.initialCapital,
                rebalancingHistory
            );

            progressCallback(100, '완료!');

            return {
                portfolioValues,
                benchmarkValues,
                rebalancingHistory,
                stats,
                dates: portfolioValues.map(v => v.date)
            };

        } catch (error) {
            console.error('Backtest failed:', error);
            throw error;
        }
    }

    /**
     * Generate rebalancing dates
     */
    generateRebalancingDates(startDate, endDate, rebalancingPeriod) {
        const dates = [];
        const current = new Date(startDate);
        const end = new Date(endDate);

        while (current <= end) {
            dates.push(current.toISOString().split('T')[0]);
            current.setDate(current.getDate() + rebalancingPeriod);
        }

        return dates;
    }

    /**
     * Calculate momentum at specific date
     */
    calculateMomentumAtDate(allStocksData, targetDate, lookbackPeriod) {
        const momentumScores = [];

        for (const [ticker, data] of Object.entries(allStocksData)) {
            if (!data || !data.dates || !data.prices) continue;

            // Find the index of target date or closest previous date
            let targetIndex = -1;
            for (let i = data.dates.length - 1; i >= 0; i--) {
                if (data.dates[i] <= targetDate) {
                    targetIndex = i;
                    break;
                }
            }

            if (targetIndex < lookbackPeriod) continue;

            const currentPrice = data.prices[targetIndex];
            const lookbackPrice = data.prices[targetIndex - lookbackPeriod];

            if (currentPrice && lookbackPrice && lookbackPrice > 0) {
                const momentum = ((currentPrice - lookbackPrice) / lookbackPrice) * 100;
                momentumScores.push({
                    ticker,
                    momentum,
                    currentPrice,
                    date: data.dates[targetIndex]
                });
            }
        }

        // Sort by momentum
        momentumScores.sort((a, b) => b.momentum - a.momentum);
        return momentumScores;
    }

    /**
     * Rebalance portfolio
     */
    async rebalancePortfolio(topStocks, allStocksData, currentDate, numberOfStocks) {
        const targetValue = this.portfolio.value / numberOfStocks; // Equal weight
        const transactions = {
            buys: [],
            sells: [],
            date: currentDate
        };

        // First, sell stocks not in top N
        const currentHoldings = Object.keys(this.portfolio.holdings);
        const topTickers = topStocks.map(s => s.ticker);

        for (const ticker of currentHoldings) {
            if (!topTickers.includes(ticker)) {
                // Sell this stock
                const shares = this.portfolio.holdings[ticker];
                const price = this.getPriceAtDate(allStocksData[ticker], currentDate);

                if (price) {
                    const saleValue = shares * price;
                    this.portfolio.cash += saleValue;
                    delete this.portfolio.holdings[ticker];

                    transactions.sells.push({
                        ticker,
                        shares,
                        price,
                        value: saleValue
                    });
                }
            }
        }

        // Then, rebalance stocks in top N
        for (const stock of topStocks) {
            const ticker = stock.ticker;
            const price = this.getPriceAtDate(allStocksData[ticker], currentDate);

            if (!price) continue;

            const currentShares = this.portfolio.holdings[ticker] || 0;
            const currentValue = currentShares * price;
            const targetShares = Math.floor(targetValue / price);
            const shareDiff = targetShares - currentShares;

            if (shareDiff > 0) {
                // Buy more shares
                const buyValue = shareDiff * price;

                if (this.portfolio.cash >= buyValue) {
                    this.portfolio.cash -= buyValue;
                    this.portfolio.holdings[ticker] = targetShares;

                    transactions.buys.push({
                        ticker,
                        shares: shareDiff,
                        price,
                        value: buyValue
                    });
                }
            } else if (shareDiff < 0) {
                // Sell excess shares
                const sellShares = Math.abs(shareDiff);
                const sellValue = sellShares * price;

                this.portfolio.cash += sellValue;
                this.portfolio.holdings[ticker] = targetShares;

                transactions.sells.push({
                    ticker,
                    shares: sellShares,
                    price,
                    value: sellValue
                });
            }
        }

        // Update portfolio value
        this.updatePortfolioValue(allStocksData, currentDate);

        // Calculate portfolio composition percentages
        const holdingsWithPercentage = {};
        const totalValue = this.portfolio.value;

        for (const [ticker, shares] of Object.entries(this.portfolio.holdings)) {
            const price = this.getPriceAtDate(allStocksData[ticker], currentDate);
            if (price) {
                const value = shares * price;
                holdingsWithPercentage[ticker] = {
                    shares: shares,
                    price: price,
                    value: value,
                    weight: (value / totalValue * 100).toFixed(2)
                };
            }
        }

        return {
            date: currentDate,
            portfolioValue: this.portfolio.value,
            cash: this.portfolio.cash,
            holdings: holdingsWithPercentage,
            transactions,
            buyStocks: transactions.buys.map(b => b.ticker),
            sellStocks: transactions.sells.map(s => s.ticker)
        };
    }

    /**
     * Track portfolio value between rebalancing dates
     */
    trackPortfolioValue(holdings, allStocksData, startDate, endDate) {
        const values = [];
        const start = new Date(startDate);
        const end = new Date(endDate);

        // Get all unique dates from stock data
        const allDates = new Set();
        for (const data of Object.values(allStocksData)) {
            if (data && data.dates) {
                data.dates.forEach(date => {
                    if (date >= startDate && date <= endDate) {
                        allDates.add(date);
                    }
                });
            }
        }

        // Sort dates
        const sortedDates = Array.from(allDates).sort();

        // Calculate portfolio value for each date
        for (const date of sortedDates) {
            let totalValue = this.portfolio.cash;

            for (const [ticker, shares] of Object.entries(holdings)) {
                const price = this.getPriceAtDate(allStocksData[ticker], date);
                if (price) {
                    totalValue += shares * price;
                }
            }

            values.push({
                date,
                value: totalValue
            });
        }

        return values;
    }

    /**
     * Update portfolio value at specific date
     */
    updatePortfolioValue(allStocksData, date) {
        let totalValue = this.portfolio.cash;

        for (const [ticker, shares] of Object.entries(this.portfolio.holdings)) {
            const price = this.getPriceAtDate(allStocksData[ticker], date);
            if (price) {
                totalValue += shares * price;
            }
        }

        this.portfolio.value = totalValue;
        return totalValue;
    }

    /**
     * Get price at date
     */
    getPriceAtDate(stockData, date) {
        if (!stockData || !stockData.dates || !stockData.prices) {
            return null;
        }

        const index = stockData.dates.indexOf(date);
        if (index !== -1) {
            return stockData.prices[index];
        }

        // Find closest previous date
        for (let i = stockData.dates.length - 1; i >= 0; i--) {
            if (stockData.dates[i] <= date) {
                return stockData.prices[i];
            }
        }

        return null;
    }

    /**
     * Calculate benchmark values
     */
    calculateBenchmarkValues(benchmarkData, initialCapital) {
        if (!benchmarkData || !benchmarkData.prices || benchmarkData.prices.length === 0) {
            return [];
        }

        const initialPrice = benchmarkData.prices[0];
        const shares = initialCapital / initialPrice;

        return benchmarkData.prices.map((price, index) => ({
            date: benchmarkData.dates[index],
            value: price * shares
        }));
    }

    /**
     * Calculate final statistics
     */
    calculateFinalStats(portfolioValues, benchmarkValues, initialCapital, rebalancingHistory) {
        const finalValue = portfolioValues[portfolioValues.length - 1].value;
        const totalReturn = ((finalValue - initialCapital) / initialCapital) * 100;

        // Calculate CAGR
        const startDate = new Date(portfolioValues[0].date);
        const endDate = new Date(portfolioValues[portfolioValues.length - 1].date);
        const years = (endDate - startDate) / (365 * 24 * 60 * 60 * 1000);
        const cagr = (Math.pow(finalValue / initialCapital, 1 / years) - 1) * 100;

        // Calculate max drawdown
        let maxDrawdown = 0;
        let peak = portfolioValues[0].value;

        for (const point of portfolioValues) {
            if (point.value > peak) {
                peak = point.value;
            }
            const drawdown = ((peak - point.value) / peak) * 100;
            if (drawdown > maxDrawdown) {
                maxDrawdown = drawdown;
            }
        }

        // Calculate benchmark return
        let benchmarkReturn = 0;
        if (benchmarkValues && benchmarkValues.length > 0) {
            const benchmarkFinal = benchmarkValues[benchmarkValues.length - 1].value;
            benchmarkReturn = ((benchmarkFinal - initialCapital) / initialCapital) * 100;
        }

        // Calculate volatility
        const returns = [];
        for (let i = 1; i < portfolioValues.length; i++) {
            const dailyReturn = ((portfolioValues[i].value - portfolioValues[i - 1].value) /
                               portfolioValues[i - 1].value) * 100;
            returns.push(dailyReturn);
        }

        const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
        const variance = returns.reduce((sum, ret) =>
            sum + Math.pow(ret - avgReturn, 2), 0) / returns.length;
        const volatility = Math.sqrt(variance) * Math.sqrt(252); // Annualized

        // Calculate Sharpe Ratio (assuming 2% risk-free rate)
        const riskFreeRate = 2;
        const excessReturn = cagr - riskFreeRate;
        const sharpeRatio = volatility > 0 ? excessReturn / volatility : 0;

        return {
            finalValue,
            totalReturn,
            cagr,
            benchmarkReturn,
            maxDrawdown,
            volatility,
            sharpeRatio,
            totalRebalances: rebalancingHistory.length,
            totalDays: portfolioValues.length
        };
    }
}

// Export for use in main app
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BacktestEngine;
}