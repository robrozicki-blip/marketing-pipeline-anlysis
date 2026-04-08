#!/usr/bin/env python3
"""
GAI File Naming Convention Script
Format: GAI-[CATEGORY]-[Description_Title_Case]-[YYYY-Qn]-v[##].[ext]
"""

import os
import re
import shutil
from datetime import datetime
from pathlib import Path
from collections import defaultdict

# --- Config ---
DRY_RUN = False  # Set False to execute

CATEGORIES_BY_EXT = {
    '.pptx': 'PRES', '.pptm': 'PRES', '.key': 'PRES',
    '.html': 'DEMO', '.jsx': 'DEMO', '.tsx': 'DEMO',
    '.pdf': 'DOC', '.doc': 'DOC', '.docx': 'DOC', '.md': 'DOC', '.txt': 'DOC',
    '.mp4': 'VID', '.mov': 'VID', '.wav': 'VID',
    '.png': 'IMG', '.jpg': 'IMG', '.jpeg': 'IMG', '.gif': 'IMG',
    '.avif': 'IMG', '.webp': 'IMG', '.heic': 'IMG', '.svg': 'IMG', '.eps': 'IMG',
    '.csv': 'DATA', '.xlsx': 'DATA', '.xls': 'DATA',
    '.zip': 'DATA',
}

SKIP_PREFIXES = ('~$', '.DS_Store', '.localized')
SKIP_EXTENSIONS = {'.app', '.dmg'}

FOLDERS = ['PRES', 'DEMO', 'DOC', 'VID', 'IMG', 'DATA']

# Acronyms to keep uppercase
ACRONYMS = {'ai', 'roi', 'mhe', 'csco', 'sop', 'ibp', 'icp', 'gtm', 'crm',
            'cctv', 'nfi', 'vp', 'wsj', 'html', 'csv', 'pdf', 'dcv', 'gat',
            'esta', 'sdk', 'api'}

def month_to_quarter(month):
    return (month - 1) // 3 + 1

def extract_date_from_name(name):
    """Try to extract a date from the filename."""
    # Pattern: YYYY-MM-DD
    m = re.search(r'(20\d{2})-(\d{2})-(\d{2})', name)
    if m:
        y, mo, d = int(m.group(1)), int(m.group(2)), int(m.group(3))
        if 1 <= mo <= 12 and 1 <= d <= 31:
            return y, mo, d
    # Pattern: YYYYMMDD
    m = re.search(r'(20\d{2})(\d{2})(\d{2})', name)
    if m:
        y, mo, d = int(m.group(1)), int(m.group(2)), int(m.group(3))
        if 1 <= mo <= 12 and 1 <= d <= 31:
            return y, mo, d
    # Pattern: YYYY-Qn
    m = re.search(r'(20\d{2})-Q(\d)', name)
    if m:
        return int(m.group(1)), int(m.group(2)) * 3, 1
    # Pattern: just YYYY (but not if part of a longer number)
    m = re.search(r'(?<!\d)(202[0-9])(?!\d)', name)
    if m:
        return int(m.group(1)), None, None
    return None, None, None

def get_quarter_str(filepath, name):
    """Get YYYY-Qn string from filename or file mod time."""
    year, month, day = extract_date_from_name(name)
    if year and month:
        q = month_to_quarter(month)
        return f"{year}-Q{q}"
    elif year:
        try:
            mtime = os.path.getmtime(filepath)
            dt = datetime.fromtimestamp(mtime)
            if dt.year == year:
                return f"{year}-Q{month_to_quarter(dt.month)}"
            return f"{year}-Q1"
        except:
            return f"{year}-Q1"
    else:
        try:
            mtime = os.path.getmtime(filepath)
            dt = datetime.fromtimestamp(mtime)
            return f"{dt.year}-Q{month_to_quarter(dt.month)}"
        except:
            return "2025-Q1"

def is_screenshot(name):
    return name.lower().startswith('screenshot ')

def is_screen_recording(name):
    return name.lower().startswith('screen recording ')

def title_case_word(word):
    """Title case a word, preserving acronyms."""
    if word.lower() in ACRONYMS:
        return word.upper()
    return word.capitalize()

