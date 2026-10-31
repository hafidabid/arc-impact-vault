# Visual design system

## Palette

| Token | Value | Use |
|---|---|---|
| Forest | `#164D42` | Primary buttons, active navigation, strong headings |
| Sage | `#91AD9D` | Decorative surfaces, quiet accents, chart fills |
| Ivory | `#F8F8F3` | Main background, text on forest |
| Gold | `#D7B36B` | Sponsor/demo accents and selected highlights |
| Ink | `#20342F` | Body text, labels and numerical balances |

Use ink text on ivory, sage and gold; ivory text on forest. Do not use sage or gold as small text on ivory. Gold does not mean verified or guaranteed. Status labels always include words and an icon. Financial chart series use labels and patterns in addition to color.

## Typography

Proposed typeface: **Inter**, with `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif` fallback. Use locally hosted licensed font assets when available; the package includes no fonts.

Body: 16px/1.5, regular. Small supporting copy: 14px/1.5. Labels: 14px/1.4, medium. Page heading: 28px/1.2 mobile and 36px/1.2 desktop. Section heading: 22px/1.3. Balance: 32px/1.15 mobile and 40px/1.15 desktop, semibold with tabular numerals. Avoid all-caps paragraphs. Keep reading width near 68 characters.

## Layout and components

Use a 4px spacing base: 4, 8, 12, 16, 24, 32, 48, 64px. Page gutters: 16px mobile, 24px tablet, 32px desktop. Maximum content width: 1200px. Cards: 16px radius, 24px padding (16px on narrow screens), light ink border and restrained shadow. Buttons: at least 44px high; primary forest/ivory, secondary ivory/forest with border. Form controls have persistent labels, helper text and inline error text.

Core components: balance card with source label; pool card; transaction status chip; amount input; allocation review; receipt; source-to-destination flow row; evidence card; reviewer decision panel; empty/error/loading states; demo banner.

## Accessibility and motion

Target WCAG 2.2 AA. Verify contrast in implementation, including disabled and focus states. Provide a visible 2px forest focus outline with 2px ivory separation, keyboard access, dialog focus management, explicit error summaries, and accessible names for icon controls. Maintain 44px touch targets and support 200% zoom and narrow screens without page-level horizontal scrolling. Announce transaction state changes without stealing focus. Respect reduced-motion preferences; use short 150ms transitions otherwise. No animation implies money has settled before confirmation.
