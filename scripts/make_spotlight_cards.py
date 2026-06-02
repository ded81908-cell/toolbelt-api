#!/usr/bin/env python3
"""Generate one PDF card per Spotlight (4 spotlights x JP/EN = 8 PDFs).
Landscape brand cards for the RapidAPI listing. IPAGothic for Japanese."""
import os, math
from fpdf import FPDF

OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "brand", "spotlight")
FONT = "/usr/share/fonts/opentype/ipafont-gothic/ipag.ttf"

BG    = (10, 14, 20)
PANEL = (18, 25, 37)
LINE  = (30, 39, 53)
TEXT  = (230, 237, 243)
MUTED = (139, 151, 167)
GREEN = (63, 185, 80)
BLUE  = (74, 163, 255)
PURPLE= (163, 113, 247)
AMBER = (227, 179, 65)

W, H = 240.0, 126.0   # landscape card (mm, ~1.9:1 / OG-ish)
MX = 16.0

SPOTLIGHTS = [
    dict(n=1, color=GREEN,
         title_jp="80のツールを1つのAPIに、AIコストはゼロ",
         title_en="80 tools in one API — zero AI cost",
         desc_jp="QR・バーコード・請求書・Markdown・ハッシュ・JWT・検証・国際化・日本語処理まで80エンドポイント。"
                 "決定的（結果が安定）・高速・低コスト。まずは無料のBASICプランでどうぞ。",
         desc_en="QR & barcodes, invoices, Markdown, hashing, JWT, validators, i18n and a Japanese pack — "
                 "80 endpoints in total. Deterministic, fast and cheap. Start free on the BASIC plan.",
         chips=["/v1/qr", "/v1/hash", "/v1/jwt/decode", "/v1/convert", "/v1/uuid"]),
    dict(n=2, color=AMBER,
         title_jp="日本のアプリ開発に効く",
         title_en="Built for Japanese apps",
         desc_jp="全角⇄半角、ひらがな⇄カタカナ、かな→ローマ字、ローマ字スラッグ。"
                 "他のAPIにない「地味に必須」な日本語処理をまとめて提供します。",
         desc_en="Full-width<->half-width, hiragana<->katakana, kana->romaji and romaji slugs — "
                 "niche but essential Japanese text utilities you won't find elsewhere.",
         chips=["/v1/jp/convert", "/v1/jp/slug"]),
    dict(n=3, color=BLUE,
         title_jp="QR・バーコード・書類をワンコールで",
         title_en="QR, barcodes & documents in one call",
         desc_jp="QRコード（Wi-Fi接続・vCard対応）、Code128/EAN/UPC/ITF/DataMatrix/PDF417、"
                 "SVG請求書（税込合計を自動計算）、Markdown→サニタイズ済みHTML。PNG・SVGで出力。",
         desc_en="QR codes (incl. Wi-Fi & vCard), Code128/EAN/UPC/ITF/DataMatrix/PDF417, "
                 "SVG invoices with auto-computed totals, and Markdown->sanitized HTML. Output as PNG or SVG.",
         chips=["/v1/qr", "/v1/barcode", "/v1/invoice", "/v1/markdown"]),
    dict(n=4, color=PURPLE,
         title_jp="あらゆる入力を検証",
         title_en="Validate everything",
         desc_jp="メール・クレジットカード（Luhn）・IBAN（mod-97）・電話番号（E.164）・郵便番号・"
                 "パスワード強度、さらにPIIマスキングまで。入力バリデーションを1つのAPIで。",
         desc_en="Email, credit card (Luhn), IBAN (mod-97), phone (E.164), postal codes, "
                 "password strength — plus PII redaction. All your input validation behind one API.",
         chips=["/v1/validate/email", "/creditcard", "/iban", "/v1/pii/redact"]),
]


