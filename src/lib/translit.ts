/**
 * Dependency-free transliteration. Latin-script accents are removed via Unicode
 * NFKD decomposition (café -> cafe); Cyrillic and Greek get explicit romanisation
 * tables. Anything else passes through. Good enough to build clean URL slugs and
 * ASCII fallbacks from a wide range of languages.
 */

const CYRILLIC: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "zh", з: "z",
  и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r",
  с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts", ч: "ch", ш: "sh",
  щ: "shch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
};

const GREEK: Record<string, string> = {
  α: "a", β: "v", γ: "g", δ: "d", ε: "e", ζ: "z", η: "i", θ: "th", ι: "i",
  κ: "k", λ: "l", μ: "m", ν: "n", ξ: "x", ο: "o", π: "p", ρ: "r", σ: "s",
  ς: "s", τ: "t", υ: "y", φ: "f", χ: "ch", ψ: "ps", ω: "o",
};

// A few Latin ligatures/letters that don't decompose under NFKD.
const LATIN_SPECIAL: Record<string, string> = {
  ß: "ss", æ: "ae", œ: "oe", ø: "o", đ: "d", ð: "d", þ: "th", ł: "l",
};

function fromTable(ch: string, table: Record<string, string>): string | undefined {
  const lower = ch.toLowerCase();
  const mapped = table[lower];
  if (mapped === undefined) return undefined;
  if (ch === lower || mapped === "") return mapped;
  // Preserve capitalisation: Ш -> Sh, Я -> Ya.
  return mapped.charAt(0).toUpperCase() + mapped.slice(1);
}

function lookup(ch: string): string | undefined {
  return (
    fromTable(ch, LATIN_SPECIAL) ??
    fromTable(ch, CYRILLIC) ??
    fromTable(ch, GREEK)
  );
}

export function transliterate(input: string): string {
  let out = "";
  for (const ch of input) {
    // Try the character as-is first (preserves e.g. Russian \u0451 -> yo).
    const direct = lookup(ch);
    if (direct !== undefined) {
      out += direct;
      continue;
    }
    // Otherwise strip diacritics via decomposition, then re-check the table so
    // accented scripts (e.g. Greek \u03ac -> \u03b1 -> a) still romanise.
    const stripped = ch.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
    out += stripped.length === 1 ? lookup(stripped) ?? stripped : stripped;
  }
  return out;
}

/** Transliterate, then build a URL-safe slug. */
export function intlSlug(input: string): string {
  return transliterate(input)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 200);
}
