#!/usr/bin/env python3
"""Generate branded one-page Spotlight PDFs (JP + EN) for the RapidAPI listing.
Reflects the current 80-endpoint scope. Uses IPAGothic for full Japanese support.
"""
import os
from fpdf import FPDF

OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "brand", "spotlight")
FONT = "/usr/share/fonts/opentype/ipafont-gothic/ipag.ttf"

# Brand palette (from docs/design.html)
BG     = (10, 14, 20)     # #0a0e14
PANEL  = (18, 25, 37)     # #121925
LINE   = (30, 39, 53)     # #1e2735
TEXT   = (230, 237, 243)  # #e6edf3
MUTED  = (139, 151, 167)  # #8b97a7
GREEN  = (63, 185, 80)    # #3fb950
BLUE   = (74, 163, 255)   # #4aa3ff
PURPLE = (163, 113, 247)  # #a371f7
AMBER  = (227, 179, 65)   # #e3b341

PAGE_W, PAGE_H = 210, 297  # A4 portrait (mm)
MX = 16                    # left/right margin

CATEGORIES = [
    ("QR & Barcodes", "QR & バーコード", GREEN,
     "qr, qr/bulk, qr/wifi, qr/vcard, barcode (Code128/EAN/UPC/PDF417)"),
    ("Documents", "書類", BLUE,
     "invoice (SVG), markdown, markdown/toc, html/strip"),
    ("Data & JSON", "データ & JSON", BLUE,
     "convert (JSON/YAML/CSV), json/format, json/diff, json/get"),
    ("Hashing & crypto", "ハッシュ & 暗号", PURPLE,
     "hash, hash/bulk, encode, base32, crc32, cipher/caesar, morse"),
    ("Auth & tokens", "認証 & トークン", PURPLE,
     "jwt/decode, jwt/sign, bcrypt/hash, bcrypt/verify, password, token"),
    ("IDs & generators", "ID & 生成", GREEN,
     "uuid, uuid/v5, uuid/validate, nanoid, ulid, passphrase, lorem, random"),
    ("Japanese", "日本語処理", AMBER,
     "jp/convert (zenkaku/hankaku/kana/romaji), jp/slug"),
    ("Internationalisation", "国際化", AMBER,
     "translit, slug, slug/intl, phone (E.164), postal, currency/convert"),
    ("Validators", "検証", GREEN,
     "validate/email, creditcard (Luhn), iban, pii/redact, password/strength"),
    ("Text tools", "テキスト", BLUE,
     "text/case, text/stats, text/diff, text/similarity, html/entities, number/words"),
    ("Color & design", "色 & デザイン", PURPLE,
     "color/convert, color/contrast, color/palette, og-image"),
    ("Numbers & units", "数値 & 単位", BLUE,
     "number/format, number/base, number/roman, units/convert"),
    ("Date & time", "日付 & 時刻", GREEN,
     "time/convert, time/diff, time/zones, age, date/add, date/business-days"),
    ("Geo & network", "地理 & ネットワーク", AMBER,
     "geo/distance, cidr, ip/info, mime, gravatar"),
    ("Web & dev", "Web & 開発", PURPLE,
     "url/parse, url/query, regex/test, useragent/parse"),
]


class Spotlight(FPDF):
    def __init__(self, lang):
        super().__init__(format="A4")
        self.lang = lang
        self.set_auto_page_break(False)
        self.set_margins(MX, 14, MX)
        self.add_font("ipa", "", FONT)
        self.add_page()
        self.fill_bg()

    def fill_bg(self):
        self.set_fill_color(*BG)
        self.rect(0, 0, PAGE_W, PAGE_H, "F")

    def f(self, size, color=TEXT):
        self.set_font("ipa", "", size)
        self.set_text_color(*color)

    def hexnut(self, cx, cy, r):
        """Draw a simple hex-nut brand mark."""
        import math
        self.set_draw_color(*GREEN)
        self.set_line_width(1.1)
        pts = []
        for i in range(6):
            a = math.radians(60 * i - 30)
            pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
        for i in range(6):
            x1, y1 = pts[i]
            x2, y2 = pts[(i + 1) % 6]
            self.line(x1, y1, x2, y2)
        # inner ring
        self.set_draw_color(*BLUE)
        self.set_line_width(0.9)
        ir = r * 0.42
        prev = None
        for i in range(33):
            a = math.radians(360 * i / 32)
            x, y = cx + ir * math.cos(a), cy + ir * math.sin(a)
            if prev:
                self.line(prev[0], prev[1], x, y)
            prev = (x, y)


