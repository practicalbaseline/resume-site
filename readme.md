# Personal Resume Site

One page. Projects on the left, principles on the right, occasional writing below.

## Structure

```
index.html          # everything lives here
blog/               # individual posts, linked from home
css/style.css
```

## Local preview

```bash
python3 -m http.server 8000
```

## GitHub Pages

1. Push to GitHub
2. **Settings → Pages → Deploy from branch → `main` / root**
3. Done

All paths are relative — works at `username.github.io/repo-name/` or a custom domain.

## Customize

- **Projects** — edit the `<ul class="project-list">` in `index.html`
- **Principles** — edit the `<ul class="principle-list">` in `index.html`
- **Blog posts** — add HTML files in `blog/`, link them in the Writing section