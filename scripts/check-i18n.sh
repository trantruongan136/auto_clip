#!/bin/bash

# AutoClip I18n Check Script
# Version: 1.0
# Function: Check synchronization status of multilingual documentation

set -euo pipefail

# =============================================================================
# Configuration Area
# =============================================================================

# Color definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Icon definitions
ICON_SUCCESS="✅"
ICON_ERROR="❌"
ICON_WARNING="⚠️"
ICON_INFO="ℹ️"
ICON_CHECK="🔍"

# File list
FILES=("README.md" "README-EN.md" ".github/README.md")

# =============================================================================
# Utility Functions
# =============================================================================

log_info() {
    echo -e "${BLUE}${ICON_INFO} $1${NC}"
}

log_success() {
    echo -e "${GREEN}${ICON_SUCCESS} $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}${ICON_WARNING} $1${NC}"
}

log_error() {
    echo -e "${RED}${ICON_ERROR} $1${NC}"
}

log_header() {
    echo -e "\n${PURPLE}${ICON_CHECK} $1${NC}"
    echo -e "${PURPLE}$(printf '=%.0s' {1..50})${NC}"
}

# =============================================================================
# Check Functions
# =============================================================================

check_file_exists() {
    local file="$1"
    if [[ -f "$file" ]]; then
        log_success "File exists: $file"
        return 0
    else
        log_error "File does not exist: $file"
        return 1
    fi
}

check_language_switcher() {
    local file="$1"
    local has_switcher=false
    
    if grep -q "语言.*English.*中文\|Language.*English.*中文" "$file" 2>/dev/null; then
        has_switcher=true
    fi
    
    if [[ "$has_switcher" == true ]]; then
        log_success "Language switcher exists: $file"
        return 0
    else
        log_error "Language switcher missing: $file"
        return 1
    fi
}

check_contact_info() {
    local file="$1"
    local has_contact=false
    
    # Check multiple contact format formats
    if grep -q "support@autoclip.com\|your_wechat_id\|your_feishu_id\|个人微信\|飞书\|Personal WeChat\|Feishu" "$file" 2>/dev/null; then
        has_contact=true
    fi
    
    if [[ "$has_contact" == true ]]; then
        log_success "Contact info exists: $file"
        return 0
    else
        log_error "Contact info missing: $file"
        return 1
    fi
}

check_docker_support() {
    local file="$1"
    local has_docker=false
    
    if grep -q "Docker\|docker" "$file" 2>/dev/null; then
        has_docker=true
    fi
    
    if [[ "$has_docker" == true ]]; then
        log_success "Docker support doc exists: $file"
        return 0
    else
        log_error "Docker support doc missing: $file"
        return 1
    fi
}

check_development_features() {
    local file="$1"
    local has_dev_features=false
    
    if grep -q "开发中\|In Development" "$file" 2>/dev/null; then
        has_dev_features=true
    fi
    
    if [[ "$has_dev_features" == true ]]; then
        log_success "In-development features tag exists: $file"
        return 0
    else
        log_warning "In-development features tag missing: $file"
        return 1
    fi
}

check_markdown_syntax() {
    local file="$1"
    local errors=0
    
    # Check title hierarchy
    if grep -q "^# " "$file" && ! grep -q "^## " "$file"; then
        log_warning "Title hierarchy might have issues: $file"
        ((errors++))
    fi
    
    # Check link format
    if grep -q "\[.*\](" "$file" && ! grep -q "\[.*\]\(http" "$file"; then
        log_warning "Possibly invalid links: $file"
        ((errors++))
    fi
    
    if [[ $errors -eq 0 ]]; then
        log_success "Markdown syntax check passed: $file"
        return 0
    else
        log_warning "Issues found in Markdown syntax check: $file"
        return 1
    fi
}

check_file_consistency() {
    local file1="$1"
    local file2="$2"
    local consistency_score=0
    
    # Check file size ratio
    local size1=$(wc -c < "$file1" 2>/dev/null || echo "0")
    local size2=$(wc -c < "$file2" 2>/dev/null || echo "0")
    
    if [[ $size1 -gt 0 && $size2 -gt 0 ]]; then
        local ratio=$((size2 * 100 / size1))
        if [[ $ratio -gt 80 && $ratio -lt 120 ]]; then
            log_success "File size ratio is reasonable: $file1 vs $file2 ($ratio%)"
            ((consistency_score++))
        else
            log_warning "File size ratio is unusual: $file1 vs $file2 ($ratio%)"
        fi
    fi
    
    # Check key content consistency
    local key_terms=("AutoClip" "Docker" "API" "GitHub")
    for term in "${key_terms[@]}"; do
        local count1=$(grep -c "$term" "$file1" 2>/dev/null || echo "0")
        local count2=$(grep -c "$term" "$file2" 2>/dev/null || echo "0")
        
        if [[ $count1 -gt 0 && $count2 -gt 0 ]]; then
            ((consistency_score++))
        fi
    done
    
    if [[ $consistency_score -gt 2 ]]; then
        log_success "File content consistency is good: $file1 vs $file2"
        return 0
    else
        log_warning "File content consistency needs improvement: $file1 vs $file2"
        return 1
    fi
}

