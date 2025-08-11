export class ShannonStrategy {
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