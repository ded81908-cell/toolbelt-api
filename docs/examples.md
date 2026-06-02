# API 実例集（全80エンドポイント）

すべて稼働中のAPIを実際に叩いて取得した本物のリクエスト/レスポンスです。
RapidAPI経由では `X-API-Key` は不要（ゲートウェイが自動付与）。直接利用時は `X-API-Key: <your-key>` を付けます。

### `GET /health`
Liveness check

**Response** `200` · `application/json`
```
{"status":"ok","uptime":1.135036537}
```

### `GET /v1/uuid`
Generate one or more UUID v4 values

**Response** `200` · `application/json`
```
{"uuids":["b1bdcde0-4c0b-440e-9bf3-ab25de19f118"]}
```

### `GET /v1/password`
Generate cryptographically strong passwords

**Response** `200` · `application/json`
```
{"passwords":["jf@m9%(Jygvf0M%gdV5b"]}
```

### `GET /v1/token`
Generate a random URL-safe token

**Response** `200` · `application/json`
```
{"token":"ri5NIPkEUFyVapk-4KnH9tP0A4RLUaw9Er-NL9VJJKk"}
```

### `GET /v1/usage`
Report the calling client's usage counters

**Response** `200` · `application/json`
```
{"clientId":"key:smoke…","tier":"pro","total":3,"endpoints":{"/v1/uuid":1,"/v1/password":1,"/v1/token":1}}
```

### `POST /v1/qr`
Generate a QR code

**Request**
```json
{
  "text": "https://example.com",
  "format": "png",
  "size": 256
}
```
**Response** `200` · `image/png`
```
<PNG image, 1552 bytes>
```

### `POST /v1/qr/bulk`
Generate many QR codes in one call

**Request**
```json
{
  "items": [
    {
      "text": "a"
    },
    {
      "text": "b"
    }
  ]
}
```
**Response** `200` · `application/json`
```
{"count":2,"results":[{"id":"0","format":"png","data":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAYAAABccqh …
```

### `POST /v1/qr/wifi`
Wi-Fi join QR code

**Request**
```json
{
  "ssid": "MyNet",
  "password": "p@ss",
  "encryption": "WPA"
}
```
**Response** `200` · `image/png`
```
<PNG image, 1571 bytes>
```

### `POST /v1/qr/vcard`
Contact (vCard) QR code

**Request**
```json
{
  "name": "Jane Doe",
  "email": "jane@x.com"
}
```
**Response** `200` · `image/png`
```
<PNG image, 2151 bytes>
```

### `POST /v1/barcode`
Generate a barcode (Code128, EAN, UPC, ITF, DataMatrix, PDF417, …)

**Request**
```json
{
  "type": "ean13",
  "text": "4006381333931"
}
```
**Response** `200` · `image/png`
```
<PNG image, 5584 bytes>
```

### `POST /v1/og-image`
Generate a social / Open Graph card image

**Request**
```json
{
  "title": "Toolbelt API",
  "subtitle": "Utilities",
  "theme": "indigo"
}
```
**Response** `200` · `image/svg+xml`
```
<SVG image, 647 bytes>
```

### `POST /v1/invoice`
Render an invoice as SVG

**Request**
```json
{
  "number": "INV-001",
  "date": "2026-06-01",
  "currency": "USD",
  "taxRate": 10,
  "from": {
    "name": "My Co."
  },
  "to": {
    "name": "Client"
  },
  "items": [
    {
      "description": "Service",
      "quantity": 2,
      "unitPrice": 100
    }
  ]
}
```
**Response** `200` · `image/svg+xml`
```
<SVG image, 2346 bytes>
```

### `POST /v1/markdown`
Render Markdown to sanitized HTML

**Request**
```json
{
  "markdown": "# Hi\n\n**bold**"
}
```
**Response** `200` · `text/html`
```
<h1>Hi</h1>
<p><strong>bold</strong></p>

```

### `POST /v1/markdown/toc`
Build a table of contents from Markdown headings

**Request**
```json
{
  "markdown": "# Title\n## A\n## B"
}
```
**Response** `200` · `application/json`
```
{"count":3,"headings":[{"level":1,"text":"Title","slug":"title"},{"level":2,"text":"A","slug":"a"},{"level":2,"text":"B","slug":"b"}],"toc":"- [Title](#title)\n  - [A](#a)\n  - [B](#b)"}
```