# =============================================================================
# Main Function
# =============================================================================

main() {
    log_header "AutoClip I18n Check v1.0"
    
    local overall_status=0
    local total_checks=0
    local passed_checks=0
    
    # Check all files
    for file in "${FILES[@]}"; do
        log_header "Checking file: $file"
        
        # File existence check
        ((total_checks++))
        if check_file_exists "$file"; then
            ((passed_checks++))
        else
            overall_status=1
            continue
        fi
        
        # Language switcher check
        ((total_checks++))
        if check_language_switcher "$file"; then
            ((passed_checks++))
        else
            overall_status=1
        fi
        
        # Contact info check
        ((total_checks++))
        if check_contact_info "$file"; then
            ((passed_checks++))
        else
            overall_status=1
        fi
        
        # Docker support check
        ((total_checks++))
        if check_docker_support "$file"; then
            ((passed_checks++))
        else
            overall_status=1
        fi
        
        # In-development features check
        ((total_checks++))
        if check_development_features "$file"; then
            ((passed_checks++))
        else
            # Not a critical error
            ((passed_checks++))
        fi
        
        # Markdown syntax check
        ((total_checks++))
        if check_markdown_syntax "$file"; then
            ((passed_checks++))
        else
            # Not a critical error
            ((passed_checks++))
        fi
    done
    
    # Check file consistency
    if [[ -f "README.md" && -f "README-EN.md" ]]; then
        log_header "Checking file consistency"
        ((total_checks++))
        if check_file_consistency "README.md" "README-EN.md"; then
            ((passed_checks++))
        else
            # Not a critical error
            ((passed_checks++))
        fi
    fi
    
    # Show overall results
    log_header "Check Results Summary"
    
    local pass_rate=$((passed_checks * 100 / total_checks))
    echo -e "${BLUE}Total checks: $total_checks${NC}"
    echo -e "${GREEN}Passed checks: $passed_checks${NC}"
    echo -e "${BLUE}Pass rate: $pass_rate%${NC}"
    
    if [[ $overall_status -eq 0 ]]; then
        log_success "All key checks passed!"
        echo -e "\n${GREEN}🎉 I18n doc status is good!${NC}"
    else
        log_error "Some checks did not pass"
        echo -e "\n${YELLOW}💡 Suggested actions:${NC}"
        echo -e "  1. Check missing files"
        echo -e "  2. Add language switcher"
        echo -e "  3. Complete contact information"
        echo -e "  4. Add Docker support documentation"
    fi
    
    echo -e "\n${BLUE}📝 Detailed report generated at: docs/i18n-report.md${NC}"
    
    # Generate detailed report
    mkdir -p docs
    cat > docs/i18n-report.md << EOF
# I18n Check Report

## Check Time
$(date)

## Check Results
- Total checks: $total_checks
- Passed checks: $passed_checks
- Pass rate: $pass_rate%

## File Status
EOF
    
    for file in "${FILES[@]}"; do
        if [[ -f "$file" ]]; then
            echo "- ✅ $file" >> docs/i18n-report.md
        else
            echo "- ❌ $file" >> docs/i18n-report.md
        fi
    done
    
    echo "" >> docs/i18n-report.md
    echo "## Recommendations" >> docs/i18n-report.md
    if [[ $overall_status -eq 0 ]]; then
        echo "- All checks passed, doc status is good" >> docs/i18n-report.md
    else
        echo "- Please fix issues based on check results" >> docs/i18n-report.md
        echo "- Ensure all language versions are synchronized" >> docs/i18n-report.md
    fi
}

# Show help information
show_help() {
    echo "AutoClip I18n Check Script"
    echo ""
    echo "Usage:"
    echo "  $0 [options]"
    echo ""
    echo "Options:"
    echo "  help    Show help information"
    echo ""
    echo "Features:"
    echo "  - Check existence of multilingual doc files"
    echo "  - Verify language switcher"
    echo "  - Check contact information"
    echo "  - Verify Docker support doc"
    echo "  - Check in-development features tag"
    echo "  - Verify Markdown syntax"
    echo "  - Check file content consistency"
    echo ""
    echo "Examples:"
    echo "  $0          # Run full check"
    echo "  $0 help     # Show help"
}

# Process parameters
case "${1:-}" in
    "help"|"-h"|"--help")
        show_help
        exit 0
        ;;
    *)
        main "$@"
        ;;
esac
