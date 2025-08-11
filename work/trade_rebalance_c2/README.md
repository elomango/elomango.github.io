# Shannon Rebalancing Strategy Backtest

주식 포트폴리오 리밸런싱 전략(Shannon's Demon)을 백테스트하는 웹 애플리케이션입니다.

## 프로젝트 구조

```
shanon/
├── index.html                 # 메인 HTML 파일
├── src/                       # 소스 코드 디렉토리
│   ├── js/                   # JavaScript 모듈
│   │   └── app.js           # 메인 애플리케이션 진입점
│   ├── css/                  # 스타일시트
│   │   └── main.css         # 메인 스타일시트
│   ├── modules/              # 비즈니스 로직 모듈
│   │   └── strategy.js      # Shannon 전략 구현
│   ├── components/           # UI 컴포넌트
│   │   ├── ChartManager.js  # 차트 관리 컴포넌트
│   │   ├── TableManager.js  # 테이블 관리 컴포넌트
│   │   ├── ComparisonDisplay.js # 성과 비교 디스플레이
│   │   ├── InputManager.js  # 입력 폼 관리
│   │   └── AdSpace.js       # 광고 공간 관리
│   └── utils/                # 유틸리티 모듈
│       └── api.js           # 주식 데이터 API
├── style.css                 # (레거시 - 삭제 예정)
├── script.js                 # (레거시 - 삭제 예정)
└── command.md                # 프로젝트 요구사항 문서
```

## 아키텍처

### 모듈화 구조

프로젝트는 ES6 모듈 시스템을 사용하여 구조화되었습니다:

1. **Application Layer** (`src/js/app.js`)
   - 메인 애플리케이션 컨트롤러
   - 모든 컴포넌트 초기화 및 조정
   - 이벤트 처리 및 시뮬레이션 실행

2. **Components Layer** (`src/components/`)
   - `ChartManager`: Chart.js를 사용한 차트 렌더링 관리
   - `TableManager`: 리밸런싱 이력 테이블 관리
   - `ComparisonDisplay`: 전략 성과 비교 표시
   - `InputManager`: 사용자 입력 검증 및 관리
   - `AdSpace`: 광고 공간 생성 및 관리

3. **Business Logic Layer** (`src/modules/`)
   - `ShannonStrategy`: 핵심 리밸런싱 전략 로직 구현

4. **Data Layer** (`src/utils/`)
   - `StockDataAPI`: 주식 데이터 fetching 및 캐싱

### 주요 기능

#### 1. 데이터 관리
- Yahoo Finance API를 통한 실시간 주식 데이터
- 15분 캐싱으로 성능 최적화
- Mock 데이터 폴백 지원

#### 2. 전략 시뮬레이션
- Shannon's Demon 리밸런싱 전략 구현
- 매개변수 기반 커스터마이징 가능
- 실시간 포트폴리오 가치 계산

#### 3. 시각화
- 듀얼 Y축 차트 (가격 & 비율)
- 포트폴리오 가치 추이
- 리밸런싱 포인트 표시

#### 4. 성과 분석
- Buy & Hold 전략과의 비교
- 상세 리밸런싱 이력 테이블
- 수익률 계산 및 표시

## 광고 통합 준비

### AdSpace 컴포넌트

광고 통합을 위한 `AdSpace` 클래스가 구현되어 있습니다:

- **위치별 광고 컨테이너**: header, sidebar, content, footer
- **동적 광고 로딩**: `loadAd()` 메소드로 광고 콘텐츠 주입
- **반응형 디자인**: 모바일/데스크톱 최적화

### 광고 삽입 위치

1. **Header Banner**: 페이지 상단
2. **Content Ad**: 차트 사이
3. **Footer Banner**: 페이지 하단
4. **Sidebar**: (향후 구현 예정)

## 설치 및 실행

1. 프로젝트 클론 또는 다운로드
2. 웹 서버에서 `index.html` 실행
3. 또는 로컬에서 Live Server 사용

```bash
# Python 서버 예시
python -m http.server 8000

# Node.js 서버 예시
npx http-server
```

## 사용 방법

1. **매개변수 설정**
   - 기간 선택 (기본: 최근 1년)
   - 초기 자본 입력
   - 티커 심볼 입력 (기본: TQQQ/QQQ)
   - 리밸런싱 임계값 설정

2. **시뮬레이션 실행**
   - "Start Simulation" 버튼 클릭
   - 결과 차트 및 테이블 확인

3. **결과 분석**
   - 차트에서 가격 추이 및 리밸런싱 포인트 확인
   - 테이블에서 상세 거래 내역 확인
   - 성과 비교 섹션에서 전략 효과 분석

## 기술 스택

- **Frontend**: Vanilla JavaScript (ES6+)
- **Charts**: Chart.js v4.4.0
- **Styling**: CSS3 with Grid/Flexbox
- **Data Source**: Yahoo Finance API (CORS proxy 사용)

## 향후 개선 사항

- [ ] 더 많은 리밸런싱 전략 추가
- [ ] 백테스트 결과 다운로드 기능
- [ ] 실시간 데이터 스트리밍
- [ ] 포트폴리오 최적화 도구
- [ ] 다중 자산 포트폴리오 지원

## 라이선스

이 프로젝트는 교육 및 연구 목적으로 제작되었습니다.