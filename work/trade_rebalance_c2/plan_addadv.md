# 광고 통합 계획서

## 개요
Shannon Rebalancing Strategy Backtest 웹사이트에 광고를 효과적으로 통합하기 위한 상세 계획서입니다.

## 현재 상태

### 완료된 준비 작업
1. **프로젝트 구조화**
   - 모듈화된 컴포넌트 구조 구현
   - ES6 모듈 시스템 적용
   - 명확한 책임 분리 (SoC)

2. **광고 인프라 구축**
   - `AdSpace` 컴포넌트 구현 완료
   - 광고 컨테이너 자동 생성 시스템
   - 위치별 스타일링 시스템

3. **광고 삽입 위치 준비**
   - Header, Content, Footer 영역 확보
   - 반응형 광고 공간 디자인
   - 플레이스홀더 표시

## 광고 통합 단계별 계획

### Phase 1: 광고 네트워크 선택 및 설정 (1-2일)

#### 1.1 광고 네트워크 옵션
- **Google AdSense**
  - 장점: 높은 수익성, 신뢰성
  - 단점: 승인 과정 필요
  - 구현 난이도: 중간

- **Media.net**
  - 장점: Yahoo/Bing 네트워크
  - 단점: AdSense보다 낮은 수익
  - 구현 난이도: 쉬움

- **Carbon Ads**
  - 장점: 개발자 친화적, 깔끔한 디자인
  - 단점: 낮은 수익, 승인 어려움
  - 구현 난이도: 쉬움

#### 1.2 필요한 작업
```javascript
// src/config/adConfig.js 생성
export const adConfig = {
    adsense: {
        client: 'ca-pub-XXXXXXXXXXXXXXXX',
        slots: {
            header: 'XXXXXXXXXX',
            content: 'XXXXXXXXXX',
            footer: 'XXXXXXXXXX'
        }
    }
};
```

### Phase 2: 광고 로더 구현 (1일)

#### 2.1 AdLoader 클래스 생성
```javascript
// src/utils/AdLoader.js
export class AdLoader {
    constructor(config) {
        this.config = config;
        this.loaded = false;
    }

    async loadGoogleAdsense() {
        // Google AdSense 스크립트 동적 로딩
        const script = document.createElement('script');
        script.async = true;
        script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
        script.setAttribute('data-ad-client', this.config.adsense.client);
        document.head.appendChild(script);
    }

    insertAd(position, slotId) {
        // 광고 삽입 로직
        const adElement = document.createElement('ins');
        adElement.className = 'adsbygoogle';
        adElement.style.display = 'block';
        adElement.setAttribute('data-ad-client', this.config.adsense.client);
        adElement.setAttribute('data-ad-slot', slotId);
        
        return adElement;
    }
}
```

#### 2.2 AdSpace 컴포넌트 업데이트
```javascript
// AdSpace.js 수정
import { AdLoader } from '../utils/AdLoader.js';
import { adConfig } from '../config/adConfig.js';

export class AdSpace {
    constructor() {
        this.adLoader = new AdLoader(adConfig);
        this.adContainers = new Map();
    }

    async initializeAds() {
        await this.adLoader.loadGoogleAdsense();
        this.insertAdsIntoContainers();
    }

    insertAdsIntoContainers() {
        // 각 위치에 광고 삽입
        Object.entries(adConfig.adsense.slots).forEach(([position, slotId]) => {
            const container = this.adContainers.get(`${position}-ad`);
            if (container) {
                const adElement = this.adLoader.insertAd(position, slotId);
                container.appendChild(adElement);
                (adsbygoogle = window.adsbygoogle || []).push({});
            }
        });
    }
}
```

### Phase 3: 광고 최적화 (2-3일)

#### 3.1 레이지 로딩 구현
```javascript
// 스크롤 기반 광고 로딩
class LazyAdLoader {
    constructor() {
        this.observer = new IntersectionObserver(this.handleIntersection.bind(this));
    }

    observeAdContainers() {
        document.querySelectorAll('.ad-container').forEach(container => {
            this.observer.observe(container);
        });
    }

    handleIntersection(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                this.loadAdForContainer(entry.target);
                this.observer.unobserve(entry.target);
            }
        });
    }
}
```

#### 3.2 광고 새로고침 전략
```javascript
// 30초마다 보이는 광고 새로고침
class AdRefreshManager {
    constructor(refreshInterval = 30000) {
        this.refreshInterval = refreshInterval;
        this.visibleAds = new Set();
    }

    startRefreshCycle() {
        setInterval(() => {
            this.visibleAds.forEach(adId => {
                this.refreshAd(adId);
            });
        }, this.refreshInterval);
    }
}
```

