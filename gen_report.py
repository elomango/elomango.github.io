#!/usr/bin/env python3
"""
Elomango 사이트 보고서 자동 생성 스크립트
Usage: python3 gen_report.py <markdown_file> --type=<corp|etf> --name="<name>" --generator="<generator>" --ticker=<ticker>
Example: python3 gen_report.py loctemp/test_report.md --type=corp --name="Some corp name" --generator="Claude Opus 4.1" --ticker=ABCD
"""

import sys
import os
import re
import argparse
from datetime import datetime
from pathlib import Path

def parse_arguments():
    """명령줄 인자 파싱"""
    parser = argparse.ArgumentParser(description='Elomango 사이트 보고서 생성 스크립트')
    parser.add_argument('markdown_file', help='마크다운 보고서 파일 경로')
    parser.add_argument('--type', required=True, choices=['corp', 'etf'], 
                        help='보고서 타입 (corp: 기업, etf: ETF)')
    parser.add_argument('--name', required=True, 
                        help='회사명 또는 ETF명')
    parser.add_argument('--generator', required=True, 
                        help='보고서 생성자/애널리스트')
    parser.add_argument('--ticker', required=True, 
                        help='티커 심볼')
    
    args = parser.parse_args()
    return args

def create_metadata(args):
    """명령줄 인자로부터 메타데이터 생성"""
    metadata = {
        'date': datetime.now().strftime('%Y-%m-%d'),
        'company': args.name,
        'ticker': args.ticker.upper(),
        'analyst': args.generator
    }
    
    # 타입에 따른 제목 생성
    if args.type == 'corp':
        metadata['title'] = f"{args.name} 기업 분석"
    else:  # etf
        metadata['title'] = f"{args.name} ETF 분석"
    
    return metadata

def generate_report_id(metadata):
    """보고서 ID 생성"""
    company_name = metadata['company'].lower()
    # 특수문자 제거 및 공백을 하이픈으로 변경
    company_name = re.sub(r'[^a-z0-9\s-]', '', company_name)
    company_name = re.sub(r'\s+', '-', company_name)
    
    # 티커가 있으면 포함
    if metadata['ticker']:
        report_id = f"{company_name}-{metadata['ticker'].lower()}-{metadata['date']}"
    else:
        report_id = f"{company_name}-{metadata['date']}"
    
    return report_id


def create_report_js(report_id, metadata, content, lang='ko'):
    """보고서 JS 파일 생성"""
    
    # 내용 정제 - JavaScript 문자열로 안전하게 변환
    content = content.replace('\\', '\\\\')
    content = content.replace('`', '\\`')
    content = content.replace('${', '\\${')
    
    # 영어 제목 생성 - 단순히 한국어 키워드를 영어로 변경
    if lang == 'en':
        title_en = metadata['title'].replace('기업 분석', 'Company Analysis').replace('ETF 분석', 'ETF Analysis')
    else:
        title_en = metadata['title'].replace('기업 분석', 'Company Analysis').replace('ETF 분석', 'ETF Analysis')
    
    js_content = f"""// {metadata['company']} 보고서 데이터 ({'한국어' if lang == 'ko' else '영어'})
window.reportData = {{
    metadata: {{
        id: "{report_id}",
        company: "{metadata['company']}",
        ticker: "{metadata['ticker'] or 'N/A'}",
        date: "{metadata['date']}",
        title: {{
            ko: "{metadata['title']}",
            en: "{title_en}"
        }},
        analyst: {{
            ko: "{metadata['analyst']}",
            en: "{metadata['analyst']}"
        }}
    }},
    content: `{content}`
}};
"""
    return js_content

