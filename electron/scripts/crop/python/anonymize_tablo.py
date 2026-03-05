#!/usr/bin/env python3
"""Tabló Referencia Anonimizáló — arcdetektálás + anonimizálás tablóképeken.

Haar Cascade + MediaPipe Face Detection kombinált multi-pass detektálás:
- 5 preprocessing (gray, equalized, CLAHE, gamma bright/dark)
- 3 Haar cascade (frontal default, alt2, alt_tree) + profile + flipped profile
- 2x upscale pass
- MediaPipe tiled detection (original + 2x)
- NMS összevonás

Anonimizálási módok: blur (pixelizáció+blur) vagy rect (szürke téglalap).

Usage:
  python3 anonymize_tablo.py --check
  python3 anonymize_tablo.py --input photo.jpg [--mode blur|rect]
  python3 anonymize_tablo.py --process photo.jpg [--mode blur|rect] [--quality 95]
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

MAX_BATCH_SIZE = 200

_ALLOWED_PREFIXES = [
    os.path.realpath(os.path.expanduser("~")),
    os.path.realpath(os.environ.get("TMPDIR", "/tmp")),
]

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)


def _is_allowed_path(filepath: str) -> bool:
    try:
        real = os.path.realpath(filepath)
        return any(real.startswith(prefix + os.sep) for prefix in _ALLOWED_PREFIXES)
    except (ValueError, OSError):
        return False


def check_available() -> bool:
    try:
        import cv2 as _cv2
        import numpy as _np
        return True
    except Exception:
        return False


def _adjust_gamma(image, gamma):
    table = np.array([((i / 255.0) ** (1.0 / gamma)) * 255
                       for i in range(256)]).astype("uint8")
    return cv2.LUT(image, table)


def _nms(boxes, overlap_thresh=0.3):
    """Non-Maximum Suppression."""
    if len(boxes) == 0:
        return []
    b = np.array(boxes, dtype=float)
    x1, y1 = b[:, 0], b[:, 1]
    x2, y2 = b[:, 0] + b[:, 2], b[:, 1] + b[:, 3]
    areas = b[:, 2] * b[:, 3]
    idxs = np.argsort(areas)[::-1]
    picked = []
    while len(idxs) > 0:
        i = idxs[0]
        picked.append(i)
        xx1 = np.maximum(x1[i], x1[idxs[1:]])
        yy1 = np.maximum(y1[i], y1[idxs[1:]])
        xx2 = np.minimum(x2[i], x2[idxs[1:]])
        yy2 = np.minimum(y2[i], y2[idxs[1:]])
        inter = np.maximum(0, xx2 - xx1) * np.maximum(0, yy2 - yy1)
        overlap = inter / np.minimum(areas[i], areas[idxs[1:]])
        rm = np.where(overlap > overlap_thresh)[0]
        idxs = np.delete(idxs, np.concatenate(([0], rm + 1)))
    return [boxes[i] for i in picked]


def _haar_detect(gray, cascades, scale_factors, min_neighbors_list,
                 min_size, max_area):
    """Haar cascade detection with multiple parameters."""
    all_faces = []
    for cascade in cascades:
        for sf in scale_factors:
            for mn in min_neighbors_list:
                faces = cascade.detectMultiScale(
                    gray, scaleFactor=sf, minNeighbors=mn,
                    minSize=min_size, flags=cv2.CASCADE_SCALE_IMAGE)
                if len(faces) > 0:
                    for (x, y, w, h) in faces:
                        if w * h < max_area:
                            all_faces.append((x, y, w, h))
    return all_faces


def _mp_tiled_detect(img_rgb, tile_sizes, confidence, max_area):
    """MediaPipe tiled face detection."""
    try:
        import mediapipe as mp
        model_path = os.path.join(
            os.path.dirname(os.path.abspath(__file__)),
            'blaze_face_short_range.tflite')
        if not os.path.exists(model_path):
            return []

        opts = mp.tasks.vision.FaceDetectorOptions(
            base_options=mp.tasks.BaseOptions(model_asset_path=model_path),
            min_detection_confidence=confidence)

        h, w = img_rgb.shape[:2]
        all_faces = []

        with mp.tasks.vision.FaceDetector.create_from_options(opts) as det:
            for ts in tile_sizes:
                step = int(ts * 0.6)
                for ty in range(0, h - ts // 4, step):
                    for tx in range(0, w - ts // 4, step):
                        tile = img_rgb[ty:min(ty + ts, h), tx:min(tx + ts, w)]
                        r = det.detect(mp.Image(
                            image_format=mp.ImageFormat.SRGB,
                            data=tile.copy()))
                        for d in r.detections:
                            bb = d.bounding_box
                            fx = int(tx + bb.origin_x)
                            fy = int(ty + bb.origin_y)
                            fw, fh = int(bb.width), int(bb.height)
                            if fw * fh < max_area and fw > 15 and fh > 15:
                                all_faces.append((fx, fy, fw, fh))
        return all_faces
    except Exception:
        return []


def detect_faces(input_path: str) -> dict:
    """Multi-pass face detection on a tablo image."""
    start_time = time.time()

    if not _is_allowed_path(input_path):
        return {"success": False, "error": "Nem engedélyezett útvonal"}

    input_path = str(Path(input_path).resolve())
    if not os.path.exists(input_path):
        return {"success": False, "error": "Fájl nem található"}

    try:
        img = cv2.imread(input_path)
        if img is None:
            return {"success": False, "error": "Kép betöltés sikertelen"}

        h, w = img.shape[:2]
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

        # Load Haar cascades
        cdir = cv2.data.haarcascades
        frontal_names = [
            'haarcascade_frontalface_default.xml',
            'haarcascade_frontalface_alt2.xml',
            'haarcascade_frontalface_alt_tree.xml',
        ]
        frontal = [cv2.CascadeClassifier(os.path.join(cdir, n))
                    for n in frontal_names]
        frontal = [c for c in frontal if not c.empty()]
        profile = cv2.CascadeClassifier(
            os.path.join(cdir, 'haarcascade_profileface.xml'))

        all_faces = []
        min_face = max(20, min(h, w) // 60)
        max_area = h * w * 0.12

        # === PASS 1: Original resolution, multiple preprocessings ===
        preps = [
            gray,
            cv2.equalizeHist(gray),
            cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8)).apply(gray),
            cv2.cvtColor(_adjust_gamma(img, 1.5), cv2.COLOR_BGR2GRAY),
            cv2.cvtColor(_adjust_gamma(img, 0.7), cv2.COLOR_BGR2GRAY),
        ]

        for pg in preps:
            # Frontal cascades
            all_faces.extend(_haar_detect(
                pg, frontal, [1.05, 1.08, 1.12, 1.15], [3, 4],
                (min_face, min_face), max_area))

            # Profile cascade + flipped
            if not profile.empty():
                for sf in [1.05, 1.1, 1.15]:
                    for mn in [2, 3]:
                        pf = profile.detectMultiScale(
                            pg, sf, mn, minSize=(min_face, min_face),
                            flags=cv2.CASCADE_SCALE_IMAGE)
                        for (x, y, fw, fh) in (pf if len(pf) > 0 else []):
                            if fw * fh < max_area:
                                all_faces.append((x, y, fw, fh))

                        flipped = cv2.flip(pg, 1)
                        pf2 = profile.detectMultiScale(
                            flipped, sf, mn, minSize=(min_face, min_face),
                            flags=cv2.CASCADE_SCALE_IMAGE)
                        for (x, y, fw, fh) in (pf2 if len(pf2) > 0 else []):
                            if fw * fh < max_area:
                                all_faces.append((w - x - fw, y, fw, fh))

        # === PASS 2: 2x upscale ===
        s2 = 2
        img2 = cv2.resize(img, (w * s2, h * s2),
                          interpolation=cv2.INTER_CUBIC)
        g2 = cv2.cvtColor(img2, cv2.COLOR_BGR2GRAY)
        min_face2 = max(30, min(h, w) // 30)
        max_area2 = (h * s2) * (w * s2) * 0.12

        preps2 = [
            g2, cv2.equalizeHist(g2),
            cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8)).apply(g2),
        ]

        for pg in preps2:
            faces = _haar_detect(
                pg, frontal, [1.05, 1.1, 1.15], [4],
                (min_face2, min_face2), max_area2)
            for (x, y, fw, fh) in faces:
                all_faces.append((x // s2, y // s2, fw // s2, fh // s2))

            if not profile.empty():
                for sf in [1.05, 1.1]:
                    pf = profile.detectMultiScale(
                        pg, sf, 2, minSize=(min_face2, min_face2),
                        flags=cv2.CASCADE_SCALE_IMAGE)
                    for (x, y, fw, fh) in (pf if len(pf) > 0 else []):
                        if fw * fh < max_area2:
                            all_faces.append(
                                (x // s2, y // s2, fw // s2, fh // s2))

                    flipped2 = cv2.flip(pg, 1)
                    pf2 = profile.detectMultiScale(
                        flipped2, sf, 2, minSize=(min_face2, min_face2),
                        flags=cv2.CASCADE_SCALE_IMAGE)
                    for (x, y, fw, fh) in (pf2 if len(pf2) > 0 else []):
                        if fw * fh < max_area2:
                            all_faces.append(
                                ((w * s2 - x - fw) // s2, y // s2,
                                 fw // s2, fh // s2))

        # === PASS 3: MediaPipe tiled on original ===
        mp_faces = _mp_tiled_detect(rgb, [200, 300, 500], 0.4, max_area)
        all_faces.extend(mp_faces)

        # === PASS 4: MediaPipe tiled on 2x upscale ===
        rgb2 = cv2.cvtColor(img2, cv2.COLOR_BGR2RGB)
        mp_faces2 = _mp_tiled_detect(rgb2, [300, 500], 0.45, max_area2)
        for (x, y, fw, fh) in mp_faces2:
            all_faces.append((x // s2, y // s2, fw // s2, fh // s2))

        # Filter: min size + max area
        min_sz = max(15, min(h, w) // 80)
        all_faces = [(x, y, fw, fh) for (x, y, fw, fh) in all_faces
                     if fw >= min_sz and fh >= min_sz and fw * fh < max_area]

        # NMS
        final_faces = _nms(all_faces, 0.3)

        # Add padding: 15% sides, 10% top, 15% bottom
        result_faces = []
        for (x, y, fw, fh) in final_faces:
            px = int(fw * 0.15)
            pt = int(fh * 0.10)
            pb = int(fh * 0.15)
            nx = int(max(0, x - px))
            ny = int(max(0, y - pt))
            nw = int(min(w - nx, fw + 2 * px))
            nh = int(min(h - ny, fh + pt + pb))
            result_faces.append({
                "x": nx, "y": ny, "w": nw, "h": nh
            })

        elapsed = time.time() - start_time
        return {
            "success": True,
            "input": input_path,
            "faces": result_faces,
            "face_count": len(result_faces),
            "image_width": w,
            "image_height": h,
            "processing_time": round(elapsed, 3),
        }

    except Exception as e:
        return {
            "success": False,
            "input": input_path,
            "error": str(e),
            "processing_time": round(time.time() - start_time, 3),
        }


def process_image(input_path: str, faces: list, output_path: str,
                  mode: str = "blur", color: str = "#888888",
                  opacity: float = 1.0, quality: int = 95) -> dict:
    """Anonimizálás: blur vagy szürke téglalap az arcokra."""
    start_time = time.time()

    if not _is_allowed_path(input_path) or not _is_allowed_path(output_path):
        return {"success": False, "error": "Nem engedélyezett útvonal"}

    try:
        img = cv2.imread(input_path)
        if img is None:
            return {"success": False, "error": "Kép betöltés sikertelen"}

        os.makedirs(os.path.dirname(output_path), exist_ok=True)

        if mode == "blur":
            for face in faces:
                x, y, fw, fh = face['x'], face['y'], face['w'], face['h']
                x2, y2 = min(x + fw, img.shape[1]), min(y + fh, img.shape[0])
                roi = img[y:y2, x:x2]
                if roi.shape[0] < 2 or roi.shape[1] < 2:
                    continue

                rw, rh = roi.shape[1], roi.shape[0]
                # Pixelation + blur combo
                small = cv2.resize(roi, (max(4, rw // 8), max(4, rh // 8)),
                                   interpolation=cv2.INTER_LINEAR)
                pixelated = cv2.resize(small, (rw, rh),
                                       interpolation=cv2.INTER_NEAREST)
                k = max(51, min(rw, rh) * 2 + 1)
                if k % 2 == 0:
                    k += 1
                blurred = cv2.GaussianBlur(roi, (k, k), 0)
                combined = cv2.addWeighted(pixelated, 0.7, blurred, 0.3, 0)
                img[y:y2, x:x2] = combined
        else:
            # Rectangle mode
            hex_color = color.lstrip('#')
            r, g, b = tuple(int(hex_color[i:i + 2], 16) for i in (0, 2, 4))
            bgr_color = (b, g, r)

            overlay = img.copy()
            for face in faces:
                x, y, fw, fh = face['x'], face['y'], face['w'], face['h']
                cv2.rectangle(overlay, (x, y), (x + fw, y + fh),
                              bgr_color, -1)

            if opacity < 1.0:
                img = cv2.addWeighted(overlay, opacity, img, 1 - opacity, 0)
            else:
                img = overlay

        cv2.imwrite(output_path, img, [cv2.IMWRITE_JPEG_QUALITY, quality])

        elapsed = time.time() - start_time
        return {
            "success": True,
            "outputPath": output_path,
            "processing_time": round(elapsed, 3),
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "processing_time": round(time.time() - start_time, 3),
        }


def main():
    parser = argparse.ArgumentParser(
        description="Tablo Anonymizer - Face Detection & Anonymization")
    parser.add_argument("--check", action="store_true",
                        help="OpenCV + dependencies elérhetők-e")
    parser.add_argument("--input", help="Bemeneti kép útvonala (detektálás)")
    parser.add_argument("--process", help="Bemeneti kép (anonimizálás)")
    parser.add_argument("--faces-json",
                        help="Arc koordináták JSON fájl (process-hez)")
    parser.add_argument("--output", help="Kimeneti kép útvonala")
    parser.add_argument("--mode", default="blur",
                        choices=["blur", "rect"],
                        help="Anonimizálás módja (default: blur)")
    parser.add_argument("--color", default="#888888",
                        help="Téglalap színe (rect mód)")
    parser.add_argument("--opacity", type=float, default=1.0,
                        help="Átlátszóság (rect mód)")
    parser.add_argument("--quality", type=int, default=95,
                        help="JPEG minőség (1-100)")

    args = parser.parse_args()

    if args.check:
        available = check_available()
        print(json.dumps({"available": available}))
        sys.exit(0 if available else 1)

    if args.input:
        result = detect_faces(args.input)
        print(json.dumps(result))
        sys.exit(0 if result.get("success") else 1)

    if args.process:
        if not args.faces_json or not args.output:
            parser.error("--faces-json és --output szükséges --process-hez")

        faces_path = Path(args.faces_json)
        if not faces_path.exists():
            print(json.dumps({"success": False,
                              "error": "Faces JSON nem található"}))
            sys.exit(1)

        faces = json.loads(faces_path.read_text("utf-8"))
        result = process_image(
            args.process, faces, args.output,
            mode=args.mode, color=args.color,
            opacity=args.opacity, quality=args.quality)
        print(json.dumps(result))
        sys.exit(0 if result.get("success") else 1)

    parser.error("--input, --process vagy --check szükséges")


if __name__ == "__main__":
    main()
