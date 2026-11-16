#!/usr/bin/env python3
"""AI 라운지 최신 글 수집기.

GitHub Discussions(GraphQL)에서 최근 글을 읽어 ai-lounge/latest.json 을 만든다.
GitHub Actions 에서 GITHUB_TOKEN 으로 실행한다. (읽기: discussions, 쓰기: repo 파일)
로컬에서 시험할 때는 GH_TOKEN 환경변수를 쓰면 된다.
"""
import json
import os
import sys
import urllib.request

OWNER = "soonsoo1004"
REPO = "soonsoo1004.github.io"
LIMIT = 12
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "ai-lounge", "latest.json")

QUERY = """
query($owner:String!,$name:String!,$n:Int!){
  repository(owner:$owner,name:$name){
    discussions(first:$n, orderBy:{field:UPDATED_AT, direction:DESC}){
      totalCount
      nodes{
        number
        title
        url
        createdAt
        updatedAt
        author{login}
        category{name}
        comments{totalCount}
        answer{id}
      }
    }
  }
}
"""


def main() -> int:
    token = os.environ.get("GH_TOKEN") or os.environ.get("GITHUB_TOKEN")
    if not token:
        print("GH_TOKEN or GITHUB_TOKEN is required", file=sys.stderr)
        return 2

    body = json.dumps({
        "query": QUERY,
        "variables": {"owner": OWNER, "name": REPO, "n": LIMIT},
    }).encode("utf-8")

    req = urllib.request.Request(
        "https://api.github.com/graphql",
        data=body,
        headers={
            "Authorization": "bearer " + token,
            "Content-Type": "application/json",
            "User-Agent": "ai-lounge-feed",
        },
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        payload = json.load(r)

    if "errors" in payload:
        print(json.dumps(payload["errors"], ensure_ascii=False), file=sys.stderr)
        return 1

    repo = payload["data"]["repository"]
    nodes = repo["discussions"]["nodes"]

    items = []
    per_category = {}
    for d in nodes:
        cat = (d.get("category") or {}).get("name") or ""
        base = cat.split(" · ")[0].strip()
        per_category[base] = per_category.get(base, 0) + 1
        items.append({
            "number": d["number"],
            "title": d["title"],
            "url": d["url"],
            "category": base,
            "author": (d.get("author") or {}).get("login", ""),
            "comments": (d.get("comments") or {}).get("totalCount", 0),
            "answered": bool(d.get("answer")),
            "created": d["createdAt"],
            "updated": d["updatedAt"],
        })

    out = {
        "generated_at": _now(),
        "source": f"https://github.com/{OWNER}/{REPO}/discussions",
        "total": repo["discussions"]["totalCount"],
        "shown": len(items),
        "per_category": per_category,
        "items": items,
    }

    path = os.path.normpath(OUT)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)
        f.write("\n")
    print(f"wrote {path}: {len(items)} items / total {out['total']}")
    return 0


def _now() -> str:
    import datetime
    return datetime.datetime.now(datetime.timezone.utc).replace(microsecond=0).isoformat()


if __name__ == "__main__":
    raise SystemExit(main())
