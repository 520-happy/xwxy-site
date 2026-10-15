#!/usr/bin/env python3
"""
每小时价格更新流水线（GitHub 版）。

用法：
    python3 scripts/update-prices.py prices.json

prices.json 格式（只写要更新的字段，没写的平台保持不动）：
    {
      "京东自营": {"price": 4999, "type": "real", "guobu": "国补后约 ¥4,999", "note": "xxx"},
      "拼多多":   {"price": 5199, "priceLabel": "¥5,199", "type": "est"}
    }

脚本会：更新 src/data/prices.ts → git commit → git push → Cloudflare Pages 自动部署。
"""
import json
import re
import subprocess
import sys
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PRICES_TS = ROOT / "src" / "data" / "prices.ts"


def run(cmd):
    r = subprocess.run(cmd, cwd=ROOT, capture_output=True, text=True)
    if r.returncode != 0:
        print(r.stderr.strip() or r.stdout.strip())
        sys.exit(f"命令失败: {' '.join(cmd)}")
    return r.stdout.strip()


def main():
    if len(sys.argv) != 2:
        sys.exit("用法: python3 scripts/update-prices.py prices.json")
    updates = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))

    src = PRICES_TS.read_text(encoding="utf-8")

    # 更新 updated 时间戳
    now = datetime.now().strftime("%Y-%m-%d %H:%M")
    src = re.sub(r'updated:\s*"[^"]*"', f'updated: "{now}"', src, count=1)

    changed = []
    for name, fields in updates.items():
        # 定位该平台的对象块：从 name: "xxx" 开始到下一个 "}," 结束
        m = re.search(
            r'(\{\s*\n\s*name:\s*"' + re.escape(name) + r'"\s*,.*?\n\s*\},)',
            src,
            re.S,
        )
        if not m:
            print(f"跳过：prices.ts 里没有平台 “{name}”")
            continue
        block = m.group(1)

        def set_field(b, key, val):
            if isinstance(val, str):
                new_val = '"' + val.replace('"', '\\"') + '"'
            else:
                new_val = str(val)
            # 值可能是 "..." 字符串（含逗号）或数字，完整匹配
            nb, n = re.subn(
                r'(' + key + r':\s*)("[^"\\]*(?:\\.[^"\\]*)*"|[-\d.]+)',
                r'\g<1>' + new_val,
                b,
                count=1,
            )
            return nb if n else b

        for key in ("price", "priceLabel", "type", "guobu", "note"):
            if key in fields:
                block = set_field(block, key, fields[key])
        src = src.replace(m.group(1), block)
        changed.append(name)

    if not changed:
        print("没有可更新的平台，退出。")
        return

    PRICES_TS.write_text(src, encoding="utf-8")
    print(f"已更新 {len(changed)} 个平台：{', '.join(changed)}（{now}）")

    run(["git", "add", "src/data/prices.ts"])
    # 无变化时不提交
    if not run(["git", "status", "--porcelain"]):
        print("内容无变化，跳过提交。")
        return
    run(["git", "commit", "-m", f"价格更新 {now}"])
    run(["git", "push"])
    print("已 push，Cloudflare Pages 将自动部署（约1分钟）。")


if __name__ == "__main__":
    main()
