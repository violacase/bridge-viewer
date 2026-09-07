#!/usr/bin/env python3
"""Convert a BML file to JSON, for consumption by non-Python renderers (e.g. a Vue app).

This mirrors bml2html.py / bml2latex.py / bml2bss.py in the upstream `bml`
package (https://github.com/gpaulissen/bml): it reuses the real parser
(bml.content_from_file) so the JSON always reflects the same tree the
official HTML/LaTeX output would show, instead of re-deriving the grammar
(indentation rules, #INCLUDE resolution, #CUT/#COPY/#PASTE, multi-line
descriptions, ...) in a second language.

Requires the `bml` package on PYTHONPATH:
    pip install git+https://github.com/gpaulissen/bml.git
or, for local development against a clone:
    pip install -e /path/to/bml

Usage:
    python3 bml2json.py system-WG-GJP.bml -o system-WG-GJP.json
    python3 bml2json.py system-WG-GJP.bml -o -        # stdout
"""
import json
import sys

from bml import bml

EXTENSION = '.json'

# Content types bml2html.py itself doesn't render (they're LaTeX-only:
# see the ContentType comments in bml.py). We skip them the same way,
# but list what was skipped so nothing silently disappears.
_HEADING_LEVELS = {
    bml.ContentType.H1: 1,
    bml.ContentType.H2: 2,
    bml.ContentType.H3: 3,
    bml.ContentType.H4: 4,
}


def node_to_dict(node):
    """Recursively convert a bml.Node (one bid + its rebids) to a plain dict."""
    return {
        'bid': node.bid,
        'desc': node.desc,
        'export': node.export,
        'children': children_to_list(node.children),
    }


def children_to_list(children):
    """Convert a list of sibling Nodes to plain dicts.

    Node.restructure() (called while parsing) inserts a synthetic node with
    bid == bml.EMPTY ('{}') and an empty desc as the sole child of root
    whenever a bidtable lists several parallel top-level bids (e.g. a table
    of opening bids). That's purely so the LaTeX dirtree package's "root has
    exactly one level-1 child" rule is satisfied -- it carries no bidding
    information, so we unwrap it here rather than showing a mystery "{}"
    node in the UI.
    """
    result = []
    for c in children:
        if c.bid == bml.EMPTY and not c.desc:
            result.extend(children_to_list(c.children))
        else:
            result.append(node_to_dict(c))
    return result


def content_to_dict(content):
    items = []
    skipped_types = []

    for content_type, value in content.nodes:
        if content_type == bml.ContentType.BIDTABLE:
            if not value.export:
                continue
            # value is the synthetic ROOT node; its children are the
            # actual top-level bids (1C, 1D, 1N, ...), which is what a
            # renderer actually wants to iterate over.
            items.append({
                'type': 'bidtable',
                'children': children_to_list(value.children),
            })
        elif content_type == bml.ContentType.PARAGRAPH:
            items.append({'type': 'paragraph', 'text': value})
        elif content_type in _HEADING_LEVELS:
            items.append({'type': 'heading', 'level': _HEADING_LEVELS[content_type], 'text': value})
        elif content_type == bml.ContentType.LIST:
            items.append({'type': 'list', 'items': value})
        elif content_type == bml.ContentType.ENUM:
            items.append({'type': 'enum', 'items': value})
        else:
            # DIAGRAM, TABLE, DESCRIPTION, BIDDING: LaTeX-only constructs.
            skipped_types.append(bml.ContentTypeStr(content_type))

    return {
        'meta': dict(content.meta),
        'items': items,
        'skipped_types': skipped_types,
    }


def bml2json(input_filename, output_filename):
    content = bml.content_from_file(input_filename)
    data = content_to_dict(content)
    text = json.dumps(data, indent=2, ensure_ascii=False)

    if output_filename == '-':
        sys.stdout.write(text + '\n')
    else:
        with open(output_filename, mode='w', encoding='utf-8') as f:
            f.write(text)


def main():
    bml.args = bml.parse_arguments(
        description='Convert BML to JSON.',
        option_tree=False,
        output_extension=EXTENSION,
    )
    bml2json(bml.args.inputfile, bml.args.outputfile)


if __name__ == '__main__':
    main()