def update_report_index_metadata(report_id, metadata, lang='ko'):
    """research/index.html의 reportMetadata 업데이트"""
    
    index_path = f"{lang}/research/index.html"
    
    with open(index_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # reportMetadata 객체 찾기 - 더 정확한 패턴 사용
    # 중첩된 객체를 처리하기 위해 }; 까지 찾기
    metadata_pattern = r'(const reportMetadata = \{)(.*?)(}\s*;)'
    
    # 새 메타데이터 항목
    new_entry = f"""            '{report_id}': {{
                title: '{metadata['title']}',
                filename: '{report_id}.js'
            }},"""
    
    # 기존 메타데이터에 추가
    def replacer(match):
        opening = match.group(1)  # const reportMetadata = {
        existing_content = match.group(2)  # 기존 내용
        closing = match.group(3)  # };
        
        # 기존 내용의 마지막 } 뒤에 콤마 추가 (필요한 경우)
        existing_content = existing_content.rstrip()
        if not existing_content.endswith(','):
            # 마지막 항목 찾아서 콤마 추가
            lines = existing_content.split('\n')
            for i in range(len(lines) - 1, -1, -1):
                if '}' in lines[i] and not lines[i].strip().startswith('//'):
                    lines[i] = lines[i].rstrip() + ','
                    break
            existing_content = '\n'.join(lines)
        
        # 새 항목 추가
        return opening + existing_content + '\n' + new_entry + '\n        ' + closing
    
    content = re.sub(metadata_pattern, replacer, content, flags=re.DOTALL)
    
    with open(index_path, 'w', encoding='utf-8') as f:
        f.write(content)

def update_homepage_table(report_id, metadata, lang='ko'):
    """홈페이지 테이블에 보고서 추가"""
    
    homepage_path = f"{lang}/index.html"
    
    with open(homepage_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 날짜 파싱
    date_parts = metadata['date'].split('-')
    year = date_parts[0]
    month = date_parts[1]
    day = date_parts[2]
    
    # 영어 제목 생성
    title_en = metadata['title'].replace('기업 분석', 'Company Analysis').replace('ETF 분석', 'ETF Analysis')
    
    # 새로운 보고서 객체 생성 (JavaScript 객체 형식)
    new_report = f"""                        {{
                            "id": "{report_id}",
                            "year": {year},
                            "month": {month},
                            "day": {day},
                            "company": "{metadata['company']}",
                            "ticker": "{metadata['ticker'] or 'N/A'}",
                            "date": "{metadata['date']}",
                            "title": {{
                                "ko": "{metadata['title']}",
                                "en": "{title_en}"
                            }},
                            "summary": {{
                                "ko": "{metadata['title']} 상세 분석",
                                "en": "Detailed analysis of {title_en}"
                            }},
                            "path": "./research/index.html?id={report_id}",
                            "rating": "TBD",
                            "tags": ["analysis"],
                            "analyst": {{
                                "ko": "{metadata['analyst']}",
                                "en": "{metadata['analyst']}"
                            }}
                        }},"""
    
    # reports 배열 찾기 및 업데이트
    reports_pattern = r'("reports":\s*\[)([^]]*)(])'
    
    def replacer(match):
        opening = match.group(1)
        existing_content = match.group(2)
        closing = match.group(3)
        
        # 새 보고서를 배열의 시작 부분에 추가 (최신 보고서가 위에 오도록)
        return opening + '\n' + new_report + existing_content + closing
    
    content = re.sub(reports_pattern, replacer, content, flags=re.DOTALL)
    
    with open(homepage_path, 'w', encoding='utf-8') as f:
        f.write(content)

def process_report(markdown_file, args):
    """메인 처리 함수"""
    
    # 수정된 파일 추적용 리스트
    modified_files = []
    
    # 마크다운 파일 읽기
    with open(markdown_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 명령줄 인자로부터 메타데이터 생성
    metadata = create_metadata(args)
    
    print(f"\n=== 보고서 메타데이터 ===")
    print(f"날짜: {metadata['date']}")
    print(f"기업명: {metadata['company']}")
    print(f"티커: {metadata['ticker']}")
    print(f"제목: {metadata['title']}")
    print(f"애널리스트: {metadata['analyst']}")
    
    # 보고서 ID 생성
    report_id = generate_report_id(metadata)
    print(f"\n생성된 보고서 ID: {report_id}")
    
    # 한국어 버전 처리
    print("\n=== 한국어 버전 생성 중 ===")
    
    # JS 파일 생성
    js_content_ko = create_report_js(report_id, metadata, content, 'ko')
    js_path_ko = f"ko/research/reports/{report_id}.js"
    os.makedirs(os.path.dirname(js_path_ko), exist_ok=True)
    with open(js_path_ko, 'w', encoding='utf-8') as f:
        f.write(js_content_ko)
    print(f"✓ JS 파일 생성: {js_path_ko}")
    modified_files.append(js_path_ko)
    
    # reportMetadata 업데이트
    update_report_index_metadata(report_id, metadata, 'ko')
    print(f"✓ ko/research/index.html 메타데이터 업데이트")
    modified_files.append("ko/research/index.html")
    
    # 홈페이지 테이블 업데이트
    update_homepage_table(report_id, metadata, 'ko')
    print(f"✓ ko/index.html 테이블 업데이트")
    modified_files.append("ko/index.html")
    
    # 영어 버전 처리
    print("\n=== 영어 버전 생성 중 ===")
    
    # 영어 버전은 같은 내용 사용 (번역은 사용자가 제공해야 함)
    content_en = content
    metadata_en = metadata.copy()
    metadata_en['title'] = metadata['title'].replace('기업 분석', 'Company Analysis').replace('ETF 분석', 'ETF Analysis')
    
    # JS 파일 생성
    js_content_en = create_report_js(report_id, metadata_en, content_en, 'en')
    js_path_en = f"en/research/reports/{report_id}.js"
    os.makedirs(os.path.dirname(js_path_en), exist_ok=True)
    with open(js_path_en, 'w', encoding='utf-8') as f:
        f.write(js_content_en)
    print(f"✓ JS 파일 생성: {js_path_en}")
    modified_files.append(js_path_en)
    
    # reportMetadata 업데이트
    update_report_index_metadata(report_id, metadata_en, 'en')
    print(f"✓ en/research/index.html 메타데이터 업데이트")
    modified_files.append("en/research/index.html")
    
    # 홈페이지 테이블 업데이트
    update_homepage_table(report_id, metadata_en, 'en')
    print(f"✓ en/index.html 테이블 업데이트")
    modified_files.append("en/index.html")
    
    print(f"\n✅ 보고서 생성 완료!")
    print(f"한국어: https://elomango.github.io/ko/research/?id={report_id}")
    print(f"영어: https://elomango.github.io/en/research/?id={report_id}")
    
    print(f"\n=== 스크립트가 수정한 파일 ===")
    for file_path in modified_files:
        print(f"  • {file_path}")

def main():
    try:
        # 명령줄 인자 파싱
        args = parse_arguments()
        
        # 파일 존재 확인
        if not os.path.exists(args.markdown_file):
            print(f"Error: 파일을 찾을 수 없습니다: {args.markdown_file}")
            sys.exit(1)
        
        # 보고서 처리
        process_report(args.markdown_file, args)
        
    except Exception as e:
        print(f"\n❌ 오류 발생: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()