### `POST /v1/html/strip`
Strip HTML tags to plain text

**Request**
```json
{
  "html": "<p>Hi <b>there</b></p>"
}
```
**Response** `200` · `application/json`
```
{"text":"Hi there"}
```

### `POST /v1/html/entities`
Encode or decode HTML entities

**Request**
```json
{
  "text": "<a href=\"x\">",
  "action": "encode"
}
```
**Response** `200` · `application/json`
```
{"action":"encode","result":"&lt;a href=&quot;x&quot;&gt;"}
```

### `POST /v1/convert`
Convert data between JSON, YAML and CSV

**Request**
```json
{
  "from": "json",
  "to": "yaml",
  "data": "{\"a\":1,\"b\":[2,3]}"
}
```
**Response** `200` · `application/x-yaml`
```
a: 1
b:
  - 2
  - 3

```

### `POST /v1/hash`
Hash a string (optionally HMAC)

**Request**
```json
{
  "input": "hello",
  "algorithm": "sha256"
}
```
**Response** `200` · `application/json`
```
{"algorithm":"sha256","hmac":false,"digest":"2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824","requestId":"051d018d-fef7-47d8-91d4-548f08c37a3d"}
```

### `POST /v1/hash/bulk`
Hash many strings in one call

**Request**
```json
{
  "inputs": [
    "a",
    "b"
  ],
  "algorithm": "md5"
}
```
**Response** `200` · `application/json`
```
{"algorithm":"md5","count":2,"digests":["0cc175b9c0f1b6a831c399e269772661","92eb5ffee6ae2fec3ad71c777531578f"]}
```

### `POST /v1/encode`
Encode or decode a string

**Request**
```json
{
  "input": "hello",
  "operation": "base64-encode"
}
```
**Response** `200` · `application/json`
```
{"operation":"base64-encode","result":"aGVsbG8="}
```

### `POST /v1/encode/base32`
Base32 encode or decode (RFC 4648)

**Request**
```json
{
  "input": "hello"
}
```
**Response** `200` · `application/json`
```
{"action":"encode","result":"NBSWY3DP"}
```

### `POST /v1/checksum/crc32`
CRC32 checksum of a string

**Request**
```json
{
  "text": "123456789"
}
```
**Response** `200` · `application/json`
```
{"crc32":3421780262,"hex":"cbf43926"}
```

### `POST /v1/slug`
Slugify a string

**Request**
```json
{
  "text": "Hello World!"
}
```
**Response** `200` · `application/json`
```
{"slug":"hello-world"}
```

### `POST /v1/slug/intl`
URL slug from any-language text (transliterated)

**Request**
```json
{
  "text": "Привет мир"
}
```
**Response** `200` · `application/json`
```
{"slug":"privet-mir"}
```

### `POST /v1/lorem`
Generate lorem ipsum placeholder text

**Request**
```json
{
  "units": "sentences",
  "count": 2
}
```
**Response** `200` · `application/json`
```
{"units":"sentences","count":2,"text":"Lorem sit adipiscing do incididunt et. Elit eiusmod ut dolore enim veniam exercitation nisi ea duis in velit eu."}
```

### `POST /v1/nanoid`
Generate URL-safe NanoIDs

**Request**
```json
{
  "size": 16
}
```
**Response** `200` · `application/json`
```
{"id":"HIjXyA04XKa5jtZb","size":16}
```

### `POST /v1/ulid`
Generate ULIDs (lexicographically sortable IDs)

**Request**
```json
{
  "count": 1
}
```
**Response** `200` · `application/json`
```
{"ids":["01KT3KRAS3K5TEASAQHNCED1N1"]}
```

### `POST /v1/passphrase`
Generate a memorable passphrase

**Request**
```json
{
  "words": 4
}
```
**Response** `200` · `application/json`
```
{"passphrase":"even-back-cook-even","words":4}
```

### `POST /v1/uuid/v5`
Generate a deterministic UUID v5 (namespaced)

**Request**
```json
{
  "namespace": "dns",
  "name": "example.com"
}
```
**Response** `200` · `application/json`
```
{"uuid":"cfbff0d1-9375-5685-968c-48ce8b15ae17"}
```

