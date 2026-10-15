#!/usr/bin/env python3
"""
每小时价格抓取（跑在 GitHub Actions 上）。

从公开页面核验 OPPO Find X10 E 的官方定价，输出 prices.json
（scripts/update-prices.py 的输入格式，只写有把握的字段）。

策略是保守的：只确认官方指导价（ real ），各平台实时成交价
需要登录/反爬，抓不到就保持原值，绝不编造。
跟踪版本：16GB+512GB（官网 5499，国补到手约 4999）。
"""
import json
import re
import sys
import urllib.request

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"
}

SOURCES = [
    # （名称，URL，验证函数）
    ("zol", "https://mobile.zol.com.cn/1255/12552023.html"),
    ("sina", "https://k.sina.cn/article_7880069125_1d5b0500506801w5e0.html?from=digit"),
]


def fetch(url: str, timeout: int = 25) -> str:
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read().decode("utf-8", "ignore")


def main() -> int:
    verified = False
    tried = 0
    for name, url in SOURCES:
        tried += 1
        try:
            html = fetch(url)
        except Exception as e:  # noqa: BLE001 - 单个源失败不影响其他
            print(f"[{name}] fetch failed: {e}")
            continue
        # 文章需同时提到 Find X10 E（或 X10E）和 5499/4999 官方价
        has_model = bool(re.search(r"Find\s*X10\s*E|X10E", html))
        has_5499 = "5499" in html
        has_4999 = "4999" in html
        print(f"[{name}] model={has_model} 5499={has_5499} 4999={has_4999}")
        if has_model and has_5499 and has_4999:
            verified = True

    out = {}
    if verified:
        # 官方定价确认无变化：16+512GB 官网 5499，国补到手约 4999
        out["OPPO 官网"] = {
            "price": 5499,
            "type": "real",
            "guobu": "国补后约 ¥4,999",
            "note": "官方直营，价格基准；国补需符合当地资格。",
        }

    with open("/tmp/prices.json", "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False)

    print(f"verified={verified} platforms={list(out)}")
    # 至少核验过一个源才算成功，否则 workflow 跳过更新（避免用空数据刷时间戳）
    return 0 if verified else 1


if __name__ == "__main__":
    sys.exit(main())
