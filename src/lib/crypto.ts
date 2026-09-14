// Client-side localStorage helpers for user-supplied API keys.
//
// Keys are stored as plaintext in localStorage — they are user-provided
// credentials visible only on this device and never transmitted to Vantix servers.
// The previous XOR+base64 scheme was symmetric and reversible by anyone with the
// user's JWT (the keying material), so it provided no meaningful security benefit.
//
// The `decryptKey` export remains for one-time backward-compat migration only:
// if a value in localStorage was written by the old XOR scheme it is decoded here
// on first read, then re-saved as plaintext when the user next clicks Save.

export function encryptKey(text: string, _userId: string): string {
  // No encoding — return plaintext.
  return text;
}

export function decryptKey(encoded: string, userId: string): string {
  if (!encoded) return '';

  // Fast-path: if it's obviously not base64 (contains chars outside the set)
  // or too short to be a valid encoding, treat as plaintext already.
  if (!/^[A-Za-z0-9+/]+=*$/.test(encoded) || encoded.length < 4) {
    return encoded;
  }

  // Attempt legacy XOR+base64 decode for backward compatibility.
  try {
    const key = userId || 'vantix_secure_fallback';
    const raw = decodeURIComponent(escape(atob(encoded)));
    let result = '';
    for (let i = 0; i < raw.length; i++) {
      result += String.fromCharCode(raw.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    // Sanity check: a valid API key contains only printable ASCII.
    if (/^[\x20-\x7E]+$/.test(result)) return result;
    // Printable check failed — value was already plaintext stored as base64 chars.
    return encoded;
  } catch {
    // Not base64 — already plaintext.
    return encoded;
  }
}