### `POST /v1/uuid/validate`
Validate a UUID and detect its version

**Request**
```json
{
  "uuid": "cfbff0d1-9375-5685-968c-48ce8b15ae17"
}
```
**Response** `200` · `application/json`
```
{"valid":true,"version":5,"variant":"RFC 4122"}
```

### `POST /v1/random/number`
Cryptographically strong random integers

**Request**
```json
{
  "min": 1,
  "max": 6,
  "count": 3
}
```
**Response** `200` · `application/json`
```
{"min":1,"max":6,"numbers":[2,2,5]}
```

### `POST /v1/random/pick`
Randomly pick items from a list

**Request**
```json
{
  "items": [
    "a",
    "b",
    "c"
  ],
  "count": 2
}
```
**Response** `200` · `application/json`
```
{"picked":["c","a"]}
```

### `POST /v1/jp/convert`
Japanese text conversion

**Request**
```json
{
  "text": "ＡＢＣ１２３",
  "operation": "hankaku"
}
```
**Response** `200` · `application/json`
```
{"operation":"hankaku","result":"ABC123"}
```

### `POST /v1/jp/slug`
Romaji slug from Japanese text

**Request**
```json
{
  "text": "東京タワー"
}
```
**Response** `200` · `application/json`
```
{"slug":"tawa"}
```

### `POST /v1/translit`
Transliterate text to Latin (ASCII-friendly)

**Request**
```json
{
  "text": "Crème brûlée"
}
```
**Response** `200` · `application/json`
```
{"result":"Creme brulee"}
```

### `POST /v1/phone`
Parse, validate and format a phone number

**Request**
```json
{
  "number": "03-1234-5678",
  "country": "JP"
}
```
**Response** `200` · `application/json`
```
{"valid":true,"input":"03-1234-5678","e164":"+81312345678","national":"03-1234-5678","international":"+81 3 1234 5678","country":"JP","countryCallingCode":"81","type":null}
```

### `POST /v1/postal`
Validate and normalise a postal code

**Request**
```json
{
  "code": "1500001",
  "country": "JP"
}
```
**Response** `200` · `application/json`
```
{"country":"JP","valid":true,"formatted":"150-0001"}
```

### `POST /v1/currency/convert`
Convert an amount between currencies

**Request**
```json
{
  "from": "USD",
  "to": "JPY",
  "amount": 10,
  "base": "USD",
  "rates": {
    "JPY": 150
  }
}
```
**Response** `200` · `application/json`
```
{"from":"USD","to":"JPY","amount":10,"result":1500,"source":"provided"}
```

### `POST /v1/color/convert`
Convert a color between hex / rgb / hsl

**Request**
```json
{
  "color": "#2563eb"
}
```
**Response** `200` · `application/json`
```
{"hex":"#2563eb","rgb":{"r":37,"g":99,"b":235},"hsl":{"h":221,"s":83,"l":53},"css":{"rgb":"rgb(37, 99, 235)","hsl":"hsl(221, 83%, 53%)"}}
```

### `POST /v1/color/contrast`
WCAG contrast ratio between two colors

**Request**
```json
{
  "foreground": "#000000",
  "background": "#ffffff"
}
```
**Response** `200` · `application/json`
```
{"ratio":21,"normalText":{"AA":true,"AAA":true},"largeText":{"AA":true,"AAA":true}}
```

### `POST /v1/color/palette`
Generate a palette (tints, shades, complementary) from a color

**Request**
```json
{
  "color": "#2563eb"
}
```
**Response** `200` · `application/json`
```
{"base":"#2563eb","tints":["#5182ef","#7ca1f3","#a8c1f7","#d3e0fb"],"shades":["#1e4fbc","#163b8d","#0f285e","#07142f"],"complementary":"#ebac24"}
```

### `POST /v1/units/convert`
Convert between units (length, mass, data, temperature, …)

**Request**
```json
{
  "value": 1,
  "from": "km",
  "to": "mi"
}
```
**Response** `200` · `application/json`
```
{"value":1,"from":"km","to":"mi","category":"length","result":0.621371192}
```

