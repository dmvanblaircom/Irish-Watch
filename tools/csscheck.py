#!/usr/bin/env python3
"""Lint app.css for the two ways this stylesheet has gone wrong before.

  1. DEAD      a declaration that a later rule with the same selector, in the
               same @media context, overrides completely. Harmless to the page,
               but it is how "override layers" accumulate until nobody can
               tell what wins.
  2. SHADOWED  a rule inside @media whose property is re-declared by a plain
               rule further down the file for the same selector. Same
               specificity, later wins, so the responsive rule never applies.
               This silently broke the phone layout once.

Usage:  python3 tools/csscheck.py [app.css]
Exit status is 1 if anything is found, so it can gate a push.
No dependencies. The parser is deliberately simple: flat rules, one level of
@media nesting, @keyframes passed over. That is all this file uses.
"""
import re
import sys
import collections

SHORTHAND = {
    "padding": ["padding-top", "padding-right", "padding-bottom", "padding-left"],
    "margin": ["margin-top", "margin-right", "margin-bottom", "margin-left"],
    "background": ["background-color", "background-image", "background-size",
                   "background-position", "background-repeat"],
    "border": ["border-width", "border-style", "border-color", "border-top",
               "border-right", "border-bottom", "border-left", "border-top-color",
               "border-right-color", "border-bottom-color", "border-left-color"],
    "border-top": ["border-top-width", "border-top-style", "border-top-color"],
    "border-bottom": ["border-bottom-width", "border-bottom-style", "border-bottom-color"],
    "border-left": ["border-left-width", "border-left-style", "border-left-color"],
    "border-right": ["border-right-width", "border-right-style", "border-right-color"],
    "font": ["font-family", "font-size", "font-weight", "line-height", "font-style"],
    "flex": ["flex-grow", "flex-shrink", "flex-basis"],
    "inset": ["top", "right", "bottom", "left"],
    "overflow": ["overflow-x", "overflow-y"],
    "transition": ["transition-property", "transition-duration",
                   "transition-timing-function", "transition-delay"],
    "grid-template": ["grid-template-columns", "grid-template-rows"],
}


def supersedes(new, old):
    """Does declaring `new` make an earlier `old` on the same element dead?"""
    return new == old or old in SHORTHAND.get(new, [])


def strip_comments(s):
    out, i = [], 0
    while i < len(s):
        if s.startswith("/*", i):
            j = s.find("*/", i + 2)
            j = len(s) if j == -1 else j + 2
            out.append("".join(c if c == "\n" else " " for c in s[i:j]))
            i = j
        else:
            out.append(s[i])
            i += 1
    return "".join(out)


def parse(css):
    """-> list of (line, context, selector, [(prop, value, important)])"""
    clean = strip_comments(css)
    rules, ctx, buf, pos, line = [], [], "", 0, 1
    n = len(clean)
    while pos < n:
        ch = clean[pos]
        if ch == "\n":
            line += 1
        if ch == "}":
            if ctx:
                ctx.pop()
            buf, pos = "", pos + 1
            continue
        if ch == "{":
            head = buf.strip()
            buf = ""
            if head.startswith("@keyframes") or head.startswith("@font-face"):
                depth, j = 1, pos + 1
                while j < n and depth:
                    depth += {"{": 1, "}": -1}.get(clean[j], 0)
                    j += 1
                line += clean[pos:j].count("\n")
                pos = j
                continue
            if head.startswith("@"):
                ctx.append(re.sub(r"\s+", " ", head))
                pos += 1
                continue
            depth, j = 1, pos + 1
            while j < n and depth:
                depth += {"{": 1, "}": -1}.get(clean[j], 0)
                j += 1
            body = clean[pos + 1:j - 1]
            decls = []
            for d in body.split(";"):
                if ":" not in d:
                    continue
                p, v = d.split(":", 1)
                v = v.strip()
                imp = v.lower().endswith("!important")
                decls.append((p.strip().lower(), re.sub(r"\s*!important$", "", v, flags=re.I), imp))
            start = line
            rules.append((start, " && ".join(ctx), head, decls))
            line += clean[pos:j].count("\n")
            pos = j
            continue
        buf += ch
        pos += 1
    return rules


def norm(sel):
    return ",".join(sorted(re.sub(r"\s+", " ", s.strip()) for s in sel.split(",")))


def find_dead(rules):
    groups = collections.OrderedDict()
    for line, ctx, sel, decls in rules:
        groups.setdefault((ctx, norm(sel)), []).append((line, decls))
    out = []
    for (ctx, sel), occ in groups.items():
        if len(occ) < 2:
            continue
        live = {}                       # prop -> (line, value, important)
        for line, decls in occ:
            for p, v, imp in decls:
                for old in list(live):
                    ol, ov, oi = live[old]
                    if supersedes(p, old) and not (oi and not imp) and ol != line:
                        out.append((ol, ctx, sel, old, ov, line, p))
                        del live[old]
                live[p] = (line, v, imp)
    return out


def find_shadowed(rules):
    """A @media declaration followed later by a base declaration of the same
    property on the same selector. Base wins; the media rule is dead."""
    out = []
    by_sel = collections.defaultdict(list)
    for line, ctx, sel, decls in rules:
        by_sel[norm(sel)].append((line, ctx, decls))
    for sel, occ in by_sel.items():
        for mline, mctx, mdecls in occ:
            if not mctx.startswith("@media"):
                continue
            for mp, mv, mimp in mdecls:
                for bline, bctx, bdecls in occ:
                    if bctx or bline <= mline:
                        continue
                    for bp, bv, bimp in bdecls:
                        if supersedes(bp, mp) and not (mimp and not bimp):
                            out.append((mline, mctx, sel, mp, mv, bline, bp, bv))
    return out


def main(path):
    css = open(path, encoding="utf-8").read()
    rules = parse(css)
    dead = find_dead(rules)
    shadowed = find_shadowed(rules)

    if shadowed:
        print("SHADOWED responsive rules (a later base rule wins; the @media one never applies):")
        for ml, mctx, sel, mp, mv, bl, bp, bv in shadowed:
            print(f"  L{ml:<4} {mctx}  {sel} {{ {mp}: {mv} }}")
            print(f"        killed by L{bl}  {sel} {{ {bp}: {bv} }}")
    if dead:
        print("DEAD declarations (same selector redeclares the property later in the same context):")
        for ol, ctx, sel, op, ov, nl, np in dead:
            where = f" in {ctx}" if ctx else ""
            print(f"  L{ol:<4} {sel}{where} {{ {op}: {ov[:50]} }}  -> replaced at L{nl} by {np}")

    n = len(shadowed) + len(dead)
    print(f"\n{len(rules)} rules checked: {len(shadowed)} shadowed, {len(dead)} dead.")
    return 1 if n else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1] if len(sys.argv) > 1 else "app.css"))
