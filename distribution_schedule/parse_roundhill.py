#!/usr/bin/env python3
import os
import csv
from datetime import datetime
from pathlib import Path

def parse_date(date_str):
    """Parse date string in M/D/YYYY format to JavaScript Date format"""
    try:
        date_obj = datetime.strptime(date_str, '%m/%d/%Y')
        # JavaScript months are 0-based
        return f"new Date({date_obj.year}, {date_obj.month - 1}, {date_obj.day})"
    except ValueError:
        return None

def extract_ticker(filename):
    """Extract ticker from filename (first 4 chars before _)"""
    return filename.split('_')[0]

def process_etf_files():
    """Process all Roundhill ETF files and generate JavaScript date arrays"""
    work_dir = Path('../work/RoundHill')
    
    income_dates = []
    weekly_dates = []
    income_tickers = []
    weekly_tickers = []
    
    # Process Income ETFs
    income_dir = work_dir / 'Income ETF'
    if income_dir.exists():
        for csv_file in income_dir.glob('*.csv'):
            ticker = extract_ticker(csv_file.name)
            income_tickers.append(ticker)
            
            with open(csv_file, 'r') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    ex_date = row.get('Ex Date', '').strip()
                    if ex_date:
                        js_date = parse_date(ex_date)
                        if js_date:
                            income_dates.append(js_date)
    
    # Process Weekly ETFs
    weekly_dir = work_dir / 'Weekly ETF'
    if weekly_dir.exists():
        for csv_file in weekly_dir.glob('*.csv'):
            ticker = extract_ticker(csv_file.name)
            weekly_tickers.append(ticker)
            
            with open(csv_file, 'r') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    ex_date = row.get('Ex Date', '').strip()
                    if ex_date:
                        js_date = parse_date(ex_date)
                        if js_date:
                            weekly_dates.append(js_date)
    
    # Remove duplicates and sort
    income_dates = sorted(list(set(income_dates)))
    weekly_dates = sorted(list(set(weekly_dates)))
    
    return {
        'income_dates': income_dates,
        'weekly_dates': weekly_dates,
        'income_tickers': sorted(income_tickers),
        'weekly_tickers': sorted(weekly_tickers)
    }

if __name__ == "__main__":
    result = process_etf_files()
    
    print("// Roundhill Income ETF dates")
    print("rhIncome: [")
    for i, date in enumerate(result['income_dates']):
        comma = "," if i < len(result['income_dates']) - 1 else ""
        print(f"    {date}{comma}")
    print("],")
    
    print("\n// Roundhill Weekly ETF dates")
    print("rhWeekly: [")
    for i, date in enumerate(result['weekly_dates']):
        comma = "," if i < len(result['weekly_dates']) - 1 else ""
        print(f"    {date}{comma}")
    print("],")
    
    print(f"\n// Income ETF Tickers: {result['income_tickers']}")
    print(f"// Weekly ETF Tickers: {result['weekly_tickers']}")