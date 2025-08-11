let simulationChart = null;
let valueChart = null;

function setDefaultDates() {
    const today = new Date();
    const oneYearAgo = new Date(today);
    oneYearAgo.setFullYear(today.getFullYear() - 1);
    
    document.getElementById('dateTo').value = today.toISOString().split('T')[0];
    document.getElementById('dateFrom').value = oneYearAgo.toISOString().split('T')[0];
}

window.addEventListener('DOMContentLoaded', setDefaultDates);

async function fetchStockData(ticker, fromDate, toDate) {
    // Try to fetch real data first, fallback to mock data
    console.log(`Fetching data for ${ticker} from ${fromDate} to ${toDate}`);
    
    try {
        // Using a public CORS proxy to fetch Yahoo Finance data
        const from = Math.floor(new Date(fromDate).getTime() / 1000);
        const to = Math.floor(new Date(toDate).getTime() / 1000);
        
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?period1=${from}&period2=${to}&interval=1d`;
        const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
        
        const response = await fetch(proxyUrl);
        if (response.ok) {
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
    } catch (error) {
        console.error(`Failed to fetch real data for ${ticker}:`, error);
    }
    
    // Fallback to mock data
    console.log(`Using mock data for ${ticker}`);
    return generateMockData(ticker, fromDate, toDate);
}

function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',');
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        const entry = {};
        headers.forEach((header, index) => {
            entry[header] = values[index];
        });
        data.push({
            date: entry.Date,
            close: parseFloat(entry.Close || entry['Adj Close'])
        });
    }
    
    return data;
}

function generateMockData(ticker, fromDate, toDate) {
    console.log(`Using mock data for ${ticker} from ${fromDate} to ${toDate}`);
    const data = [];
    const startDate = new Date(fromDate);
    const endDate = new Date(toDate);
    
    // Validate dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        console.error('Invalid dates:', fromDate, toDate);
        return data;
    }
    
    const days = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24));
    console.log(`Generating ${days} days of data`);
    
    let basePrice = ticker === 'TQQQ' ? 80 : 500;
    const volatility = ticker === 'TQQQ' ? 0.03 : 0.015;
    
    for (let i = 0; i <= days; i++) {
        const currentDate = new Date(startDate.getTime());
        currentDate.setDate(startDate.getDate() + i);
        
        // Skip weekends
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

function runShannonStrategy(dataA, dataB, params) {
    const results = [];
    const rebalanceHistory = [];
    
    // Ensure data exists and has valid values
    if (!dataA || !dataB || dataA.length === 0 || dataB.length === 0) {
        console.error('No data available for strategy');
        return {
            dates: [],
            pricesA: [],
            pricesB: [],
            balanceRatios: [],
            portfolioValues: [],
            rebalanceHistory: [],
            rebalancePoints: []
        };
    }
    
    const dates = dataA.map(d => d.date);
    const pricesA = dataA.map(d => d.close);
    const pricesB = dataB.map(d => d.close);
    
    // Check for valid prices
    if (isNaN(pricesA[0]) || isNaN(pricesB[0]) || pricesA[0] <= 0 || pricesB[0] <= 0) {
        console.error('Invalid price data:', pricesA[0], pricesB[0]);
        return {
            dates: [],
            pricesA: [],
            pricesB: [],
            balanceRatios: [],
            portfolioValues: [],
            rebalanceHistory: [],
            rebalancePoints: []
        };
    }
    
    let sharesA = params.seed / 2 / pricesA[0];
    let sharesB = params.seed / 2 / pricesB[0];
    let point1Index = 0;
    
    rebalanceHistory.push({
        no: 1,
        date: dates[0],
        sharesA: sharesA,
        sharesB: sharesB,
        priceA: pricesA[0],
        priceB: pricesB[0],
        ratioA: 50,
        value: params.seed,
        performance: 0,
        type: 'initial'
    });
    
    const balanceRatios = [50];
    const portfolioValues = [params.seed];
    const rebalancePoints = [];
    const buyAndHoldA = [params.seed];
    const buyAndHoldB = [params.seed];
    
    // Calculate initial shares for buy and hold strategies
    const buyHoldSharesA = params.seed / pricesA[0];
    const buyHoldSharesB = params.seed / pricesB[0];
    
    for (let i = 1; i < dates.length; i++) {
        const currentValueA = sharesA * pricesA[i];
        const currentValueB = sharesB * pricesB[i];
        const totalValue = currentValueA + currentValueB;
        const currentRatioA = (currentValueA / totalValue) * 100;
        
        const point1ValueA = sharesA * pricesA[point1Index];
        const percentChangeA = ((pricesA[i] - pricesA[point1Index]) / pricesA[point1Index]) * 100;
        
        let rebalanced = false;
        let rebalanceType = '';
        
        if (percentChangeA >= params.aIncGap) {
            const sellValueA = currentValueA * (params.aIncSell / 100);
            sharesA -= sellValueA / pricesA[i];
            sharesB += sellValueA / pricesB[i];
            
            point1Index = i;
            rebalanced = true;
            rebalanceType = 'increase';
            
        } else if (percentChangeA <= -params.aDecGap) {
            const sellValueB = currentValueB * (params.bDecSell / 100);
            sharesB -= sellValueB / pricesB[i];
            sharesA += sellValueB / pricesA[i];
            
            point1Index = i;
            rebalanced = true;
            rebalanceType = 'decrease';
        }
        
        const newValueA = sharesA * pricesA[i];
        const newValueB = sharesB * pricesB[i];
        const newTotalValue = newValueA + newValueB;
        const newRatioA = (newValueA / newTotalValue) * 100;
        
        balanceRatios.push(newRatioA);
        portfolioValues.push(newTotalValue);
        
        // Calculate buy and hold values
        buyAndHoldA.push(buyHoldSharesA * pricesA[i]);
        buyAndHoldB.push(buyHoldSharesB * pricesB[i]);
        
        if (rebalanced) {
            const performance = ((newTotalValue - params.seed) / params.seed) * 100;
            
            rebalanceHistory.push({
                no: rebalanceHistory.length + 1,
                date: dates[i],
                sharesA: sharesA,
                sharesB: sharesB,
                priceA: pricesA[i],
                priceB: pricesB[i],
                ratioA: newRatioA,
                value: newTotalValue,
                performance: performance,
                type: rebalanceType
            });
            
            rebalancePoints.push({
                index: i,
                type: rebalanceType
            });
        }
    }
    
    // Add final day to rebalance history
    const lastIndex = dates.length - 1;
    const finalValueA = sharesA * pricesA[lastIndex];
    const finalValueB = sharesB * pricesB[lastIndex];
    const finalTotalValue = finalValueA + finalValueB;
    const finalRatioA = (finalValueA / finalTotalValue) * 100;
    const finalPerformance = ((finalTotalValue - params.seed) / params.seed) * 100;
    
    rebalanceHistory.push({
        no: rebalanceHistory.length + 1,
        date: dates[lastIndex],
        sharesA: sharesA,
        sharesB: sharesB,
        priceA: pricesA[lastIndex],
        priceB: pricesB[lastIndex],
        ratioA: finalRatioA,
        value: finalTotalValue,
        performance: finalPerformance,
        type: 'final'
    });
    
    return {
        dates,
        pricesA,
        pricesB,
        balanceRatios,
        portfolioValues,
        rebalanceHistory,
        rebalancePoints,
        buyAndHoldA,
        buyAndHoldB
    };
}

function updateCharts(results, tickerA, tickerB) {
    console.log('Updating charts with results:', results);
    
    const ctx1 = document.getElementById('simulationChart').getContext('2d');
    const ctx2 = document.getElementById('valueChart').getContext('2d');
    
    if (simulationChart) simulationChart.destroy();
    if (valueChart) valueChart.destroy();
    
    const rebalanceIncrease = results.rebalancePoints
        .filter(p => p.type === 'increase')
        .map(p => ({
            x: results.dates[p.index],
            y: results.balanceRatios[p.index]
        }));
    
    const rebalanceDecrease = results.rebalancePoints
        .filter(p => p.type === 'decrease')
        .map(p => ({
            x: results.dates[p.index],
            y: results.balanceRatios[p.index]
        }));
        
    const valueRebalanceIncrease = results.rebalancePoints
        .filter(p => p.type === 'increase')
        .map(p => ({
            x: results.dates[p.index],
            y: results.portfolioValues[p.index]
        }));
    
    const valueRebalanceDecrease = results.rebalancePoints
        .filter(p => p.type === 'decrease')
        .map(p => ({
            x: results.dates[p.index],
            y: results.portfolioValues[p.index]
        }));
    
    simulationChart = new Chart(ctx1, {
        type: 'line',
        data: {
            labels: results.dates,
            datasets: [
                {
                    label: tickerA,
                    data: results.pricesA,
                    borderColor: 'rgb(255, 99, 132)',
                    backgroundColor: 'transparent',
                    yAxisID: 'y-price',
                    borderWidth: 2,
                    pointRadius: 0,
                    pointHoverRadius: 3,
                    tension: 0
                },
                {
                    label: tickerB,
                    data: results.pricesB,
                    borderColor: 'rgb(54, 162, 235)',
                    backgroundColor: 'transparent',
                    yAxisID: 'y-price',
                    borderWidth: 2,
                    pointRadius: 0,
                    pointHoverRadius: 3,
                    tension: 0
                },
                {
                    label: 'Rebalance',
                    data: results.balanceRatios,
                    borderColor: 'rgb(75, 192, 192)',
                    backgroundColor: 'transparent',
                    yAxisID: 'y-percentage',
                    borderWidth: 2,
                    pointRadius: 0,
                    pointHoverRadius: 3,
                    tension: 0
                },
                {
                    label: 'Rebalance (Increase)',
                    data: rebalanceIncrease,
                    borderColor: 'transparent',
                    backgroundColor: 'red',
                    pointStyle: 'circle',
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    showLine: false,
                    yAxisID: 'y-percentage'
                },
                {
                    label: 'Rebalance (Decrease)',
                    data: rebalanceDecrease,
                    borderColor: 'transparent',
                    backgroundColor: 'green',
                    pointStyle: 'circle',
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    showLine: false,
                    yAxisID: 'y-percentage'
                }
            ]
        },
        options: {
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
        }
    });
    
    valueChart = new Chart(ctx2, {
        type: 'line',
        data: {
            labels: results.dates,
            datasets: [{
                label: 'Rebalance',
                data: results.portfolioValues,
                borderColor: 'rgb(153, 102, 255)',
                backgroundColor: 'transparent',
                borderWidth: 2,
                pointRadius: 0,
                pointHoverRadius: 3,
                tension: 0
            }, {
                label: tickerA,
                data: results.buyAndHoldA,
                borderColor: 'rgb(255, 99, 132)',
                backgroundColor: 'transparent',
                borderWidth: 2,
                pointRadius: 0,
                pointHoverRadius: 3,
                tension: 0,
                borderDash: [5, 5]
            }, {
                label: tickerB,
                data: results.buyAndHoldB,
                borderColor: 'rgb(54, 162, 235)',
                backgroundColor: 'transparent',
                borderWidth: 2,
                pointRadius: 0,
                pointHoverRadius: 3,
                tension: 0,
                borderDash: [5, 5]
            }, {
                label: 'Rebalance (Increase)',
                data: valueRebalanceIncrease,
                borderColor: 'transparent',
                backgroundColor: 'red',
                pointStyle: 'circle',
                pointRadius: 5,
                pointHoverRadius: 7,
                showLine: false
            }, {
                label: 'Rebalance (Decrease)',
                data: valueRebalanceDecrease,
                borderColor: 'transparent',
                backgroundColor: 'green',
                pointStyle: 'circle',
                pointRadius: 5,
                pointHoverRadius: 7,
                showLine: false
            }]
        },
        options: {
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
        }
    });
}

function calculateBuyAndHoldPerformances(dataA, dataB, initialCapital) {
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
    
    // Calculate performance for holding only Ticker A
    const sharesA = initialCapital / initialPriceA;
    const finalValueA = sharesA * finalPriceA;
    const performanceA = ((finalValueA - initialCapital) / initialCapital) * 100;
    
    // Calculate performance for holding only Ticker B
    const sharesB = initialCapital / initialPriceB;
    const finalValueB = sharesB * finalPriceB;
    const performanceB = ((finalValueB - initialCapital) / initialCapital) * 100;
    
    return {
        tickerAOnly: performanceA,
        tickerBOnly: performanceB
    };
}

function updateComparison(dataA, dataB, rebalanceHistory, tickerA, tickerB, initialCapital) {
    // Update ticker names in the comparison section
    document.getElementById('tickerAOnlyTitle').textContent = `Holding Only ${tickerA}`;
    document.getElementById('tickerBOnlyTitle').textContent = `Holding Only ${tickerB}`;
    
    // Calculate buy-and-hold performances
    const buyHoldPerformances = calculateBuyAndHoldPerformances(dataA, dataB, initialCapital);
    
    // Get rebalance strategy performance (from last entry in rebalance history)
    const rebalancePerformance = rebalanceHistory.length > 0 ? 
        rebalanceHistory[rebalanceHistory.length - 1].performance : 0;
    
    // Update the display
    document.getElementById('tickerAOnlyPerformance').textContent = 
        `${buyHoldPerformances.tickerAOnly >= 0 ? '+' : ''}${buyHoldPerformances.tickerAOnly.toFixed(2)}%`;
    document.getElementById('tickerBOnlyPerformance').textContent = 
        `${buyHoldPerformances.tickerBOnly >= 0 ? '+' : ''}${buyHoldPerformances.tickerBOnly.toFixed(2)}%`;
    document.getElementById('rebalancePerformance').textContent = 
        `${rebalancePerformance >= 0 ? '+' : ''}${rebalancePerformance.toFixed(2)}%`;
}

function updateTable(rebalanceHistory, tickerA, tickerB) {
    const tbody = document.getElementById('resultsBody');
    tbody.innerHTML = '';
    
    document.getElementById('tickerACountHeader').textContent = `${tickerA} Count`;
    document.getElementById('tickerBCountHeader').textContent = `${tickerB} Count`;
    document.getElementById('tickerAPriceHeader').textContent = `${tickerA} Price`;
    document.getElementById('tickerBPriceHeader').textContent = `${tickerB} Price`;
    document.getElementById('tickerARatioHeader').textContent = `${tickerA} Ratio`;
    
    rebalanceHistory.forEach(entry => {
        const row = tbody.insertRow();
        row.insertCell(0).textContent = entry.no;
        row.insertCell(1).textContent = entry.date;
        row.insertCell(2).textContent = entry.sharesA.toFixed(2);
        row.insertCell(3).textContent = entry.sharesB.toFixed(2);
        row.insertCell(4).textContent = `$${entry.priceA.toFixed(2)}`;
        row.insertCell(5).textContent = `$${entry.priceB.toFixed(2)}`;
        row.insertCell(6).textContent = `${entry.ratioA.toFixed(2)}%`;
        row.insertCell(7).textContent = `$${entry.value.toFixed(2)}`;
        row.insertCell(8).textContent = `${entry.performance >= 0 ? '+' : ''}${entry.performance.toFixed(2)}%`;
        
        if (entry.type === 'increase') {
            row.style.backgroundColor = '#ffe6e6';
        } else if (entry.type === 'decrease') {
            row.style.backgroundColor = '#e6ffe6';
        } else if (entry.type === 'final') {
            row.style.backgroundColor = '#f0f0f0';
            row.style.fontWeight = 'bold';
        }
    });
}

document.getElementById('simulateBtn').addEventListener('click', async function() {
    const btn = this;
    btn.disabled = true;
    btn.textContent = 'Simulating...';
    
    try {
        const params = {
            dateFrom: document.getElementById('dateFrom').value,
            dateTo: document.getElementById('dateTo').value,
            seed: parseFloat(document.getElementById('seed').value),
            tickerA: document.getElementById('tickerA').value,
            tickerB: document.getElementById('tickerB').value,
            aIncGap: parseFloat(document.getElementById('aIncGap').value),
            aIncSell: parseFloat(document.getElementById('aIncSell').value),
            aDecGap: parseFloat(document.getElementById('aDecGap').value),
            bDecSell: parseFloat(document.getElementById('bDecSell').value)
        };
        
        document.getElementById('title').textContent = `${params.tickerA} & ${params.tickerB} rebalance trading strategy`;
        
        const [dataA, dataB] = await Promise.all([
            fetchStockData(params.tickerA, params.dateFrom, params.dateTo),
            fetchStockData(params.tickerB, params.dateFrom, params.dateTo)
        ]);
        
        console.log('Data A:', dataA.slice(0, 5));
        console.log('Data B:', dataB.slice(0, 5));
        
        if (!dataA || !dataB || dataA.length === 0 || dataB.length === 0) {
            alert('Failed to fetch stock data. Please try again.');
            return;
        }
        
        const minLength = Math.min(dataA.length, dataB.length);
        const alignedDataA = dataA.slice(0, minLength);
        const alignedDataB = dataB.slice(0, minLength);
        
        const results = runShannonStrategy(alignedDataA, alignedDataB, params);
        
        updateCharts(results, params.tickerA, params.tickerB);
        updateTable(results.rebalanceHistory, params.tickerA, params.tickerB);
        updateComparison(alignedDataA, alignedDataB, results.rebalanceHistory, params.tickerA, params.tickerB, params.seed);
        
        document.getElementById('results').style.display = 'block';
        
    } catch (error) {
        console.error('Simulation error:', error);
        alert('Error during simulation. Please check the console for details.');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Start Simulation';
    }
});