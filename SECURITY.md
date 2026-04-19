# Security Policy

## Supported Versions

We actively support and provide security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability within this project, please send an email to the security team. All security vulnerabilities will be promptly addressed.

Please include the following information:

- Type of vulnerability
- Full paths of source file(s) related to the vulnerability
- Location of the affected source code
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

## Security Best Practices

When using these MCP servers:

1. **Environment Variables**: Never commit API keys or secrets to version control. Use environment variables for configuration.

2. **Network Security**: Ensure MCP servers are deployed in a secure network environment. Use HTTPS for all external connections.

3. **Access Control**: Implement proper authentication and authorization for all services.

4. **Docker Security**:
   - Run containers as non-root user (our Dockerfiles do this by default)
   - Regularly update base images
   - Use read-only file systems where possible

## Dependencies

This project uses Dependabot to automatically detect and alert about vulnerabilities in dependencies. Security updates are prioritized and merged regularly.

## Supported By

Security vulnerabilities will be addressed by the maintainers of AgentNxt. For urgent security issues, please contact us directly.