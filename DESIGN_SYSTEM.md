### Button Color Usage

- **Primary (Blue/Friend Primary)**: Main call-to-action (Save, Submit, Add).
- **Secondary (Lighter/Friend Secondary)**: Alternative actions (Cancel, Back).
- **Accent (Highlight/Friend Accent)**: Toggles, active states, selected items.
- **Success (Green)**: Confirmations, positive actions.
- **Danger (Red)**: Destructive actions (Delete, Remove).
- **Warning (Yellow)**: Alerts, cautions.

### Focus & Navigation

- All interactive elements must have focus styles (`outline` or `box-shadow`).
- Gamepad navigation uses a "magnetic" focus system finding the nearest element in the cardinal direction.
- Focus sounds (`hover`) play when focus changes via controller/keyboard.

### Typography

- Headings are always uppercase and bold.
- Body text uses the pixel font stack.
- Font sizes scale with the global scale factor.
- Use CSS variables (`--font-size-sm`, `--font-size-md`, etc.) instead of hardcoded pixel values.
