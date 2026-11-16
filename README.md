# TAC-USA 2026

BigCommerce Stencil theme for TAC-USA 2026 (development / staging).

- Homepage merchandising: **Page Builder** custom widgets (field-editable)
- Header / pills / footer: Theme Editor
- Makeswift: **off**
- Catalog: live PLP / PDP / search
  
Theme: TAC-USA 2026 · Blank · v1.0.0  

## Commands

```bash
npm run check              # stencil bundle (required validation)
npm run check:layout       # static homepage width/gutter/promo protected-layout assertions
npm run bundle             # produce TAC-USA 2026-*.zip locally (gitignored)
npm run push               # upload + activate TAC-USA 2026 on staging channel 1
npm run push:source        # upload + activate same theme on SOURCE (TAC test) store
npm run migrate:homepage-to-source  # copy homepage PB templates/widgets staging → SOURCE
npm run seed:page-builder  # re-seed homepage Page Builder widgets (API)
npm run update:lower-merch # non-destructive replace of lower homepage merch rows only
npm start                  # local Stencil preview
```

Requires Stencil CLI plus gitignored config.stencil.json and secrets.stencil.json.  
Staging↔SOURCE handoff notes: [docs/MIGRATE-STAGING-TO-SOURCE.md](docs/MIGRATE-STAGING-TO-SOURCE.md).

There is no headless browser / CI layout suite in this repository yet. `check:layout` asserts theme source anchors only; rendered desktop/mobile review is still required for protected homepage changes.

## Documentation

**Mandatory visual rules:** [docs/STYLE-GUIDE.md](docs/STYLE-GUIDE.md) (also enforced via always-applied Cursor rule + [AGENTS.md](AGENTS.md)).

**User guides (start here):** [docs/guides/README.md](docs/guides/README.md)

| Guide | Topic |
| --- | --- |
| [Homepage map](docs/guides/HOMEPAGE-MAP.md) | Each homepage section + content source |
| [Category URLs](docs/guides/CATEGORY-URLS.md) | Whether/how to rename paths like `/categories/computers-accessories/` |
| [Media](docs/guides/MEDIA.md) | Placeholder vs needed photography |
| [Theme architecture](docs/guides/THEME-ARCHITECTURE.md) | How the Stencil theme is built |
| [BigCommerce updates](docs/guides/BIGCOMMERCE-UPDATES.md) | How Ann/devs edit in CP |
| [Review checklist](docs/guides/REVIEW-CHECKLIST.md) | Clickable staging URLs to review |

Shorter handover stubs: [docs/HANDOVER.md](docs/HANDOVER.md), [docs/EDITING-STOREFRONT.md](docs/EDITING-STOREFRONT.md), [docs/PAGE-BUILDER.md](docs/PAGE-BUILDER.md).
