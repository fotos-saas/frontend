#!/bin/bash
# PhotoStack SaaS - Pre-Commit Check Script
# Checks staged files in frontend/ and backend/ git repos for issues.
# Returns exit code 1 if blocking issues found.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../../../.." && pwd)"
ROOT_DIR="${PHOTOSTACK_ROOT:-$ROOT_DIR}"

RED='\033[0;31m'
YELLOW='\033[0;33m'
GREEN='\033[0;32m'
BOLD='\033[1m'
NC='\033[0m'

# Use temp files for counters (subshell-safe)
TMPDIR_CHECK=$(mktemp -d)
echo "0" > "$TMPDIR_CHECK/warnings"
echo "0" > "$TMPDIR_CHECK/errors"
echo "0" > "$TMPDIR_CHECK/blocked"
trap 'rm -rf "$TMPDIR_CHECK"' EXIT

inc_warn() {
    local c; c=$(cat "$TMPDIR_CHECK/warnings"); echo $((c + 1)) > "$TMPDIR_CHECK/warnings"
    printf "  ${YELLOW}WARNING:${NC} %s\n" "$1"
}

inc_err() {
    local c; c=$(cat "$TMPDIR_CHECK/errors"); echo $((c + 1)) > "$TMPDIR_CHECK/errors"
    printf "  ${RED}ERROR:${NC} %s\n" "$1"
}

inc_block() {
    local c; c=$(cat "$TMPDIR_CHECK/blocked"); echo $((c + 1)) > "$TMPDIR_CHECK/blocked"
    printf "  ${RED}BLOCKED:${NC} %s\n" "$1"
}

check_repo() {
    local repo_dir="$1"
    local repo_name="$2"

    if [ ! -d "$repo_dir/.git" ]; then
        printf "  %s: nem git repo, kihagyva.\n" "$repo_name"
        return
    fi

    cd "$repo_dir"

    # Get all staged files for forbidden file check
    local all_staged
    all_staged=$(git diff --cached --name-only 2>/dev/null || true)

    if [ -z "$all_staged" ]; then
        printf "  %s: nincs staged fajl.\n" "$repo_name"
        return
    fi

    # Check for forbidden files
    while IFS= read -r file; do
        case "$file" in
            src/environments/environment.ts|src/environments/environment.local.ts|src/environments/environment.production.ts)
                inc_block "$repo_name/$file: environment fajl NEM commitolhato!"
                ;;
            proxy.conf.json)
                inc_block "$repo_name/$file: proxy.conf.json NEM commitolhato!"
                ;;
            .env|.env.*)
                inc_block "$repo_name/$file: .env fajl NEM commitolhato!"
                ;;
        esac
    done <<< "$all_staged"

    # Get staged files (added/modified only) for content checks
    local staged_files
    staged_files=$(git diff --cached --name-only --diff-filter=ACM 2>/dev/null || true)

    if [ -z "$staged_files" ]; then
        return
    fi

    local file_count
    file_count=$(echo "$staged_files" | wc -l | tr -d ' ')
    printf "  %s: %s staged fajl\n" "$repo_name" "$file_count"

    # Check each staged file
    while IFS= read -r file; do
        local full_path="$repo_dir/$file"
        local display_name="$repo_name/$file"
        local bname
        bname=$(basename "$file")
        local ext="${bname##*.}"

        case "$ext" in
            ts|php|html|scss|css|js) ;;
            *) continue ;;
        esac

        if [ ! -f "$full_path" ]; then
            continue
        fi

        # Line count (STRICT)
        local line_count
        line_count=$(wc -l < "$full_path" 2>/dev/null || echo "0")
        line_count=$(echo "$line_count" | tr -d ' ')

        case "$bname" in
            *.data.ts|*.routes.ts|*.models.ts)
                if [ "$line_count" -gt 800 ]; then
                    inc_block "$display_name: $line_count sor (limit: 800 adat fajlnal)"
                fi
                ;;
            *)
                if [ "$line_count" -gt 500 ]; then
                    inc_block "$display_name: $line_count sor (limit: 500) -- bontsd szet!"
                elif [ "$line_count" -gt 400 ]; then
                    inc_warn "$display_name: $line_count sor (kozel a 500-as limithez)"
                fi
                ;;
        esac

        # Use staged content for pattern checks
        local staged_content
        staged_content=$(git show ":$file" 2>/dev/null || true)

        if [ -z "$staged_content" ]; then
            continue
        fi

        # console.log - skip test/spec files
        case "$bname" in
            *.spec.ts|*.test.ts|*.test.js) ;;
            *)
                local cl_count
                cl_count=$(printf '%s' "$staged_content" | grep -c 'console\.log' 2>/dev/null || echo "0")
                if [ "$cl_count" -gt 0 ]; then
                    inc_err "$display_name: console.log talalat ($cl_count db)"
                fi
                ;;
        esac

        # shell_exec (PHP)
        if [ "$ext" = "php" ]; then
            if printf '%s' "$staged_content" | grep -q 'shell_exec'; then
                inc_block "$display_name: shell_exec() hasznalat (Symfony Process kell!)"
            fi
        fi

        # localStorage for tokens
        if [ "$ext" = "ts" ] || [ "$ext" = "js" ]; then
            if printf '%s' "$staged_content" | grep -qE 'localStorage\.(set|get)Item.*token'; then
                inc_block "$display_name: localStorage token tarolas (sessionStorage kell!)"
            fi
        fi

        # dd() / dump() / var_dump() in PHP
        if [ "$ext" = "php" ]; then
            if printf '%s' "$staged_content" | grep -qE '\b(dd|dump|var_dump)\s*\('; then
                inc_block "$display_name: debug fuggveny (dd/dump/var_dump)"
            fi
        fi

        # Missing ekezet patterns
        if [ "$ext" = "ts" ] || [ "$ext" = "html" ] || [ "$ext" = "php" ]; then
            if printf '%s' "$staged_content" | grep -qiE "[\'\"][^\'\"]*\b(feltoltes|letoltes|modositas|beallitas|torles|kereses|valasztas|ertesites)\b"; then
                inc_warn "$display_name: lehetseges hianyzo ekezet magyar szovegben"
            fi
        fi
    done <<< "$staged_files"
}

printf "${BOLD}PhotoStack SaaS - Pre-Commit Check${NC}\n\n"

for subdir in frontend backend; do
    printf "${BOLD}[%s]${NC}\n" "$subdir"
    check_repo "$ROOT_DIR/$subdir" "$subdir"
    printf "\n"
done

BLOCKED=$(cat "$TMPDIR_CHECK/blocked")
ERRORS=$(cat "$TMPDIR_CHECK/errors")
WARNINGS=$(cat "$TMPDIR_CHECK/warnings")

printf -- "---\n"
printf "${BOLD}Osszesites:${NC} %s blocked, %s error, %s warning\n" "$BLOCKED" "$ERRORS" "$WARNINGS"

if [ "$BLOCKED" -gt 0 ]; then
    printf "${RED}COMMIT BLOKKOLT! Javitsd ki a BLOCKED hibakat.${NC}\n"
    exit 1
fi

if [ "$ERRORS" -gt 0 ]; then
    printf "${RED}Hibak talalhatoak! Javitsd ki mielott commitolsz.${NC}\n"
    exit 1
fi

if [ "$WARNINGS" -gt 0 ]; then
    printf "${YELLOW}Figyelmeztetesek talalhatoak, de commitolhato.${NC}\n"
    exit 0
fi

printf "${GREEN}Minden rendben! Commitolhatsz.${NC}\n"
exit 0
