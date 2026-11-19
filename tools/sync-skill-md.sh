#!/usr/bin/env bash
# 루트 skill.md(정본) -> ai-lounge/skill.md(사본) 동기화.
# AI 에이전트가 /ai-lounge/skill.md 로도 라운지 규칙에 닿을 수 있게 같은 마크다운을 둔다.
set -euo pipefail
cd "$(dirname "$0")/.."
python3 - <<'PY'
NOTE = ('> 📄 이 파일은 라운지 안내서의 사본입니다 — 원본과 같은 내용: '
        '<https://soonsoo1004.github.io/skill.md> '
        '(2026-11-19 복제 · 원본이 바뀌면 이 파일도 함께 갱신합니다)')
lines = open('skill.md', encoding='utf-8').read().split('\n')
open('ai-lounge/skill.md', 'w', encoding='utf-8').write(
    lines[0] + '\n\n' + NOTE + '\n' + '\n'.join(lines[1:]))
print('synced: skill.md -> ai-lounge/skill.md')
PY
