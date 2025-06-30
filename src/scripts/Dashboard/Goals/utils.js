export function formatDate(date) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(date).toLocaleDateString(undefined, options);
}

export function formatCurrency(amount) {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(amount);
}

export function progress(goal, current) {
    return Math.min((current / goal) * 100, 100).toFixed(2);
}