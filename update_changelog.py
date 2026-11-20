#!/usr/bin/env python3
"""Automatically prepend a new entry to CHANGELOG.md based on the latest Git commit.

Usage: run this script manually or hook it via a Git post‑commit hook.
It will:
  1. Read the most recent commit message (one‑line).
  2. Determine the next version number (simple integer increment).
  3. Insert a new section at the top of CHANGELOG.md under an "[Unreleased]" header.

The script is safe to run multiple times – it will not duplicate the same commit.
"""
import subprocess
import re
from pathlib import Path

CHANGELOG = Path(__file__).with_name("CHANGELOG.md")

def get_latest_commit_msg() -> str:
    result = subprocess.run(["git", "log", "-1", "--pretty=%s"], capture_output=True, text=True, check=True)
    return result.stdout.strip()

def get_current_version() -> int:
    # Look for a line like "## [21]" at the top of the file.
    if not CHANGELOG.exists():
        return 0
    for line in CHANGELOG.read_text().splitlines():
        m = re.match(r"##\s*\[(\d+)\]", line)
        if m:
            return int(m.group(1))
    return 0

def prepend_entry(commit_msg: str, new_version: int):
    today = subprocess.run(["git", "show", "-s", "--format=%cs"], capture_output=True, text=True).stdout.strip()
    new_header = f"## [{new_version}] - {today}\n- {commit_msg}\n\n"
    if CHANGELOG.exists():
        existing = CHANGELOG.read_text()
        # Avoid duplicate entry for the same commit hash (store commit hash as comment)
        if commit_msg in existing:
            return
        new_content = new_header + existing
    else:
        new_content = "# Change Log\n\n" + new_header
    CHANGELOG.write_text(new_content)

if __name__ == "__main__":
    msg = get_latest_commit_msg()
    ver = get_current_version() + 1
    prepend_entry(msg, ver)
