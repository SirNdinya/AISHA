# AISHA Security Vulnerability Report (Phase 5.1.4)

An automated dependency audit was performed on Feb 11, 2026. The following vulnerabilities were identified:

## 1. Web (Frontend & Backend)
- **Dependency**: `axios` (<= 1.13.4)
- **Severity**: HIGH
- **Issue**: Denial of Service (DoS) via `__proto__` key in `mergeConfig`.
- **Status**: Vulnerable.
- **Recommended Fix**: Run `npm audit fix` or upgrade to `axios@1.13.5+`.

## 2. AI Services (Python)
- **Dependency**: `cryptography` (43.0.1)
- **Severity**: HIGH
- **Issue**: Multiple CVEs (CVE-2024-12797, CVE-2026-26007).
- **Status**: Vulnerable.
- **Recommended Fix**: Upgrade to `46.0.5+`.

- **Dependency**: `starlette` (0.38.6)
- **Severity**: HIGH
- **Issue**: Path traversal and DoS (CVE-2024-47874, CVE-2025-54121).
- **Status**: Vulnerable.
- **Recommended Fix**: Upgrade to `0.47.2+`.

- **Dependency**: `pypdf` (5.1.0)
- **Severity**: MEDIUM/HIGH
- **Issue**: Multiple ReDoS and infinite loop vulnerabilities.
- **Status**: Vulnerable.
- **Recommended Fix**: Upgrade to `6.6.2+`.

- **Dependency**: `requests` (2.32.3)
- **Severity**: MEDIUM
- **Issue**: Cookie leakage (CVE-2024-47081).
- **Status**: Vulnerable.
- **Recommended Fix**: Upgrade to `2.32.4+`.

## 3. General Recommendations
1.  **Automated Patching**: Execute `npm audit fix` in both web directories.
2.  **AI Services Update**: Update `ai-services/requirements.txt` with the recommended versions and re-run the setup.
3.  **Regular Audits**: Schedule weekly automated security audits as part of the CI/CD pipeline.
