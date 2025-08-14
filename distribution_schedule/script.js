class Calendar {
    constructor() {
        this.currentDate = new Date();
        this.currentMonth = this.currentDate.getMonth();
        this.currentYear = this.currentDate.getFullYear();
        this.showYieldMax = true;
        this.showRex = true;
        
        this.distributionDates = {
            target12: [
                new Date(2025, 0, 8),   // 1/7/25
                new Date(2025, 1, 5),   // 2/4/25
                new Date(2025, 2, 5),   // 3/4/25
                new Date(2025, 3, 2),   // 4/1/25
                new Date(2025, 4, 7),   // 5/6/25
                new Date(2025, 5, 4),   // 6/3/25
                new Date(2025, 6, 2),   // 7/1/25
                new Date(2025, 7, 6),   // 8/5/25
                new Date(2025, 8, 3),   // 9/2/25
                new Date(2025, 9, 8),   // 10/7/25
                new Date(2025, 10, 5),  // 11/4/25
                new Date(2025, 11, 3)   // 12/2/25
            ],
            weekly: [],
            groupA: [
                new Date(2025, 0, 23), // 1/22/25
                new Date(2025, 1, 20), // 2/19/25
                new Date(2025, 2, 20), // 3/19/25
                new Date(2025, 3, 17), // 4/16/25
                new Date(2025, 4, 15), // 5/14/25
                new Date(2025, 5, 12), // 6/11/25
                new Date(2025, 6, 10),  // 7/9/25
                new Date(2025, 7, 7),  // 8/6/25
                new Date(2025, 8, 4),  // 9/3/25
                new Date(2025, 9, 2),  // 10/2/25
                new Date(2025, 9, 30), // 10/30/25
                new Date(2025, 10, 28), // 11/28/25
                new Date(2025, 11, 26)  // 12/26/25
            ],
            groupB: [
                new Date(2025, 0, 3), new Date(2025, 0, 30), // 1/2/25, 1/29/25
                new Date(2025, 1, 27), new Date(2025, 2, 27), new Date(2025, 3, 24), // 2/26/25, 3/26/25, 4/23/25
                new Date(2025, 4, 22), new Date(2025, 5, 19), new Date(2025, 6, 17), // 5/21/25, 6/18/25, 7/16/25
                new Date(2025, 7, 14), new Date(2025, 8, 11), new Date(2025, 9, 9), // 8/13/25, 9/10/25, 10/8/25
                new Date(2025, 10, 6), new Date(2025, 11, 4), new Date(2026, 0, 2) // 11/6/25, 12/4/25, 1/2/26
            ],
            groupC: [
                new Date(2025, 0, 9),  // 1/8/25
                new Date(2025, 1, 6),  // 2/5/25
                new Date(2025, 2, 6),  // 3/5/25
                new Date(2025, 3, 3),  // 4/2/25
                new Date(2025, 4, 1), // 4/30/25
                new Date(2025, 4, 29), // 5/28/25
                new Date(2025, 5, 26), // 6/25/25
                new Date(2025, 6, 24), // 7/23/25
                new Date(2025, 7, 21), // 8/20/25
                new Date(2025, 8, 18), // 9/17/25
                new Date(2025, 9, 16), // 10/15/25
                new Date(2025, 10, 13), // 11/12/25
                new Date(2025, 11, 11)  // 12/10/25
            ],
            groupD: [
                new Date(2025, 0, 16), // 1/15/25
                new Date(2025, 1, 13), // 2/12/25
                new Date(2025, 2, 13), // 3/12/25
                new Date(2025, 3, 10),  // 4/9/25
                new Date(2025, 4, 8),  // 5/7/25
                new Date(2025, 5, 5),  // 6/4/25
                new Date(2025, 6, 3),  // 7/2/25
                new Date(2025, 6, 31), // 7/30/25
                new Date(2025, 7, 28), // 8/27/25
                new Date(2025, 8, 25), // 9/24/25
                new Date(2025, 9, 23), // 10/22/25
                new Date(2025, 10, 20), // 11/19/25
                new Date(2025, 11, 18)  // 12/17/25
            ],
            rex: {
                BMAX: [
                    new Date(2025, 11, 30), new Date(2025, 8, 29), new Date(2025, 5, 27), new Date(2026, 2, 30),
                    new Date(2026, 5, 29), new Date(2026, 8, 29), new Date(2026, 11, 30)
                ],
                FEPI: [
                    new Date(2025, 0, 29), new Date(2025, 1, 26), new Date(2025, 2, 26), new Date(2025, 3, 23),
                    new Date(2025, 4, 28), new Date(2025, 5, 25), new Date(2025, 6, 23), new Date(2025, 7, 27),
                    new Date(2025, 8, 24), new Date(2025, 9, 29), new Date(2025, 10, 25), new Date(2025, 11, 24)
                ],
                AIPI: [
                    new Date(2024, 6, 26), new Date(2024, 7, 27), new Date(2024, 8, 26), new Date(2024, 9, 24),
                    new Date(2024, 10, 26), new Date(2024, 11, 24), new Date(2025, 0, 29), new Date(2025, 1, 26),
                    new Date(2025, 2, 26), new Date(2025, 3, 23), new Date(2025, 4, 28), new Date(2025, 5, 25),
                    new Date(2025, 6, 23), new Date(2025, 7, 27), new Date(2025, 8, 24), new Date(2025, 9, 29),
                    new Date(2025, 10, 25), new Date(2025, 11, 24)
                ],
                CEPI: [
                    new Date(2025, 0, 28), new Date(2025, 1, 25), new Date(2025, 2, 25), new Date(2025, 3, 29),
                    new Date(2025, 4, 29), new Date(2025, 5, 24), new Date(2025, 6, 29), new Date(2025, 7, 26),
                    new Date(2025, 8, 23), new Date(2025, 9, 28), new Date(2025, 10, 26), new Date(2025, 11, 23)
                ],
                COII: [
                    new Date(2025, 5, 17), new Date(2025, 5, 24), new Date(2025, 6, 1), new Date(2025, 6, 8),
                    new Date(2025, 6, 15), new Date(2025, 6, 22), new Date(2025, 6, 29), new Date(2025, 7, 5),
                    new Date(2025, 7, 12), new Date(2025, 7, 19), new Date(2025, 7, 26), new Date(2025, 8, 3),
                    new Date(2025, 8, 9), new Date(2025, 8, 16), new Date(2025, 8, 23), new Date(2025, 8, 30),
                    new Date(2025, 9, 7), new Date(2025, 9, 14), new Date(2025, 9, 21), new Date(2025, 9, 28),
                    new Date(2025, 10, 4), new Date(2025, 10, 11), new Date(2025, 10, 18), new Date(2025, 10, 25),
                    new Date(2025, 11, 2), new Date(2025, 11, 9), new Date(2025, 11, 16), new Date(2025, 11, 23),
                    new Date(2025, 11, 30)
                ],
                MSII: [
                    new Date(2025, 5, 17), new Date(2025, 5, 24), new Date(2025, 6, 1), new Date(2025, 6, 8),
                    new Date(2025, 6, 15), new Date(2025, 6, 22), new Date(2025, 6, 29), new Date(2025, 7, 5),
                    new Date(2025, 7, 12), new Date(2025, 7, 19), new Date(2025, 7, 26), new Date(2025, 8, 3),
                    new Date(2025, 8, 9), new Date(2025, 8, 16), new Date(2025, 8, 23), new Date(2025, 8, 30),
                    new Date(2025, 9, 7), new Date(2025, 9, 14), new Date(2025, 9, 21), new Date(2025, 9, 28),
                    new Date(2025, 10, 4), new Date(2025, 10, 11), new Date(2025, 10, 18), new Date(2025, 10, 25),
                    new Date(2025, 11, 2), new Date(2025, 11, 9), new Date(2025, 11, 16), new Date(2025, 11, 23),
                    new Date(2025, 11, 30)
                ],
                NVII: [
                    new Date(2025, 5, 10), new Date(2025, 5, 17), new Date(2025, 5, 24), new Date(2025, 6, 1),
                    new Date(2025, 6, 8), new Date(2025, 6, 15), new Date(2025, 6, 22), new Date(2025, 6, 29),
                    new Date(2025, 7, 5), new Date(2025, 7, 12), new Date(2025, 7, 19), new Date(2025, 7, 26),
                    new Date(2025, 8, 3), new Date(2025, 8, 9), new Date(2025, 8, 16), new Date(2025, 8, 23),
                    new Date(2025, 8, 30), new Date(2025, 9, 7), new Date(2025, 9, 14), new Date(2025, 9, 21),
                    new Date(2025, 9, 28), new Date(2025, 10, 4), new Date(2025, 10, 11), new Date(2025, 10, 18),
                    new Date(2025, 10, 25), new Date(2025, 11, 2), new Date(2025, 11, 9), new Date(2025, 11, 16),
                    new Date(2025, 11, 23), new Date(2025, 11, 30)
                ],
                TSII: [
                    new Date(2025, 5, 17), new Date(2025, 5, 24), new Date(2025, 6, 1), new Date(2025, 6, 8),
                    new Date(2025, 6, 15), new Date(2025, 6, 22), new Date(2025, 6, 29), new Date(2025, 7, 5),
                    new Date(2025, 7, 12), new Date(2025, 7, 19), new Date(2025, 7, 26), new Date(2025, 8, 3),
                    new Date(2025, 8, 9), new Date(2025, 8, 16), new Date(2025, 8, 23), new Date(2025, 8, 30),
                    new Date(2025, 9, 7), new Date(2025, 9, 14), new Date(2025, 9, 21), new Date(2025, 9, 28),
                    new Date(2025, 10, 4), new Date(2025, 10, 11), new Date(2025, 10, 18), new Date(2025, 10, 25),
                    new Date(2025, 11, 2), new Date(2025, 11, 9), new Date(2025, 11, 16), new Date(2025, 11, 23),
                    new Date(2025, 11, 30)
                ],
                SSK: [
                    new Date(2025, 6, 31), new Date(2025, 7, 28), new Date(2025, 8, 29), new Date(2025, 9, 30),
                    new Date(2025, 10, 26), new Date(2025, 11, 30)
                ]
            }
        };

        // Weekly dates are the same as all group dates combined
        this.distributionDates.weekly = [
            ...this.distributionDates.groupA,
            ...this.distributionDates.groupB,
            ...this.distributionDates.groupC,
            ...this.distributionDates.groupD
        ];

        this.init();
    }

    init() {
        this.bindEvents();
        this.renderCalendar();
    }

    bindEvents() {
        document.getElementById('prev-btn').addEventListener('click', () => this.previousMonth());
        document.getElementById('next-btn').addEventListener('click', () => this.nextMonth());
        document.getElementById('today-btn').addEventListener('click', () => this.goToToday());
        document.getElementById('yieldmax-btn').addEventListener('click', () => this.toggleYieldMax());
        document.getElementById('rex-btn').addEventListener('click', () => this.toggleRex());
    }

    toggleYieldMax() {
        this.showYieldMax = !this.showYieldMax;
        const btn = document.getElementById('yieldmax-btn');
        
        if (this.showYieldMax) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
        
        this.renderCalendar();
    }

    toggleRex() {
        this.showRex = !this.showRex;
        const btn = document.getElementById('rex-btn');
        
        if (this.showRex) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
        
        this.renderCalendar();
    }

    goToToday() {
        const today = new Date();
        this.currentMonth = today.getMonth();
        this.currentYear = today.getFullYear();
        this.renderCalendar();
    }

    previousMonth() {
        if (this.currentMonth === 0) {
            this.currentMonth = 11;
            this.currentYear--;
        } else {
            this.currentMonth--;
        }
        this.renderCalendar();
    }

    nextMonth() {
        if (this.currentMonth === 11) {
            this.currentMonth = 0;
            this.currentYear++;
        } else {
            this.currentMonth++;
        }
        this.renderCalendar();
    }

    renderCalendar() {
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];

        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        document.getElementById('month-year').textContent = 
            `${monthNames[this.currentMonth]} ${this.currentYear}`;

        const firstDay = new Date(this.currentYear, this.currentMonth, 1).getDay();
        const daysInMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
        const prevMonthDays = new Date(this.currentYear, this.currentMonth, 0).getDate();

        const calendar = document.getElementById('calendar');
        calendar.innerHTML = '';

        // Add day headers
        dayNames.forEach((day, index) => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'calendar-day header';
            
            // Add special classes for weekend headers
            if (index === 0) { // Sunday
                dayHeader.classList.add('sunday');
            } else if (index === 6) { // Saturday
                dayHeader.classList.add('saturday');
            }
            
            dayHeader.textContent = day;
            calendar.appendChild(dayHeader);
        });

        // Previous month's trailing days
        for (let i = firstDay - 1; i >= 0; i--) {
            const dayCell = document.createElement('div');
            dayCell.className = 'calendar-day other-month';
            dayCell.innerHTML = `<div class="day-number">${prevMonthDays - i}</div>`;
            calendar.appendChild(dayCell);
        }

        // Current month days
        for (let day = 1; day <= daysInMonth; day++) {
            const dayCell = document.createElement('div');
            dayCell.className = 'calendar-day';
            
            const currentDate = new Date(this.currentYear, this.currentMonth, day);
            const dayOfWeek = currentDate.getDay();
            
            // Add weekend classes
            if (dayOfWeek === 0) { // Sunday
                dayCell.classList.add('sunday');
            } else if (dayOfWeek === 6) { // Saturday
                dayCell.classList.add('saturday');
            }
            
            // Check if this is today
            const today = new Date();
            if (currentDate.toDateString() === today.toDateString()) {
                dayCell.classList.add('today');
            }

            const dayNumber = document.createElement('div');
            dayNumber.className = 'day-number';
            dayNumber.textContent = day;
            dayCell.appendChild(dayNumber);

            const distributions = this.getDistributionsForDate(currentDate);
            if (distributions.length > 0) {
                const distributionTypes = document.createElement('div');
                distributionTypes.className = 'distribution-types';
                
                distributions.forEach(dist => {
                    const tag = document.createElement('div');
                    tag.className = `distribution-tag ${dist.type}`;
                    tag.textContent = dist.label;
                    distributionTypes.appendChild(tag);
                });
                
                dayCell.appendChild(distributionTypes);
            }

            calendar.appendChild(dayCell);
        }

        // Next month's leading days
        const totalCells = calendar.children.length - 7; // Subtract header row
        const remainingCells = 42 - totalCells; // 6 weeks * 7 days - header = 35 total cells needed
        for (let day = 1; day <= remainingCells; day++) {
            const dayCell = document.createElement('div');
            dayCell.className = 'calendar-day other-month';
            dayCell.innerHTML = `<div class="day-number">${day}</div>`;
            calendar.appendChild(dayCell);
        }
    }

    getDistributionsForDate(date) {
        const distributions = [];
        const dateStr = date.toDateString();

        // Only show YieldMax distributions if the filter is active
        if (this.showYieldMax) {
            if (this.distributionDates.target12.some(d => d.toDateString() === dateStr)) {
                distributions.push({ type: 'target12', label: 'YMX T12' });
            }

            if (this.distributionDates.groupA.some(d => d.toDateString() === dateStr)) {
                distributions.push({ type: 'group-a', label: 'YMX Group A' });
            }

            if (this.distributionDates.groupB.some(d => d.toDateString() === dateStr)) {
                distributions.push({ type: 'group-b', label: 'YMX Group B' });
            }

            if (this.distributionDates.groupC.some(d => d.toDateString() === dateStr)) {
                distributions.push({ type: 'group-c', label: 'YMX Group C' });
            }

            if (this.distributionDates.groupD.some(d => d.toDateString() === dateStr)) {
                distributions.push({ type: 'group-d', label: 'YMX Group D' });
            }

            // Add Weekly tag if any group is present (since Weekly = Groups A/B/C/D)
            if (distributions.some(d => ['group-a', 'group-b', 'group-c', 'group-d'].includes(d.type))) {
                distributions.push({ type: 'weekly', label: 'YMX Weekly' });
            }
        }

        // Show REX distributions if the filter is active
        if (this.showRex) {
            const rexTickers = [];
            const weeklyTickers = ['COII', 'MSII', 'NVII', 'TSII'];
            let hasWeekly = false;
            
            // Check each REX ticker separately
            for (const [ticker, dates] of Object.entries(this.distributionDates.rex)) {
                if (dates.some(d => d.toDateString() === dateStr)) {
                    if (weeklyTickers.includes(ticker)) {
                        hasWeekly = true;
                    } else {
                        rexTickers.push(`REX ${ticker}`);
                    }
                }
            }
            
            // Add weekly group if any weekly ticker has a distribution
            if (hasWeekly) {
                rexTickers.push('REX Weekly');
            }
            
            // Add all REX distributions to the main list
            rexTickers.forEach(label => {
                distributions.push({ type: 'rex', label: label });
            });
        }

        return distributions;
    }
}

// Initialize calendar when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new Calendar();
});

// Toggle function for collapsible sections
function toggleSection(contentId) {
    const content = document.getElementById(contentId);
    const icon = document.getElementById(contentId.replace('-content', '-icon'));
    
    if (content.classList.contains('collapsed')) {
        // Expand
        content.classList.remove('collapsed');
        icon.classList.remove('collapsed');
        icon.textContent = '▼';
    } else {
        // Collapse
        content.classList.add('collapsed');
        icon.classList.add('collapsed');
        icon.textContent = '►';
    }
}