export class ChartManager {
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
                    this.createDataset(tickerA, results.buyAndHoldA, 'rgb(255, 99, 132)', null, [5, 5]),
                    this.createDataset(tickerB, results.buyAndHoldB, 'rgb(54, 162, 235)', null, [5, 5]),
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
        return {
            label,
            data,
            borderColor,
            backgroundColor: 'transparent',
            yAxisID,
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 3,
            tension: 0,
            borderDash
        };
    }

    createPointDataset(label, data, backgroundColor, yAxisID = null) {
        return {
            label,
            data,
            borderColor: 'transparent',
            backgroundColor,
            pointStyle: 'circle',
            pointRadius: 5,
            pointHoverRadius: 7,
            showLine: false,
            yAxisID
        };
    }

    getSimulationChartOptions() {
        return {
            responsive: true,
            interaction: {
                mode: 'index',
                intersect: false,
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