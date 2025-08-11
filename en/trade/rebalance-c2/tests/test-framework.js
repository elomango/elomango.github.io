// Simple Test Framework with Code Coverage
class TestFramework {
    constructor() {
        this.suites = [];
        this.currentSuite = null;
        this.results = [];
        this.coverage = new Map();
        this.startTime = null;
        this.endTime = null;
        this.originalFunctions = new Map();
    }

    // Test registration methods
    describe(suiteName, callback) {
        const suite = {
            name: suiteName,
            tests: [],
            beforeEach: null,
            afterEach: null
        };
        this.currentSuite = suite;
        this.suites.push(suite);
        callback();
        this.currentSuite = null;
    }

    it(testName, callback) {
        if (!this.currentSuite) {
            throw new Error('it() must be called inside describe()');
        }
        this.currentSuite.tests.push({
            name: testName,
            callback: callback,
            timeout: 5000 // default timeout 5 seconds
        });
    }

    beforeEach(callback) {
        if (!this.currentSuite) {
            throw new Error('beforeEach() must be called inside describe()');
        }
        this.currentSuite.beforeEach = callback;
    }

    afterEach(callback) {
        if (!this.currentSuite) {
            throw new Error('afterEach() must be called inside describe()');
        }
        this.currentSuite.afterEach = callback;
    }

    // Assertion methods
    expect(actual) {
        return {
            toBe: (expected) => {
                if (actual !== expected) {
                    throw new Error(`Expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`);
                }
            },
            toEqual: (expected) => {
                if (JSON.stringify(actual) !== JSON.stringify(expected)) {
                    throw new Error(`Expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`);
                }
            },
            toBeGreaterThan: (expected) => {
                if (!(actual > expected)) {
                    throw new Error(`Expected ${actual} to be greater than ${expected}`);
                }
            },
            toBeLessThan: (expected) => {
                if (!(actual < expected)) {
                    throw new Error(`Expected ${actual} to be less than ${expected}`);
                }
            },
            toBeTruthy: () => {
                if (!actual) {
                    throw new Error(`Expected ${actual} to be truthy`);
                }
            },
            toBeFalsy: () => {
                if (actual) {
                    throw new Error(`Expected ${actual} to be falsy`);
                }
            },
            toContain: (expected) => {
                if (Array.isArray(actual)) {
                    if (!actual.includes(expected)) {
                        throw new Error(`Expected array to contain ${expected}`);
                    }
                } else if (typeof actual === 'string') {
                    if (!actual.includes(expected)) {
                        throw new Error(`Expected string to contain ${expected}`);
                    }
                }
            },
            toThrow: () => {
                let threw = false;
                try {
                    if (typeof actual === 'function') {
                        actual();
                    }
                } catch (e) {
                    threw = true;
                }
                if (!threw) {
                    throw new Error('Expected function to throw');
                }
            },
            toHaveLength: (expected) => {
                if (actual.length !== expected) {
                    throw new Error(`Expected length ${expected} but got ${actual.length}`);
                }
            },
            toBeCloseTo: (expected, precision = 2) => {
                const multiplier = Math.pow(10, precision);
                const actualRounded = Math.round(actual * multiplier) / multiplier;
                const expectedRounded = Math.round(expected * multiplier) / multiplier;
                if (actualRounded !== expectedRounded) {
                    throw new Error(`Expected ${actual} to be close to ${expected}`);
                }
            }
        };
    }

    // Code coverage instrumentation
    instrumentFunction(obj, methodName, objectName = '') {
        const originalMethod = obj[methodName];
        if (typeof originalMethod !== 'function') return;

        const fullName = objectName ? `${objectName}.${methodName}` : methodName;
        this.originalFunctions.set(fullName, originalMethod);
        
        obj[methodName] = (...args) => {
            if (!this.coverage.has(fullName)) {
                this.coverage.set(fullName, {
                    calls: 0,
                    tested: false
                });
            }
            const coverageData = this.coverage.get(fullName);
            coverageData.calls++;
            coverageData.tested = true;
            
            return originalMethod.apply(obj, args);
        };
    }

    instrumentObject(obj, objectName) {
        const methods = Object.getOwnPropertyNames(obj);
        methods.forEach(method => {
            if (typeof obj[method] === 'function' && method !== 'constructor') {
                this.instrumentFunction(obj, method, objectName);
            }
        });
    }

    // Test execution
    async run() {
        this.startTime = Date.now();
        this.results = [];

        for (const suite of this.suites) {
            const suiteResult = {
                name: suite.name,
                tests: [],
                passed: 0,
                failed: 0,
                totalTime: 0
            };

            for (const test of suite.tests) {
                const testStart = Date.now();
                const testResult = {
                    name: test.name,
                    passed: false,
                    error: null,
                    time: 0
                };

                try {
                    // Run beforeEach if exists
                    if (suite.beforeEach) {
                        await this.runWithTimeout(suite.beforeEach(), test.timeout);
                    }

                    // Run test
                    await this.runWithTimeout(test.callback(), test.timeout);
                    
                    testResult.passed = true;
                    suiteResult.passed++;
                } catch (error) {
                    testResult.error = {
                        message: error.message,
                        stack: error.stack
                    };
                    suiteResult.failed++;
                } finally {
                    // Run afterEach if exists
                    if (suite.afterEach) {
                        try {
                            await this.runWithTimeout(suite.afterEach(), test.timeout);
                        } catch (e) {
                            console.error('afterEach failed:', e);
                        }
                    }
                }

                testResult.time = Date.now() - testStart;
                suiteResult.totalTime += testResult.time;
                suiteResult.tests.push(testResult);
            }

            this.results.push(suiteResult);
        }

        this.endTime = Date.now();
        return this.generateReport();
    }