### Phase 4: 수익 추적 및 분석 (2일)

#### 4.1 광고 성과 추적
```javascript
// src/analytics/AdAnalytics.js
export class AdAnalytics {
    trackImpression(adId, position) {
        // Google Analytics 이벤트 전송
        gtag('event', 'ad_impression', {
            ad_id: adId,
            ad_position: position,
            timestamp: Date.now()
        });
    }

    trackClick(adId, position) {
        gtag('event', 'ad_click', {
            ad_id: adId,
            ad_position: position
        });
    }
}
```

#### 4.2 A/B 테스팅
```javascript
// 광고 위치 최적화를 위한 A/B 테스트
class AdABTester {
    constructor() {
        this.variants = {
            A: { header: true, content: true, footer: true },
            B: { header: true, content: false, footer: true }
        };
    }

    selectVariant() {
        return Math.random() > 0.5 ? 'A' : 'B';
    }
}
```

### Phase 5: 사용자 경험 보호 (1일)

#### 5.1 광고 차단기 감지
```javascript
class AdBlockDetector {
    detect() {
        const testAd = document.createElement('div');
        testAd.innerHTML = '&nbsp;';
        testAd.className = 'adsbox';
        document.body.appendChild(testAd);
        
        window.setTimeout(() => {
            if (testAd.offsetHeight === 0) {
                this.handleAdBlockDetected();
            }
            testAd.remove();
        }, 100);
    }

    handleAdBlockDetected() {
        // 정중한 메시지 표시
        console.log('Ad blocker detected');
    }
}
```

#### 5.2 성능 최적화
```javascript
// 광고 로딩이 메인 콘텐츠를 방해하지 않도록
class PerformanceOptimizer {
    deferAdLoading() {
        if ('requestIdleCallback' in window) {
            requestIdleCallback(() => {
                this.loadAds();
            });
        } else {
            setTimeout(() => {
                this.loadAds();
            }, 2000);
        }
    }
}
```

## 구현 체크리스트

### 즉시 구현 가능 (현재 준비됨)
- [x] 광고 컨테이너 생성
- [x] 플레이스홀더 표시
- [x] 반응형 레이아웃
- [x] 컴포넌트 구조

### 광고 네트워크 승인 후 구현
- [ ] AdSense 계정 생성 및 승인
- [ ] 광고 유닛 생성
- [ ] 광고 코드 통합
- [ ] 테스트 및 검증

### 추가 구현 사항
- [ ] 광고 로더 클래스
- [ ] 레이지 로딩
- [ ] 광고 새로고침
- [ ] 성과 추적
- [ ] A/B 테스팅
- [ ] 광고 차단기 대응

## 예상 수익 모델

### 트래픽 기반 예상 수익
- **일일 방문자 1,000명 기준**
  - CTR (클릭률): 1-2%
  - CPC (클릭당 비용): $0.20-0.50
  - 예상 일일 수익: $2-10

- **일일 방문자 10,000명 기준**
  - CTR: 1-2%
  - CPC: $0.20-0.50
  - 예상 일일 수익: $20-100

### 수익 최적화 전략
1. **고가치 키워드 타겟팅**
   - 금융, 투자 관련 키워드
   - 트레이딩 전략 키워드

2. **광고 위치 최적화**
   - Above the fold 광고
   - 콘텐츠 내 네이티브 광고

3. **사용자 참여도 향상**
   - 체류 시간 증가
   - 페이지뷰 증가

## 법적/윤리적 고려사항

### 필수 구현 사항
1. **개인정보 처리방침**
   - 광고 쿠키 사용 명시
   - 데이터 수집 범위 공개

2. **쿠키 동의 배너**
   ```javascript
   class CookieConsent {
       show() {
           // GDPR 준수 쿠키 동의
       }
   }
   ```

3. **광고 라벨링**
   - 명확한 "광고" 또는 "스폰서" 표시
   - 콘텐츠와 광고 구분

## 타임라인

### Week 1
- Day 1-2: 광고 네트워크 신청 및 승인 대기
- Day 3: AdLoader 구현
- Day 4-5: 광고 통합 및 테스트

### Week 2
- Day 1-2: 성능 최적화
- Day 3: 분석 도구 통합
- Day 4-5: A/B 테스트 시작

### Week 3
- 모니터링 및 최적화
- 수익 분석
- 사용자 피드백 수집

## 결론

현재 프로젝트는 광고 통합을 위한 기술적 준비가 완료되었습니다. AdSpace 컴포넌트와 모듈화된 구조 덕분에 광고 네트워크 승인 후 즉시 구현이 가능합니다. 제안된 단계별 계획을 따르면 사용자 경험을 해치지 않으면서도 효과적인 수익화가 가능할 것입니다.