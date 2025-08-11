export class InputManager {
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
        const oneYearAgo = new Date(today);
        oneYearAgo.setFullYear(today.getFullYear() - 1);
        
        this.inputs.dateTo.value = today.toISOString().split('T')[0];
        this.inputs.dateFrom.value = oneYearAgo.toISOString().split('T')[0];
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
            errors.push('A Increase Threshold must be a positive number');
        }
        
        if (isNaN(params.aIncSell) || params.aIncSell <= 0 || params.aIncSell > 100) {
            errors.push('A Sell Ratio must be between 0 and 100');
        }
        
        if (isNaN(params.aDecGap) || params.aDecGap <= 0) {
            errors.push('A Decrease Threshold must be a positive number');
        }
        
        if (isNaN(params.bDecSell) || params.bDecSell <= 0 || params.bDecSell > 100) {
            errors.push('B Sell Ratio must be between 0 and 100');
        }
        
        return errors;
    }
}