from __future__ import annotations

import argparse
import json
from pathlib import Path


def main() -> None:
    parser = argparse.ArgumentParser(description='Validate and normalize UzhavanAI JSONL training data.')
    parser.add_argument('--input', default='training/dataset.jsonl')
    parser.add_argument('--output', default='training/normalized.jsonl')
    args = parser.parse_args()

    source = Path(args.input)
    destination = Path(args.output)
    rows = []
    for line_number, line in enumerate(source.read_text(encoding='utf-8').splitlines(), 1):
        if not line.strip():
            continue
        try:
            item = json.loads(line)
        except json.JSONDecodeError as exc:
            raise ValueError(f'{source}:{line_number}: invalid JSON: {exc}') from exc
        for field in ('instruction', 'output', 'language'):
            if not isinstance(item.get(field), str) or not item[field].strip():
                raise ValueError(f'{source}:{line_number}: missing non-empty {field}')
        rows.append({
            'messages': [
                {'role': 'system', 'content': 'You are UzhavanAI, a careful agricultural advisor.'},
                {'role': 'user', 'content': item['instruction'].strip()},
                {'role': 'assistant', 'content': item['output'].strip()},
            ],
            'language': item['language'].strip(),
        })

    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text('\n'.join(json.dumps(row, ensure_ascii=False) for row in rows) + '\n', encoding='utf-8')
    print(f'Wrote {len(rows)} examples to {destination}')


if __name__ == '__main__':
    main()
