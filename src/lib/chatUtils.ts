/**
 * Formats a chat URL or Fastwork message ID into a full chat link.
 * Examples:
 * - "rr43tfs" -> "https://chat.fastwork.co/message/rr43tfs"
 * - "123456" -> "https://chat.fastwork.co/message/123456"
 * - "message/rr43tfs" -> "https://chat.fastwork.co/message/rr43tfs"
 * - "https://chat.fastwork.co/message/rr43tfs" -> "https://chat.fastwork.co/message/rr43tfs"
 */
export const formatChatUrl = (value: string | null | undefined): string => {
  if (!value) return '';
  let cleanVal = value.trim();
  if (!cleanVal) return '';

  // If already full HTTP / HTTPS URL, return as is
  if (/^https?:\/\//i.test(cleanVal)) {
    return cleanVal;
  }

  // Handle paths like "message/rr43tfs" or "/message/rr43tfs"
  if (cleanVal.toLowerCase().startsWith('message/')) {
    cleanVal = cleanVal.slice(8);
  } else if (cleanVal.toLowerCase().startsWith('/message/')) {
    cleanVal = cleanVal.slice(9);
  }

  // Any other ID string (alphanumeric like rr43tfs or numeric like 123456)
  return `https://chat.fastwork.co/message/${cleanVal}`;
};
