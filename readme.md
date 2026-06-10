# itsjakegray.com

Static personal site. Hosted on GitHub Pages at **https://www.itsjakegray.com**

## Deploy

1. Push this repo to GitHub
2. **Settings → Pages → Source:** `main` branch, `/ (root)`
3. **Settings → Pages → Custom domain:** `www.itsjakegray.com`
4. Wait for DNS check, then enable **Enforce HTTPS**

## DNS (at your domain registrar)

| Type | Name | Value |
|------|------|-------|
| CNAME | `www` | `<your-github-username>.github.io` |

Replace `<your-github-username>` with your GitHub username (or org name).

### Optional: redirect bare domain to www

If you also own `itsjakegray.com` (without www), set a redirect at your registrar:

`itsjakegray.com` → `https://www.itsjakegray.com`

Or add GitHub's apex A records for `@` and configure both in GitHub Pages docs.

## Verify

```bash
dig www.itsjakegray.com CNAME +short
curl -I https://www.itsjakegray.com
```

DNS can take up to 24–48 hours to propagate (often much faster).