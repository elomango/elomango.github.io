# Multilingual Site Structure

This website now supports multiple languages with a build system for easy maintenance.

## Current Languages
- Korean (ko) - 한국어
- English (en)

## Directory Structure
```
elomango.github.io/
├── index.html              # Language selector page
├── ko/                     # Korean version
│   ├── index.html
│   ├── privacy.html
│   └── terms.html
├── en/                     # English version
│   ├── index.html
│   ├── privacy.html
│   └── terms.html
├── assets/
│   ├── css/               # Shared styles
│   ├── js/                # Shared scripts
│   └── i18n/              # Translation files
│       ├── ko.json
│       └── en.json
├── templates/             # HTML templates
│   └── index.template.html
├── distribution_schedule/  # ETF Calendar (English only)
└── build.js               # Build script
```

## How to Build

1. Edit translation files in `assets/i18n/`
2. Run the build command:
```bash
npm run build
```

## Adding a New Language

1. Create a new translation file: `assets/i18n/[lang].json`
   - Copy from `en.json` and translate all values

2. Update `build.js`:
   ```javascript
   const languages = ['ko', 'en', 'ja']; // Add new language code
   ```

3. Update the language selector in `templates/index.template.html`:
   ```html
   <option value="ja" {{#if_eq lang 'ja'}}selected{{/if_eq}}>🇯🇵 日本語</option>
   ```

4. Update the root `index.html` language selector page

5. Run `npm run build`

6. Update `sitemap.xml` with new language URLs

## SEO Optimization

Each page includes:
- `hreflang` tags for language alternatives
- Canonical URLs
- Language-specific meta descriptions
- Proper language attributes

## Language Detection

The site:
1. Checks for saved language preference in localStorage
2. If returning visitor, redirects to their preferred language
3. First-time visitors see language selection page
4. Browser language is highlighted as suggestion

## Notes

- Distribution schedule remains English-only
- Privacy and Terms pages need full translation for production
- All shared assets are in `/assets/` folder
- Build script handles template processing automatically