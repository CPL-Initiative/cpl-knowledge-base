#!/usr/bin/env python3
"""Curation assistant — toil-out, judgment-in promotion from the private vault.

Encodes the CURATION.md pipeline. It takes files the private CPLBrain vault has
EXPLICITLY marked for promotion, runs the mechanical transforms (Obsidian
wikilink-strip -> relative-relink, dashboard-banner injection), and runs a
SENSITIVITY SCANNER that FLAGS — never silently strips — anything that needs a
human's eyes before it can go public. It writes the transformed markdown into a
working copy of this PUBLIC repo plus a masked report for review.

It does NOT publish. Nothing reaches public `main` without a human opening and
merging a PR — that review IS the CURATION.md "sensitivity audit".

Safety properties:
  * Opt-in only. Promotion is driven by a manifest whose default bucket is
    `hold`; a file is NEVER promoted unless explicitly listed as
    promote/redact/extract/rewrite. `hold` files are skipped, never written.
  * The assistant can't become a leak vector. The sensitivity report masks the
    values it flags (type + line + masked token, never the raw value) and is
    written under `curation_out/` (gitignored), so it is never committed.
  * Judgment stays human. `redact`/`extract`/`rewrite` files are written with a
    prominent TODO banner and flagged — the tool does the mechanical part, the
    human does the editorial part.

Stdlib only. Run from a checkout of this repo with a CPLBrain clone alongside
(a multi-repo session, or locally):

  python3 tools/curation_assistant.py --vault ../CPLBrain \
      --manifest ../CPLBrain/audit/curation-manifest.tsv --out .

Bootstrap a manifest (everything defaults to `hold` — you opt files in):

  python3 tools/curation_assistant.py --vault ../CPLBrain --init-manifest \
      > ../CPLBrain/audit/curation-manifest.tsv
"""
import argparse
import datetime
import os
import re
import sys

# Dirs whose contents are categorically private — mirrors the CURATION.md
# "Held private" list. Used by --init-manifest to pre-mark `hold`.
PRIVATE_DIRS = (
    "00-inbox", "02-personal", "03-professional/braindumps", "07-session-notes",
    "04-projects/cpl-initiative/college-updates", "05-knowledge/snapshots", "audit",
)
VALID_BUCKETS = ("promote", "redact", "extract", "rewrite", "hold")

# Dest prefixes that are "mirrors of static documents" and must carry the
# dashboard banner (CURATION.md metrics policy).
BANNER_DIRS = ("policy-and-funding/", "research/", "playbooks/")
BANNER = (
    "> ℹ️ **Operational metrics live on the dashboards, not here.** Specific "
    "counts in this mirror reflect the source document's original publication date. "
    "See the [CPL Project Dashboard](https://cpl-initiative.github.io/cpl-project-tracker/) "
    "and the [MAP CPL Insights Dashboard](https://cpldashboardcccco.azurewebsites.net/insights/dashboard) "
    "for current figures."
)

# Sensitivity scanner: (category, severity, compiled regex).
SCAN = [
    ("email",        "high", re.compile(r"\b[\w.+-]+@[\w-]+\.[\w.-]+\b")),
    ("ssn",          "high", re.compile(r"\b\d{3}-\d{2}-\d{4}\b")),
    ("phone",        "high", re.compile(r"\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b")),
    ("long-id",      "high", re.compile(r"\b\d{7,}\b")),
    ("dob",          "high", re.compile(r"\b(?:dob|date of birth)\b", re.I)),
    ("money",        "med",  re.compile(r"\$\s?\d[\d,]*(?:\.\d+)?")),
    ("sensitive-kw", "med",  re.compile(r"\b(?:draft|internal|confidential|do not (?:distribute|share)|embargo(?:ed)?|unreleased|preliminary|not for distribution|ferpa|pii)\b", re.I)),
    ("held-path",    "med",  re.compile(r"\b(?:00-inbox|02-personal|braindumps|07-session-notes|college-updates)\b", re.I)),
    ("wikilink",     "low",  re.compile(r"!?\[\[[^\]]+\]\]")),
    ("agent-ref",    "low",  re.compile(r"\b(?:CLAUDE|AGENTS|GEMINI)\.md\b")),
]
WIKILINK = re.compile(r"(!?)\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|([^\]]+))?\]\]")

