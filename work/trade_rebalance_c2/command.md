
셰넌 전략으로 백테스트를 하고 결과를 챠트로 볼수 있는 사이트를 만들어줘.

아래의 “A. 입력” 부분은 사용자로 부터 입력을 받는 부분이야. 여기서 받은 입력 내용으로 화면을 
“B 출력” 부분에 기술 한 것 처럼 보여줘.

셰넌 전략(매수 매도 및 발란스 전략)은 아래 내용과 같아.
- Point1: TickerA 와 TickerB 가 1:1 비율 로 유지
    - 첫 Point1 시점은, 시뮬레이션의 첫날의 종가를 기준으로 설정
    - 이후 재 발란스가 일어난 시점이 Point1 시점으로 업데이트 됨
- Increase: TickerA 가 Point1 지점으로 부터, A_INC_Gap_Perc 만큼 올랐다면, 
    - A_INC_Sell_Perc 만큼 매도. 
    - 매도한 금액으로 TickerB 매수
    - 발란스를 재조정한 이 시점을 Point1 로 재 설정
- Decrease: TickerA 가 Point1 지점으로 부터, A_DEC_Gap_Perc 만큼 하락 하면, 
    - B_DEC_Sell_Perc 만큼 매도 
    - 매도한 금액으로 TickerA를 매수
    - 발란스를 재조정한 이 시점을 다시 Point1 로 재설정

A. 입력: 아래 내용은 사용자로 부터 입력 받을 수 있는 변수들
- 기간: <from 입력: 년/월/일> ~ < to 입력: 년/월/일>
    - 디폴트: 오늘의 1년 전 ~ 오늘
- 자본: <SEED>
    - 디폴트: 10,000
    - 달러/엔/원 고려 하지 않고, 사용되는 티커와 같은 종류의 화폐다.
- 조합 티커:
    - 티커A: <TickerA:>
        - 디폴트: TQQQ
    - 티커B: <TickerB>
        - 디폴트: QQQ
- Ticker A 상승시, 
    - A 상승 기준: <A_INC_Gap_Perc>
        - 디폴트 100%
    - A 매도 비율: <A_INC_Sell_Perc>
        - 디폴트 20%
- Ticker A 하락시
    - A 하락 기준: <A_DEC_Gap_Perc>
        - 디폴트 20%
    - B 매도 비율: <B_DEC_Sell_Perc>
        - 디폴트: 20%

B. 출력: 챠트를 잘 그리는것이 매우 중요 하니, 신중하게 설계 하고 개발 할것.
- 화면 구성
    - 제목 표시: <TickerA> & <TickerB> rebalace trading strategy
        - 디폴트: TQQQ & QQQ rebalance trading strategy
    - 입력 표시
        - 위의 A. 입력 내용을 바탕으로 입력 구성
        - 디폴트 값을 표시하고, 사용자가 수정 가능하다.
    - 시뮬레이션 시작 버튼
        - 이 버튼을 탭 하면, 입력값을 기준으로 전략을 시뮬레이션 한다.
        - 시뮬레이션이 완료 되면 모든 정보를 챠트에 표현 한다.

    - 챠트
        - 크게 두 개의 챠트가 이어서 나온다.
        - 챠트 표현은 단순히 그날의 종가값을 라인으로 표현 한다.
        - rebalance 가 일어난 경우, 라인 위에 보이기 쉽게 점을 표시한다.
        - 첫번째 챠트 -  Simulation 
            - y 축의 왼쪽은 가격, 오른쪽은 percentage 를 표현 한다.
                - percentage 축의 값은 0 ~ 100 값으로 고정한다.
            - x 축은 날짜.
            - TickerA와 TickerB 기간에 해당 하는 일 기준의 종가 챠트를 그린다. 이때 y축의 가격을 이용한다.(왼쪽)
                - 각 라인의 이름은 Ticker 이름과 같다.
            - A 의 비율을 챠트에 겹쳐 그린다(A / (A+B)). y축의 오른쪽. 이 라인의 이름은 Rebalance 다.
            - 상승으로 인해 재조정이 이루어진 경우, Rebalance 라인 위에 빨간 점을 표시 한다. 너무 크지 않게, 라인 보다 약간 크게 표시 한다.
            - 하락으로 인해 재조정이 이루어진 경우, Rebalanace 라인 위에 녹색 점을 표시 한다. 너무 크지 않게, 라인 보다 약간 크게 표시 한다.
        - 두번째 챠트 -  Value
            - x축은 첫번째 챠트와 같은 기간에 해당 하는 날짜
            - y축은 금액
            - Rebalance:그 당시 종가 기준으로 평가 금액의 합(Ticker A + Ticker B)을 표시 한다.
              - 상승으로 인해 재조정이 이루어진 경우, Rebalance 라인 위에 빨간 점을 표시 한다. 너무 크지 않게, 라인 보다 약간 크게 표시 한다.
              - 하락으로 인해 재조정이 이루어진 경우, Rebalanace 라인 위에 녹색 점을 표시 한다. 너무 크지 않게, 라인 보다 약간 크게 표시 한다.
            - <Ticker A>: 첫날 SEED 로 Ticker A 만 100% 샀을때의 가치를 표시 한다.
            - <Ticker B>: 첫날 SEED 로 Ticker B 만 100% 샀을때의 가치를 표시 한다.
    - 테이블
        - 챠트 아래에는 테이블을 표시 한다.
        - 한 행은 재조정이 이루어질때 마다 추가 한다. 
        - 첫 행은 첫 날의 Point1 을 기록 한다.
        - 마지막 행은 마지막 날의 상태를 기록 한다.
        - 열은 다음과 같다.
            - no: 순서. 1 부터 1씩 증가
            - date: 재조정이 일어난 날. 첫 행은 첫 날.
            - <Ticker A> 수: Ticker A 의 수. 만일 QQQ 라면, 열 제목은 QQQ 수
            - <Ticker B> 수: Ticker B 의 수. 만일 QQQ 라면, 열 제목은 QQQ 수
            - <Ticker A> 가격: Ticker A 의 가격. 만일 QQQ 라면, 열 제목은 QQQ 가격
            - <Ticker B> 가격: Ticker B 의 가격. 만일 QQQ 라면, 열 제목은 QQQ 가격
            - <Ticker A> 비율: 재조정된 (A/(A+B)) 를 가격 기준(수 x 가격)으로 비율(%)  로 표시. 
            - 평가 금액: 재조정된 Ticker A의 가치와 Ticker B 가치의 합(종가 기준)
            - Performance: SEED 값 대비 수익률. SEED 보다 적으면 -, 많으면 +로 표시. 예를 들어 SEED 가 10,000 일때
                - 만일 평가 금액이 5,000 : -50 %
                - 만일 평가 금액이 10,000 : 0 %
                - 만일 평가 금액이 15,000: +50%
                - 만일 평가 금액이 20,000: +100%
    - Comparison
       - 기간의 마지막 종가 기준으로 다음을 비교 하고 표시 한다.
       - <Ticker A> 단순 HOLD case: <Ticker A> 만 첫날 매수했을때, Performance 
       - <Ticker B> 단순 HOLD case: <Ticker B> 만 첫날 매수했을때, Performance
       - Rebalance: Simulation Performance
       - 예)
          - TQQQ performance: 800%
          - QQQ performance: 2,000%
          - Rebalance performance: 10,000%
