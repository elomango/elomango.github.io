# Elomango Project Context

## 프로젝트 개요
Elomango는 금융 도구와 투자 정보를 제공하는 웹 플랫폼입니다. 다국어 지원(한국어/영어)과 다양한 금융 도구를 제공합니다.

## 프로젝트 구조

### 주요 디렉토리
```
elomango.github.io/
├── index.html                    # 루트 페이지 (언어 선택 및 리디렉션)
├── ko/                          # 한국어 버전
│   ├── index.html               # 메인 페이지
│   ├── privacy.html             # 개인정보처리방침
│   ├── terms.html              # 이용약관
│   ├── research/               # 분석 보고서
│   └── trade/                  # 트레이딩 도구
│       ├── chart-stack/        # Chart Stack 도구
│       └── rebalance-c2/       # Rebalance C2 도구
├── en/                         # 영어 버전 (ko/와 동일 구조)
├── distribution_schedule/       # ETF 배당 캘린더
├── assets/                     # CSS, JS, 이미지 자산
├── reports/                    # 분석 보고서 파일들
└── research/                   # 보고서 메타데이터
```

### 핵심 기능

#### 1. ETF Distribution Calendar (`/distribution_schedule/`)
- 고배당 ETF의 배당 일정을 캘린더 형식으로 표시
- YieldMax, REX Shares, Roundhill 등의 ETF 제공사별 분류
- 실시간 배당 데이터 표시

#### 2. Trading Tools (`/ko/trade/`, `/en/trade/`)

**Chart Stack Tool:**
- 동일한 초기 자본($10,000)으로 서로 다른 주식의 성과 비교
- Yahoo Finance API를 통한 실시간 주가 데이터
- Chart.js를 사용한 인터랙티브 차트
- 다중 종목 비교 지원

**Rebalance C2 Tool:**
- 두 종목 간의 리밸런싱 전략 백테스트
- 비율 유지 시뮬레이션

#### 3. Research Reports (`/research/`)
- 기업 분석 보고서 (PANW, GitLab, CoreWeave, Circle 등)
- ETF 분석 보고서 (Roundhill Income ETFs, IAI ETF 등)
- 다국어 지원 (한국어/영어)

## 기술 스택

### Frontend
- **HTML5/CSS3/JavaScript** - 순수 웹 기술
- **Chart.js 4.4.0** - 차트 라이브러리
- **Responsive Design** - 모바일 친화적 디자인

### Data Sources
- **Yahoo Finance API** - 실시간 주가 데이터
- **CORS Proxy** (corsproxy.io) - API 접근을 위한 프록시
- **Fear & Greed Index** - 시장 심리 지표

### Hosting & Services
- **GitHub Pages** - 호스팅
- **Google AdSense** - 광고 수익화 (ca-pub-6475131530037931)
- **Google Analytics** - 웹 트래픽 분석

## 현재 상황 (2025년 8월)

### Google AdSense 이슈
**문제:** "게시자 콘텐츠가 없는 화면에 Google 게재 광고" 정책 위반으로 승인 거부

**주요 위반 사항:**
1. 루트 페이지에 실질적 콘텐츠 없음 (언어 선택만 제공)
2. "준비중" 상태의 기능들에 광고 배치
3. 모든 페이지에 동일한 테스트 광고 슬롯 ID 사용
4. JavaScript 의존적 콘텐츠

**해결 방안:**
- 루트 페이지에 실질적 콘텐츠 추가 또는 광고 제거
- "준비중" 기능 완성 또는 광고 제거
- 각 페이지별 고유 광고 슬롯 ID 사용
- 콘텐츠 품질 및 독창성 강화

## 개발 가이드라인

### 다국어 지원
- 모든 새 페이지는 한국어(`/ko/`)와 영어(`/en/`) 버전 모두 생성
- 언어별 메타데이터 및 SEO 최적화

### 스타일 가이드
- **색상 테마:** #667eea (주요 색상), #fdcb6e (강조 색상)
- **폰트:** -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto
- **레이아웃:** 반응형 디자인, 모바일 우선

### 파일 명명 규칙
- HTML 파일: 소문자, 하이픈 사용 (`chart-stack.html`)
- 보고서 ID: `{company-name}-{yyyy-mm-dd}` 형식
- 이미지: 의미있는 이름, 최적화된 크기

## API 및 외부 서비스

### Yahoo Finance API
```javascript
const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?period1=${from}&period2=${to}&interval=1d`;
const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
```

### Chart.js 설정
```javascript
// 표준 라인 차트 설정
chart = new Chart(ctx, {
    type: 'line',
    data: { datasets: [] },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        // ... 기타 설정
    }
});
```

## 배포 및 운영

### Git Workflow
- **Main 브랜치**: 프로덕션 배포
- **GitHub Pages**: 자동 배포
- **커밋 메시지**: 영어로 작성, 명확한 설명

### 파일 관리
- 불필요한 파일 제외: `.DS_Store`, `node_modules/`
- 이미지 최적화: 웹용 크기 및 포맷
- CSS/JS 파일: 주석 최소화, 프로덕션 최적화

## 성능 최적화

### 로딩 성능
- 이미지 lazy loading 고려
- CSS/JS 파일 압축
- 외부 리소스 최적화

### SEO 최적화
- 메타 태그 완성도 (title, description, keywords)
- 언어별 대체 링크 (`hreflang`)
- 구조화된 데이터 마크업 고려

## 보안 고려사항

### CORS 정책
- 외부 API 호출 시 프록시 서버 사용
- 민감한 API 키 노출 방지

### 콘텐츠 보안
- 사용자 입력 검증 (XSS 방지)
- 외부 링크 `target="_blank"` 시 `rel="noopener"` 추가

## 향후 개발 계획

### 단기 목표
1. AdSense 정책 위반 문제 해결
2. "준비중" 기능들 구현 완료
3. 콘텐츠 품질 개선

### 중장기 목표
1. 사용자 계정 시스템 도입
2. 포트폴리오 저장 기능
3. 실시간 알림 시스템
4. 모바일 앱 개발 검토

## 연락처 및 지원
- **이메일**: elomango7@gmail.com
- **GitHub**: https://github.com/elomango
- **웹사이트**: https://elomango.github.io

---
*이 문서는 프로젝트의 전반적인 컨텍스트를 제공하며, 새로운 개발자나 다른 환경에서 작업할 때 참고용으로 활용됩니다.*