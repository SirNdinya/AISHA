#!/bin/bash

################################################################################
# AISHA Test Automation Script
# 
# This script automates testing across all AISHA components:
# - Backend (Jest)
# - Frontend (Vitest)
# - AI Services (Pytest)
#
# Features:
# - Real-time progress feedback with colored output
# - Detailed logging to files
# - Test result summaries
# - Error tracking and reporting
# - Parallel or sequential test execution
################################################################################

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Directories
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
AI_SERVICES_DIR="$PROJECT_ROOT/ai-services"
LOGS_DIR="$PROJECT_ROOT/logs/tests"

# Create logs directory if it doesn't exist
mkdir -p "$LOGS_DIR"

# Timestamp for log files
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
MASTER_LOG="$LOGS_DIR/test_run_${TIMESTAMP}.log"

# Test results tracking
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
SKIPPED_TESTS=0

################################################################################
# Utility Functions
################################################################################

# Print colored header
print_header() {
    echo -e "\n${BOLD}${CYAN}================================${NC}"
    echo -e "${BOLD}${CYAN}$1${NC}"
    echo -e "${BOLD}${CYAN}================================${NC}\n"
}

# Print colored section
print_section() {
    echo -e "\n${BOLD}${BLUE}>>> $1${NC}\n"
}

# Print success message
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Print error message
print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Print warning message
print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Print info message
print_info() {
    echo -e "${CYAN}ℹ $1${NC}"
}

# Log message to both console and file
log_message() {
    local message="$1"
    echo -e "$message" | tee -a "$MASTER_LOG"
}

# Log to file only (for verbose output)
log_file_only() {
    echo -e "$1" >> "$MASTER_LOG"
}

# Show spinner while command runs
spinner() {
    local pid=$1
    local message=$2
    local spin='⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏'
    local i=0
    
    while kill -0 $pid 2>/dev/null; do
        i=$(( (i+1) %10 ))
        printf "\r${CYAN}${spin:$i:1} ${message}...${NC}"
        sleep 0.1
    done
    printf "\r"
}

################################################################################
# Test Execution Functions
################################################################################

# Run Backend Tests (Jest)
run_backend_tests() {
    print_section "Running Backend Tests (Jest)"
    
    local log_file="$LOGS_DIR/backend_${TIMESTAMP}.log"
    
    if [ ! -d "$BACKEND_DIR" ]; then
        print_error "Backend directory not found: $BACKEND_DIR"
        log_message "${RED}Backend tests skipped - directory not found${NC}"
        return 1
    fi
    
    cd "$BACKEND_DIR" || return 1
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        print_warning "Backend dependencies not installed. Installing..."
        npm install > "$log_file" 2>&1 &
        spinner $! "Installing backend dependencies"
        wait $!
    fi
    
    print_info "Running backend tests..."
    log_message "Backend Test Output:" >> "$log_file"
    
    # Run tests with coverage and save output
    npm test -- --verbose --coverage 2>&1 | tee -a "$log_file" | while IFS= read -r line; do
        # Parse test results in real-time
        if [[ $line =~ "PASS" ]]; then
            echo -e "${GREEN}$line${NC}"
        elif [[ $line =~ "FAIL" ]]; then
            echo -e "${RED}$line${NC}"
        elif [[ $line =~ "Test Suites:" ]]; then
            echo -e "${BOLD}${WHITE}$line${NC}"
        elif [[ $line =~ "Tests:" ]]; then
            echo -e "${BOLD}${WHITE}$line${NC}"
        else
            echo "$line"
        fi
    done
    
    local exit_code=${PIPESTATUS[0]}
    
    if [ $exit_code -eq 0 ]; then
        print_success "Backend tests completed successfully"
        log_message "${GREEN}Backend tests: PASSED${NC}"
    else
        print_error "Backend tests failed"
        log_message "${RED}Backend tests: FAILED${NC}"
    fi
    
    print_info "Backend test log saved to: $log_file"
    cd "$PROJECT_ROOT"
    
    return $exit_code
}

