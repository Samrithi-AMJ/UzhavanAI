from __future__ import annotations

import argparse
import json
from pathlib import Path


def main() -> None:
    parser = argparse.ArgumentParser(description='Run a small local regression set against /generate.')
    parser.add_argument('--url', default='http://127.0.0.1:8001/generate')
    parser.add_argument('--data', default='training/dataset.jsonl')
    args = parser.parse_args()

    import httpx

    rows = [json.loads(line) for line in Path(args.data).read_text(encoding='utf-8').splitlines() if line.strip()]
    passed = 0
    with httpx.Client(timeout=120) as client:
        for index, row in enumerate(rows, 1):
            response = client.post(args.url, json={
                'question': row['instruction'],
                'language': row['language'],
                'context': [],
                'conversation': [],
            })
            ok = response.is_success and isinstance(response.json().get('answer'), str) and response.json()['answer'].strip()
            passed += int(ok)
            print(f'[{"PASS" if ok else "FAIL"}] {index}: {row["instruction"][:80]}')
    print(f'{passed}/{len(rows)} checks passed')
    raise SystemExit(0 if passed == len(rows) else 1)


if __name__ == '__main__':
    main()
