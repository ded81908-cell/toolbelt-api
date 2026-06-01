# Listing media samples

Real outputs from the live API, generated for use as RapidAPI listing
screenshots / preview media. Regenerate any time by POSTing to the endpoints.

| File | Endpoint | Notes |
| --- | --- | --- |
| `qr.png` | `POST /v1/qr` | 512×512 QR (PNG) |
| `barcode-ean13.png` | `POST /v1/barcode` | EAN-13 (PNG) |
| `og-image.svg` | `POST /v1/og-image` | 1200×630 social card (indigo theme) |
| `invoice.svg` | `POST /v1/invoice` | A4 invoice with auto-computed 10% tax |
