const SUPERSCRIPT: Record<string, string> = {
  "-": "⁻",
  "0": "⁰",
  "1": "¹",
  "2": "²",
  "3": "³",
  "4": "⁴",
  "5": "⁵",
  "6": "⁶",
  "7": "⁷",
  "8": "⁸",
  "9": "⁹",
};

const decimal = new Intl.NumberFormat("pt-BR", { maximumSignificantDigits: 3 });

/** Formata valores muito pequenos (ex.: 9.54e-7 g) sem arredondar para "0,00". */
export function formatImpact(value: number): string {
  if (!Number.isFinite(value) || value === 0) return "0";
  if (Math.abs(value) < 1e-4) {
    const [mantissa = "0", exponent = "0"] = value.toExponential(2).split("e");
    const exp = String(Number(exponent))
      .split("")
      .map((c) => SUPERSCRIPT[c] ?? c)
      .join("");
    return `${mantissa.replace(".", ",")} × 10${exp}`;
  }
  return decimal.format(value);
}
