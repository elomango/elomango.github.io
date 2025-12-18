/**
 * Momentum Calculation Module
 * S&P 500 Momentum Rebalancing Tool
 */

class MomentumCalculator {
    constructor() {
        this.cache = new Map();
    }

    /**
     * Calculate momentum (return) for a single stock
     * @param {Object} data - Stock price data
     * @param {number} lookbackDays - Number of days to look back
     * @returns {number} - Percentage return
     */
    calculateSingleStockMomentum(data, lookbackDays) {
        if (!data || !data.prices || data.prices.length < 2) {
            return null;
        }

        // Get the most recent price
        const currentPrice = data.prices[data.prices.length - 1];

        // Find the price from lookbackDays ago
        let lookbackIndex = Math.max(0, data.prices.length - lookbackDays);
        const lookbackPrice = data.prices[lookbackIndex];

        if (!currentPrice || !lookbackPrice || lookbackPrice === 0) {
            return null;
        }

        // Calculate percentage return
        const momentum = ((currentPrice - lookbackPrice) / lookbackPrice) * 100;

        return momentum;
    }

    /**
     * Calculate momentum for multiple stocks
     * @param {Object} stocksData - Object with ticker as key and price data as value
     * @param {number} lookbackDays - Number of days to look back
     * @returns {Array} - Array of {ticker, momentum} sorted by momentum
     */
    calculateMultipleStocksMomentum(stocksData, lookbackDays) {
        const momentumScores = [];

        for (const [ticker, data] of Object.entries(stocksData)) {
            if (!data) continue;

            const momentum = this.calculateSingleStockMomentum(data, lookbackDays);

            if (momentum !== null) {
                momentumScores.push({
                    ticker,
                    momentum,
                    currentPrice: data.prices[data.prices.length - 1],
                    startPrice: data.prices[Math.max(0, data.prices.length - lookbackDays)]
                });
            }
        }

        // Sort by momentum (highest first)
        momentumScores.sort((a, b) => b.momentum - a.momentum);

        return momentumScores;
    }

    /**
     * Select top N stocks based on momentum
     * @param {Array} momentumScores - Array of momentum scores
     * @param {number} topN - Number of top stocks to select
     * @returns {Array} - Top N stocks
     */
    selectTopStocks(momentumScores, topN) {
        return momentumScores.slice(0, topN);
    }

    /**
     * Calculate momentum at a specific date
     * @param {Object} data - Stock price data
     * @param {string} targetDate - Date to calculate momentum at
     * @param {number} lookbackDays - Number of days to look back
     * @returns {number} - Momentum at target date
     */
    calculateMomentumAtDate(data, targetDate, lookbackDays) {
        if (!data || !data.dates || !data.prices) {
            return null;
        }

        const targetIndex = data.dates.indexOf(targetDate);
        if (targetIndex === -1 || targetIndex < lookbackDays) {
            return null;
        }

        const currentPrice = data.prices[targetIndex];
        const lookbackPrice = data.prices[targetIndex - lookbackDays];

        if (!currentPrice || !lookbackPrice || lookbackPrice === 0) {
            return null;
        }

        return ((currentPrice - lookbackPrice) / lookbackPrice) * 100;
    }

    /**
     * Get price at specific date
     * @param {Object} data - Stock price data
     * @param {string} date - Target date
     * @returns {number} - Price at date
     */
    getPriceAtDate(data, date) {
        if (!data || !data.dates || !data.prices) {
            return null;
        }

        const index = data.dates.indexOf(date);
        if (index === -1) {
            // Try to find the closest previous date
            for (let i = data.dates.length - 1; i >= 0; i--) {
                if (data.dates[i] <= date) {
                    return data.prices[i];
                }
            }
            return null;
        }

        return data.prices[index];
    }

