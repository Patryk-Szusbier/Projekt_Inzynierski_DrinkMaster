export const sanitizeVirtualKeyboardInput = (value: string): string =>
  value
    // remove invisible chars and accidental newlines/tabs
    .replace(/[\u200B-\u200D\uFEFF\r\n\t]/g, "")
    // normalize non-breaking space to regular space
    .replace(/\u00A0/g, " ");
