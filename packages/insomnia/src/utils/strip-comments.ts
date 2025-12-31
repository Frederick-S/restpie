/**
 * Strip comment lines from request body text based on content type.
 * Only strips comments for formats that don't natively support them (JSON, XML).
 * Leaves comments in formats that support them (YAML, shell scripts).
 */

/**
 * Strips // line comments from JSON-like content.
 * Only strips lines that start with // (after trimming whitespace).
 * Also handles inline comments at the end of lines.
 */
function stripJsonComments(text: string): string {
  const lines = text.split('\n');
  const result: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip lines that are entirely comments
    if (trimmed.startsWith('//')) {
      continue;
    }

    // Handle inline comments: remove // and everything after it
    // But be careful not to remove // inside strings
    let inString = false;
    let stringChar = '';
    let i = 0;
    let commentStart = -1;

    while (i < line.length) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (inString) {
        // Check for escape sequences
        if (char === '\\') {
          i += 2; // Skip escaped character
          continue;
        }
        // Check for end of string
        if (char === stringChar) {
          inString = false;
        }
      } else {
        // Check for start of string
        if (char === '"' || char === "'") {
          inString = true;
          stringChar = char;
        } else if (char === '/' && nextChar === '/') {
          // Check for // comment outside of string
          commentStart = i;
          break;
        }
      }
      i++;
    }

    if (commentStart !== -1) {
      // Remove trailing comma before comment if present
      const lineWithoutComment = line.substring(0, commentStart);
      const trimmedWithoutComment = lineWithoutComment.trimEnd();

      // If we're in JSON and there's a trailing comma before the comment,
      // we need to keep it if the next non-empty line has content
      result.push(trimmedWithoutComment.length > 0 ? trimmedWithoutComment : '');
    } else {
      result.push(line);
    }
  }

  // Clean up empty lines that resulted from comment removal
  // But preserve intentional empty lines in the original
  return result
    .filter((line, index, arr) => {
      // Keep non-empty lines
      if (line.trim().length > 0) {
        return true;
      }
      // Keep empty lines that weren't from comment stripping
      // (this is approximate - we keep empty lines if surrounding lines are also empty or have content)
      return index > 0 && arr[index - 1].trim().length > 0;
    })
    .join('\n');
}

/**
 * Strips <!-- --> block comments from XML content.
 */
function stripXmlComments(text: string): string {
  // Remove XML comments (<!-- ... -->)
  // Use a regex that handles multi-line comments
  return text.replace(/<!--[\s\S]*?-->/g, '');
}

/**
 * Strips # line comments from GraphQL content.
 * Only strips lines that start with # (after trimming whitespace).
 */
export function stripGraphQLComments(text: string): string {
  const lines = text.split('\n');
  const result: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip lines that are entirely comments
    if (trimmed.startsWith('#')) {
      continue;
    }

    // Handle inline comments: remove # and everything after it
    // But be careful not to remove # inside strings
    let inString = false;
    let stringChar = '';
    let i = 0;
    let commentStart = -1;

    while (i < line.length) {
      const char = line[i];

      if (inString) {
        // Check for escape sequences
        if (char === '\\') {
          i += 2; // Skip escaped character
          continue;
        }
        // Check for end of string
        if (char === stringChar) {
          inString = false;
        }
      } else {
        // Check for start of string
        if (char === '"') {
          inString = true;
          stringChar = char;
        } else if (char === '#') {
          // Check for # comment outside of string
          commentStart = i;
          break;
        }
      }
      i++;
    }

    if (commentStart !== -1) {
      const lineWithoutComment = line.substring(0, commentStart).trimEnd();
      result.push(lineWithoutComment.length > 0 ? lineWithoutComment : '');
    } else {
      result.push(line);
    }
  }

  return result
    .filter((line, index, arr) => {
      if (line.trim().length > 0) {
        return true;
      }
      return index > 0 && arr[index - 1].trim().length > 0;
    })
    .join('\n');
}

/**
 * Determines if a mime type natively supports comments.
 * These formats should NOT have comments stripped.
 */
function formatSupportsComments(mimeType: string): boolean {
  const normalizedMimeType = mimeType.toLowerCase().split(';')[0].trim();

  // YAML natively supports # comments
  if (normalizedMimeType.includes('yaml') || normalizedMimeType.includes('yml')) {
    return true;
  }

  // Shell scripts natively support # comments
  if (normalizedMimeType.includes('shell') || normalizedMimeType.includes('bash') || normalizedMimeType.includes('sh')) {
    return true;
  }

  // JavaScript/TypeScript support // and /* */ comments
  if (normalizedMimeType.includes('javascript') || normalizedMimeType.includes('typescript')) {
    return true;
  }

  return false;
}

/**
 * Main function to strip comments from request body text based on content type.
 * Only strips comments for formats that don't natively support them.
 *
 * @param text - The request body text
 * @param mimeType - The MIME type of the content (e.g., 'application/json')
 * @returns The text with comments stripped (for applicable formats)
 */
export function stripCommentsFromBody(text: string, mimeType?: string | null): string {
  if (!text || !text.trim()) {
    return text;
  }

  // If no mime type specified, default to JSON behavior (most common for API clients)
  if (!mimeType) {
    return stripJsonComments(text);
  }

  const normalizedMimeType = mimeType.toLowerCase().split(';')[0].trim();

  // Don't strip comments from formats that natively support them
  if (formatSupportsComments(normalizedMimeType)) {
    return text;
  }

  // JSON: strip // comments
  if (normalizedMimeType.includes('json')) {
    return stripJsonComments(text);
  }

  // XML: strip <!-- --> comments
  if (normalizedMimeType.includes('xml')) {
    return stripXmlComments(text);
  }

  // GraphQL: strip # comments (GraphQL doesn't natively support comments in HTTP body)
  if (normalizedMimeType.includes('graphql')) {
    return stripGraphQLComments(text);
  }

  // Plain text: strip // comments (for consistency with editor)
  if (normalizedMimeType.includes('text/plain') || normalizedMimeType === 'text') {
    return stripJsonComments(text);
  }

  // For unknown formats, apply JSON-style comment stripping as default
  // since this is an API client and JSON is the most common format
  return stripJsonComments(text);
}
