---
date: 2026-10-02
type: reference
status: reference
container: standalone
summary: "Audited initialization rules, provenance and validation for the Pendor lords and ladies reference."
---

# Lords extraction notes

Extracted from the installed **Prophesy of Pendor QoL Plus v2**, module version 3950. No wiki data. The public JSON contains source filenames, SHA-256 hashes, file lines and operation indices; local installation paths are omitted.

- **105 kings/lords and 100 ladies:** five kings, 100 noble lords, 40 initially married ladies, 60 initially unmarried ladies. Legacy lady IDs are retained; names are taken from the contiguous in-game lady block.
- **Personality:** 40 lords have fixed personalities; 60 vary by new game. The first eight lords in each faction are Martial, Martial, Quarrelsome, Pitiless, Cunning, Sadistic, Good-natured and Upstanding. The next four draw from all seven, with Martial twice as likely. The last eight either draw the same distribution or inherit their father's fixed personality, each branch with probability 50%. Kings have no lord-personality assignment. Lady personalities are random; daughters have a father-specific distribution.
- **Renown:** kings are explicitly assigned 1200 and excluded from the later non-ruler loop. Other lords receive `floor(level²/4) + floor(age²/8) + U[100,200)`. Upper random bounds are exclusive. Elder ages are 45–63; middle ages 25–35; younger ages are 20–40 and depend on their father's age minus 23–25. Lady renown is omitted because this initialization does not assign it.
- **Households:** 41 kings/lords have explicit slot-158 troops and slot-159/160 quantities. The script adds one to the upper quantity before its random draw, so the displayed maximum is inclusive. These are reinforcement-event quantities, not party totals. Kings receive an additional listed troop in a 0–3 draw. The 15 normal faction reinforcement templates are also extracted separately; they are not household assignments. Fief-based order recruitment can change with ownership and is excluded from household claims.
- **Family reach:** counts mean other noble lords recognized by the game's family-relation script, excluding self, kings and ladies. Fixed and possible named kin are separate. Elder and younger lords have 1–15 lord kin; middle lords 0; wives 2–9; daughters 2–16; wards 1; kings 0. Each faction's eight elders independently choose from six genealogical placeholder father IDs. A shared ID generates siblings, nephews/uncles and cousins; in-laws are included only where the script recognizes them. Placeholders are not named characters. The ranges are **tight per person**, not simultaneous minima for the entire faction. Possible kin links are correlated.
- **Kinship bonus:** the catalog records the script's numeric kinship bonus separately from network size. It is not a current relationship score. Initialization also adds random relation points and simulates political events.
- **Marriage:** 60 initially unmarried lords are potential female-PC targets. Their personalities are variable, and **Martial and Upstanding personalities always refuse in the female-PC marriage checklist**. Other personalities face additional chemistry, relationship, property, allegiance and competing-suitor checks. The 60 initially unmarried ladies are potential male-PC targets. These fields describe starting pools; they do not guarantee courtship success or present-save availability.
- **Personal stats:** extracted level, attributes, skills and proficiencies are static troop definitions. Aristocracy initialization adjusts age/appearance rather than these stats. Engine-side variation and later leveling are not modeled.

`catalog/build_lords.py` fails closed on any changed fingerprint of the audited scripts, troops, conversation or party-template files. Re-audit before supporting another module revision. Field evidence is inline for explicit assignments and keyed into the catalog's `evidence` table for shared rules.

The numeric operation semantics were cross-checked against the [Module System header_operations source](https://github.com/CaueVaranda/Warband-Module-System/blob/main/header_operations.py); labels and gameplay assignments come from the installed game files. The standard header names self-righteous/debauched correspond to the displayed Pitiless/Sadistic terminology; the source also uses calculating/debauched in some debug strings.

Build with `python catalog/build_lords.py --module "<installed module>"`. Validate with `PENDOR_MODULE` set to that path, then run `python -m unittest discover -s catalog -p test_lords.py -v`.

Focused checks passed: scope/uniqueness, public-path sanitization, representative personalities and troop assignments, exclusive renown bounds, exact parent/sibling/cousin labels, marriage blockers, feasible extrema using actual six-ID pools, random-draw family-bound checks and rejection of an altered script fingerprint.
