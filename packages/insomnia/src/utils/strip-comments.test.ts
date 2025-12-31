import { describe, expect, it } from '@jest/globals';

import { stripCommentsFromBody, stripGraphQLComments } from './strip-comments';

describe('stripCommentsFromBody()', () => {
  describe('JSON (application/json)', () => {
    it('strips // line comments', () => {
      const input = `{
  // This is a comment
  "name": "John"
}`;
      const expected = `{
  "name": "John"
}`;
      expect(stripCommentsFromBody(input, 'application/json')).toBe(expected);
    });

    it('strips inline // comments', () => {
      const input = `{
  "name": "John", // This is the name
  "age": 30 // This is the age
}`;
      const expected = `{
  "name": "John",
  "age": 30
}`;
      expect(stripCommentsFromBody(input, 'application/json')).toBe(expected);
    });

    it('does not strip // inside strings', () => {
      const input = `{
  "url": "https://example.com/path"
}`;
      expect(stripCommentsFromBody(input, 'application/json')).toBe(input);
    });

    it('handles mixed comments and string with slashes', () => {
      const input = `{
  "url": "https://example.com", // API endpoint
  "path": "/api/v1" // version 1
}`;
      const expected = `{
  "url": "https://example.com",
  "path": "/api/v1"
}`;
      expect(stripCommentsFromBody(input, 'application/json')).toBe(expected);
    });

    it('handles empty input', () => {
      expect(stripCommentsFromBody('', 'application/json')).toBe('');
      expect(stripCommentsFromBody('   ', 'application/json')).toBe('   ');
    });

    it('handles input with only comments', () => {
      const input = `// Comment 1
// Comment 2`;
      expect(stripCommentsFromBody(input, 'application/json').trim()).toBe('');
    });
  });

  describe('XML (application/xml)', () => {
    it('strips <!-- --> block comments', () => {
      const input = `<?xml version="1.0"?>
<!-- This is a comment -->
<root>
  <item>value</item>
</root>`;
      const expected = `<?xml version="1.0"?>

<root>
  <item>value</item>
</root>`;
      expect(stripCommentsFromBody(input, 'application/xml')).toBe(expected);
    });

    it('strips multi-line block comments', () => {
      const input = `<root>
  <!--
    This is a
    multi-line comment
  -->
  <item>value</item>
</root>`;
      const expected = `<root>
  
  <item>value</item>
</root>`;
      expect(stripCommentsFromBody(input, 'application/xml')).toBe(expected);
    });

    it('strips inline comments', () => {
      const input = `<root><!-- inline --><item>value</item></root>`;
      const expected = `<root><item>value</item></root>`;
      expect(stripCommentsFromBody(input, 'application/xml')).toBe(expected);
    });
  });

  describe('YAML (text/yaml)', () => {
    it('preserves # comments (native support)', () => {
      const input = `# This is a YAML comment
name: John
# Another comment
age: 30`;
      expect(stripCommentsFromBody(input, 'text/yaml')).toBe(input);
    });

    it('preserves comments in application/yaml', () => {
      const input = `# Comment
key: value`;
      expect(stripCommentsFromBody(input, 'application/yaml')).toBe(input);
    });
  });

  describe('Plain text', () => {
    it('strips // comments', () => {
      const input = `Line 1
// Comment
Line 2`;
      const expected = `Line 1
Line 2`;
      expect(stripCommentsFromBody(input, 'text/plain')).toBe(expected);
    });
  });

  describe('No mimeType specified', () => {
    it('defaults to JSON comment stripping', () => {
      const input = `{
  // Comment
  "key": "value"
}`;
      const expected = `{
  "key": "value"
}`;
      expect(stripCommentsFromBody(input, null)).toBe(expected);
      expect(stripCommentsFromBody(input, undefined)).toBe(expected);
    });
  });

  describe('mimeType with charset', () => {
    it('handles application/json; charset=utf-8', () => {
      const input = `{
  // Comment
  "key": "value"
}`;
      const expected = `{
  "key": "value"
}`;
      expect(stripCommentsFromBody(input, 'application/json; charset=utf-8')).toBe(expected);
    });
  });
});

describe('stripGraphQLComments()', () => {
  it('strips # line comments', () => {
    const input = `# This is a comment
query GetUser {
  user(id: 1) {
    name
  }
}`;
    const expected = `query GetUser {
  user(id: 1) {
    name
  }
}`;
    expect(stripGraphQLComments(input)).toBe(expected);
  });

  it('strips inline # comments', () => {
    const input = `query GetUser {
  user(id: 1) { # Get user by ID
    name # User's name
    age
  }
}`;
    const expected = `query GetUser {
  user(id: 1) {
    name
    age
  }
}`;
    expect(stripGraphQLComments(input)).toBe(expected);
  });

  it('does not strip # inside strings', () => {
    const input = `query {
  search(query: "#hashtag") {
    results
  }
}`;
    expect(stripGraphQLComments(input)).toBe(input);
  });

  it('handles empty input', () => {
    expect(stripGraphQLComments('')).toBe('');
  });

  it('handles query with only comments', () => {
    const input = `# Comment 1
# Comment 2`;
    expect(stripGraphQLComments(input).trim()).toBe('');
  });
});
