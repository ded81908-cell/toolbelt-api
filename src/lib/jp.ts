/**
 * Japanese text utilities. Deliberately dependency-free. These are the kind of
 * normalisation/conversion steps that are common in Japanese-facing apps but
 * poorly served by the generic English-centric tools on API marketplaces —
 * hence a good differentiator.
 */

const FULLWIDTH_OFFSET = 0xfee0;

/** Full-width ASCII (and full-width space) -> half-width ASCII. */
export function toHankaku(input: string): string {
  let out = "";
  for (const ch of input) {
    const code = ch.codePointAt(0)!;
    if (code === 0x3000) {
      out += " ";
    } else if (code >= 0xff01 && code <= 0xff5e) {
      out += String.fromCodePoint(code - FULLWIDTH_OFFSET);
    } else {
      out += ch;
    }
  }
  return out;
}

/** Half-width ASCII (and space) -> full-width. */
export function toZenkaku(input: string): string {
  let out = "";
  for (const ch of input) {
    const code = ch.codePointAt(0)!;
    if (code === 0x20) {
      out += "　";
    } else if (code >= 0x21 && code <= 0x7e) {
      out += String.fromCodePoint(code + FULLWIDTH_OFFSET);
    } else {
      out += ch;
    }
  }
  return out;
}

/** Hiragana -> Katakana. */
export function hiraToKata(input: string): string {
  let out = "";
  for (const ch of input) {
    const code = ch.codePointAt(0)!;
    if (code >= 0x3041 && code <= 0x3096) {
      out += String.fromCodePoint(code + 0x60);
    } else {
      out += ch;
    }
  }
  return out;
}

/** Katakana -> Hiragana. */
export function kataToHira(input: string): string {
  let out = "";
  for (const ch of input) {
    const code = ch.codePointAt(0)!;
    if (code >= 0x30a1 && code <= 0x30f6) {
      out += String.fromCodePoint(code - 0x60);
    } else {
      out += ch;
    }
  }
  return out;
}

// Two-kana combinations (yoon) take priority over single kana.
const COMBO: Record<string, string> = {
  きゃ: "kya", きゅ: "kyu", きょ: "kyo",
  しゃ: "sha", しゅ: "shu", しょ: "sho",
  ちゃ: "cha", ちゅ: "chu", ちょ: "cho",
  にゃ: "nya", にゅ: "nyu", にょ: "nyo",
  ひゃ: "hya", ひゅ: "hyu", ひょ: "hyo",
  みゃ: "mya", みゅ: "myu", みょ: "myo",
  りゃ: "rya", りゅ: "ryu", りょ: "ryo",
  ぎゃ: "gya", ぎゅ: "gyu", ぎょ: "gyo",
  じゃ: "ja", じゅ: "ju", じょ: "jo",
  びゃ: "bya", びゅ: "byu", びょ: "byo",
  ぴゃ: "pya", ぴゅ: "pyu", ぴょ: "pyo",
};

const MONO: Record<string, string> = {
  あ: "a", い: "i", う: "u", え: "e", お: "o",
  か: "ka", き: "ki", く: "ku", け: "ke", こ: "ko",
  が: "ga", ぎ: "gi", ぐ: "gu", げ: "ge", ご: "go",
  さ: "sa", し: "shi", す: "su", せ: "se", そ: "so",
  ざ: "za", じ: "ji", ず: "zu", ぜ: "ze", ぞ: "zo",
  た: "ta", ち: "chi", つ: "tsu", て: "te", と: "to",
  だ: "da", ぢ: "ji", づ: "zu", で: "de", ど: "do",
  な: "na", に: "ni", ぬ: "nu", ね: "ne", の: "no",
  は: "ha", ひ: "hi", ふ: "fu", へ: "he", ほ: "ho",
  ば: "ba", び: "bi", ぶ: "bu", べ: "be", ぼ: "bo",
  ぱ: "pa", ぴ: "pi", ぷ: "pu", ぺ: "pe", ぽ: "po",
  ま: "ma", み: "mi", む: "mu", め: "me", も: "mo",
  や: "ya", ゆ: "yu", よ: "yo",
  ら: "ra", り: "ri", る: "ru", れ: "re", ろ: "ro",
  わ: "wa", ゐ: "wi", ゑ: "we", を: "wo", ん: "n",
  ぁ: "a", ぃ: "i", ぅ: "u", ぇ: "e", ぉ: "o",
  ゃ: "ya", ゅ: "yu", ょ: "yo", っ: "",
};

/**
 * Romanise Japanese kana to Hepburn-ish romaji. Katakana is folded to hiragana
 * first. Handles yoon (きゃ), sokuon (っ -> doubled consonant), syllabic ん and
 * the long-vowel mark ー. Non-kana characters pass through unchanged.
 */
export function romanize(input: string): string {
  const text = kataToHira(input).replace(/ー/g, "");
  let out = "";
  let pendingDouble = false;

  const flush = (romaji: string): void => {
    if (pendingDouble && romaji) {
      // Hepburn doubles the consonant; ch -> tch.
      out += romaji.startsWith("ch") ? "t" : romaji[0];
      pendingDouble = false;
    }
    out += romaji;
  };

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === "っ") {
      pendingDouble = true;
      continue;
    }
    const pair = text[i] + (text[i + 1] ?? "");
    if (COMBO[pair]) {
      flush(COMBO[pair]);
      i++;
      continue;
    }
    if (MONO[ch] !== undefined) {
      flush(MONO[ch]);
    } else {
      // Unknown char: drop any pending sokuon and pass through.
      pendingDouble = false;
      out += ch;
    }
  }
  return out;
}