### `POST /v1/geo/distance`
Great-circle distance between two coordinates (Haversine)

**Request**
```json
{
  "from": {
    "lat": 35.68,
    "lon": 139.77
  },
  "to": {
    "lat": 34.69,
    "lon": 135.5
  }
}
```
**Response** `200` · `application/json`
```
{"distance":403.326,"unit":"km"}
```

### `POST /v1/time/convert`
Convert/format a timestamp across timezones

**Request**
```json
{
  "input": 1700000000,
  "timezone": "Asia/Tokyo"
}
```
**Response** `200` · `application/json`
```
{"unix":1700000000,"unixMs":1700000000000,"iso":"2023-11-14T22:13:20.000Z","timezone":"Asia/Tokyo","formatted":"Wednesday, November 15, 2023 at 7:13:20 AM GMT+9","weekday":"Wednesday"}
```

### `POST /v1/time/diff`
Humanized difference between two timestamps

**Request**
```json
{
  "from": "2020-01-01",
  "to": "2026-06-01"
}
```
**Response** `200` · `application/json`
```
{"milliseconds":202435200000,"seconds":202435200,"days":2343,"humanized":"6 years, 153 days"}
```

### `POST /v1/time/zones`
List IANA timezones (optionally filtered)

**Request**
```json
{
  "filter": "Tokyo"
}
```
**Response** `200` · `application/json`
```
{"count":1,"timezones":["Asia/Tokyo"]}
```

### `POST /v1/date/add`
Add or subtract a duration from a date

**Request**
```json
{
  "date": "2026-01-01",
  "months": 2,
  "days": 10
}
```
**Response** `200` · `application/json`
```
{"iso":"2026-03-11T00:00:00.000Z","unix":1773187200}
```

### `POST /v1/date/business-days`
Count business days (Mon–Fri) between two dates

**Request**
```json
{
  "from": "2026-06-01",
  "to": "2026-06-08"
}
```
**Response** `200` · `application/json`
```
{"from":"2026-06-01","to":"2026-06-08","calendarDays":7,"businessDays":5}
```

### `POST /v1/age`
Compute age / elapsed time from a date

**Request**
```json
{
  "birthdate": "2000-01-01",
  "at": "2026-06-02"
}
```
**Response** `200` · `application/json`
```
{"years":26,"months":5,"days":1,"totalDays":9649}
```

### `POST /v1/jwt/sign`
Sign a JWT (HS256/384/512)

**Request**
```json
{
  "payload": {
    "sub": "u1"
  },
  "secret": "s3cr3t",
  "expiresIn": 3600
}
```
**Response** `200` · `application/json`
```
{"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3ODAzODUzMjcsImV4cCI6MTc4MDM4ODkyNywic3ViIjoidTEifQ.XeGrQCtWEvMTxRdVYkYogouNs49yXGzOgRZ2FryCjoA"}
```

### `POST /v1/jwt/decode`
Decode (and optionally verify) a JWT

