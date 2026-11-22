/**
 * Contact details are only shared after a booking, so free-text fields must not contain
 * phone numbers or email addresses. Returns an error message, or null if the text is fine.
 */
const EMAIL = /[A-Z0-9._%+-]+\s*(@|\(at\)|\[at\])\s*[A-Z0-9.-]+\s*(\.|\(dot\)|\[dot\])\s*[A-Z]{2,}/i;
// UK-style numbers: 07xxx xxxxxx, +44 7xxx, 01xx / 02x landlines — allowing spaces, dots and dashes.
const PHONE = /(\+?44[\s.-]*\(?0?\)?|\b0)[\s.-]*\d(?:[\s.-]*\d){8,9}\b/;
const LONG_DIGITS = /(?:\d[\s.-]*){10,}/;

export function contactDetailsError(...texts: (string | null | undefined)[]) {
  for (const t of texts) {
    if (!t) continue;
    if (EMAIL.test(t) || PHONE.test(t) || LONG_DIGITS.test(t)) {
      return "Please don't include phone numbers or email addresses — contact details are shared automatically once a booking is confirmed.";
    }
  }
  return null;
}