# Run Frontend Tests (Vitest)
run_frontend_tests() {
    print_section "Running Frontend Tests (Vitest)"
    
    local log_file="$LOGS_DIR/frontend_${TIMESTAMP}.log"
    
    if [ ! -d "$FRONTEND_DIR" ]; then
        print_error "Frontend directory not found: $FRONTEND_DIR"
        log_message "${RED}Frontend tests skipped - directory not found${NC}"
        return 1
    fi
    
    cd "$FRONTEND_DIR" || return 1
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        print_warning "Frontend dependencies not installed. Installing..."
        npm install > "$log_file" 2>&1 &
        spinner $! "Installing frontend dependencies"
        wait $!
    fi
    
    print_info "Running frontend tests..."
    log_message "Frontend Test Output:" >> "$log_file"
    
    # Run tests and save output
    npm test -- --run --reporter=verbose 2>&1 | tee -a "$log_file" | while IFS= read -r line; do
        # Parse test results in real-time
        if [[ $line =~ "✓" ]] || [[ $line =~ "PASS" ]]; then
            echo -e "${GREEN}$line${NC}"
        elif [[ $line =~ "✗" ]] || [[ $line =~ "FAIL" ]]; then
            echo -e "${RED}$line${NC}"
        elif [[ $line =~ "Test Files" ]]; then
            echo -e "${BOLD}${WHITE}$line${NC}"
        elif [[ $line =~ "Tests" ]]; then
            echo -e "${BOLD}${WHITE}$line${NC}"
        else
            echo "$line"
        fi
    done
    
    local exit_code=${PIPESTATUS[0]}
    
    if [ $exit_code -eq 0 ]; then
        print_success "Frontend tests completed successfully"
        log_message "${GREEN}Frontend tests: PASSED${NC}"
    else
        print_error "Frontend tests failed"
        log_message "${RED}Frontend tests: FAILED${NC}"
    fi
    
    print_info "Frontend test log saved to: $log_file"
    cd "$PROJECT_ROOT"
    
    return $exit_code
}

# Run AI Services Tests (Pytest)
run_ai_tests() {
    print_section "Running AI Services Tests (Pytest)"
    
    local log_file="$LOGS_DIR/ai_services_${TIMESTAMP}.log"
    
    if [ ! -d "$AI_SERVICES_DIR" ]; then
        print_error "AI Services directory not found: $AI_SERVICES_DIR"
        log_message "${RED}AI Services tests skipped - directory not found${NC}"
        return 1
    fi
    
    cd "$AI_SERVICES_DIR" || return 1
    
    # Check if virtual environment exists
    if [ ! -d "venv" ]; then
        print_warning "Python virtual environment not found. Creating..."
        python3 -m venv venv > "$log_file" 2>&1
        source venv/bin/activate
        pip install -r requirements.txt >> "$log_file" 2>&1 &
        spinner $! "Installing AI services dependencies"
        wait $!
    else
        source venv/bin/activate
    fi
    
    print_info "Running AI services tests..."
    log_message "AI Services Test Output:" >> "$log_file"
    
    # Set PYTHONPATH to include the ai-services directory
    export PYTHONPATH="${AI_SERVICES_DIR}:${PYTHONPATH:-}"
    
    # Run pytest with verbose output and coverage
    if command -v pytest &> /dev/null; then
        pytest -v --tb=short --color=yes 2>&1 | tee -a "$log_file" | while IFS= read -r line; do
            # Parse test results in real-time
            if [[ $line =~ "PASSED" ]]; then
                echo -e "${GREEN}$line${NC}"
            elif [[ $line =~ "FAILED" ]]; then
                echo -e "${RED}$line${NC}"
            elif [[ $line =~ "ERROR" ]]; then
                echo -e "${RED}$line${NC}"
            elif [[ $line =~ "SKIPPED" ]]; then
                echo -e "${YELLOW}$line${NC}"
            elif [[ $line =~ "=" ]]; then
                echo -e "${BOLD}${WHITE}$line${NC}"
            else
                echo "$line"
            fi
        done
        
        local exit_code=${PIPESTATUS[0]}
    else
        print_warning "pytest not found. Installing pytest..."
        pip install pytest pytest-cov > "$log_file" 2>&1
        print_info "Please run the script again to execute AI tests."
        exit_code=1
    fi
    
    deactivate
    
    if [ $exit_code -eq 0 ]; then
        print_success "AI Services tests completed successfully"
        log_message "${GREEN}AI Services tests: PASSED${NC}"
    else
        print_error "AI Services tests failed"
        log_message "${RED}AI Services tests: FAILED${NC}"
    fi
    
    print_info "AI Services test log saved to: $log_file"
    cd "$PROJECT_ROOT"
    
    return $exit_code
}

# Check Ollama Status
check_ollama() {
    print_section "Checking Ollama Service"
    
    local log_file="$LOGS_DIR/ollama_check_${TIMESTAMP}.log"
    
    # Check if ollama command exists
    if ! command -v ollama &> /dev/null; then
        print_error "Ollama command not found"
        log_message "${RED}Ollama check: FAILED (command not found)${NC}"
        return 1
    fi
    
    # Check if service is responsive
    if curl -s http://localhost:11434/api/tags > /dev/null; then
        print_success "Ollama service is running"
    else
        print_error "Ollama service is not responding on http://localhost:11434"
        log_message "${RED}Ollama check: FAILED (service unreachable)${NC}"
        return 1
    fi
    
    # Check if llama3 is pulled
    if ollama list | grep -q "llama3"; then
        print_success "Llama3 model is available"
    else
        print_warning "Llama3 model not found. Attempting to pull..."
        ollama pull llama3 >> "$log_file" 2>&1 &
        spinner $! "Pulling llama3 model"
        wait $!
        if ollama list | grep -q "llama3"; then
            print_success "Llama3 model pulled successfully"
        else
            print_error "Failed to pull llama3 model"
            return 1
        fi
    fi
    
    log_message "${GREEN}Ollama check: PASSED${NC}"
    return 0
}

