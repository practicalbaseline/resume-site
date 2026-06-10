# itsjakegray.com

Static personal site → **https://www.itsjakegray.com**

Repo: [github.com/practicalbaseline/resume-site](https://github.com/practicalbaseline/resume-site)

## Deploy

1. Push to `practicalbaseline/resume-site`
2. **Settings → Pages → Source:** `main` branch, `/ (root)`
3. **Settings → Pages → Custom domain:** `www.itsjakegray.com`
4. Wait for DNS check → enable **Enforce HTTPS**

Until the custom domain is live, the site is also at:
`https://practicalbaseline.github.io/resume-site/`

## DNS (Cloudflare or your registrar)

| Type | Name | Value |
|------|------|-------|
| CNAME | `www` | `practicalbaseline.github.io` |

Use **DNS only** (grey cloud in Cloudflare) until GitHub provisions HTTPS.

### Bare domain redirect

Redirect `itsjakegray.com` → `https://www.itsjakegray.com` in Cloudflare **Rules**.

## Verify

```bash
dig www.itsjakegray.com CNAME +short
curl -I https://www.itsjakegray.com
```