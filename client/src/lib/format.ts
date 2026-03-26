export function formatCurrency(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return "$0";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "$0";
  return `$${num.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function formatCurrencyFull(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return "$0";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "$0";
  return `$${num.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function formatNumber(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return "0";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "0";
  return num.toLocaleString("en-US");
}

export function formatShares(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return "0";
  const num = typeof value === "string" ? parseInt(value) : value;
  if (isNaN(num)) return "0";
  return num.toLocaleString("en-US");
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const avatarColorHexes = [
  "#2980B9",
  "#27AE60",
  "#8E44AD",
  "#D35400",
  "#C0392B",
  "#16A085",
  "#2C3E50",
  "#E67E22",
  "#2ECC71",
  "#3498DB",
];

export function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % avatarColorHexes.length;
  return avatarColorHexes[idx];
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "N/A";
  const parts = dateStr.split("T")[0].split("-");
  if (parts.length === 3) {
    const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
