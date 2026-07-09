"""Headless browser verification for the shipped static site."""

from __future__ import annotations

import subprocess
import sys
import time
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent


def main() -> int:
    from playwright.sync_api import sync_playwright

    server = subprocess.Popen(
        [sys.executable, "-m", "http.server", "8766"],
        cwd=REPO_ROOT,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    time.sleep(1)

    errors: list[str] = []
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            page.on("pageerror", lambda exc: errors.append(str(exc)))

            page.goto("http://127.0.0.1:8766/", wait_until="networkidle")
            text = page.inner_text("body")

            for heading in ("BUILDING", "CAPABILITIES", "HOW I THINK", "PRINCIPLES"):
                if heading not in text.upper():
                    raise AssertionError(f"Missing visible heading: {heading}")

            styles = page.evaluate(
                """() => {
                    const body = document.body;
                    const cs = getComputedStyle(body);
                    return {
                        color: cs.color,
                        backgroundColor: cs.backgroundColor,
                    };
                }"""
            )
            if styles["backgroundColor"] in ("rgba(0, 0, 0, 0)", "transparent", "rgb(255, 255, 255)"):
                raise AssertionError(f"Body background not themed: {styles['backgroundColor']}")
            if styles["color"] == "rgb(0, 0, 0)":
                raise AssertionError("Body text color appears unstyled default black")

            if errors:
                raise AssertionError(f"Page errors: {errors}")

            out = Path(sys.argv[1]) if len(sys.argv) > 1 else None
            if out:
                page.screenshot(path=str(out), full_page=True)

            browser.close()
    finally:
        server.terminate()
        server.wait(timeout=5)

    print("browser verification OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())