#!/usr/bin/env python3
"""Build a flat {ABBREVIATION: definition} lookup table from BML's own
common/abbreviations.bml.

Like bml2json.py, this reuses the real bml parser instead of hand-copying
the WBF abbreviation list -- so it stays correct if abbreviations.bml is
ever edited or extended.

Usage:
    python3 scripts/extract_abbreviations.py path/to/common/abbreviations.bml \
        -o app/src/reference/abbreviations.json
"""
import argparse
import json
import re
import sys

from bml import bml


def parse_entries(raw_items):
    """Turn a LIST content item's raw strings ("KEY  = definition") into
    (key, definition) pairs. A left-hand side like "VUL or V" registers
    both "VUL" and "V" under the same definition."""
    entries = []
    for raw in raw_items:
        # continuation lines (from a multi-line entry) become plain spaces
        text = re.sub(r'\s+', ' ', raw).strip()
        if '=' not in text:
            continue
        left, right = text.split('=', 1)
        definition = right.strip()
        for key in re.split(r'\s+or\s+', left.strip()):
            key = key.strip()
            if key:
                entries.append((key, definition))
    return entries


def build_lookup(content):
    lookup = {}
    nodes = content.nodes
    for i, (content_type, value) in enumerate(nodes):
        if content_type != bml.ContentType.LIST:
            continue
        # abbreviations.bml calls out one list as explicitly unused
        # ("The following abbreviations are *not* used:", with the *not*
        # left as raw unrendered bold markup at this parse stage) -- skip
        # it, based on the paragraph immediately preceding the list,
        # rather than hardcoding which list index that is.
        prev_text = ''
        if i > 0 and nodes[i - 1][0] == bml.ContentType.PARAGRAPH:
            prev_text = nodes[i - 1][1].lower()
        if re.search(r'not\W*used', prev_text):
            continue
        for key, definition in parse_entries(value):
            lookup[key] = definition
    return lookup


def main():
    parser = argparse.ArgumentParser(description='Extract a BML abbreviation lookup table as JSON.')
    parser.add_argument('inputfile', help='path to common/abbreviations.bml')
    parser.add_argument('-o', '--outputfile', default='-', help='the output file (- is stdout)')
    args = parser.parse_args()

    content = bml.content_from_file(args.inputfile)
    lookup = build_lookup(content)
    text = json.dumps(lookup, indent=2, ensure_ascii=False, sort_keys=True)

    if args.outputfile == '-':
        sys.stdout.write(text + '\n')
    else:
        with open(args.outputfile, mode='w', encoding='utf-8') as f:
            f.write(text)


if __name__ == '__main__':
    main()
