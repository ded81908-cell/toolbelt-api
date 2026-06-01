import type { FastifyInstance } from "fastify";
import { marked } from "marked";
import sanitizeHtml from "sanitize-html";

interface MarkdownBody {
  markdown: string;
  fullDocument?: boolean;
  title?: string;
}

const ALLOWED_TAGS = sanitizeHtml.defaults.allowedTags.concat([
  "img",
  "h1",
  "h2",
  "input", // task-list checkboxes
]);

const PRINT_CSS = `
  :root { color-scheme: light dark; }
  body { font: 16px/1.6 -apple-system, system-ui, "Segoe UI", Helvetica, Arial, sans-serif;
    max-width: 760px; margin: 40px auto; padding: 0 20px; color: #1f2937; }
  h1,h2,h3 { line-height: 1.25; }
  pre { background: #f6f8fa; padding: 14px; border-radius: 8px; overflow: auto; }
  code { background: #f6f8fa; padding: 2px 5px; border-radius: 4px; font-size: 0.9em; }
  pre code { background: none; padding: 0; }
  blockquote { border-left: 4px solid #d1d5db; margin: 0; padding-left: 16px; color: #4b5563; }
  table { border-collapse: collapse; } th,td { border: 1px solid #d1d5db; padding: 6px 10px; }
  img { max-width: 100%; }
  @media print { body { margin: 0; max-width: none; } }
`;

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function markdownRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: MarkdownBody }>(
    "/v1/markdown",
    {
      schema: {
        summary: "Render Markdown to sanitized HTML",
        description:
          "GitHub-flavoured Markdown → safe HTML (XSS-sanitised). Set fullDocument:true for a print-ready standalone page (print-to-PDF in any browser).",
        tags: ["documents"],
        body: {
          type: "object",
          required: ["markdown"],
          properties: {
            markdown: { type: "string", maxLength: 500_000 },
            fullDocument: { type: "boolean", default: false },
            title: { type: "string", maxLength: 200 },
          },
        },
      },
    },
    async (req, reply) => {
      const rendered = marked.parse(req.body.markdown, { async: false }) as string;
      const safe = sanitizeHtml(rendered, {
        allowedTags: ALLOWED_TAGS,
        allowedAttributes: {
          ...sanitizeHtml.defaults.allowedAttributes,
          img: ["src", "alt", "title", "width", "height"],
          input: ["type", "checked", "disabled"],
          "*": ["id"],
        },
        allowedSchemes: ["http", "https", "mailto", "data"],
      });

      if (!req.body.fullDocument) {
        return reply.header("content-type", "text/html; charset=utf-8").send(safe);
      }

      const title = escapeHtml(req.body.title ?? "Document");
      const page = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title><style>${PRINT_CSS}</style></head>
<body>${safe}</body></html>`;
      return reply.header("content-type", "text/html; charset=utf-8").send(page);
    },
  );
}
