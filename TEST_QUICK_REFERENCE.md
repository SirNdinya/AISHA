# 🚀 AISHA Test Automation - Quick Reference

## Basic Commands

```bash
# Run all tests
./run-tests.sh

# Run specific component tests
./run-tests.sh --backend      # Backend only (Jest)
./run-tests.sh --frontend     # Frontend only (Vitest)
./run-tests.sh --ai           # AI services only (Pytest)

# Run multiple components
./run-tests.sh -b -f          # Backend + Frontend
./run-tests.sh -f -i          # Frontend + AI

# Show help
./run-tests.sh --help
```

## Features at a Glance

✅ **Real-time colored output** - See test results as they happen
✅ **Progress indicators** - Animated spinners for long operations
✅ **Detailed logging** - All output saved to timestamped log files
✅ **Auto dependency check** - Installs missing dependencies automatically
✅ **Summary reports** - Clear pass/fail summary at the end
✅ **CI/CD ready** - Returns proper exit codes (0=success, 1=failure)

## Output Colors

- 🟢 **Green** - Tests passed
- 🔴 **Red** - Tests failed
- 🟡 **Yellow** - Warnings/skipped tests
- 🔵 **Blue** - Section headers
- 🔵 **Cyan** - Info messages

## Log Files Location

```
logs/tests/
├── test_run_TIMESTAMP.log       # Master log (all tests)
├── backend_TIMESTAMP.log        # Backend tests only
├── frontend_TIMESTAMP.log       # Frontend tests only
└── ai_services_TIMESTAMP.log    # AI services tests only
```

## Exit Codes

- **0** - All tests passed ✅
- **1** - One or more tests failed ❌

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Permission denied | `chmod +x run-tests.sh` |
| Dependencies missing | Script auto-installs them |
| Tests failing | Check log files in `logs/tests/` |
| Services not running | Start PostgreSQL/Redis with Docker |

## Example Output

```
================================
AISHA Test Automation Suite
================================

>>> Running Backend Tests (Jest)
ℹ Running backend tests...
✓ Health check endpoint returns 200
✓ Student controller tests pass
✓ Backend tests completed successfully

================================
TEST EXECUTION SUMMARY
================================

Backend Tests:     ✓ PASSED
Frontend Tests:    ✓ PASSED
AI Services Tests: ✓ PASSED

Overall Status: ALL TESTS PASSED ✓
```

## Pro Tips

💡 Run `./run-tests.sh` before every commit
💡 Use specific flags during development to save time
💡 Check log files for detailed error diagnostics
💡 Integrate with CI/CD pipelines for automated testing

---

📖 **Full Documentation**: See `TEST_AUTOMATION_GUIDE.md`
