export class TableManager {
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