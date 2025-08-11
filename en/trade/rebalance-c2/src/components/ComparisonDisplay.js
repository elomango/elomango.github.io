export class ComparisonDisplay {
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