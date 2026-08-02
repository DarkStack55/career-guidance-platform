## Light-mode visibility repair

### 1. Correct the global theme foundation
- Replace the current partial “legibility rescue” rules—which only cover content inside `<main>`—with semantic light-mode styling that also covers the navbar, footer, menus, floating chat controls, dialogs, and overlays.
- Strengthen foreground, muted text, border, input, card, popover, hover, focus, disabled, and selected-state tokens for reliable contrast.
- Preserve the intentionally dark authentication experience while keeping every control readable.

### 2. Fix shared components used across the site
- Refactor the navigation bar and desktop/mobile menus to use theme-aware surfaces and text instead of hardcoded white text and black panels.
- Correct footer links, borders, labels, and secondary text.
- Convert `SubPageShell` from its forced black/white presentation to semantic background, foreground, card, border, and accent styles so all subcategory pages support light mode.
- Repair Zoiee/chat launcher and chat surfaces so buttons, icons, messages, inputs, and borders remain visible over light pages.
- Review reusable heroes, cards, forms, buttons, badges, tabs, modals, and assessment shells for the same issue.

### 3. Repair route-specific contrast defects
- Audit all content route families: Home, Assessment, Dashboard, Roadmap, Mentors, Scholarships, Internships, Blog, jobs, profile, resources, and their subcategory pages.
- Replace hardcoded dark-theme classes where they create white-on-white text, invisible translucent cards, faint borders, unreadable placeholders, or incorrect selected/hover states.
- Keep intentional image-overlay sections dark only where their own background guarantees contrast.

### 4. Validate the complete site
- Check every generated route in light mode at desktop and mobile widths.
- Verify normal, hover, focus, active, selected, disabled, loading, empty, modal, dropdown, and form-error states.
- Confirm there is no invisible text/button content, no low-contrast white-on-white controls, and no regression to dark mode or auth screens.