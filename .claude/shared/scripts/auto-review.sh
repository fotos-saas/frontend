#!/bin/bash
# PhotoStack SaaS - Auto Review Script
# Checks recently modified files in frontend/ and backend/ for common issues.
# Both are separate git repos; root is NOT a git repo.

set -euo pipefail

# Dinamikus root: script → shared/scripts/ → .claude/ → frontend/ → root
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../../../.." && pwd)"
# Fallback: ha PHOTOSTACK_ROOT env var be van állítva
ROOT_DIR="${PHOTOSTACK_ROOT:-$ROOT_DIR}"
MINUTES_AGO=5

RED='\033[0;31m'
YELLOW='\033[0;33m'
GREEN='\033[0;32m'
BOLD='\033[1m'
NC='\033[0m'

# Use temp files for counters (subshell-safe)
TMPDIR_REVIEW=$(mktemp -d)
echo "0" > "$TMPDIR_REVIEW/warnings"
echo "0" > "$TMPDIR_REVIEW/errors"
trap 'rm -rf "$TMPDIR_REVIEW"' EXIT

inc_warn() {
    local c; c=$(cat "$TMPDIR_REVIEW/warnings"); echo $((c + 1)) > "$TMPDIR_REVIEW/warnings"
    printf "  ${YELLOW}WARNING:${NC} %s\n" "$1"
}

inc_err() {
    local c; c=$(cat "$TMPDIR_REVIEW/errors"); echo $((c + 1)) > "$TMPDIR_REVIEW/errors"
    printf "  ${RED}ERROR:${NC} %s\n" "$1"
}

check_file() {
    local file="$1"
    local relative_file="$2"
    local bname
    bname=$(basename "$file")
    local ext="${bname##*.}"

    case "$ext" in
        ts|php|html|scss|css|js) ;;
        *) return 0 ;;
    esac

    case "$file" in
        */node_modules/*|*/vendor/*|*/dist/*|*/.git/*|*/storage/*) return 0 ;;
    esac

    # Line count check
    local line_count
    line_count=$(wc -l < "$file" 2>/dev/null || echo "0")
    line_count=$(echo "$line_count" | tr -d ' ')

    case "$bname" in
        *.data.ts|*.routes.ts|*.models.ts)
            if [ "$line_count" -gt 800 ]; then
                inc_err "$relative_file: $line_count sor (limit: 800 adat fajlnal)"
            fi
            ;;
        *)
            if [ "$line_count" -gt 500 ]; then
                inc_err "$relative_file: $line_count sor (limit: 500)"
            elif [ "$line_count" -gt 400 ]; then
                inc_warn "$relative_file: $line_count sor (kozel a 500-as limithez)"
            fi
            ;;
    esac

    # console.log - skip test/spec files
    case "$bname" in
        *.spec.ts|*.test.ts|*.test.js) ;;
        *)
            local cl_count
            cl_count=$(grep -c 'console\.log' "$file" 2>/dev/null || echo "0")
            if [ "$cl_count" -gt 0 ]; then
                inc_warn "$relative_file: console.log talalat ($cl_count db)"
            fi
            ;;
    esac

    # shell_exec (PHP)
    if [ "$ext" = "php" ]; then
        if grep -q 'shell_exec' "$file" 2>/dev/null; then
            inc_err "$relative_file: shell_exec() hasznalat (Symfony Process kell!)"
        fi
    fi

    # localStorage for tokens
    if [ "$ext" = "ts" ] || [ "$ext" = "js" ]; then
        if grep -qE 'localStorage\.(set|get)Item.*token' "$file" 2>/dev/null; then
            inc_err "$relative_file: localStorage token tarolas (sessionStorage kell!)"
        fi
    fi

    # dd() / dump() / var_dump() in PHP
    if [ "$ext" = "php" ]; then
        if grep -qE '\b(dd|dump|var_dump)\s*\(' "$file" 2>/dev/null; then
            inc_err "$relative_file: debug fuggveny (dd/dump/var_dump)"
        fi
    fi

    # Missing ekezet in Hungarian strings
    if [ "$ext" = "ts" ] || [ "$ext" = "html" ] || [ "$ext" = "php" ]; then
        if grep -qiE "[\'\"][^\'\"]*\b(feltoltes|letoltes|modositas|beallitas|torles|kereses|valasztas|ertesites)\b" "$file" 2>/dev/null; then
            inc_warn "$relative_file: lehetseges hianyzo ekezet magyar szovegben"
        fi
    fi
}

printf "${BOLD}PhotoStack SaaS - Auto Review${NC}\n"
printf "Utolso %s percben modositott fajlok vizsgalata...\n\n" "$MINUTES_AGO"

# Find recently modified files in both repos
MODIFIED_FILES=""

for subdir in frontend backend; do
    dir="$ROOT_DIR/$subdir"
    if [ -d "$dir" ]; then
        files=$(find "$dir" -type f -mmin -"$MINUTES_AGO" \
            -not -path '*/node_modules/*' \
            -not -path '*/vendor/*' \
            -not -path '*/.git/*' \
            -not -path '*/dist/*' \
            -not -path '*/storage/*' \
            -not -name '*.map' \
            -not -name '*.lock' \
            2>/dev/null || true)
        if [ -n "$files" ]; then
            MODIFIED_FILES="${MODIFIED_FILES}
${files}"
        fi
    fi
done

MODIFIED_FILES=$(echo "$MODIFIED_FILES" | sed '/^$/d')

if [ -z "$MODIFIED_FILES" ]; then
    printf "${GREEN}Nincs modositott fajl az utolso %s percben.${NC}\n" "$MINUTES_AGO"
    exit 0
fi

FILE_COUNT=$(echo "$MODIFIED_FILES" | wc -l | tr -d ' ')
printf "Talalt fajlok: %s\n---\n" "$FILE_COUNT"

while IFS= read -r file; do
    if [ -n "$file" ] && [ -f "$file" ]; then
        relative_file="${file#$ROOT_DIR/}"
        check_file "$file" "$relative_file"
    fi
done <<< "$MODIFIED_FILES"

WARNINGS=$(cat "$TMPDIR_REVIEW/warnings")
ERRORS=$(cat "$TMPDIR_REVIEW/errors")

printf "\n---\n"
printf "${BOLD}Osszesites:${NC} %s warning, %s error\n" "$WARNINGS" "$ERRORS"

if [ "$ERRORS" -gt 0 ]; then
    printf "${RED}Hibak talalhatoak! Javitsd ki mielott commitolsz.${NC}\n"
    exit 1
fi

if [ "$WARNINGS" -gt 0 ]; then
    printf "${YELLOW}Figyelmeztetesek talalhatoak.${NC}\n"
    exit 0
fi

printf "${GREEN}Minden rendben!${NC}\n"
exit 0
