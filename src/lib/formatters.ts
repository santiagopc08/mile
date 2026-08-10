export const currencyFormatter = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
});

export const compactCurrencyFormatter = new Intl.NumberFormat('es-CO', {
    notation: 'compact',
    compactDisplay: 'short'
});

export const compactCurrencyFormatterWithDecimals = new Intl.NumberFormat('es-CO', {
    notation: 'compact',
    maximumFractionDigits: 1
});

// Using empty array [] to use browser default locale with specific options
export const shortDateFormatter = new Intl.DateTimeFormat([], {
    month: 'short',
    day: 'numeric'
});

export const fullDateFormatter = new Intl.DateTimeFormat([], {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
});

export const shortTimeFormatter = new Intl.DateTimeFormat([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
});