TODO = {
    "redact":  "<!-- CURATION TODO: redact the specific lines/refs per the audit before publishing. -->",
    "extract": "<!-- CURATION TODO: EXTRACT — keep only the audit-approved portion of this file. -->",
    "rewrite": "<!-- CURATION TODO: REWRITE internal-team framing for a public audience before publishing. -->",
}


def mask(token):
    token = token.strip()
    if len(token) <= 2:
        return "•" * len(token)
    return token[0] + "•" * (len(token) - 2) + token[-1]


def read_manifest(path):
    """TSV rows: src<TAB>dest<TAB>bucket ; '#' comments and blanks ignored."""
    entries = []
    with open(path, encoding="utf-8") as fh:
        for ln, raw in enumerate(fh, 1):
            line = raw.split("#", 1)[0].strip()
            if not line:
                continue
            parts = [p.strip() for p in line.split("\t") if p.strip()]
            if len(parts) < 3:
                print("manifest line %d malformed (need src<TAB>dest<TAB>bucket): %r"
                      % (ln, raw.rstrip()), file=sys.stderr)
                continue
            src, dest, bucket = parts[0], parts[1], parts[2].lower()
            if bucket not in VALID_BUCKETS:
                print("manifest line %d: unknown bucket %r (skipped)" % (ln, bucket), file=sys.stderr)
                continue
            entries.append((src, dest, bucket))
    return entries


def relink_wikilinks(text, dest_by_basename, this_dest):
    """[[Note]] / [[Note|Alias]] -> relative link if the target is also being
    promoted, else strip to plain text. Embeds (![[...]]) are dropped."""
    def repl(m):
        embed, target, alias = m.group(1), m.group(2).strip(), (m.group(3) or "").strip()
        label = alias or target
        if embed:
            return "(embedded content omitted)"
        dest = dest_by_basename.get(target.lower())
        if dest:
            rel = os.path.relpath(dest, os.path.dirname(this_dest) or ".")
            return "[%s](%s)" % (label, rel)
        return label
    return WIKILINK.sub(repl, text)


def add_banner(text):
    if "Operational metrics live on the dashboards" in text:
        return text
    if text.startswith("---"):
        end = text.find("\n---", 3)
        if end != -1:
            cut = text.find("\n", end + 1)
            cut = cut if cut != -1 else len(text)
            return text[:cut] + "\n\n" + BANNER + "\n" + text[cut:]
    return BANNER + "\n\n" + text


def scan(text):
    findings = []
    for ln, line in enumerate(text.splitlines(), 1):
        for cat, sev, rx in SCAN:
            for m in rx.finditer(line):
                findings.append((sev, cat, ln, mask(m.group(0))))
    return findings


def init_manifest(vault):
    """Starter manifest: every .md under the vault, defaulted to `hold`."""
    out = ["# Curation manifest  —  src<TAB>dest<TAB>bucket",
           "# buckets: promote | redact | extract | rewrite | hold (default)",
           "# Everything is hold until you opt it in (set a dest + bucket).", ""]
    for root, _d, files in os.walk(vault):
        for f in sorted(files):
            if not f.endswith(".md"):
                continue
            rel = os.path.relpath(os.path.join(root, f), vault).replace(os.sep, "/")
            private = any(rel == d or rel.startswith(d + "/") for d in PRIVATE_DIRS)
            out.append("%s\t\thold%s" % (rel, "  # private-by-default" if private else ""))
    return "\n".join(out) + "\n"


