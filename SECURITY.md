# Security Policy

## Supported Versions

We release patches for security vulnerabilities for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

We take the security of CodeTube seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### Please do NOT:

- **Do NOT** open public issues on GitHub for security vulnerabilities
- **Do NOT** post about the vulnerability on public forums, social media, or Discord
- **Do NOT** attempt to access, modify, or delete data on production systems

### Please DO:

**Email us directly at:** security@codetube.dev

Include the following details in your report:

1. **Description**: Clear description of the vulnerability
2. **Steps to Reproduce**: Detailed steps to reproduce the issue
3. **Impact**: What could an attacker accomplish?
4. **Affected Versions**: Which versions are affected?
5. **Proof of Concept**: If possible, include a minimal proof of concept
6. **Your Contact**: How can we reach you for follow-up questions?

### What to Expect

- **Acknowledgment**: Within 48 hours of your report
- **Assessment**: We'll evaluate the severity and impact within 5 business days
- **Updates**: Regular updates on our progress every 7 days
- **Resolution**: Target fix timeline based on severity:
  - Critical: 7 days
  - High: 14 days
  - Medium: 30 days
  - Low: 90 days

### Bug Bounty

While we don't currently offer a paid bug bounty program, we deeply appreciate security researchers who help us improve. All valid security reports will be:

- Acknowledged in our security advisories
- Credited in release notes (with your permission)
- Added to our security hall of fame

## Security Considerations

When using CodeTube, please be aware of the following security aspects:

### Authentication & Authorization

- CodeTube uses JWT tokens for authentication
- Tokens expire after 24 hours by default
- Refresh tokens are rotated on each use
- Always use HTTPS in production

### Data Handling

- Recording data is stored in object storage (S3/MinIO)
- User passwords are hashed with bcrypt
- Database connections use SSL/TLS in production
- PII is handled according to GDPR/CCPA guidelines

### File Uploads

- Maximum recording file size: 50MB
- File types are validated server-side
- Uploaded files are scanned for malware
- Malicious file uploads are logged and blocked

### WebSocket Security

- All WebSocket connections require authentication
- Rate limiting is applied to prevent abuse
- Connection timeouts prevent resource exhaustion
- Message size limits prevent DoS attacks

### Dependencies

We regularly monitor and update our dependencies:

- Automated dependency scanning with Dependabot
- Security patches applied within 24 hours of release
- Outdated dependencies updated monthly

### Infrastructure

Recommended security measures for self-hosted deployments:

1. **Database**: Use strong passwords, enable SSL, restrict network access
2. **Redis**: Enable authentication, bind to localhost or internal network
3. **Object Storage**: Use presigned URLs with short expiration
4. **API Rate Limiting**: Configure nginx or API gateway for rate limiting
5. **CORS**: Whitelist only your frontend domains
6. **Headers**: Enable security headers (HSTS, CSP, X-Frame-Options)

## Security Best Practices for Users

- Use strong, unique passwords
- Enable two-factor authentication when available
- Don't share your API keys or access tokens
- Report suspicious activity immediately

## Security Updates

Security advisories will be published on:

- Our [Security Advisories](https://github.com/yourusername/codetube/security/advisories) page
- The [CHANGELOG.md](CHANGELOG.md)
- Our [Discord](https://discord.gg/codetube) #announcements channel
- Twitter [@CodeTube](https://twitter.com/codetube)

---

Thank you for helping keep CodeTube and our community safe!
