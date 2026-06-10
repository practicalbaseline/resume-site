# itsjakegray.com

**https://www.itsjakegray.com**

## Fix 404 (run once)

```bash
bash setup-pages.sh
```

Then configure Pages in GitHub Settings (the script prints the link).

### Why 404 happens

1. **Repo is private** — GitHub Pages on free plans requires a **public** repo
2. **Pages not enabled** — must turn on in Settings → Pages
3. **Wrong DNS** — `www` must CNAME to `practicalbaseline.github.io`, not A records to Cloudflare

### Cloudflare DNS

| Type | Name | Value | Proxy |
|------|------|-------|-------|
| CNAME | `www` | `practicalbaseline.github.io` | DNS only (grey cloud) |

Delete any existing `www` A records first.

### Verify

```bash
dig www.itsjakegray.com CNAME +short
curl -I https://practicalbaseline.github.io/resume-site/
curl -I https://www.itsjakegray.com
```