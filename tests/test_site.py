"""Structure tests for the shipped itsjakegray.com static site."""

from __future__ import annotations

import re
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
INDEX = REPO_ROOT / "index.html"
STYLE = REPO_ROOT / "css" / "style.css"
CNAME = REPO_ROOT / "CNAME"


class SiteStructureTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.html = INDEX.read_text(encoding="utf-8")

    def test_index_and_stylesheet_exist(self) -> None:
        self.assertTrue(INDEX.is_file())
        self.assertTrue(STYLE.is_file())
        self.assertIn('href="css/style.css"', self.html)

    def test_jake_gray_branding(self) -> None:
        self.assertIn("Jake Gray", self.html)
        self.assertRegex(self.html, r"<title>Jake Gray</title>")

    def test_four_pillar_section_headings(self) -> None:
        for heading_id, label in (
            ("projects-heading", "Building"),
            ("capabilities-heading", "Capabilities"),
            ("thinking-heading", "How I Think"),
            ("principles-heading", "Principles"),
        ):
            with self.subTest(heading=label):
                self.assertIn(f'id="{heading_id}"', self.html)
                self.assertIn(f">{label}</h2>", self.html)

    def test_active_projects_present(self) -> None:
        self.assertIn("SweatyGM.com", self.html)
        self.assertIn("Stage Design Tool", self.html)
        self.assertIn("Eye speed for GM-level target transitions.", self.html)

    def test_principles_index_pattern(self) -> None:
        self.assertGreaterEqual(self.html.count('class="entry"'), 8)
        self.assertIn('class="entry-source"', self.html)
        self.assertIn('class="entry-gloss"', self.html)
        self.assertIn('class="entry-statement"', self.html)

    def test_no_resume_noise(self) -> None:
        noise = ("subscribe", "Buttondown", "Mechanic Simulator", "blog", "Writing")
        lowered = self.html.lower()
        for term in noise:
            with self.subTest(term=term):
                self.assertNotIn(term.lower(), lowered)

    def test_canonical_and_cname(self) -> None:
        self.assertIn('href="https://www.itsjakegray.com/"', self.html)
        cname = CNAME.read_text(encoding="utf-8").strip()
        self.assertEqual(cname, "itsjakegray.com")
        self.assertRegex(cname, r"itsjakegray\.com")


if __name__ == "__main__":
    unittest.main()