    /**
     * Calculate portfolio statistics
     * @param {Array} portfolioHistory - Array of portfolio values over time
     * @returns {Object} - Portfolio statistics
     */
    calculatePortfolioStats(portfolioHistory, initialCapital) {
        if (!portfolioHistory || portfolioHistory.length < 2) {
            return null;
        }

        const finalValue = portfolioHistory[portfolioHistory.length - 1];
        const totalReturn = ((finalValue - initialCapital) / initialCapital) * 100;

        // Calculate max drawdown
        let maxDrawdown = 0;
        let peak = portfolioHistory[0];

        for (let i = 1; i < portfolioHistory.length; i++) {
            if (portfolioHistory[i] > peak) {
                peak = portfolioHistory[i];
            }
            const drawdown = ((peak - portfolioHistory[i]) / peak) * 100;
            if (drawdown > maxDrawdown) {
                maxDrawdown = drawdown;
            }
        }

        // Calculate volatility (standard deviation of returns)
        const returns = [];
        for (let i = 1; i < portfolioHistory.length; i++) {
            const dailyReturn = ((portfolioHistory[i] - portfolioHistory[i - 1]) /
                               portfolioHistory[i - 1]) * 100;
            returns.push(dailyReturn);
        }

        const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
        const variance = returns.reduce((sum, ret) =>
            sum + Math.pow(ret - avgReturn, 2), 0) / returns.length;
        const volatility = Math.sqrt(variance);

        // Calculate Sharpe Ratio (assuming 0% risk-free rate)
        const sharpeRatio = avgReturn / volatility;

        // Calculate CAGR
        const years = portfolioHistory.length / 252; // Assuming 252 trading days per year
        const cagr = (Math.pow(finalValue / initialCapital, 1 / years) - 1) * 100;

        return {
            finalValue,
            totalReturn,
            cagr,
            maxDrawdown,
            volatility,
            sharpeRatio,
            avgDailyReturn: avgReturn
        };
    }

    /**
     * Calculate transaction costs
     * @param {number} value - Transaction value
     * @param {number} feeRate - Fee rate (default 0.1%)
     * @returns {number} - Value after fees
     */
    calculateTransactionCost(value, feeRate = 0.001) {
        return value * feeRate;
    }

    /**
     * Rank stocks by various metrics
     * @param {Object} stocksData - Stock data
     * @param {string} metric - Metric to rank by ('momentum', 'volatility', 'sharpe')
     * @param {number} lookbackDays - Lookback period
     * @returns {Array} - Ranked stocks
     */
    rankStocksByMetric(stocksData, metric = 'momentum', lookbackDays = 20) {
        const rankings = [];

        for (const [ticker, data] of Object.entries(stocksData)) {
            if (!data || !data.prices || data.prices.length < lookbackDays) {
                continue;
            }

            let score;
            switch (metric) {
                case 'momentum':
                    score = this.calculateSingleStockMomentum(data, lookbackDays);
                    break;

                case 'volatility':
                    score = this.calculateVolatility(data, lookbackDays);
                    break;

                case 'sharpe':
                    const momentum = this.calculateSingleStockMomentum(data, lookbackDays);
                    const volatility = this.calculateVolatility(data, lookbackDays);
                    score = volatility > 0 ? momentum / volatility : 0;
                    break;

                default:
                    score = this.calculateSingleStockMomentum(data, lookbackDays);
            }

            if (score !== null) {
                rankings.push({ ticker, score });
            }
        }

        // Sort based on metric (higher is better for momentum and sharpe, lower for volatility)
        if (metric === 'volatility') {
            rankings.sort((a, b) => a.score - b.score);
        } else {
            rankings.sort((a, b) => b.score - a.score);
        }

        return rankings;
    }

    /**
     * Calculate volatility for a stock
     * @param {Object} data - Stock price data
     * @param {number} lookbackDays - Number of days to look back
     * @returns {number} - Volatility (standard deviation of returns)
     */
    calculateVolatility(data, lookbackDays) {
        if (!data || !data.prices || data.prices.length < lookbackDays + 1) {
            return null;
        }

        const startIndex = Math.max(0, data.prices.length - lookbackDays);
        const prices = data.prices.slice(startIndex);

        const returns = [];
        for (let i = 1; i < prices.length; i++) {
            const dailyReturn = (prices[i] - prices[i - 1]) / prices[i - 1];
            returns.push(dailyReturn);
        }

        if (returns.length === 0) {
            return null;
        }

        const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
        const variance = returns.reduce((sum, ret) =>
            sum + Math.pow(ret - avgReturn, 2), 0) / returns.length;

        return Math.sqrt(variance) * Math.sqrt(252) * 100; // Annualized volatility in percentage
    }
}

// Export for use in main app
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MomentumCalculator;
}