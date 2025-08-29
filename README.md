# Elomango

Financial Tools & Investment Resources

## 🌐 Live Website

Visit the website at: **https://elomango.github.io**

## 📋 Features

- **ETF 배당 캘린더**: YieldMax ETFs의 배당 일정을 캘린더 형식으로 확인
- **포트폴리오 분석기** (준비중): 포트폴리오의 성과를 분석하고 리밸런싱 제안
- **실시간 시장 대시보드** (준비중): 주요 지수, 환율, 암호화폐 등의 실시간 정보

## 🎨 Design

- Mango/lemon color theme with warm yellow gradients
- Mobile-optimized responsive design
- Clean and intuitive user interface

## 🛠️ Development Tools

### Report Generator Script (`gen_report.py`)

보고서를 자동으로 생성하고 웹사이트에 추가하는 스크립트입니다.

#### 사용법

```bash
python3 gen_report.py <markdown_file> --type=<corp|etf> --name="<name>" --generator="<generator>" --ticker=<ticker>
```

#### 필수 인자

- `markdown_file`: 마크다운 형식의 보고서 파일 경로
- `--type`: 보고서 타입 (`corp` = 기업, `etf` = ETF)
- `--name`: 회사명 또는 ETF명
- `--generator`: 보고서 생성자/애널리스트 이름
- `--ticker`: 티커 심볼

#### 예시

```bash
# 기업 보고서 생성
python3 gen_report.py loctemp/apple_report.md --type=corp --name="애플" --generator="Claude Opus 4.1" --ticker=AAPL

# ETF 보고서 생성
python3 gen_report.py loctemp/spy_report.md --type=etf --name="SPDR S&P 500" --generator="AI Analyst" --ticker=SPY
```

#### 기능

- 자동으로 보고서 ID 생성
- 한국어/영어 버전 JS 파일 생성
- 영어 번역 파일 자동 탐색 (파일명_en.md)
- `research/index.html` 메타데이터 업데이트
- 홈페이지 테이블에 새 보고서 추가
- 수정된 파일 목록 표시

#### 영어 번역 지원

스크립트는 자동으로 영어 번역 파일을 탐색합니다:
- 입력 파일: `report.md`
- 영어 번역 파일: `report_en.md` (자동 탐색)
- 번역 파일이 있으면 사용, 없으면 원본을 양쪽 버전에 사용

```bash
# 영어 번역 파일이 있는 경우
python3 gen_report.py loctemp/apple_report.md --type=corp --name="애플" --generator="Claude Opus 4.1" --ticker=AAPL
# → 자동으로 apple_report_en.md 파일 감지 및 사용

# 영어 번역 파일이 없는 경우
python3 gen_report.py loctemp/report.md --type=corp --name="회사명" --generator="생성자" --ticker=TICK
# → 원본을 한국어/영어 버전 모두에 사용
```

**참고:** 영어 번역은 별도의 `translate_to_en.py` 스크립트를 사용하거나 수동으로 번역하여 `{파일명}_en.md` 형식으로 저장해야 합니다.

#### 생성되는 파일

- `ko/research/reports/{report-id}.js` - 한국어 보고서
- `en/research/reports/{report-id}.js` - 영어 보고서
- `ko/research/index.html` - 한국어 메타데이터 업데이트
- `en/research/index.html` - 영어 메타데이터 업데이트
- `ko/index.html` - 한국어 홈페이지 테이블 업데이트
- `en/index.html` - 영어 홈페이지 테이블 업데이트

## 📞 Contact

For inquiries, please contact: elomango7@gmail.com

---

© 2025 Elomango. All rights reserved. 
