export function formatCurrency(input: string): string {
    const raw = input.replace(/[^0-9.]/g, "");
    const parts = raw.split(".");
    const integerPart = parts[0] || "";
    const decimalPart = parts.length > 1 ? parts[1] : "";
  
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  
    if (parts.length === 1) return formattedInteger;
    if (decimalPart === "") return formattedInteger + ".";
    return formattedInteger + "." + decimalPart.substring(0, 2);
  }
  
  
export function parseCurrency(formatted: string): string {
    return formatted.replace(/,/g, "");
}