    runWithTimeout(promise, timeout) {
        return Promise.race([
            promise,
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error(`Test timeout after ${timeout}ms`)), timeout)
            )
        ]);
    }

    // Calculate coverage statistics
    calculateCoverage() {
        const total = this.coverage.size;
        const tested = Array.from(this.coverage.values()).filter(c => c.tested).length;
        const percentage = total > 0 ? (tested / total) * 100 : 0;
        
        const details = Array.from(this.coverage.entries()).map(([name, data]) => ({
            name,
            tested: data.tested,
            calls: data.calls
        }));

        return {
            total,
            tested,
            untested: total - tested,
            percentage,
            details
        };
    }

    // Generate HTML report
    generateReport() {
        const totalTests = this.results.reduce((sum, suite) => sum + suite.tests.length, 0);
        const passedTests = this.results.reduce((sum, suite) => sum + suite.passed, 0);
        const failedTests = this.results.reduce((sum, suite) => sum + suite.failed, 0);
        const totalTime = this.endTime - this.startTime;
        const coverage = this.calculateCoverage();

        return {
            summary: {
                total: totalTests,
                passed: passedTests,
                failed: failedTests,
                duration: totalTime,
                timestamp: new Date().toISOString(),
                coverage: coverage.percentage
            },
            suites: this.results,
            coverage: coverage,
            getHTML: () => this.renderHTMLReport({
                summary: {
                    total: totalTests,
                    passed: passedTests,
                    failed: failedTests,
                    duration: totalTime,
                    timestamp: new Date().toISOString(),
                    coverage: coverage.percentage
                },
                suites: this.results,
                coverage: coverage
            })
        };
    }

    renderHTMLReport(report) {
        const statusIcon = report.summary.failed === 0 ? '✅' : '❌';
        const coverageColor = report.coverage.percentage >= 80 ? 'green' : 
                              report.coverage.percentage >= 60 ? 'orange' : 'red';

        let html = `
            <div class="test-report">
                <header class="report-header">
                    <h1>${statusIcon} Test Report</h1>
                    <div class="timestamp">Generated: ${report.summary.timestamp}</div>
                </header>

                <section class="summary-section">
                    <h2>Summary</h2>
                    <div class="summary-grid">
                        <div class="summary-card">
                            <div class="summary-label">Total Tests</div>
                            <div class="summary-value">${report.summary.total}</div>
                        </div>
                        <div class="summary-card success">
                            <div class="summary-label">Passed</div>
                            <div class="summary-value">${report.summary.passed}</div>
                        </div>
                        <div class="summary-card ${report.summary.failed > 0 ? 'failure' : ''}">
                            <div class="summary-label">Failed</div>
                            <div class="summary-value">${report.summary.failed}</div>
                        </div>
                        <div class="summary-card">
                            <div class="summary-label">Duration</div>
                            <div class="summary-value">${report.summary.duration}ms</div>
                        </div>
                        <div class="summary-card coverage-${coverageColor}">
                            <div class="summary-label">Code Coverage</div>
                            <div class="summary-value">${report.coverage.percentage.toFixed(1)}%</div>
                        </div>
                    </div>
                </section>

                <section class="coverage-section">
                    <h2>Code Coverage Details</h2>
                    <div class="coverage-stats">
                        <div>Functions tested: ${report.coverage.tested} / ${report.coverage.total}</div>
                        <div class="coverage-bar">
                            <div class="coverage-fill" style="width: ${report.coverage.percentage}%"></div>
                        </div>
                    </div>
                    <table class="coverage-table">
                        <thead>
                            <tr>
                                <th>Function</th>
                                <th>Status</th>
                                <th>Calls</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${report.coverage.details.map(func => `
                                <tr class="${func.tested ? 'tested' : 'untested'}">
                                    <td>${func.name}</td>
                                    <td>${func.tested ? '✅ Tested' : '❌ Not tested'}</td>
                                    <td>${func.calls}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </section>

                <section class="results-section">
                    <h2>Test Results</h2>
                    ${report.suites.map(suite => `
                        <div class="suite">
                            <h3>${suite.name} (${suite.passed}/${suite.tests.length} passed)</h3>
                            <div class="tests">
                                ${suite.tests.map(test => `
                                    <div class="test ${test.passed ? 'passed' : 'failed'}">
                                        <div class="test-header">
                                            <span class="test-icon">${test.passed ? '✓' : '✗'}</span>
                                            <span class="test-name">${test.name}</span>
                                            <span class="test-time">${test.time}ms</span>
                                        </div>
                                        ${test.error ? `
                                            <div class="test-error">
                                                <div class="error-message">${test.error.message}</div>
                                                <pre class="error-stack">${test.error.stack}</pre>
                                            </div>
                                        ` : ''}
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </section>
            </div>
        `;

        return html;
    }
}

// Export for use
const testFramework = new TestFramework();