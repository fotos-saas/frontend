#!/usr/bin/env python3
"""Auto Portrait Crop CLI - Electron sidecar script.

MediaPipe Face Mesh (468 landmark) alapú arcdetektálás.
NEM ír képet — csak JSON-t ad vissza (landmarks + quality scores).
A vágást a Node.js Sharp végzi.

Usage:
  python3 auto_crop.py --check                    # MediaPipe elérhető-e
  python3 auto_crop.py --input photo.jpg           # 1 kép detektálás
  python3 auto_crop.py --batch-json /tmp/batch.json # Batch detektálás
"""

import argparse
import json
import logging
import os
import sys
import time
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

# Képméretkorlát: max 50 megapixel (védelem image bomb ellen)
Image.MAX_IMAGE_PIXELS = 50_000_000

MAX_BATCH_SIZE = 500

# Downscale target a gyorsaság érdekében
DETECTION_MAX_SIZE = 1024

# Kulcs landmark indexek (MediaPipe Face Mesh 468 pont)
LM_FOREHEAD = 10
LM_CHIN = 152
LM_LEFT_EAR = 234
LM_RIGHT_EAR = 454

# Szem landmark-ok az EAR (Eye Aspect Ratio) számításhoz
LEFT_EYE_TOP = 159
LEFT_EYE_BOTTOM = 145
LEFT_EYE_LEFT = 33
LEFT_EYE_RIGHT = 133
RIGHT_EYE_TOP = 386
RIGHT_EYE_BOTTOM = 374
RIGHT_EYE_LEFT = 362
RIGHT_EYE_RIGHT = 263

# Engedélyezett útvonal prefixek (defense-in-depth)
_ALLOWED_PREFIXES = [
    os.path.realpath(os.path.expanduser("~")),
    os.path.realpath(os.environ.get("TMPDIR", "/tmp")),
]


def _is_allowed_path(filepath: str) -> bool:
    """Ellenőrzi, hogy az útvonal az engedélyezett könyvtárakon belül van-e."""
    try:
        real = os.path.realpath(filepath)
        return any(real.startswith(prefix + os.sep) for prefix in _ALLOWED_PREFIXES)
    except (ValueError, OSError):
        return False


logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)


def check_available() -> bool:
    """Ellenőrzi, hogy a MediaPipe Face Mesh elérhető-e."""
    try:
        import mediapipe as mp
        _ = mp.solutions.face_mesh.FaceMesh
        return True
    except Exception:
        return False


def compute_ear(landmarks, img_w, img_h, eye_top, eye_bottom, eye_left, eye_right):
    """Eye Aspect Ratio (EAR) számítás — csukott szem detektálás."""
    top = np.array([landmarks[eye_top].x * img_w, landmarks[eye_top].y * img_h])
    bottom = np.array([landmarks[eye_bottom].x * img_w, landmarks[eye_bottom].y * img_h])
    left = np.array([landmarks[eye_left].x * img_w, landmarks[eye_left].y * img_h])
    right = np.array([landmarks[eye_right].x * img_w, landmarks[eye_right].y * img_h])

    vertical = np.linalg.norm(top - bottom)
    horizontal = np.linalg.norm(left - right)
    if horizontal < 1e-6:
        return 0.0
    return float(vertical / horizontal)


