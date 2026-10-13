const ENTITIES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

// Safe for HTML text and double- or single-quoted attribute values.
export function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (char) => ENTITIES[char]);
}

// Same set; &#39; is valid in XML too.
export const escapeXml = escapeHtml;
