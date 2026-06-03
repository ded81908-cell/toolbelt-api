#!/usr/bin/env python3
"""Publish the JP article to Qiita and the EN article to Dev.to.
Tokens are read from env vars QIITA_TOKEN / DEVTO_TOKEN (never hard-coded)."""
import os, re, json, urllib.request, urllib.error

ROOT = os.path.join(os.path.dirname(__file__), "..", "docs", "marketing")


def read(path):
    with open(os.path.join(ROOT, path), encoding="utf-8") as f:
        return f.read()


def http(url, data, headers):
    req = urllib.request.Request(url, data=json.dumps(data).encode("utf-8"),
                                 headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req) as r:
            return r.status, json.loads(r.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8")


def publish_qiita():
    token = os.environ["QIITA_TOKEN"]
    raw = read("article-qiita-jp.md")
    lines = raw.splitlines()
    # title = first H1, strip the 【Qiita投稿用】 prefix
    title = re.sub(r"^#\s*", "", lines[0])
    title = title.replace("【Qiita投稿用】", "").strip()
    # body = everything after the "> タグ候補" helper line
    body_start = next(i for i, l in enumerate(lines) if l.startswith("> タグ候補")) + 1
    body_lines = lines[body_start:]
    # drop leading blank lines and a leading horizontal rule
    while body_lines and (body_lines[0].strip() in ("", "---")):
        body_lines.pop(0)
    body = "\n".join(body_lines).strip()
    payload = {
        "title": title,
        "body": body,
        "tags": [{"name": "API"}, {"name": "JavaScript"}, {"name": "Python"},
                 {"name": "日本語処理"}, {"name": "個人開発"}],
        "private": False,
        "tweet": False,
    }
    status, resp = http("https://qiita.com/api/v2/items", payload, {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    })
    if status in (200, 201):
        print("QIITA OK:", resp.get("url"))
    else:
        print("QIITA FAIL", status, resp)


def publish_devto():
    token = os.environ["DEVTO_TOKEN"]
    raw = read("article-devto-en.md")
    # split frontmatter
    m = re.match(r"^---\n(.*?)\n---\n(.*)$", raw, re.S)
    fm, rest = m.group(1), m.group(2)
    title = re.search(r'title:\s*"(.+?)"', fm).group(1)
    # drop leading helper blockquote lines
    body_lines = rest.splitlines()
    while body_lines and (body_lines[0].startswith(">") or body_lines[0].strip() == ""):
        body_lines.pop(0)
    body = "\n".join(body_lines).strip()
    payload = {"article": {
        "title": title,
        "published": True,
        "body_markdown": body,
        "tags": ["api", "webdev", "javascript", "python"],
    }}
    status, resp = http("https://dev.to/api/articles", payload, {
        "api-key": token,
        "Content-Type": "application/json",
    })
    if status in (200, 201):
        print("DEVTO OK:", resp.get("url"))
    else:
        print("DEVTO FAIL", status, resp)


if __name__ == "__main__":
    if os.environ.get("QIITA_TOKEN"):
        publish_qiita()
    if os.environ.get("DEVTO_TOKEN"):
        publish_devto()
