// Utility functions for date formatting and normalization

export function formatHumanDate(input: string | Date | undefined | null): string {
  if (!input) return '';
  const date = input instanceof Date ? input : new Date(input);
  if (isNaN(date.getTime())) return '';
  // Example: 29 Oct 2025
  return date.toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatHumanDateTime(input: string | Date | undefined | null): string {
  if (!input) return '';
  const date = input instanceof Date ? input : new Date(input);
  if (isNaN(date.getTime())) return '';
  // Example: 29 Oct 2025, 11:57 AM
  return date.toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

// Normalize any date input to YYYY-MM-DD (date-only)
export function toDateOnlyISO(input: string | Date): string {
  const date = input instanceof Date ? input : new Date(input);
  if (isNaN(date.getTime())) return '';
  return new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  )
    .toISOString()
    .split('T')[0];
}

// Convert YYYY-MM-DD to full ISO for API
export function toApiISO(dateOnly: string): string {
  if (!dateOnly) return '';
  // Interpret as local date and convert to ISO
  const [y, m, d] = dateOnly.split('-').map((n) => parseInt(n, 10));
  if (!y || !m || !d) return '';
  return new Date(Date.UTC(y, m - 1, d)).toISOString();
}


