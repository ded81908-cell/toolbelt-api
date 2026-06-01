import type { FastifyInstance } from "fastify";

interface Party {
  name: string;
  address?: string;
  email?: string;
}

interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

interface InvoiceBody {
  number: string;
  date: string;
  dueDate?: string;
  currency?: string;
  locale?: string;
  taxRate?: number;
  from: Party;
  to: Party;
  items: LineItem[];
  notes?: string;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function money(value: number, currency: string, locale: string): string {
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

const partySchema = {
  type: "object",
  required: ["name"],
  properties: {
    name: { type: "string", maxLength: 200 },
    address: { type: "string", maxLength: 500 },
    email: { type: "string", maxLength: 200 },
  },
};

export async function invoiceRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: InvoiceBody }>(
    "/v1/invoice",
    {
      schema: {
        summary: "Render an invoice as SVG",
        description:
          "Turns structured invoice JSON into a clean, printable A4 SVG with computed subtotal, tax and total. Handy for freelancers/SMBs.",
        tags: ["documents"],
        body: {
          type: "object",
          required: ["number", "date", "from", "to", "items"],
          properties: {
            number: { type: "string", maxLength: 64 },
            date: { type: "string", maxLength: 32 },
            dueDate: { type: "string", maxLength: 32 },
            currency: { type: "string", maxLength: 8, default: "USD" },
            locale: { type: "string", maxLength: 16, default: "en-US" },
            taxRate: { type: "number", minimum: 0, maximum: 100, default: 0 },
            from: partySchema,
            to: partySchema,
            items: {
              type: "array",
              minItems: 1,
              maxItems: 100,
              items: {
                type: "object",
                required: ["description", "quantity", "unitPrice"],
                properties: {
                  description: { type: "string", maxLength: 300 },
                  quantity: { type: "number", minimum: 0 },
                  unitPrice: { type: "number" },
                },
              },
            },
            notes: { type: "string", maxLength: 1000 },
          },
        },
      },
    },
    async (req, reply) => {
      const {
        number,
        date,
        dueDate,
        currency = "USD",
        locale = "en-US",
        taxRate = 0,
        from,
        to,
        items,
        notes,
      } = req.body;

      const subtotal = items.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0);
      const tax = (subtotal * taxRate) / 100;
      const total = subtotal + tax;

      const W = 800;
      const H = 1130;
      const left = 56;
      const right = W - 56;
      let y = 150;

      const partyBlock = (label: string, p: Party, x: number): string => {
        const lines = [p.name, p.address ?? "", p.email ?? ""].filter(Boolean);
        const rows = lines
          .map((l, i) => `<text x="${x}" y="${200 + i * 22}" font-size="14" fill="#334155">${escapeXml(l)}</text>`)
          .join("");
        return `<text x="${x}" y="178" font-size="12" font-weight="700" fill="#94a3b8" letter-spacing="1">${label}</text>${rows}`;
      };

      const itemRows = items
        .map((it, i) => {
          const rowY = y + 34 + i * 30;
          const amount = it.quantity * it.unitPrice;
          return `<text x="${left}" y="${rowY}" font-size="14" fill="#0f172a">${escapeXml(it.description)}</text>
    <text x="${right - 220}" y="${rowY}" font-size="14" fill="#475569" text-anchor="end">${it.quantity}</text>
    <text x="${right - 110}" y="${rowY}" font-size="14" fill="#475569" text-anchor="end">${escapeXml(money(it.unitPrice, currency, locale))}</text>
    <text x="${right}" y="${rowY}" font-size="14" fill="#0f172a" text-anchor="end">${escapeXml(money(amount, currency, locale))}</text>`;
        })
        .join("\n    ");

      const tableTop = y + 6;
      const totalsTop = y + 34 + items.length * 30 + 26;

      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="'Segoe UI', system-ui, -apple-system, Helvetica, Arial, sans-serif">
  <rect width="${W}" height="${H}" fill="#ffffff"/>
  <rect x="0" y="0" width="${W}" height="8" fill="#2563eb"/>
  <text x="${left}" y="76" font-size="38" font-weight="800" fill="#0f172a">INVOICE</text>
  <text x="${right}" y="60" font-size="14" fill="#475569" text-anchor="end">No. ${escapeXml(number)}</text>
  <text x="${right}" y="82" font-size="14" fill="#475569" text-anchor="end">Date: ${escapeXml(date)}</text>
  ${dueDate ? `<text x="${right}" y="104" font-size="14" fill="#475569" text-anchor="end">Due: ${escapeXml(dueDate)}</text>` : ""}
  ${partyBlock("FROM", from, left)}
  ${partyBlock("BILL TO", to, left + 360)}

  <line x1="${left}" y1="${tableTop}" x2="${right}" y2="${tableTop}" stroke="#e2e8f0" stroke-width="1"/>
  <text x="${left}" y="${y + 24}" font-size="12" font-weight="700" fill="#94a3b8">DESCRIPTION</text>
  <text x="${right - 220}" y="${y + 24}" font-size="12" font-weight="700" fill="#94a3b8" text-anchor="end">QTY</text>
  <text x="${right - 110}" y="${y + 24}" font-size="12" font-weight="700" fill="#94a3b8" text-anchor="end">UNIT</text>
  <text x="${right}" y="${y + 24}" font-size="12" font-weight="700" fill="#94a3b8" text-anchor="end">AMOUNT</text>
  ${itemRows}
  <line x1="${left}" y1="${totalsTop - 18}" x2="${right}" y2="${totalsTop - 18}" stroke="#e2e8f0" stroke-width="1"/>

  <text x="${right - 110}" y="${totalsTop + 8}" font-size="14" fill="#475569" text-anchor="end">Subtotal</text>
  <text x="${right}" y="${totalsTop + 8}" font-size="14" fill="#0f172a" text-anchor="end">${escapeXml(money(subtotal, currency, locale))}</text>
  <text x="${right - 110}" y="${totalsTop + 32}" font-size="14" fill="#475569" text-anchor="end">Tax (${taxRate}%)</text>
  <text x="${right}" y="${totalsTop + 32}" font-size="14" fill="#0f172a" text-anchor="end">${escapeXml(money(tax, currency, locale))}</text>
  <text x="${right - 110}" y="${totalsTop + 62}" font-size="18" font-weight="800" fill="#0f172a" text-anchor="end">Total</text>
  <text x="${right}" y="${totalsTop + 62}" font-size="18" font-weight="800" fill="#2563eb" text-anchor="end">${escapeXml(money(total, currency, locale))}</text>

  ${notes ? `<text x="${left}" y="${totalsTop + 110}" font-size="12" font-weight="700" fill="#94a3b8">NOTES</text><text x="${left}" y="${totalsTop + 132}" font-size="13" fill="#475569">${escapeXml(notes.slice(0, 120))}</text>` : ""}
</svg>`;

      return reply.header("content-type", "image/svg+xml").send(svg);
    },
  );
}