def main():
    ap = argparse.ArgumentParser(description="Curation assistant (CURATION.md pipeline).")
    ap.add_argument("--vault", required=True, help="path to the private CPLBrain vault clone")
    ap.add_argument("--manifest", help="curation manifest TSV (src<TAB>dest<TAB>bucket)")
    ap.add_argument("--out", default=".", help="path to this public repo's root (default .)")
    ap.add_argument("--report", default=None,
                    help="report path (default <out>/curation_out/CURATION_REPORT.md; gitignored)")
    ap.add_argument("--init-manifest", action="store_true",
                    help="emit a starter manifest (all hold) to stdout and exit")
    ap.add_argument("--dry-run", action="store_true", help="scan + report, write no curated files")
    args = ap.parse_args()

    if not os.path.isdir(args.vault):
        print("Vault not found: %s" % args.vault, file=sys.stderr)
        return 2
    if args.init_manifest:
        sys.stdout.write(init_manifest(args.vault))
        return 0
    if not args.manifest:
        print("Need --manifest (or --init-manifest to bootstrap one).", file=sys.stderr)
        return 2

    entries = read_manifest(args.manifest)
    dest_by_basename = {os.path.splitext(os.path.basename(s))[0].lower(): d
                        for s, d, b in entries if b != "hold"}

    written, held, missing, findings = [], 0, [], []
    for src, dest, bucket in entries:
        if bucket == "hold":
            held += 1
            continue
        src_path = os.path.join(args.vault, src)
        if not os.path.isfile(src_path):
            missing.append(src)
            continue
        with open(src_path, encoding="utf-8") as fh:
            text = fh.read()
        text = relink_wikilinks(text, dest_by_basename, dest)
        if any(dest.startswith(p) for p in BANNER_DIRS):
            text = add_banner(text)
        if bucket in TODO:
            text = TODO[bucket] + "\n\n" + text
        for sev, cat, ln, masked in scan(text):
            findings.append((dest, sev, cat, ln, masked))
        if not args.dry_run:
            out_path = os.path.join(args.out, dest)
            os.makedirs(os.path.dirname(out_path) or ".", exist_ok=True)
            with open(out_path, "w", encoding="utf-8") as fh:
                fh.write(text)
        written.append((dest, bucket))

    report = args.report or os.path.join(args.out, "curation_out", "CURATION_REPORT.md")
    rank = {"high": 0, "med": 1, "low": 2}
    findings.sort(key=lambda x: (rank[x[1]], x[0], x[3]))
    os.makedirs(os.path.dirname(report) or ".", exist_ok=True)
    highs = [f for f in findings if f[1] == "high"]
    with open(report, "w", encoding="utf-8") as fh:
        fh.write("# Curation sensitivity report — %s\n\n" % datetime.date.today().isoformat())
        fh.write("_Masked values only — open the source file at the cited line to review._\n\n")
        fh.write("**%d staged · %d hold (skipped) · %d flag(s), %d HIGH-severity.**\n\n"
                 % (len(written), held, len(findings), len(highs)))
        if missing:
            fh.write("> ⚠️ Manifest sources not found in vault: %s\n\n" % ", ".join(missing))
        for dest, bucket in written:
            fs = [f for f in findings if f[0] == dest]
            fh.write("## %s  (`%s`)\n" % (dest, bucket))
            if not fs:
                fh.write("- clean\n\n")
                continue
            for _d, sev, cat, ln, masked in fs:
                fh.write("- **%s** %s — line %d — `%s`\n" % (sev.upper(), cat, ln, masked))
            fh.write("\n")

    print("Curation assistant: %d staged, %d held, %d flags (%d HIGH). Report: %s"
          % (len(written), held, len(findings), len(highs), report))
    if highs:
        print("⚠️  %d HIGH-severity flag(s) — review the report before opening a PR." % len(highs))
    if missing:
        print("⚠️  %d manifest source(s) missing from the vault." % len(missing))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
