# Personal Resume Site

A living resume of how I think, how I work, what I believe, and the projects I'm building.

## Pages

- **Home** — Introduction and philosophy pillars
- **Principles** — General principles I subscribe to (starting with Isaac Asimov)
- **Projects** — Active work with links to live deployments
- **Articles** — AI best practices and deep dives

## Local development

No build step required. Open `index.html` in a browser, or serve locally:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Deploy to GitHub Pages

1. Push this repo to GitHub
2. Go to **Settings → Pages**
3. Under **Source**, select **Deploy from a branch**
4. Choose the `main` branch and `/ (root)` folder
5. Click **Save**

Your site will be live at `https://<username>.github.io/<repo-name>/` within a few minutes.

## Custom domain

1. Create a `CNAME` file in the repo root containing your domain:

   ```
   yourdomain.com
   ```

2. In your DNS provider, add records pointing to GitHub Pages:
   - **A records** pointing to GitHub's IPs:
     - `185.199.108.153`
     - `185.199.109.153`
     - `185.199.110.153`
     - `185.199.111.153`
   - Or a **CNAME record** pointing `www` to `<username>.github.io`

3. In **Settings → Pages**, enter your custom domain and enable **Enforce HTTPS**

## Customization

| What | Where |
|------|-------|
| Your name | `index.html`, all page titles |
| Principles / quotes | `principles.html` |
| Projects | `projects.html` — duplicate a `.project-item` block |
| Articles | `articles/` directory |
| Colors & fonts | `css/style.css` (`:root` variables) |

## Tech

Static HTML, CSS, and vanilla JavaScript. No frameworks, no build tools, no dependencies. Designed for GitHub Pages hosting with optional custom domain support.