**Request**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1MSJ9.cMrXa6Q9t_t_3sJzaiM0n6xR3oP8Vfvkqd0KkBN0Z7E",
  "secret": "s3cr3t"
}
```
**Response** `200` · `application/json`
```
{"header":{"alg":"HS256","typ":"JWT"},"payload":{"sub":"u1"},"expired":null,"notYetValid":null,"signatureValid":false}
```

### `POST /v1/bcrypt/hash`
Hash a password with bcrypt

**Request**
```json
{
  "password": "hunter2",
  "rounds": 8
}
```
**Response** `200` · `application/json`
```
{"hash":"$2a$08$Mhc6vlSZxE6uVbMLge/J5.UpSzBH3H8ZWbEvTemOS57.Uph5eFk9W","rounds":8}
```

### `POST /v1/bcrypt/verify`
Verify a password against a bcrypt hash

**Request**
```json
{
  "password": "hunter2",
  "hash": "$2a$08$abcdefghijklmnopqrstuv"
}
```
**Response** `200` · `application/json`
```
{"match":false}
```

### `POST /v1/json/format`
Validate, pretty-print or minify JSON

**Request**
```json
{
  "json": "{\"b\":1,\"a\":2}",
  "indent": 2,
  "sortKeys": true
}
```
**Response** `200` · `application/json`
```
{"valid":true,"formatted":"{\n  \"a\": 2,\n  \"b\": 1\n}","minified":"{\"a\":2,\"b\":1}"}
```

### `POST /v1/json/diff`
Diff two JSON values

**Request**
```json
{
  "a": {
    "x": 1,
    "y": 2
  },
  "b": {
    "x": 1,
    "y": 3,
    "z": 4
  }
}
```
**Response** `200` · `application/json`
```
{"added":{"z":4},"removed":{},"changed":{"y":{"from":2,"to":3}},"equal":false}
```

### `POST /v1/json/get`
Extract a value from JSON by path

**Request**
```json
{
  "data": {
    "user": {
      "city": "Tokyo"
    }
  },
  "path": "user.city"
}
```
**Response** `200` · `application/json`
```
{"path":"user.city","found":true,"value":"Tokyo"}
```

### `POST /v1/regex/test`
Test a regular expression against text

**Request**
```json
{
  "pattern": "(\\w)(\\d)",
  "text": "a1 b2",
  "flags": "g"
}
```
**Response** `200` · `application/json`
```
{"matched":true,"count":2,"matches":[{"match":"a1","index":0,"groups":["a","1"]},{"match":"b2","index":3,"groups":["b","2"]}]}
```

### `POST /v1/useragent/parse`
Parse a User-Agent string

**Request**
```json
{
  "userAgent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605 Version/17.0 Mobile Safari/604"
}
```
**Response** `200` · `application/json`
```
{"browser":{"name":"Safari","version":"17.0"},"engine":{"name":"WebKit","version":"605"},"os":{"name":"iOS","version":"17.0"},"device":{"type":"mobile","vendor":"Apple","model":"iPhone"},"cpu":{"architecture":null}}
```

### `POST /v1/morse`
Encode or decode Morse code

**Request**
```json
{
  "text": "SOS"
}
```
**Response** `200` · `application/json`
```
{"action":"encode","result":"... --- ..."}
```

### `POST /v1/cipher/caesar`
Caesar / ROT cipher

**Request**
```json
{
  "text": "Hello",
  "shift": 13
}
```
**Response** `200` · `application/json`
```
{"result":"Uryyb","shift":13}
```

### `POST /v1/cidr`
IPv4 subnet / CIDR calculator

**Request**
```json
{
  "cidr": "192.168.1.10/24"
}
```
**Response** `200` · `application/json`
```
{"cidr":"192.168.1.10/24","network":"192.168.1.0","broadcast":"192.168.1.255","netmask":"255.255.255.0","wildcard":"0.0.0.255","prefix":24,"firstHost":"192.168.1.1","lastHost":"192.168.1.254","totalAddresses":256,"usableHosts":254}
```

### `POST /v1/ip/info`
Validate and classify an IP address (v4/v6)

**Request**
```json
{
  "ip": "10.0.0.1"
}
```
**Response** `200` · `application/json`
```
{"valid":true,"version":4,"type":"private"}
```

### `POST /v1/mime`
Look up the MIME type for a filename or extension

**Request**
```json
{
  "filename": "photo.png"
}
```
**Response** `200` · `application/json`
```
{"extension":"png","mime":"image/png","known":true}
```

### `POST /v1/gravatar`
Build a Gravatar avatar URL from an email

**Request**
```json
{
  "email": "user@example.com"
}
```
**Response** `200` · `application/json`
```
{"hash":"b58996c504c5638798eb6b511e6f49af","url":"https://www.gravatar.com/avatar/b58996c504c5638798eb6b511e6f49af?s=200&d=identicon"}
```

### `POST /v1/number/format`
Locale-aware number / currency / percent formatting

**Request**
```json
{
  "value": 1234.5,
  "style": "currency",
  "currency": "USD"
}
```
**Response** `200` · `application/json`
```
{"value":1234.5,"style":"currency","locale":"en-US","formatted":"$1,234.50"}
```

### `POST /v1/number/base`
Convert an integer between bases (2–36)

**Request**
```json
{
  "value": "255",
  "fromBase": 10,
  "toBase": 16
}
```
**Response** `200` · `application/json`
```
{"value":"255","fromBase":10,"toBase":16,"result":"ff"}
```

### `POST /v1/number/roman`
Convert between Roman numerals and integers (1–3999)

**Request**
```json
{
  "value": 2024
}
```
**Response** `200` · `application/json`
```
{"result":"MMXXIV"}
```

### `POST /v1/number/words`
Spell an integer in English words

**Request**
```json
{
  "value": 1234567
}
```
**Response** `200` · `application/json`
```
{"value":1234567,"words":"one million two hundred thirty four thousand five hundred sixty seven"}
```

### `POST /v1/text/case`
Convert text case (camel, snake, kebab, title, …)

**Request**
```json
{
  "text": "Hello World",
  "target": "snake"
}
```
**Response** `200` · `application/json`
```
{"result":"hello_world"}
```

### `POST /v1/text/stats`
Word/character/reading-time statistics

**Request**
```json
{
  "text": "One two three."
}
```
**Response** `200` · `application/json`
```
{"characters":14,"charactersNoSpaces":12,"words":3,"sentences":1,"lines":1,"paragraphs":1,"readingTimeSeconds":1}
```

### `POST /v1/text/diff`
Line-level diff between two texts

**Request**
```json
{
  "a": "one\ntwo",
  "b": "one\n2"
}
```
**Response** `200` · `application/json`
```
{"added":1,"removed":1,"ops":[{"type":"eq","line":"one"},{"type":"del","line":"two"},{"type":"add","line":"2"}]}
```

### `POST /v1/text/similarity`
String similarity (Levenshtein distance + ratio)

**Request**
```json
{
  "a": "kitten",
  "b": "sitting"
}
```
**Response** `200` · `application/json`
```
{"distance":3,"similarity":0.5714}
```

### `POST /v1/url/parse`
Parse a URL into its components

**Request**
```json
{
  "url": "https://u:p@ex.com:8443/a?x=1#h"
}
```
**Response** `200` · `application/json`
```
{"href":"https://u:p@ex.com:8443/a?x=1#h","protocol":"https","origin":"https://ex.com:8443","username":"u","password":"p","hostname":"ex.com","port":"8443","pathname":"/a","search":"?x=1","hash":"#h","query":{"x":"1"}}
```

### `POST /v1/url/query`
Parse or build a URL query string

**Request**
```json
{
  "action": "build",
  "value": {
    "a": 1,
    "b": "two"
  }
}
```
**Response** `200` · `application/json`
```
{"queryString":"a=1&b=two"}
```

### `POST /v1/validate/email`
Validate and normalise an email address

**Request**
```json
{
  "email": "John.Doe+x@Gmail.com"
}
```
**Response** `200` · `application/json`
```
{"valid":true,"normalized":"johndoe@gmail.com"}
```

### `POST /v1/validate/creditcard`
Validate a credit-card number (Luhn) and detect brand

**Request**
```json
{
  "number": "4111 1111 1111 1111"
}
```
**Response** `200` · `application/json`
```
{"valid":true,"brand":"Visa"}
```

### `POST /v1/validate/iban`
Validate an IBAN (ISO 13616, mod-97)

**Request**
```json
{
  "iban": "GB82 WEST 1234 5698 7654 32"
}
```
**Response** `200` · `application/json`
```
{"valid":true,"formatted":"GB82 WEST 1234 5698 7654 32","countryCode":"GB"}
```

### `POST /v1/password/strength`
Estimate password strength (entropy, crack time)

**Request**
```json
{
  "password": "Tr0ub4dour&3"
}
```
**Response** `200` · `application/json`
```
{"score":3,"entropyBits":79,"crackTime":"centuries","suggestions":[]}
```

### `POST /v1/creditcard/generate`
Generate Luhn-valid test card numbers (for testing only)

**Request**
```json
{
  "brand": "visa",
  "count": 1
}
```
**Response** `200` · `application/json`
```
{"brand":"visa","numbers":["4352882215055267"]}
```

### `POST /v1/pii/redact`
Redact PII (emails, phones, card numbers) from text

**Request**
```json
{
  "text": "mail a@b.com card 4111 1111 1111 1111"
}
```
**Response** `200` · `application/json`
```
{"redacted":"mail a***@b.com card ••••••••••••1111","counts":{"emails":1,"cards":1,"phones":0}}
```

