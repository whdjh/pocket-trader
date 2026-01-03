import os
import json
import time
from dotenv import load_dotenv
import python_bithumb
from openai import OpenAI

# .env에서 API 키 불러오기
load_dotenv()

def ai_trading():
    # 1. 멀티 타임프레임 데이터 수집
    short_term_df = python_bithumb.get_ohlcv("KRW-BTC", interval="minute60", count=24)   # 단기: 1시간봉 24개
    mid_term_df = python_bithumb.get_ohlcv("KRW-BTC", interval="minute240", count=30)     # 중기: 4시간봉 30개
    long_term_df = python_bithumb.get_ohlcv("KRW-BTC", interval="day", count=30)   # 장기: 일봉 30개

    # 2. pandas DataFrame → JSON 형태로 변환
    data_payload = {
        "short_term": json.loads(short_term_df.to_json()),
        "mid_term": json.loads(mid_term_df.to_json()),
        "long_term": json.loads(long_term_df.to_json())
    }

    # 3. OpenAI GPT에게 판단 요청
    client = OpenAI()

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {
                "role": "system",
                "content": """
                You are an expert in Bitcoin investing.

                You invest according to the following principles:
                Rule No.1: Never lose money.
                Rule No.2: Never forget Rule No.1.

                Use multi-timeframe analysis based on the chart data provided:
                - short_term: 1-hour candles
                - mid_term: 4-hour candles
                - long_term: daily candles

                Tell me whether to buy, sell, or hold at the moment.
                Respond in JSON format like this:
                {"decision": "buy", "reason": "some technical reason"}
                {"decision": "sell", "reason": "some technical reason"}
                {"decision": "hold", "reason": "some technical reason"}
                """
            },
            {
                "role": "user",
                "content": json.dumps(data_payload)
            }
        ],
        response_format={
            "type": "json_object"
        }
    )

    # 4. AI 응답 처리
    result = json.loads(response.choices[0].message.content)
    return result

# 결과 출력
print(ai_trading())