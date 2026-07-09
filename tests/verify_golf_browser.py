"""Headless browser verification for golf.html."""

from __future__ import annotations

import subprocess
import sys
import time
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent


def painted_fraction(page, canvas_selector: str) -> float:
    return page.evaluate(
        """(sel) => {
            const canvas = document.querySelector(sel);
            if (!canvas) return 0;
            const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
            if (!gl) return 0;
            const w = canvas.width;
            const h = canvas.height;
            if (!w || !h) return 0;
            const pixels = new Uint8Array(w * h * 4);
            gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
            let painted = 0;
            const step = 24;
            for (let y = 0; y < h; y += step) {
              for (let x = 0; x < w; x += step) {
                const i = (y * w + x) * 4;
                const r = pixels[i];
                const g = pixels[i + 1];
                const b = pixels[i + 2];
                const a = pixels[i + 3];
                if (a > 10 && !(r > 245 && g > 245 && b > 245)) painted++;
              }
            }
            const samples = Math.ceil(w / step) * Math.ceil(h / step);
            return painted / samples;
        }""",
        canvas_selector,
    )


def main() -> int:
    from playwright.sync_api import sync_playwright

    server = subprocess.Popen(
        [sys.executable, "-m", "http.server", "8767"],
        cwd=REPO_ROOT,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    time.sleep(1)

    errors: list[str] = []
    scratch = Path(sys.argv[1]) if len(sys.argv) > 1 else None

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page(viewport={"width": 1280, "height": 720})
            page.on("pageerror", lambda exc: errors.append(str(exc)))

            page.goto("http://127.0.0.1:8767/golf.html", wait_until="networkidle")
            page.wait_for_selector("canvas[data-golf-canvas='1']", timeout=10000)
            time.sleep(0.5)

            canvas = page.query_selector("canvas[data-golf-canvas='1']")
            if not canvas:
                raise AssertionError("Golf canvas missing")

            box = canvas.bounding_box()
            if not box or box["width"] < 100 or box["height"] < 100:
                raise AssertionError(f"Canvas too small: {box}")

            mount = page.query_selector("[data-golf-canvas]")
            mount_size = page.evaluate(
                """(el) => ({ w: el.clientWidth, h: el.clientHeight })""",
                mount,
            )
            if abs(box["width"] - mount_size["w"]) > 4 or abs(box["height"] - mount_size["h"]) > 4:
                raise AssertionError(f"Canvas size mismatch: {box} vs mount {mount_size}")

            page.evaluate("window.__GOLF__.setPlaying(false)")
            page.evaluate("window.__GOLF__.seek(0)")
            page.evaluate(
                """() => {
                    if (window.__GOLF__ && window.__GOLF__.seek) window.__GOLF__.seek(0);
                }"""
            )
            time.sleep(0.6)
            start_frac = painted_fraction(page, "canvas[data-golf-canvas='1']")
            if start_frac < 0.15:
                raise AssertionError(f"Canvas under-painted at start: {start_frac:.3f}")

            status_start = page.inner_text("[data-golf-status]")
            if "Address" not in status_start and "ball" not in status_start.lower():
                raise AssertionError(f"Unexpected start status: {status_start}")

            if scratch:
                page.screenshot(path=str(scratch / "golf-page-start.png"), full_page=True)

            page.evaluate("window.__GOLF__.seek(14)")
            time.sleep(0.4)
            mid_frac = painted_fraction(page, "canvas[data-golf-canvas='1']")
            if mid_frac < 0.15:
                raise AssertionError(f"Canvas under-painted mid-sequence: {mid_frac:.3f}")

            status_mid = page.inner_text("[data-golf-status]")
            if status_mid == status_start:
                raise AssertionError("Status did not progress mid-sequence")

            if errors:
                raise AssertionError(f"Page errors: {errors}")

            if scratch:
                page.screenshot(path=str(scratch / "golf-page-mid.png"), full_page=True)

            browser.close()
    finally:
        server.terminate()
        server.wait(timeout=5)

    print("golf browser verification OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())