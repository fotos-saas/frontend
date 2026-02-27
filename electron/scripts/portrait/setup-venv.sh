#!/usr/bin/env bash
set -euo pipefail

# Portrait Python venv auto-setup
# Idempotens: ha a venv mar letezik es mukodik, gyors skip

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PYTHON_DIR="$SCRIPT_DIR/python"
VENV_DIR="$PYTHON_DIR/.venv"
REQUIREMENTS="$PYTHON_DIR/requirements.txt"

# Szinek (ha terminal tamogatja)
if [ -t 1 ]; then
  GREEN='\033[0;32m'
  YELLOW='\033[1;33m'
  RED='\033[0;31m'
  NC='\033[0m'
else
  GREEN='' YELLOW='' RED='' NC=''
fi

log_info()  { echo -e "${GREEN}[portrait-venv]${NC} $1"; }
log_warn()  { echo -e "${YELLOW}[portrait-venv]${NC} $1"; }
log_error() { echo -e "${RED}[portrait-venv]${NC} $1"; }

# 1. python3 letezik?
if ! command -v python3 &>/dev/null; then
  log_error "python3 nem talalhato a PATH-ban!"
  exit 1
fi

# 2. requirements.txt letezik?
if [ ! -f "$REQUIREMENTS" ]; then
  log_error "requirements.txt nem talalhato: $REQUIREMENTS"
  exit 1
fi

# 3. Ha a venv mar letezik es a csomagok rendben vannak -> skip
if [ -f "$VENV_DIR/bin/python3" ] || [ -f "$VENV_DIR/Scripts/python.exe" ]; then
  # Proba import a kulcsfontossagu csomagokkal
  VENV_PYTHON="$VENV_DIR/bin/python3"
  [ -f "$VENV_DIR/Scripts/python.exe" ] && VENV_PYTHON="$VENV_DIR/Scripts/python.exe"

  if "$VENV_PYTHON" -c "import cv2; import numpy; from PIL import Image; from transparent_background import Remover" 2>/dev/null; then
    log_info "Venv rendben, minden csomag elerheto. Skip."
    exit 0
  else
    log_warn "Venv letezik de csomagok hianyoznak, ujratelepites..."
  fi
fi

# 4. Venv letrehozas (ha meg nincs)
if [ ! -d "$VENV_DIR" ]; then
  log_info "Venv letrehozasa: $VENV_DIR"
  python3 -m venv "$VENV_DIR"
fi

# 5. pip install
VENV_PYTHON="$VENV_DIR/bin/python3"
[ -f "$VENV_DIR/Scripts/python.exe" ] && VENV_PYTHON="$VENV_DIR/Scripts/python.exe"

VENV_PIP="$VENV_DIR/bin/pip"
[ -f "$VENV_DIR/Scripts/pip.exe" ] && VENV_PIP="$VENV_DIR/Scripts/pip.exe"

log_info "pip upgrade..."
"$VENV_PYTHON" -m pip install --upgrade pip --quiet

log_info "Csomagok telepitese requirements.txt-bol..."
"$VENV_PIP" install -r "$REQUIREMENTS" --quiet

# 6. Vegso ellenorzes
if "$VENV_PYTHON" -c "import cv2; import numpy; from PIL import Image; from transparent_background import Remover" 2>/dev/null; then
  log_info "Sikeres! Minden csomag elerheto."
else
  log_error "Telepites utan is hianyoznak csomagok!"
  exit 1
fi