def build(lang):
    JP = lang == "jp"
    pdf = Spotlight(lang)

    # ---- Header band ----
    pdf.set_fill_color(*PANEL)
    pdf.rect(0, 0, PAGE_W, 46, "F")
    pdf.set_draw_color(*LINE)
    pdf.set_line_width(0.4)
    pdf.line(0, 46, PAGE_W, 46)
    pdf.hexnut(MX + 9, 23, 9)

    pdf.set_xy(MX + 24, 12)
    pdf.f(22, TEXT)
    pdf.cell(0, 9, "Toolbelt API")
    pdf.set_xy(MX + 24, 24)
    pdf.f(10.5, MUTED)
    pdf.cell(0, 6,
        "開発者向けユーティリティ API ・ 80エンドポイント" if JP
        else "Developer utility API · 80 endpoints")
    pdf.set_xy(MX + 24, 31)
    pdf.f(9, GREEN)
    pdf.cell(0, 6,
        "AIコストゼロ ・ 高速 ・ 決定的（結果が安定）" if JP
        else "Zero AI cost · fast · deterministic")

    # ---- Tagline ----
    pdf.set_xy(MX, 54)
    pdf.f(11, TEXT)
    tagline = ("アプリ開発で頻出する「地味だけど必要」な処理を、ひとつの高速APIに集約。"
               "QR・バーコード・請求書・データ変換・認証・国際化・日本語処理まで。"
               if JP else
               "Every boring-but-essential utility your app needs, behind one fast API: "
               "QR & barcodes, invoices, data conversion, auth, i18n and a Japanese text pack.")
    pdf.multi_cell(PAGE_W - 2 * MX, 5.6, tagline)

    # ---- Category grid (2 columns) ----
    top = 66
    col_w = (PAGE_W - 2 * MX - 6) / 2
    row_h = 22.5
    inner = row_h - 3.5
    rows = (len(CATEGORIES) + 1) // 2
    for i, (en, jp, color, eps) in enumerate(CATEGORIES):
        col = i % 2
        row = i // 2
        x = MX + col * (col_w + 6)
        y = top + row * row_h
        pdf.set_fill_color(*PANEL)
        pdf.set_draw_color(*LINE)
        pdf.set_line_width(0.3)
        pdf.rect(x, y, col_w, inner, "DF")
        # accent bar
        pdf.set_fill_color(*color)
        pdf.rect(x, y, 1.6, inner, "F")
        pdf.set_xy(x + 5, y + 2.4)
        pdf.f(10, TEXT)
        pdf.cell(0, 5, jp if JP else en)
        pdf.set_xy(x + 5, y + 8.4)
        pdf.f(7.3, MUTED)
        pdf.multi_cell(col_w - 8, 3.8, eps)

    # ---- Footer panel: example + URL ----
    fy = top + rows * row_h + 1
    pdf.set_fill_color(7, 11, 17)
    pdf.set_draw_color(*LINE)
    pdf.rect(MX, fy, PAGE_W - 2 * MX, 26, "DF")
    pdf.set_xy(MX + 5, fy + 3)
    pdf.f(8, BLUE)
    pdf.cell(0, 5, "EXAMPLE — POST /v1/qr")
    pdf.set_xy(MX + 5, fy + 8.5)
    pdf.set_font("Courier", "", 7.6)
    pdf.set_text_color(203, 213, 225)
    pdf.multi_cell(PAGE_W - 2 * MX - 10, 4.3,
        'curl -X POST "https://{HOST}/v1/qr" \\\n'
        '  -H "X-RapidAPI-Key: YOUR_KEY" -H "Content-Type: application/json" \\\n'
        '  -d \'{"text":"https://example.com","format":"png"}\' --output qr.png')

    # ---- Bottom CTA ----
    pdf.set_xy(MX, PAGE_H - 21)
    pdf.f(9.5, GREEN)
    pdf.cell(0, 6,
        "無料のBASICプランで今すぐ開始 → RapidAPIでSubscribe" if JP
        else "Start free on the BASIC plan → Subscribe on RapidAPI")
    pdf.set_xy(MX, PAGE_H - 14.5)
    pdf.f(8.2, MUTED)
    pdf.cell(0, 6, "https://toolbelt-api-9oll.onrender.com  ·  全EPは /docs で対話的に試せます"
             if JP else
             "https://toolbelt-api-9oll.onrender.com  ·  Try every endpoint at /docs")

    os.makedirs(OUT_DIR, exist_ok=True)
    out = os.path.join(OUT_DIR, f"toolbelt-spotlight-{lang}.pdf")
    pdf.output(out)
    print("wrote", os.path.abspath(out), os.path.getsize(out), "bytes")
    return out


if __name__ == "__main__":
    build("jp")
    build("en")
