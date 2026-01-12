# Claude Instructions for RestPie

This file contains coding conventions and rules for Claude to follow when working on this project.

## UI Component Conventions

### Modal Button Styling

When creating or modifying modals, footer buttons must follow this pattern:

1. Wrap all buttons in a single `<div>` inside `<ModalFooter>` to align them to the right side
2. All buttons should use `className="btn"` (not `btn--super-compact` or other variants)
3. The secondary/cancel action button comes first, followed by the primary action button

**Example:**
```tsx
<ModalFooter>
  <div>
    <button className="btn" onClick={handleCancel}>
      Cancel
    </button>
    <button className="btn" onClick={handleSave}>
      Save
    </button>
  </div>
</ModalFooter>
```
