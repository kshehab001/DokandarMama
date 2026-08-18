/**
 * Turns raw OCR text from a supplier invoice photo into candidate line items.
 * OCR output is messy, so the parser is deliberately forgiving: it keeps any
 * line that has a name-ish part plus at least one number, and lets the user
 * fix the rest on the confirmation screen.
 */
export interface ParsedInvoiceLine {
  rawText: string;
  name: string;
  quantity: number;
  unitCost: number | null;
  lineTotal: number | null;
}

const BN_DIGITS = "০১২৩৪৫৬৭৮৯";

export function normalizeDigits(text: string): string {
  return text.replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d)));
}

const SKIP_PATTERN =
  /^(total|subtotal|grand\s*total|vat|tax|discount|invoice|bill|date|mobile|phone|thanks|signature|মোট|ভ্যাট|ছাড়|তারিখ|ধন্যবাদ)/i;

export function parseInvoiceText(rawInput: string): ParsedInvoiceLine[] {
  const lines = normalizeDigits(rawInput)
    .split(/\r?\n/)
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  const items: ParsedInvoiceLine[] = [];

  for (const line of lines) {
    if (SKIP_PATTERN.test(line)) continue;

    const numbers = (line.match(/\d+(?:[.,]\d+)?/g) ?? []).map((n) =>
      parseFloat(n.replace(",", ".")),
    );
    const name = line
      .replace(/[\d.,x×@:|-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (name.length < 2 || numbers.length === 0) continue;

    // Common shapes: "name qty price total", "name qty x price", "name total".
    let quantity = 1;
    let unitCost: number | null = null;
    let lineTotal: number | null = null;

    if (numbers.length >= 3) {
      quantity = numbers[0];
      unitCost = numbers[1];
      lineTotal = numbers[numbers.length - 1];
    } else if (numbers.length === 2) {
      quantity = numbers[0];
      unitCost = numbers[1];
      lineTotal = quantity * unitCost;
    } else {
      lineTotal = numbers[0];
    }

    if (!Number.isFinite(quantity) || quantity <= 0) quantity = 1;

    items.push({
      rawText: line,
      name,
      quantity,
      unitCost: unitCost !== null && Number.isFinite(unitCost) ? unitCost : null,
      lineTotal:
        lineTotal !== null && Number.isFinite(lineTotal) ? lineTotal : null,
    });
  }

  return items;
}

/** Cheap fuzzy score (0-1) used to match an OCR name to an existing product. */
export function similarity(a: string, b: string): number {
  const x = a.toLowerCase().replace(/\s+/g, "");
  const y = b.toLowerCase().replace(/\s+/g, "");
  if (!x || !y) return 0;
  if (x === y) return 1;
  if (x.includes(y) || y.includes(x)) return 0.85;

  const bigrams = (s: string) => {
    const out = new Set<string>();
    for (let i = 0; i < s.length - 1; i++) out.add(s.slice(i, i + 2));
    return out;
  };
  const bx = bigrams(x);
  const by = bigrams(y);
  if (bx.size === 0 || by.size === 0) return 0;
  let shared = 0;
  for (const g of bx) if (by.has(g)) shared++;
  return (2 * shared) / (bx.size + by.size);
}
