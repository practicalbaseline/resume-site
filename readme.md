# itsjakegray.com

**https://www.itsjakegray.com**

Repo: [github.com/practicalbaseline/resume-site](https://github.com/practicalbaseline/resume-site)

## One-time GitHub setup

1. Repo must be **Public** (required for free GitHub Pages)
2. **Settings → Pages → Build and deployment → Source:** `GitHub Actions`
3. **Settings → Pages → Custom domain:** `www.itsjakegray.com`
4. Enable **Enforce HTTPS** after DNS check passes

Pushes to `main` auto-deploy via `.github/workflows/pages.yml`.

## DNS (Cloudflare)

| Type | Name | Value | Proxy |
|------|------|-------|-------|
| CNAME | `www` | `practicalbaseline.github.io` | DNS only (grey cloud) |

Remove any `www` A records pointing to Cloudflare IPs — they block GitHub from verifying the domain.

### Bare domain

Redirect `itsjakegray.com` → `https://www.itsjakegray.com` in Cloudflare **Rules**.

## Verify

```bash
dig www.itsjakegray.com CNAME +short
# should return: practicalbaseline.github.io

curl -I https://practicalbaseline.github.io/resume-site/
curl -I https://www.itsjakegray.com
```