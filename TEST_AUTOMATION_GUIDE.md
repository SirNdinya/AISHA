# AISHA Test Automation Guide

## Overview

The `run-tests.sh` script provides automated testing across all AISHA components with real-time feedback and comprehensive logging.

## Quick Start

```bash
# Run all tests
./run-tests.sh

# Run specific test suites
./run-tests.sh --backend
./run-tests.sh --frontend
./run-tests.sh --ai

# Run multiple specific suites
./run-tests.sh -f -i  # Frontend and AI only
```

## Features

### ✨ Real-Time Feedback
- **Colored Output**: Green for passing tests, red for failures, yellow for warnings
- **Progress Indicators**: Animated spinners during long operations
- **Live Test Results**: See test results as they execute

### 📊 Comprehensive Logging
- **Master Log**: Combined log of all test runs (`logs/tests/test_run_TIMESTAMP.log`)
- **Individual Logs**: Separate logs for each component
  - `backend_TIMESTAMP.log`
  - `frontend_TIMESTAMP.log`
  - `ai_services_TIMESTAMP.log`

### 🎯 Flexible Execution
- Run all tests or select specific components
- Automatic dependency installation if needed
- Detailed error reporting and stack traces

## Command Line Options

| Option | Description |
|--------|-------------|
| `-a, --all` | Run all tests (default) |
| `-b, --backend` | Run backend tests only (Jest) |
| `-f, --frontend` | Run frontend tests only (Vitest) |
| `-i, --ai` | Run AI services tests only (Pytest) |
| `-h, --help` | Show help message |

## Test Components

### Backend Tests (Jest)
- **Location**: `backend/src/tests/`
- **Framework**: Jest with TypeScript support
- **Coverage**: Includes code coverage reports
- **Tests**:
  - Health check tests
  - Student controller integration tests
  - API endpoint tests

### Frontend Tests (Vitest)
- **Location**: `frontend/src/tests/`
- **Framework**: Vitest with React Testing Library
- **Tests**:
  - Component tests (e.g., ThemeToggle)
  - UI interaction tests
  - Integration tests

### AI Services Tests (Pytest)
- **Location**: `ai-services/app/tests/`
- **Framework**: Pytest
- **Tests**:
  - ML model tests
  - Service integration tests
  - API endpoint tests

## Output Examples

### Successful Test Run
```
================================
AISHA Test Automation Suite
================================

>>> Running Backend Tests (Jest)

ℹ Running backend tests...
✓ Health check endpoint returns 200
✓ Student profile retrieval works correctly
✓ Backend tests completed successfully

>>> Running Frontend Tests (Vitest)

ℹ Running frontend tests...
✓ ThemeToggle renders correctly
✓ ThemeToggle switches themes on click
✓ Frontend tests completed successfully

================================
TEST EXECUTION SUMMARY
================================

Test Suite Results:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Backend Tests:     ✓ PASSED
Frontend Tests:    ✓ PASSED
AI Services Tests: ✓ PASSED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Overall Status: ALL TESTS PASSED ✓
```

### Failed Test Run
```
>>> Running Backend Tests (Jest)

✗ Student controller validation fails
✗ Backend tests failed

================================
TEST EXECUTION SUMMARY
================================

Test Suite Results:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Backend Tests:     ✗ FAILED
Frontend Tests:    ✓ PASSED
AI Services Tests: ✓ PASSED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Overall Status: SOME TESTS FAILED ✗
```

## Log Files

All logs are stored in `logs/tests/` directory:

```
logs/tests/
├── test_run_20260211_154500.log      # Master log
├── backend_20260211_154500.log       # Backend-specific
├── frontend_20260211_154500.log      # Frontend-specific
└── ai_services_20260211_154500.log   # AI services-specific
```

### Log Contents
- Timestamp of test execution
- Complete test output with all details
- Error messages and stack traces
- Coverage reports (when available)
- Dependency installation logs

## Troubleshooting

### Dependencies Not Installed
The script automatically detects missing dependencies and installs them:
- **Backend**: Runs `npm install` if `node_modules` is missing
- **Frontend**: Runs `npm install` if `node_modules` is missing
- **AI Services**: Creates virtual environment and installs requirements

### Tests Failing
1. Check the specific log file for detailed error messages
2. Review the master log for overall context
3. Ensure all services (PostgreSQL, Redis) are running if needed
4. Verify environment variables are properly configured

### Permission Denied
If you get a permission error:
```bash
chmod +x run-tests.sh
```

## Integration with CI/CD

The script returns appropriate exit codes for CI/CD integration:
- **Exit 0**: All tests passed
- **Exit 1**: One or more test suites failed

Example GitHub Actions usage:
```yaml
- name: Run Tests
  run: ./run-tests.sh
```

Example GitLab CI usage:
```yaml
test:
  script:
    - ./run-tests.sh
```

## Best Practices

1. **Run Before Commits**: Execute `./run-tests.sh` before committing code
2. **Review Logs**: Check log files when tests fail for detailed diagnostics
3. **Selective Testing**: Use specific flags during development to save time
4. **Clean Logs**: Periodically clean old log files from `logs/tests/`

## Advanced Usage

### Running with Custom Environment
```bash
# Set custom environment variables
export NODE_ENV=test
export DATABASE_URL=postgresql://test:test@localhost:5432/test_db
./run-tests.sh
```

### Continuous Testing During Development
```bash
# Backend watch mode
cd backend && npm run test:watch

# Frontend watch mode
cd frontend && npm test
```

### Debugging Failed Tests
```bash
# Run specific suite with verbose output
./run-tests.sh --backend

# Check the log file
cat logs/tests/backend_*.log | tail -n 100
```

## Support

For issues or questions:
1. Check the log files in `logs/tests/`
2. Review the test files in respective directories
3. Ensure all dependencies are up to date
4. Verify environment configuration in `.env` files
