---
description: Staff Software Engineer code review - verify best practices and enforce refactoring
---

# Staff Software Engineer Review

Invoke this workflow to perform a rigorous code review with the mindset of a Staff Software Engineer. This review focuses on code quality, maintainability, scalability, and adherence to best practices.

## Review Checklist

When invoked, perform a comprehensive review covering the following areas:

### 1. Architecture & Design
- [ ] **Separation of Concerns**: Is the code properly modularized? Are responsibilities clearly separated?
- [ ] **Single Responsibility Principle**: Does each component/function do one thing well?
- [ ] **DRY (Don't Repeat Yourself)**: Is there duplicated logic that should be abstracted?
- [ ] **KISS (Keep It Simple)**: Is the solution unnecessarily complex?
- [ ] **Component Structure**: Are components appropriately sized? Should large components be split?

### 2. Code Quality
- [ ] **Naming Conventions**: Are variables, functions, and components named clearly and descriptively?
- [ ] **Type Safety**: Are TypeScript types properly defined and used? No `any` without justification.
- [ ] **Error Handling**: Are errors handled gracefully? Are edge cases considered?
- [ ] **Code Comments**: Is complex logic documented? Are comments meaningful (not obvious)?
- [ ] **Dead Code**: Is there unused code that should be removed?

### 3. Performance
- [ ] **Unnecessary Re-renders**: Are React components optimized (useMemo, useCallback where appropriate)?
- [ ] **Bundle Size**: Are imports optimized? No unused dependencies?
- [ ] **Lazy Loading**: Are large components/routes lazy loaded where beneficial?
- [ ] **Data Fetching**: Is data fetched efficiently? No N+1 queries or waterfalls?

### 4. Maintainability
- [ ] **Readability**: Can a new developer understand this code quickly?
- [ ] **Testability**: Is the code structured to be easily testable?
- [ ] **Configuration**: Are magic numbers and strings extracted to constants?
- [ ] **Dependencies**: Are dependencies up to date and necessary?

### 5. Security
- [ ] **Input Validation**: Is user input validated and sanitized?
- [ ] **Sensitive Data**: Are secrets and credentials properly handled?
- [ ] **XSS Prevention**: Is user-generated content properly escaped?

### 6. Accessibility
- [ ] **Semantic HTML**: Are proper HTML elements used?
- [ ] **ARIA Labels**: Are interactive elements properly labeled?
- [ ] **Keyboard Navigation**: Can the UI be navigated with keyboard?
- [ ] **Color Contrast**: Is text readable against backgrounds?

## Review Process

1. **Read the code** - Understand the intent and implementation
2. **Identify issues** - Note violations of the checklist above
3. **Prioritize findings**:
   - 🔴 **Critical**: Must fix before merge (security, bugs, breaking changes)
   - 🟠 **Important**: Should fix (maintainability, performance concerns)
   - 🟡 **Suggestion**: Nice to have (style, minor improvements)
4. **Provide actionable feedback** - Include specific suggestions and code examples
5. **Acknowledge good patterns** - Call out well-implemented sections

## Output Format

Provide the review in this structure:

```markdown
## Staff Engineer Review Summary

### 🔴 Critical Issues
[List critical issues with file references and line numbers]

### 🟠 Important Issues
[List important issues with suggestions]

### 🟡 Suggestions
[List nice-to-have improvements]

### ✅ Well Done
[Acknowledge good patterns and implementations]

### Recommended Refactoring
[Provide specific refactoring recommendations with code examples]
```

## Invocation

To use this workflow, say:
- `/staff-engineer-review` - Review the current file or specified files
- `/staff-engineer-review app/` - Review all files in a directory
- `/staff-engineer-review --focus performance` - Focus on a specific area