def detect_faces(input_path: str) -> dict:
    """Egy kép arcdetektálása MediaPipe Face Mesh-sel."""
    import mediapipe as mp

    start_time = time.time()

    if not _is_allowed_path(input_path):
        return {"success": False, "input": input_path, "error": "Nem engedélyezett útvonal", "processing_time": 0}

    input_path = Path(input_path)
    if not input_path.exists():
        return {"success": False, "input": str(input_path), "error": "Fájl nem található", "processing_time": 0}

    try:
        # Kép betöltés és méret megállapítás
        pil_img = Image.open(input_path)
        original_width, original_height = pil_img.size

        # Downscale detektáláshoz
        scale = 1.0
        if max(original_width, original_height) > DETECTION_MAX_SIZE:
            scale = DETECTION_MAX_SIZE / max(original_width, original_height)

        # OpenCV-vel dolgozunk (MediaPipe RGB-t vár)
        img_bgr = cv2.imread(str(input_path))
        if img_bgr is None:
            return {"success": False, "input": str(input_path), "error": "Kép betöltés sikertelen", "processing_time": 0}

        if scale < 1.0:
            new_w = int(img_bgr.shape[1] * scale)
            new_h = int(img_bgr.shape[0] * scale)
            img_bgr = cv2.resize(img_bgr, (new_w, new_h), interpolation=cv2.INTER_AREA)

        img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
        det_h, det_w = img_rgb.shape[:2]

        # Quality scores: blur + exposure (a detektáláshoz használt képen)
        gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
        laplacian_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())
        exposure_mean = float(np.mean(gray))

        # MediaPipe Face Mesh
        with mp.solutions.face_mesh.FaceMesh(
            static_image_mode=True,
            max_num_faces=5,
            refine_landmarks=True,
            min_detection_confidence=0.5,
        ) as face_mesh:
            results = face_mesh.process(img_rgb)

        if not results.multi_face_landmarks:
            elapsed = time.time() - start_time
            return {
                "success": True,
                "input": str(input_path),
                "original_width": original_width,
                "original_height": original_height,
                "faces": [],
                "face_count": 0,
                "quality": {
                    "blur_score": round(laplacian_var, 2),
                    "exposure_mean": round(exposure_mean, 2),
                    "is_blurry": laplacian_var < 50,
                    "is_dark": exposure_mean < 40,
                    "is_overexposed": exposure_mean > 220,
                },
                "processing_time": round(elapsed, 3),
            }

        faces = []
        for face_landmarks in results.multi_face_landmarks:
            lm = face_landmarks.landmark

            # Kulcs pontok (eredeti képméretben)
            forehead = {
                "x": round(lm[LM_FOREHEAD].x * original_width, 1),
                "y": round(lm[LM_FOREHEAD].y * original_height, 1),
            }
            chin = {
                "x": round(lm[LM_CHIN].x * original_width, 1),
                "y": round(lm[LM_CHIN].y * original_height, 1),
            }
            left_ear = {
                "x": round(lm[LM_LEFT_EAR].x * original_width, 1),
                "y": round(lm[LM_LEFT_EAR].y * original_height, 1),
            }
            right_ear = {
                "x": round(lm[LM_RIGHT_EAR].x * original_width, 1),
                "y": round(lm[LM_RIGHT_EAR].y * original_height, 1),
            }

            # Arc méret (eredeti képméretben)
            face_height = abs(chin["y"] - forehead["y"])
            face_width = abs(right_ear["x"] - left_ear["x"])

            # Arc közép
            face_center_x = round((left_ear["x"] + right_ear["x"]) / 2, 1)
            face_center_y = round((forehead["y"] + chin["y"]) / 2, 1)

            # Bounding box (összes landmark alapján)
            xs = [l.x * original_width for l in lm]
            ys = [l.y * original_height for l in lm]
            bbox = {
                "x": round(min(xs), 1),
                "y": round(min(ys), 1),
                "width": round(max(xs) - min(xs), 1),
                "height": round(max(ys) - min(ys), 1),
            }

            # EAR (Eye Aspect Ratio) — csukott szem detektálás
            left_ear_val = compute_ear(lm, det_w, det_h, LEFT_EYE_TOP, LEFT_EYE_BOTTOM, LEFT_EYE_LEFT, LEFT_EYE_RIGHT)
            right_ear_val = compute_ear(lm, det_w, det_h, RIGHT_EYE_TOP, RIGHT_EYE_BOTTOM, RIGHT_EYE_LEFT, RIGHT_EYE_RIGHT)
            avg_ear = (left_ear_val + right_ear_val) / 2

            # Arc terület aránya a képhez
            face_area_ratio = (face_width * face_height) / (original_width * original_height)

            faces.append({
                "forehead": forehead,
                "chin": chin,
                "left_ear": left_ear,
                "right_ear": right_ear,
                "face_center": {"x": face_center_x, "y": face_center_y},
                "face_width": round(face_width, 1),
                "face_height": round(face_height, 1),
                "face_area_ratio": round(face_area_ratio, 4),
                "bbox": bbox,
                "ear": round(avg_ear, 3),
                "eyes_closed": avg_ear < 0.18,
            })

        # Rendezés: legnagyobb arc (face_area_ratio) elöl
        faces.sort(key=lambda f: f["face_area_ratio"], reverse=True)

        elapsed = time.time() - start_time
        return {
            "success": True,
            "input": str(input_path),
            "original_width": original_width,
            "original_height": original_height,
            "faces": faces,
            "face_count": len(faces),
            "quality": {
                "blur_score": round(laplacian_var, 2),
                "exposure_mean": round(exposure_mean, 2),
                "is_blurry": laplacian_var < 50,
                "is_dark": exposure_mean < 40,
                "is_overexposed": exposure_mean > 220,
            },
            "processing_time": round(elapsed, 3),
        }

    except Exception as e:
        return {
            "success": False,
            "input": str(input_path),
            "error": str(e),
            "processing_time": round(time.time() - start_time, 3),
        }


def main():
    parser = argparse.ArgumentParser(description="Auto Portrait Crop - Face Detection")
    parser.add_argument("--check", action="store_true", help="MediaPipe elérhetőség ellenőrzés")
    parser.add_argument("--input", help="Bemeneti kép útvonala")
    parser.add_argument("--batch-json", help="Batch JSON fájl útvonala (tömb [{input: ...}])")

    args = parser.parse_args()

    if args.check:
        available = check_available()
        print(json.dumps({"available": available}))
        sys.exit(0 if available else 1)

    # Batch mód
    if args.batch_json:
        batch_path = Path(args.batch_json)
        if not batch_path.exists():
            print(json.dumps({"success": False, "error": "Batch JSON nem található"}))
            sys.exit(1)
        items = json.loads(batch_path.read_text("utf-8"))
        if len(items) > MAX_BATCH_SIZE:
            print(json.dumps({"success": False, "error": f"Túl sok elem (max {MAX_BATCH_SIZE})"}))
            sys.exit(1)

        results = []
        for item in items:
            input_path = item.get("input") or item
            result = detect_faces(str(input_path))
            results.append(result)
            # Progress flush per item
            print(json.dumps({"progress": len(results), "total": len(items), "current": result}), flush=True)

        successful = sum(1 for r in results if r.get("success") and r.get("face_count", 0) > 0)
        print(json.dumps({"success": True, "results": results, "total": len(results), "successful": successful}))
        sys.exit(0)

    # Egyedi mód
    if not args.input:
        parser.error("--input szükséges (vagy --check / --batch-json)")

    result = detect_faces(args.input)
    print(json.dumps(result))
    sys.exit(0 if result.get("success") else 1)


if __name__ == "__main__":
    main()
