# Project-local skills

Copied from upstream on **2026-04-17**. To refresh, re-copy from the listed commit (or later) and bump the SHA here.

| Skill dir | Source repo | Path in source | Commit SHA |
|---|---|---|---|
| `react-agents-review/` | [OpenAEC-Foundation/React-Claude-Skill-Package](https://github.com/OpenAEC-Foundation/React-Claude-Skill-Package) | `skills/source/react-agents/react-agents-review/` | `aa2b2ea7b21ab0c12a0a65362c29997d0fc5136b` |
| `advanced-react-patterns/` | [MyLightIsOn/advanced-react-claude-skills](https://github.com/MyLightIsOn/advanced-react-claude-skills) | repo root (SKILL.md + advanced-patterns.md + reconciliation-deep-dive.md + README.md) | `626384b832740a6dbc3af920a0c3c899962193d8` |
| `webapp-testing/` | [anthropics/skills](https://github.com/anthropics/skills) | `skills/webapp-testing/` | `2c7ec5e78b8e5d43ea02e90bb8826f6b9f147b0c` |

## Refresh procedure

```bash
cd /tmp && rm -rf skill-src && mkdir skill-src && cd skill-src
git clone --depth 1 https://github.com/OpenAEC-Foundation/React-Claude-Skill-Package.git openaec-react
git clone --depth 1 https://github.com/MyLightIsOn/advanced-react-claude-skills.git advanced-react
git clone --depth 1 --filter=blob:none --sparse https://github.com/anthropics/skills.git anthropic-skills
(cd anthropic-skills && git sparse-checkout set skills/webapp-testing)

# Replace project-local copies (run from apps/next_pms/)
rm -rf .claude/skills/react-agents-review .claude/skills/advanced-react-patterns .claude/skills/webapp-testing
cp -r /tmp/skill-src/openaec-react/skills/source/react-agents/react-agents-review .claude/skills/
mkdir -p .claude/skills/advanced-react-patterns
cp /tmp/skill-src/advanced-react/{SKILL.md,advanced-patterns.md,reconciliation-deep-dive.md,README.md} .claude/skills/advanced-react-patterns/
cp -r /tmp/skill-src/anthropic-skills/skills/webapp-testing .claude/skills/

# Then update the SHAs above.
```
