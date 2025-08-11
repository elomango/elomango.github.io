import { StockDataAPI } from '../utils/api.js';
import { ShannonStrategy } from '../modules/strategy.js';
import { ChartManager } from '../components/ChartManager.js';
import { TableManager } from '../components/TableManager.js';
import { ComparisonDisplay } from '../components/ComparisonDisplay.js';
import { InputManager } from '../components/InputManager.js';
import { AdSpace } from '../components/AdSpace.js';

class Application {
    constructor() {
        this.api = new StockDataAPI();
        this.chartManager = new ChartManager();
        this.tableManager = new TableManager();
        this.comparisonDisplay = new ComparisonDisplay();
        this.inputManager = new InputManager();
        this.adSpace = new AdSpace();
        this.simulateBtn = document.getElementById('simulateBtn');
        
        this.initialize();
    }

    initialize() {
        this.setupEventListeners();
        this.setupAdSpaces();
    }

    setupEventListeners() {
        this.simulateBtn.addEventListener('click', () => this.runSimulation());
    }

    setupAdSpaces() {
        const ads = this.adSpace.setupAdPlaceholders();
        
        const container = document.querySelector('.container');
        container.insertBefore(ads.header, container.firstChild);
        
        const resultsSection = document.getElementById('results');
        if (resultsSection) {
            const contentAdPosition = resultsSection.querySelector('.chart-container:nth-child(2)');
            if (contentAdPosition) {
                resultsSection.insertBefore(ads.content, contentAdPosition.nextSibling);
            }
        }
        
        container.appendChild(ads.footer);
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
        document.getElementById('title').textContent = 
            `${tickerA} & ${tickerB} rebalance trading strategy`;
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

window.addEventListener('DOMContentLoaded', () => {
    window.app = new Application();
});