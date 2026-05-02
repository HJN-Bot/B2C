# Cat Coach Asset Notes

## Production Asset

- `cat_listening_motion_alpha.png`
- `cat_thinking_motion_alpha.png`
- `cat_coaching_motion_alpha.png`
- `cat_excited_motion_alpha.png`
- RGBA transparent PNGs.
- 4x2 motion sheets currently used by `PracticeRoom`.

Fallback asset:

- `cat_speaking_coach_sprite_sheet_transparent.png`
- RGBA transparent 2x2 state sheet kept as a backup.

State mapping:

| State | Sheet Position | Product Meaning |
|-------|----------------|-----------------|
| listening | `cat_listening_motion_alpha.png` | AI is listening / idle |
| thinking | `cat_thinking_motion_alpha.png` | AI is thinking or user is forming an idea |
| excited | `cat_excited_motion_alpha.png` | high-value phrase or strong moment |
| coaching | `cat_coaching_motion_alpha.png` | pause helper / hint card |

## Reference Assets

The files in `reference/` are useful for art direction and future animation. Some are earlier RGB exports, while the `_alpha` files are transparent source references.

| File | Use |
|------|-----|
| `cat_layered_parts_grid.png` | body / ear / tail / pose reference |
| `cat_face_expression_parts_grid.png` | eyes, brows, mouth expression reference |
| `cat_coach_card_motion_sheet.png` | future coaching animation reference |
| `cat_excited_motion_sheet.png` | future celebration animation reference |
| `cat_thinking_motion_sheet.png` | future thinking animation reference |
| `cat_listening_motion_sheet.png` | future listening/tail/ear motion reference |
| `cat_idle_sit_motion_sheet.png` | future idle breathing and blink reference |
| `cat_modular_parts_grid.png` | modular body part reference |

## Preferred Next Export

For production-quality animation, export each action as a transparent PNG sprite sheet:

- transparent background, RGBA
- equal-size frames
- one action per sheet
- 4 or 8 frames per action
- no baked white/checkerboard background
- recommended actions: `idle`, `listening`, `thinking`, `coaching`, `excited`

This will let the app use CSS `steps()` animation while keeping the current cute art style.
