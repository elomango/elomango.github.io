class Calendar {
    constructor() {
        this.currentDate = new Date();
        this.currentMonth = this.currentDate.getMonth();
        this.currentYear = this.currentDate.getFullYear();
        this.showYieldMax = true;
        this.showRex = true;
        
        this.distributionDates = {
            target12: [
                new Date(2025, 0, 7),   // 1/7/25
                new Date(2025, 1, 4),   // 2/4/25
                new Date(2025, 2, 4),   // 3/4/25
                new Date(2025, 3, 1),   // 4/1/25
                new Date(2025, 4, 6),   // 5/6/25
                new Date(2025, 5, 3),   // 6/3/25
                new Date(2025, 6, 1),   // 7/1/25
                new Date(2025, 7, 5),   // 8/5/25
                new Date(2025, 8, 2),   // 9/2/25
                new Date(2025, 9, 7),   // 10/7/25
                new Date(2025, 10, 4),  // 11/4/25
                new Date(2025, 11, 2)   // 12/2/25
            ],
            weekly: [],
            groupA: [
                new Date(2025, 0, 22), // 1/22/25
                new Date(2025, 1, 19), // 2/19/25
                new Date(2025, 2, 19), // 3/19/25
                new Date(2025, 3, 16), // 4/16/25
                new Date(2025, 4, 14), // 5/14/25
                new Date(2025, 5, 11), // 6/11/25
                new Date(2025, 6, 9),  // 7/9/25
                new Date(2025, 7, 6),  // 8/6/25
                new Date(2025, 8, 3),  // 9/3/25
                new Date(2025, 9, 1),  // 10/1/25
                new Date(2025, 10, 26), // 11/26/25
                new Date(2025, 11, 24)  // 12/24/25
            ],
            groupB: [
                new Date(2025, 0, 2), new Date(2025, 0, 29), // 1/2/25, 1/29/25
                new Date(2025, 1, 26), new Date(2025, 2, 26), new Date(2025, 3, 23), // 2/26/25, 3/26/25, 4/23/25
                new Date(2025, 4, 21), new Date(2025, 5, 18), new Date(2025, 6, 16), // 5/21/25, 6/18/25, 7/16/25
                new Date(2025, 7, 13), new Date(2025, 8, 10), new Date(2025, 9, 8), // 8/13/25, 9/10/25, 10/8/25
                new Date(2025, 10, 5), new Date(2025, 11, 3), new Date(2025, 11, 31) // 11/5/25, 12/3/25, 12/31/25
            ],
            groupC: [
                new Date(2025, 0, 8),  // 1/8/25
                new Date(2025, 1, 5),  // 2/5/25
                new Date(2025, 2, 5),  // 3/5/25
                new Date(2025, 3, 2),  // 4/2/25
                new Date(2025, 3, 30), // 4/30/25
                new Date(2025, 4, 28), // 5/28/25
                new Date(2025, 5, 25), // 6/25/25
                new Date(2025, 6, 23), // 7/23/25
                new Date(2025, 7, 20), // 8/20/25
                new Date(2025, 8, 17), // 9/17/25
                new Date(2025, 9, 15), // 10/15/25
                new Date(2025, 10, 12), // 11/12/25
                new Date(2025, 11, 10)  // 12/10/25
            ],
            groupD: [
                new Date(2025, 0, 15), // 1/15/25
                new Date(2025, 1, 12), // 2/12/25
                new Date(2025, 2, 12), // 3/12/25
                new Date(2025, 3, 9),  // 4/9/25
                new Date(2025, 4, 7),  // 5/7/25
                new Date(2025, 5, 4),  // 6/4/25
                new Date(2025, 6, 2),  // 7/2/25
                new Date(2025, 6, 30), // 7/30/25
                new Date(2025, 7, 27), // 8/27/25
                new Date(2025, 8, 24), // 9/24/25
                new Date(2025, 9, 22), // 10/22/25
                new Date(2025, 10, 19), // 11/19/25
                new Date(2025, 11, 17)  // 12/17/25
            ],
            rex: {
                BMAX: [
                    new Date(2025, 11, 29), new Date(2025, 8, 26), new Date(2025, 5, 26), new Date(2026, 2, 27),
                    new Date(2026, 5, 26), new Date(2026, 8, 28), new Date(2026, 11, 29)
                ],
                FEPI: [
                    new Date(2025, 0, 28), new Date(2025, 1, 25), new Date(2025, 2, 25), new Date(2025, 3, 22),
                    new Date(2025, 4, 27), new Date(2025, 5, 24), new Date(2025, 6, 22), new Date(2025, 7, 26),
                    new Date(2025, 8, 23), new Date(2025, 9, 28), new Date(2025, 10, 24), new Date(2025, 11, 23)
                ],
                AIPI: [
                    new Date(2024, 6, 25), new Date(2024, 7, 26), new Date(2024, 8, 25), new Date(2024, 9, 23),
                    new Date(2024, 10, 25), new Date(2024, 11, 23), new Date(2025, 0, 28), new Date(2025, 1, 25),
                    new Date(2025, 2, 25), new Date(2025, 3, 22), new Date(2025, 4, 27), new Date(2025, 5, 24),
                    new Date(2025, 6, 22), new Date(2025, 7, 26), new Date(2025, 8, 23), new Date(2025, 9, 28),
                    new Date(2025, 10, 24), new Date(2025, 11, 23)
                ],
                CEPI: [
                    new Date(2025, 0, 27), new Date(2025, 1, 24), new Date(2025, 2, 24), new Date(2025, 3, 28),
                    new Date(2025, 4, 28), new Date(2025, 5, 23), new Date(2025, 6, 28), new Date(2025, 7, 25),
                    new Date(2025, 8, 22), new Date(2025, 9, 27), new Date(2025, 10, 25), new Date(2025, 11, 22)
                ],
                COII: [
                    new Date(2025, 5, 16), new Date(2025, 5, 23), new Date(2025, 5, 30), new Date(2025, 6, 7),
                    new Date(2025, 6, 14), new Date(2025, 6, 21), new Date(2025, 6, 28), new Date(2025, 7, 4),
                    new Date(2025, 7, 11), new Date(2025, 7, 18), new Date(2025, 7, 25), new Date(2025, 8, 2),
                    new Date(2025, 8, 8), new Date(2025, 8, 15), new Date(2025, 8, 22), new Date(2025, 8, 29),
                    new Date(2025, 9, 6), new Date(2025, 9, 13), new Date(2025, 9, 20), new Date(2025, 9, 27),
                    new Date(2025, 10, 3), new Date(2025, 10, 10), new Date(2025, 10, 17), new Date(2025, 10, 24),
                    new Date(2025, 11, 1), new Date(2025, 11, 8), new Date(2025, 11, 15), new Date(2025, 11, 22),
                    new Date(2025, 11, 29)
                ],
                MSII: [
                    new Date(2025, 5, 16), new Date(2025, 5, 23), new Date(2025, 5, 30), new Date(2025, 6, 7),
                    new Date(2025, 6, 14), new Date(2025, 6, 21), new Date(2025, 6, 28), new Date(2025, 7, 4),
                    new Date(2025, 7, 11), new Date(2025, 7, 18), new Date(2025, 7, 25), new Date(2025, 8, 2),
                    new Date(2025, 8, 8), new Date(2025, 8, 15), new Date(2025, 8, 22), new Date(2025, 8, 29),
                    new Date(2025, 9, 6), new Date(2025, 9, 13), new Date(2025, 9, 20), new Date(2025, 9, 27),
                    new Date(2025, 10, 3), new Date(2025, 10, 10), new Date(2025, 10, 17), new Date(2025, 10, 24),
                    new Date(2025, 11, 1), new Date(2025, 11, 8), new Date(2025, 11, 15), new Date(2025, 11, 22),
                    new Date(2025, 11, 29)
                ],
                NVII: [
                    new Date(2025, 5, 9), new Date(2025, 5, 16), new Date(2025, 5, 23), new Date(2025, 5, 30),
                    new Date(2025, 6, 7), new Date(2025, 6, 14), new Date(2025, 6, 21), new Date(2025, 6, 28),
                    new Date(2025, 7, 4), new Date(2025, 7, 11), new Date(2025, 7, 18), new Date(2025, 7, 25),
                    new Date(2025, 8, 2), new Date(2025, 8, 8), new Date(2025, 8, 15), new Date(2025, 8, 22),
                    new Date(2025, 8, 29), new Date(2025, 9, 6), new Date(2025, 9, 13), new Date(2025, 9, 20),
                    new Date(2025, 9, 27), new Date(2025, 10, 3), new Date(2025, 10, 10), new Date(2025, 10, 17),
                    new Date(2025, 10, 24), new Date(2025, 11, 1), new Date(2025, 11, 8), new Date(2025, 11, 15),
                    new Date(2025, 11, 22), new Date(2025, 11, 29)
                ],
                TSII: [
                    new Date(2025, 5, 16), new Date(2025, 5, 23), new Date(2025, 5, 30), new Date(2025, 6, 7),
                    new Date(2025, 6, 14), new Date(2025, 6, 21), new Date(2025, 6, 28), new Date(2025, 7, 4),
                    new Date(2025, 7, 11), new Date(2025, 7, 18), new Date(2025, 7, 25), new Date(2025, 8, 2),
                    new Date(2025, 8, 8), new Date(2025, 8, 15), new Date(2025, 8, 22), new Date(2025, 8, 29),
                    new Date(2025, 9, 6), new Date(2025, 9, 13), new Date(2025, 9, 20), new Date(2025, 9, 27),
                    new Date(2025, 10, 3), new Date(2025, 10, 10), new Date(2025, 10, 17), new Date(2025, 10, 24),
                    new Date(2025, 11, 1), new Date(2025, 11, 8), new Date(2025, 11, 15), new Date(2025, 11, 22),
                    new Date(2025, 11, 29)
                ],
                SSK: [
                    new Date(2025, 6, 30), new Date(2025, 7, 27), new Date(2025, 8, 26), new Date(2025, 9, 29),
                    new Date(2025, 10, 25), new Date(2025, 11, 29)
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