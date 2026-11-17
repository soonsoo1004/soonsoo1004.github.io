#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""올팍 지금 — 데이터 스냅샷 생성기.

한국체육산업개발(주) 개방 공공데이터 3종을 받아 정적 JSON으로 굳힌다.
 1) 올림픽공원 공연정보      — https://www.ksponco.or.kr/olympicpark/eventInfo/eventInfoList?mid=a20301010100
                               (공공데이터포털 data.go.kr/data/3037877, LINK형·XML·실시간·출처표시 1유형)
 2) 올림픽공원 실시간 주차현황 — https://www.ksponco.or.kr/online/main/parkingorsApi.do?apiKey=PARKING21803504
                               (공공데이터포털 실시간 API, JSON, 2,200대 기준은 기관 주차장 예상 이용률 안내 페이지)
 3) 올림픽공원 대관정보      — data.go.kr/data/15015212 (기관 개방목록 확인용, 페이지에서는 '대관·행사' 안내로 표기)

실행:  python3 build_snapshot.py            (같은 폴더의 data/ 에 기록)
"""
from __future__ import annotations

import json
import re
import sys
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path

KST = timezone(timedelta(hours=9))
UA = "Mozilla/5.0 (compatible; olpark-now/1.0; +https://soonsoo1004.github.io/ksponco-helper/)"
EVENT_URL = "https://www.ksponco.or.kr/olympicpark/eventInfo/eventInfoList?mid=a20301010100"
PARKING_URL = "https://www.ksponco.or.kr/online/main/parkingorsApi.do?apiKey=PARKING21803504"
PARKING_CAPACITY = 2200  # 기관 '주차장 예상 이용률 안내' 페이지 표기: "주차 중 / 2,200대 가능"

OUT = Path(__file__).resolve().parent / "data"


def get(url: str, timeout: int = 25) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        raw = r.read()
    return raw.decode("utf-8", errors="replace")


def strip(s: str) -> str:
    s = re.sub(r"<[^>]+>", " ", s)
    s = s.replace("&amp;", "&").replace("&quot;", '"').replace("&#39;", "'").replace("&nbsp;", " ")
    return " ".join(s.split())


def parse_events(html: str) -> list[dict]:
    items = []
    for m in re.finditer(r'<a href="(/olympicpark/eventInfo/eventInfoView\.es\?[^"]+)" class="item">(.*?)</a>', html, re.S):
        href, body = m.group(1), m.group(2)
        place = re.search(r'<em class="place">(.*?)</em>', body, re.S)
        title = re.search(r'<strong class="title">(.*?)</strong>', body, re.S)
        date = re.search(r'<span class="date">(.*?)</span>', body, re.S)
        time_ = re.search(r'<small class="time">(.*?)</small>', body, re.S)
        if not (title and date):
            continue
        d = strip(date.group(1))
        begin, _, end = d.partition("~")
        items.append({
            "place": strip(place.group(1)) if place else "",
            "title": strip(title.group(1)),
            "begin": begin.strip(),
            "end": end.strip() or begin.strip(),
            "period": d,
            "time": strip(time_.group(1)) if time_ else "",
            "url": "https://www.ksponco.or.kr" + href.replace("&amp;", "&"),
        })
    return items


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    now = datetime.now(KST)
    status = {}

    # 1) 주차현황 (실시간 API)
    parking = {"ok": False}
    try:
        body = get(PARKING_URL, timeout=20)
        n = int(json.loads(body)[0]["parking_sum"])
        parking = {
            "ok": True,
            "count": n,
            "capacity": PARKING_CAPACITY,
            "fetched_at": now.isoformat(timespec="minutes"),
            "source": PARKING_URL,
        }
    except Exception as e:  # noqa: BLE001
        parking["error"] = type(e).__name__
    (OUT / "parking.json").write_text(json.dumps(parking, ensure_ascii=False, indent=2), encoding="utf-8")
    status["parking"] = parking.get("count", parking.get("error"))

    # 2) 공연정보 (LINK형 오픈API의 원문 목록)
    try:
        events = parse_events(get(EVENT_URL))
        payload = {
            "ok": bool(events),
            "fetched_at": now.isoformat(timespec="minutes"),
            "source": EVENT_URL,
            "dataset": "한국체육산업개발주식회사_올림픽공원 공연정보",
            "count": len(events),
            "items": events,
        }
    except Exception as e:  # noqa: BLE001
        payload = {"ok": False, "error": type(e).__name__, "items": []}
    (OUT / "events.json").write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    status["events"] = payload.get("count", payload.get("error"))

    print(json.dumps(status, ensure_ascii=False))
    return 0 if parking.get("ok") and payload.get("ok") else 1


if __name__ == "__main__":
    sys.exit(main())