################################################################################
# Summary and Reporting
################################################################################

generate_summary() {
    local backend_result=$1
    local frontend_result=$2
    local ai_result=$3
    local ollama_result=$4
    
    print_header "TEST EXECUTION SUMMARY"
    
    echo -e "${BOLD}Test Suite Results:${NC}"
    echo -e "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # Backend
    if [ $backend_result -eq 0 ]; then
        echo -e "Backend Tests:     ${GREEN}✓ PASSED${NC}"
    else
        echo -e "Backend Tests:     ${RED}✗ FAILED${NC}"
    fi
    
    # Frontend
    if [ $frontend_result -eq 0 ]; then
        echo -e "Frontend Tests:    ${GREEN}✓ PASSED${NC}"
    else
        echo -e "Frontend Tests:    ${RED}✗ FAILED${NC}"
    fi
    
    # AI Services
    if [ $ai_result -eq 0 ]; then
        echo -e "AI Services Tests: ${GREEN}✓ PASSED${NC}"
    else
        echo -e "AI Services Tests: ${RED}✗ FAILED${NC}"
    fi

    # Ollama
    if [ $ollama_result -eq 0 ]; then
        echo -e "Ollama Service:    ${GREEN}✓ READY${NC}"
    else
        echo -e "Ollama Service:    ${RED}✗ UNREACHABLE/MISSING${NC}"
    fi
    
    echo -e "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # Overall result
    if [ $backend_result -eq 0 ] && [ $frontend_result -eq 0 ] && [ $ai_result -eq 0 ] && [ $ollama_result -eq 0 ]; then
        echo -e "\n${BOLD}${GREEN}Overall Status: ALL SYSTEMS PASSING ✓${NC}\n"
        OVERALL_EXIT=0
    else
        echo -e "\n${BOLD}${RED}Overall Status: SOME SYSTEMS FAILING ✗${NC}\n"
        OVERALL_EXIT=1
    fi
    
    print_info "Master log file: $MASTER_LOG"
    print_info "Individual logs: $LOGS_DIR/"
    
    echo ""
}

################################################################################
# Main Execution
################################################################################

show_usage() {
    echo -e "${BOLD}Usage:${NC} $0 [OPTIONS]"
    echo ""
    echo -e "${BOLD}Options:${NC}"
    echo "  -a, --all         Run all tests (default)"
    echo "  -b, --backend     Run backend tests only"
    echo "  -f, --frontend    Run frontend tests only"
    echo "  -i, --ai          Run AI services tests only"
    echo "  -o, --ollama      Check Ollama status only"
    echo "  -h, --help        Show this help message"
    echo ""
    echo -e "${BOLD}Examples:${NC}"
    echo "  $0                # Run all tests"
    echo "  $0 --backend      # Run only backend tests"
    echo "  $0 -f -i          # Run frontend and AI tests"
    echo ""
}

# Parse command line arguments
RUN_BACKEND=false
RUN_FRONTEND=false
RUN_AI=false
RUN_OLLAMA=false
RUN_ALL=false

if [ $# -eq 0 ]; then
    RUN_ALL=true
fi

while [[ $# -gt 0 ]]; do
    case $1 in
        -a|--all)
            RUN_ALL=true
            shift
            ;;
        -b|--backend)
            RUN_BACKEND=true
            shift
            ;;
        -f|--frontend)
            RUN_FRONTEND=true
            shift
            ;;
        -i|--ai)
            RUN_AI=true
            shift
            ;;
        -o|--ollama)
            RUN_OLLAMA=true
            shift
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Final Summary arguments
BACKEND_RESULT=0
FRONTEND_RESULT=0
AI_RESULT=0
OLLAMA_RESULT=0

# If --all, include Ollama check
if [ "$RUN_ALL" = true ]; then
    RUN_BACKEND=true
    RUN_FRONTEND=true
    RUN_AI=true
    RUN_OLLAMA=true
fi

# Print script header
clear
print_header "AISHA Test Automation Suite"
echo -e "${BOLD}Started at:${NC} $(date)"
echo -e "${BOLD}Log Directory:${NC} $LOGS_DIR"
echo ""

# Run selected test suites
if [ "$RUN_BACKEND" = true ]; then
    run_backend_tests
    BACKEND_RESULT=$?
fi

if [ "$RUN_FRONTEND" = true ]; then
    run_frontend_tests
    FRONTEND_RESULT=$?
fi

if [ "$RUN_AI" = true ]; then
    run_ai_tests
    AI_RESULT=$?
fi

if [ "$RUN_OLLAMA" = true ]; then
    check_ollama
    OLLAMA_RESULT=$?
fi

# Generate summary report
generate_summary $BACKEND_RESULT $FRONTEND_RESULT $AI_RESULT $OLLAMA_RESULT

echo -e "${BOLD}Completed at:${NC} $(date)"
echo ""

exit $OVERALL_EXIT