def clean_description(name, ext):
    """Clean a filename into a Title_Case description."""
    desc = name
    if desc.lower().endswith(ext.lower()):
        desc = desc[:-len(ext)]

    # Handle screenshots - just use "Screenshot"
    if is_screenshot(name):
        return "Screenshot"
    if is_screen_recording(name):
        return "Screen_Recording"

    # Remove extension-like artifacts in the middle of names
    desc = re.sub(r'\.mp4|\.html|\.csv|\.pdf', '', desc, flags=re.IGNORECASE)

    # Remove dates in various formats
    desc = re.sub(r'\d{4}-\d{2}-\d{2}[-_]?\d{2}[-_]?\d{2}[-_]?\d{2}[-_]?utc', '', desc)
    desc = re.sub(r'20\d{2}-\d{2}-\d{2}', '', desc)
    desc = re.sub(r'20\d{2}\d{4}T\d+Z[-_]\d+[-_]\d+', '', desc)
    desc = re.sub(r'20\d{2}\d{4}', '', desc)
    desc = re.sub(r'20\d{2}-Q\d', '', desc)
    # Remove standalone years carefully
    desc = re.sub(r'[_\s-]20\d{2}[_\s-]', ' ', desc)
    desc = re.sub(r'^20\d{2}[_\s-]', '', desc)
    desc = re.sub(r'[_\s-]20\d{2}$', '', desc)
    # Remove macOS timestamp patterns "at X.XX.XX AM/PM"
    desc = re.sub(r'\s*at\s+\d+\.\d+\.\d+\s*[AP]M', '', desc, flags=re.IGNORECASE)
    # Remove UTC timestamps
    desc = re.sub(r'[-_]\d{2}-\d{2}-\d{2}-utc', '', desc)
    # Remove version indicators
    desc = re.sub(r'[_\s.-]*[Vv]\d+\.?\d*', '', desc)
    desc = re.sub(r'[_\s-]*FINAL', '', desc, flags=re.IGNORECASE)
    desc = re.sub(r'\s*copy\s*', ' ', desc, flags=re.IGNORECASE)
    desc = re.sub(r'\s*\(\d+\s*p?\)\s*', ' ', desc)  # (1), (1080p) etc
    desc = re.sub(r'\s*\(\d+\)\s*', ' ', desc)
    # Remove UUIDs
    desc = re.sub(r'[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}', '', desc, flags=re.IGNORECASE)
    # Remove long hex strings (20+ chars)
    desc = re.sub(r'[0-9a-f]{20,}', '', desc, flags=re.IGNORECASE)
    # Remove hex prefixes from web downloads (8+ hex followed by _)
    desc = re.sub(r'^[0-9a-f]{8,}_', '', desc, flags=re.IGNORECASE)
    # Remove numeric-only prefixes like "431-" or "432-"
    desc = re.sub(r'^\d{1,4}[-_]\s*', '', desc)
    # Remove GAI/GatherAI/Gather AI/GATHERAI prefixes
    desc = re.sub(r'^GAI[\s_-]*', '', desc, flags=re.IGNORECASE)
    desc = re.sub(r'^GatherAI[\s_-]*', '', desc, flags=re.IGNORECASE)
    desc = re.sub(r'^Gather[\s_]*AI[\s_-]*', '', desc, flags=re.IGNORECASE)
    desc = re.sub(r'^GATHERAI[\s_-]*', '', desc, flags=re.IGNORECASE)
    desc = re.sub(r'^Gather[\s_-]+', '', desc, flags=re.IGNORECASE)
    # Remove "Default-view-export-" and long trailing numbers
    desc = re.sub(r'Default[-_]view[-_]export[-_]\d+', '', desc)
    desc = re.sub(r'[-_]\d{10,}', '', desc)  # remove long number suffixes
    # Remove _ndx suffix (Gartner report artifacts)
    desc = re.sub(r'_\d{6}_ndx', '', desc, flags=re.IGNORECASE)
    # Clean separators
    desc = re.sub(r'[_\s-]+', '_', desc)
    desc = desc.strip('_.- ,')

    # Remove any remaining lone numbers that are just noise
    # But keep meaningful ones

    # Title case each word
    if desc:
        parts = desc.split('_')
        parts = [title_case_word(p) for p in parts if p]
        desc = '_'.join(parts)

    # Truncate very long descriptions
    if len(desc) > 55:
        # Try to cut at word boundary
        truncated = desc[:55]
        last_underscore = truncated.rfind('_')
        if last_underscore > 30:
            truncated = truncated[:last_underscore]
        desc = truncated

    return desc if desc else "Untitled"