class Card(FPDF):
    def __init__(self):
        super().__init__(orientation="L", format=(H, W))
        self.set_auto_page_break(False)
        self.set_margins(MX, MX, MX)
        self.add_font("ipa", "", FONT)

    def f(self, size, color=TEXT):
        self.set_font("ipa", "", size)
        self.set_text_color(*color)

    def hexnut(self, cx, cy, r, color):
        self.set_draw_color(*color)
        self.set_line_width(1.0)
        pts = [(cx + r*math.cos(math.radians(60*i-30)),
                cy + r*math.sin(math.radians(60*i-30))) for i in range(6)]
        for i in range(6):
            self.line(*pts[i], *pts[(i+1) % 6])
        self.set_draw_color(*BLUE)
        self.set_line_width(0.8)
        ir, prev = r*0.42, None
        for i in range(33):
            a = math.radians(360*i/32)
            x, y = cx+ir*math.cos(a), cy+ir*math.sin(a)
            if prev:
                self.line(prev[0], prev[1], x, y)
            prev = (x, y)


def build(sp, lang):
    JP = lang == "jp"
    color = sp["color"]
    pdf = Card()
    pdf.add_page()
    # background
    pdf.set_fill_color(*BG)
    pdf.rect(0, 0, W, H, "F")
    # left accent bar
    pdf.set_fill_color(*color)
    pdf.rect(0, 0, 4, H, "F")
    # subtle header panel
    pdf.set_fill_color(*PANEL)
    pdf.rect(4, 0, W-4, 26, "F")
    pdf.set_draw_color(*LINE)
    pdf.set_line_width(0.3)
    pdf.line(4, 26, W, 26)

    pdf.hexnut(MX+4, 13, 7, color)
    pdf.set_xy(MX+15, 6)
    pdf.f(8.5, color)
    pdf.cell(0, 5, "TOOLBELT API")
    pdf.set_xy(MX+15, 12.5)
    pdf.f(8, MUTED)
    pdf.cell(0, 6, "開発者向けユーティリティ API ・ 80エンドポイント" if JP
             else "Developer utility API · 80 endpoints")

    # Title
    pdf.set_xy(MX, 36)
    pdf.f(18 if JP else 19, TEXT)
    pdf.multi_cell(W-2*MX, 9, sp["title_jp"] if JP else sp["title_en"])

    # Description
    pdf.set_xy(MX, pdf.get_y()+3)
    pdf.f(10.5, MUTED)
    pdf.multi_cell(W-2*MX, 6, sp["desc_jp"] if JP else sp["desc_en"])

    # Chips row (bottom)
    cy = H - 26
    cx = MX
    pdf.set_font("Courier", "", 8.5)
    for chip in sp["chips"]:
        tw = pdf.get_string_width(chip) + 7
        if cx + tw > W - MX:
            break
        pdf.set_fill_color(*PANEL)
        pdf.set_draw_color(*color)
        pdf.set_line_width(0.4)
        pdf.rect(cx, cy, tw, 8, "DF")
        pdf.set_xy(cx, cy+0.6)
        pdf.set_text_color(*color)
        pdf.cell(tw, 7, chip, align="C")
        cx += tw + 3

    # Footer CTA
    pdf.set_xy(MX, H-12)
    pdf.f(8.5, GREEN)
    pdf.cell(0, 6, "無料のBASICプランで開始 → RapidAPIでSubscribe" if JP
             else "Start free on the BASIC plan → Subscribe on RapidAPI")
    pdf.set_xy(W-110, H-12)
    pdf.f(7.5, MUTED)
    pdf.cell(94, 6, "toolbelt-api-9oll.onrender.com", align="R")

    os.makedirs(OUT_DIR, exist_ok=True)
    out = os.path.join(OUT_DIR, f"spotlight-{sp['n']}-{lang}.pdf")
    pdf.output(out)
    print("wrote", os.path.relpath(out), os.path.getsize(out), "bytes")
    return out


if __name__ == "__main__":
    for sp in SPOTLIGHTS:
        for lang in ("jp", "en"):
            build(sp, lang)
