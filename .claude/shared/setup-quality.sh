#!/bin/bash
# PhotoStack SaaS — Quality Infrastructure Setup
# Futtasd egy új gépen: cd frontend && bash .claude/shared/setup-quality.sh
# Vagy a rootból: bash frontend/.claude/shared/setup-quality.sh

RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${CYAN}╔═══════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  PhotoStack Quality Infrastructure Setup  ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════╝${NC}"
echo ""

# Root dir meghatározás
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# shared/ → .claude/ → frontend/ → photostack-saas/ = 3 szint feljebb
ROOT_DIR="$(cd "$SCRIPT_DIR/../../.." && pwd)"

FRONTEND_DIR="$ROOT_DIR/frontend"
BACKEND_DIR="$ROOT_DIR/backend"
SHARED_DIR="$FRONTEND_DIR/.claude/shared"

echo "Projekt root: $ROOT_DIR"
echo ""

# 1. Git hooks beállítás
echo -e "${CYAN}1/4 Git hooks beállítás...${NC}"

if [ -d "$FRONTEND_DIR/.git" ]; then
    cd "$FRONTEND_DIR"
    git config core.hooksPath .githooks
    echo -e "${GREEN}  ✓ Frontend: .githooks aktív${NC}"
else
    echo -e "${RED}  ✗ Frontend: .git nem található${NC}"
fi

if [ -d "$BACKEND_DIR/.git" ]; then
    cd "$BACKEND_DIR"
    git config core.hooksPath .githooks
    echo -e "${GREEN}  ✓ Backend: .githooks aktív${NC}"
else
    echo -e "${RED}  ✗ Backend: .git nem található${NC}"
fi

# 2. Root .claude/ másolás (symlink nem működik Claude Code-ban)
echo ""
echo -e "${CYAN}2/4 Root .claude/ beállítás...${NC}"

mkdir -p "$ROOT_DIR/.claude/scripts"
mkdir -p "$ROOT_DIR/.claude/commands"

# Scripts másolás
for script in auto-review.sh pre-commit-check.sh; do
    SRC="$SHARED_DIR/scripts/$script"
    DST="$ROOT_DIR/.claude/scripts/$script"
    if [ -f "$SRC" ]; then
        cp "$SRC" "$DST"
        chmod +x "$DST"
        echo -e "${GREEN}  ✓ .claude/scripts/$script → másolva${NC}"
    fi
done

# Commands másolás (Claude Code /parancsok)
for cmd in maintenance.md ci-fix.md; do
    SRC="$SHARED_DIR/commands/$cmd"
    DST="$ROOT_DIR/.claude/commands/$cmd"
    if [ -f "$SRC" ]; then
        cp "$SRC" "$DST"
        echo -e "${GREEN}  ✓ .claude/commands/$cmd → másolva${NC}"
    fi
done

# 3. Claude Code settings.local.json (hook konfig)
echo ""
echo -e "${CYAN}3/4 Claude Code hook konfig...${NC}"

SETTINGS_FILE="$ROOT_DIR/.claude/settings.local.json"
REVIEW_SCRIPT="$ROOT_DIR/.claude/scripts/auto-review.sh"

# Ha nincs még settings.local.json VAGY nincs benne hooks szekció
if [ ! -f "$SETTINGS_FILE" ] || ! grep -q '"hooks"' "$SETTINGS_FILE" 2>/dev/null; then
    # Ha létezik, mentjük a régit
    if [ -f "$SETTINGS_FILE" ]; then
        cp "$SETTINGS_FILE" "${SETTINGS_FILE}.bak"
        echo -e "${YELLOW}  ⚠ Régi settings mentve: settings.local.json.bak${NC}"
    fi

    cat > "$SETTINGS_FILE" << SETTINGSEOF
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "bash $REVIEW_SCRIPT",
            "timeout": 30,
            "statusMessage": "Auto-review futtatása..."
          }
        ]
      }
    ]
  }
}
SETTINGSEOF
    echo -e "${GREEN}  ✓ settings.local.json létrehozva hook konfiggal${NC}"
else
    echo -e "${GREEN}  ✓ settings.local.json már tartalmaz hooks szekciót${NC}"
fi

# 4. Jogosultságok
echo ""
echo -e "${CYAN}4/4 Jogosultságok...${NC}"

chmod +x "$SHARED_DIR/scripts/"*.sh 2>/dev/null
chmod +x "$FRONTEND_DIR/.githooks/"* 2>/dev/null
chmod +x "$BACKEND_DIR/.githooks/"* 2>/dev/null
echo -e "${GREEN}  ✓ Scriptek futtathatók${NC}"

# Összefoglaló
echo ""
echo -e "${CYAN}════════════════════════════════════════════${NC}"
echo -e "${GREEN}Kész!${NC} Aktív védőháló:"
echo ""
echo "  Pre-commit:   okos fájlméret + security + lint"
echo "  Post-commit:  túlméretes fájl refaktor emlékeztető"
echo "  Auto-review:  minden Claude Code szerkesztés után"
echo "  /maintenance: heti kód-audit (5 párhuzamos agent)"
echo ""
echo -e "${CYAN}Másik gépen: git pull mindkét repóban, majd:${NC}"
echo "  bash frontend/.claude/shared/setup-quality.sh"
echo ""
