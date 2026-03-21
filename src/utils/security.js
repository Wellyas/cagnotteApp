/**
 * Basic security utilities to prevent code injection and sanitize inputs.
 */

/**
 * Strips HTML tags from a string to prevent basic XSS when rendering content.
 * Although React handles most XSS by escaping text, this is an extra layer 
 * for data storage and when dealing with potential dangerouslySetInnerHTML (if any).
 */
export function sanitizeString(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/<[^>]*>?/gm, '').trim();
}

/**
 * Validates if a URL is safe (starts with http:// or https://)
 * to prevent javascript: or data: URI injections.
 */
export function isSafeUrl(url) {
    if (!url) return true; // Empty is fine (will be ignored)
    try {
        const parsed = new URL(url);
        return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
        // If it's not a valid URL (like a path), we might want to check if it starts with /
        return url.startsWith('/') || url.startsWith('./') || url.startsWith('../');
    }
}

/**
 * Sanitizes a numeric input.
 */
export function sanitizeNumber(val) {
    const n = parseFloat(val);
    return isNaN(n) ? 0 : n;
}
