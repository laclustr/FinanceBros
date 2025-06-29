export const formatDateString = (d) => new Date(d).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric' });

export const truncateText = (text, maxLength) => text.length > maxLength ? text.substring(0, maxLength) + "..." : text;

export const cleanupDropdowns = () => document.querySelectorAll(".dropdown-menu").forEach(d => d.remove());