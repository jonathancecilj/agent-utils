---
description: Security review agent that audits the codebase for vulnerabilities and security gaps
---

# Security Review Agent

This workflow performs a comprehensive security audit of the application codebase and generates a detailed report.

## Steps

1. **Analyze the project structure** to understand the application architecture, frameworks used, and identify key security-sensitive areas (authentication, authorization, data handling, API endpoints, configuration files).

2. **Review authentication and authorization**:
   - Check for proper password hashing and storage
   - Verify session management implementation
   - Look for hardcoded credentials or API keys
   - Review access control mechanisms
   - Check for proper logout and session invalidation

3. **Analyze input validation and sanitization**:
   - Check for SQL injection vulnerabilities
   - Review XSS (Cross-Site Scripting) prevention
   - Look for command injection risks
   - Verify file upload security
   - Check for path traversal vulnerabilities

4. **Review sensitive data handling**:
   - Check for proper encryption of sensitive data
   - Review .env file handling and secrets management
   - Look for sensitive data in logs or error messages
   - Verify secure transmission (HTTPS, TLS)
   - Check for PII exposure risks

5. **Examine infrastructure security**:
   - Review Docker configuration for security best practices
   - Check for exposed ports and services
   - Analyze CORS configuration
   - Review CSP (Content Security Policy) headers
   - Check for security headers (X-Frame-Options, X-Content-Type-Options, etc.)

6. **Review dependencies**:
   - Check for known vulnerabilities in dependencies
   - Look for outdated packages with security patches
   - Review third-party integrations

7. **Analyze API security**:
   - Check for rate limiting implementation
   - Review API authentication mechanisms
   - Look for insecure direct object references (IDOR)
   - Verify proper error handling without information leakage

8. **Check for security misconfigurations**:
   - Debug mode in production
   - Default credentials
   - Overly permissive file permissions
   - Insecure default settings

9. **Generate the security report** by creating `SECURITY-REVIEW-REPORT.md` in the project root with the following structure:

```markdown
# Security Review Report

**Date:** [Current Date]
**Reviewed By:** Security Review Agent

## Executive Summary
[Brief overview of findings with risk level assessment]

## Critical Findings ⛔
[Vulnerabilities that require immediate attention]

## High Priority Issues ⚠️
[Significant security concerns]

## Medium Priority Issues 🟡
[Moderate security improvements needed]

## Low Priority Issues 🟢
[Minor security enhancements recommended]

## Best Practices Recommendations
[Suggestions for improving overall security posture]

## Detailed Findings

### Authentication & Authorization
[Detailed analysis]

### Input Validation
[Detailed analysis]

### Data Protection
[Detailed analysis]

### Infrastructure Security
[Detailed analysis]

### Dependency Security
[Detailed analysis]

### API Security
[Detailed analysis]

## Remediation Roadmap
[Prioritized action items with suggested timelines]

## Appendix
[Additional technical details, code snippets, and references]
```

10. **Summary**: Present key findings to the user with critical issues highlighted first.