def get_version(name):
    """Extract version number from filename."""
    # Check for V1.2 style
    m = re.search(r'[_\s-][Vv](\d+)\.\d+', name)
    if m:
        return int(m.group(1))
    # Check for v01 style
    m = re.search(r'[_\s-][Vv](\d+)', name)
    if m:
        return int(m.group(1))
    if '_FINAL' in name.upper():
        return 2
    if 'copy' in name.lower():
        return 2
    # (N) pattern - treat as version N+1
    m = re.search(r'\((\d+)\)', name)
    if m:
        val = int(m.group(1))
        if val < 20:  # avoid interpreting (1080p) as version
            return val + 1
    return 1

def process_directory(base_dir):
    """Process a directory and return list of (old_path, new_path, category)."""
    results = []
    seen_names = defaultdict(int)
    screenshot_counter = defaultdict(int)  # per-quarter counter

    entries = sorted(os.listdir(base_dir))

    for name in entries:
        filepath = os.path.join(base_dir, name)

        # Skip directories
        if os.path.isdir(filepath):
            continue

        # Skip temp files and certain extensions
        if any(name.startswith(p) for p in SKIP_PREFIXES):
            continue

        ext_raw = os.path.splitext(name)[1]
        ext = ext_raw.lower()
        if ext in SKIP_EXTENSIONS:
            continue

        if not ext:
            continue

        # Determine category
        category = CATEGORIES_BY_EXT.get(ext)
        if not category:
            continue

        # Build new name
        quarter = get_quarter_str(filepath, name)
        desc = clean_description(name, ext_raw)
        version = get_version(name)

        # For screenshots/recordings, add sequence number
        if desc in ("Screenshot", "Screen_Recording"):
            seq_key = f"{desc}_{quarter}"
            screenshot_counter[seq_key] += 1
            seq = screenshot_counter[seq_key]
            desc = f"{desc}_{seq:03d}"

        new_name = f"GAI-{category}-{desc}-{quarter}-v{version:02d}{ext}"

        # Handle exact duplicates
        key = new_name.lower()
        seen_names[key] += 1
        if seen_names[key] > 1:
            new_name = f"GAI-{category}-{desc}-{quarter}-v{version:02d}_{seen_names[key]}{ext}"

        new_dir = os.path.join(base_dir, category)
        new_path = os.path.join(new_dir, new_name)

        results.append((filepath, new_path, category))

    return results

def execute(results, base_dir):
    """Create folders and move files."""
    for folder in FOLDERS:
        folder_path = os.path.join(base_dir, folder)
        if not os.path.exists(folder_path):
            os.makedirs(folder_path)
            print(f"  Created folder: {folder}/")

    for old_path, new_path, category in results:
        old_name = os.path.basename(old_path)
        new_name = os.path.basename(new_path)
        if DRY_RUN:
            print(f"  {category}/{new_name}")
            print(f"       ← {old_name}")
            print()
        else:
            if os.path.exists(new_path):
                base, ext = os.path.splitext(new_path)
                i = 2
                while os.path.exists(f"{base}_{i}{ext}"):
                    i += 1
                new_path = f"{base}_{i}{ext}"
            shutil.move(old_path, new_path)

def main():
    mode = "DRY RUN" if DRY_RUN else "EXECUTING"

    for label, directory in [("DESKTOP", os.path.expanduser("~/Desktop")),
                              ("DOWNLOADS", os.path.expanduser("~/Downloads"))]:
        print(f"\n{'='*70}")
        print(f"  {label} — {mode}")
        print(f"{'='*70}\n")

        results = process_directory(directory)
        execute(results, directory)

        cats = defaultdict(int)
        for _, _, c in results:
            cats[c] += 1
        print(f"  TOTAL: {len(results)} files")
        for c in FOLDERS:
            if cats[c]:
                print(f"    {c}: {cats[c]}")

if __name__ == '__main__':
    main()
