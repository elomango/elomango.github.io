#!/bin/bash

echo "🚀 Elomango 개발 서버 시작..."
echo "-----------------------------"
echo "브라우저에서 다음 주소로 접속하세요:"
echo ""
echo "📊 모멘텀 리밸런싱 툴:"
echo "  http://localhost:8000/ko/trade/momentum-rebalance/"
echo ""
echo "🧪 테스트 페이지:"
echo "  http://localhost:8000/ko/trade/momentum-rebalance/test.html"
echo ""
echo "🔍 디버그 페이지:"
echo "  http://localhost:8000/ko/trade/momentum-rebalance/debug.html"
echo ""
echo "📊 테이블 디버그:"
echo "  http://localhost:8000/ko/trade/momentum-rebalance/debug-table.html"
echo ""
echo "🔎 테이블 정렬 테스트:"
echo "  http://localhost:8000/ko/trade/momentum-rebalance/test-alignment.html"
echo ""
echo "📋 데이터 구조 검사:"
echo "  http://localhost:8000/ko/trade/momentum-rebalance/inspect-data.html"
echo ""
echo "서버를 종료하려면 Ctrl+C를 누르세요."
echo "-----------------------------"

# Python 3 서버 실행
python3 -m http.server 8000