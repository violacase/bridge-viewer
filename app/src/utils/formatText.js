// Mirrors the text-substitution rules in bml's html.py (to_html / html_replace_suits).
// The *structure* of a BML file (indentation, #INCLUDE, bid trees) is parsed once,
// upstream, by the real bml package (see scripts/bml2json.py) -- that part has real
// edge cases and shouldn't be re-derived. These substitutions are stateless regexes
// applied to already-parsed text, so reimplementing them here is low-risk and lets
// them run as real Vue-rendered markup instead of string-hacked HTML.

import abbreviations from '../reference/abbreviations.json'

const SUIT_SPANS = {
  C: '<span class="suit suit-c">&clubs;</span>',
  D: '<span class="suit suit-d">&diams;</span>',
  H: '<span class="suit suit-h">&hearts;</span>',
  S: '<span class="suit suit-s">&spades;</span>',
}

const SUIT_GLYPHS = { c: '♣', d: '♦', h: '♥', s: '♠' }

function escapeHtml(s) {
  return s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
}

function escapeAttr(s) {
  return escapeHtml(s).replaceAll('"', '&quot;')
}

// One alternation of every known abbreviation (see scripts/extract_abbreviations.py,
// which builds abbreviations.json from BML's own common/abbreviations.bml -- this
// isn't a hand-typed list). Longest keys first so e.g. "S/A" wins over a shorter
// key that happens to be a prefix of it. Matches are required to sit on a
// non-alphanumeric boundary on both sides, so it only fires on abbreviations used
// as their own token (", BAL," or "4+m") and not on digit-attached bid-shape
// notation like "5M" or "2C", which is exactly how these descriptions use them.
const ABBR_KEYS = Object.keys(abbreviations).sort((a, b) => b.length - a.length)
const ABBR_PATTERN = ABBR_KEYS.length
  ? new RegExp(
      `(?<![A-Za-z0-9])(${ABBR_KEYS.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})(?![A-Za-z0-9])`,
      'g',
    )
  : null

function abbreviationTitle(key) {
  const def = abbreviations[key].replaceAll(/!([cdhs])/g, (_, s) => SUIT_GLYPHS[s])
  return escapeAttr(def)
}

// Wraps recognized abbreviations in a native <abbr title="..."> so the full
// definition shows up as a hover tooltip, right in the same preview text --
// no separate glossary lookup needed. Must run last (see the call site in
// formatBmlText for why).
function annotateAbbreviations(html) {
  if (!ABBR_PATTERN) return html
  return html.replace(ABBR_PATTERN, (match) => `<abbr title="${abbreviationTitle(match)}">${match}</abbr>`)
}

// Replaces suit letters embedded in a bid token, e.g. "1C" -> "1<clubs>", "2NT" -> "2NT".
// Mirrors html_replace_suits() in bml's html.py.
function replaceBidSuits(match) {
  return match
    .replaceAll('C', SUIT_SPANS.C)
    .replaceAll('D', SUIT_SPANS.D)
    .replaceAll('H', SUIT_SPANS.H)
    .replaceAll('S', SUIT_SPANS.S)
    .replaceAll('N', 'NT')
}

// A digit followed by one or more suit letters, e.g. "1C", "2NT", "3SX".
// The N(?!T) guard keeps "NT" itself from being treated as a suit letter.
const BID_SUIT_PATTERN = /\d(?:[CDHS]|N(?!T))+/g

/**
 * Format free-text description/paragraph content: suit shorthand (!c !d !h !s),
 * *bold*, /italic/, =code=, dashes, and any inline bid tokens (e.g. "as after 1C").
 * Returns HTML for use with v-html.
 */
export function formatBmlText(raw) {
  if (!raw) return ''
  let html = escapeHtml(raw)

  // bml.py joins continuation lines in a description with the literal two-char
  // sequence "\n" (see Node desc handling in create_bidtree), not a real newline.
  html = html.replaceAll('\\n', '<br>')

  // inline markup -- must run before suit substitution since it also uses '*' etc.
  html = html.replace(/(?<=^|\s|>)\*(\S[^*<>]*)\*/g, '<strong>$1</strong>')
  html = html.replace(/(?<=^|\s|>)\/(\S[^/<>]*)\//g, '<em>$1</em>')
  html = html.replace(/(?<=^|\s|>)=(\S[^=<>]*)=/g, '<code>$1</code>')

  html = html
    .replaceAll('!c', SUIT_SPANS.C)
    .replaceAll('!d', SUIT_SPANS.D)
    .replaceAll('!h', SUIT_SPANS.H)
    .replaceAll('!s', SUIT_SPANS.S)

  // order matters: em dash before en dash
  html = html.replaceAll('---', '&mdash;').replaceAll('--', '&ndash;')

  html = html.replace(BID_SUIT_PATTERN, replaceBidSuits)

  // Runs last, deliberately: every other pass above scans the *whole*
  // string blindly (no tag-awareness), so if abbreviation tooltips were
  // inserted earlier, a later pass could match text inside the title=""
  // we just added (e.g. the "4SF" definition itself contains "4SFG",
  // which BID_SUIT_PATTERN would happily match) and corrupt the markup.
  // Running this last means nothing downstream can do that; matching
  // inside our own already-inserted tags isn't a concern since none of
  // our generated class names/entities collide with an actual key.
  html = annotateAbbreviations(html)

  return html
}

/**
 * Format a bid token (Node.bid): "P" -> "Pass", "D" -> "Dbl", "R" -> "Rdbl",
 * plus suit-letter substitution. Sequences like "1C-1D-1N" are supported --
 * each segment gets the suit substitution independently.
 */
export function formatBid(bid) {
  let text = bid
  if (text === 'P') text = 'Pass'
  else if (text === 'D') text = 'Dbl'
  else if (text === 'R') text = 'Rdbl'

  const html = escapeHtml(text)
  return html.replace(BID_SUIT_PATTERN, replaceBidSuits)
}
