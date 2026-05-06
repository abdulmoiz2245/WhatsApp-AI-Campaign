# WhatsApp AI Campaign Chatbot — UI Mock

> Pure HTML + Tailwind CDN mock UI. No build step required. Open any HTML file directly in your browser.

---

## Folder Structure

```
WhatsApp Campaing Ai Chatbot/
├── index.html              ← Mock Login page
├── admin.html              ← Redirect → dashboard
│
├── pages/
│   ├── dashboard.html      ← KPI cards, charts, activity feed
│   ├── campaigns.html      ← Campaign table, create/edit modal
│   ├── research.html       ← AI Research topic input + content preview
│   ├── pipeline.html       ← Script → Voiceover → Video → Thumbnail → WA Upload
│   ├── scheduler.html      ← Calendar + 7:00 PM PKT auto-publish
│   ├── contacts.html       ← Contacts list, segments, broadcast groups
│   └── settings.html       ← WhatsApp API, AI config, notifications, account
│
└── assets/
    ├── layout.js           ← Shared sidebar + topbar injector
    └── style.css           ← CSS custom properties, badge helpers, card styles
```

---

## How to Open

### Option 1 — Double-click
Double-click `index.html` in your file manager. It opens in the browser.  
Click **"Sign In"** → goes to `admin.html` → redirects to `pages/dashboard.html`.

### Option 2 — VS Code Live Server (recommended)
1. Install the **Live Server** extension in VS Code.
2. Right-click `index.html` → **"Open with Live Server"**.
3. Navigate between pages using the sidebar.

### Option 3 — Python simple server
```bash
cd "/home/abdul-moiz/Desktop/WhatsApp Campaing Ai Chatbot"
python3 -m http.server 5500
```
Then open: [http://localhost:5500](http://localhost:5500)

---

## Pages & Features

| Page | Route | Features |
|------|-------|----------|
| Login | `index.html` | Email/password mock, WhatsApp SSO button |
| Dashboard | `pages/dashboard.html` | KPI cards, delivery trend chart, campaign type donut, activity feed |
| Campaigns | `pages/campaigns.html` | Full table with status badges, progress bars, create modal, pagination |
| AI Research | `pages/research.html` | Topic input, content type picker, live progress animation, script/voiceover/thumbnail preview |
| AI Pipeline | `pages/pipeline.html` | 6-step stepper, render progress, video preview placeholder, job queue |
| Scheduler | `pages/scheduler.html` | Monthly calendar, today highlight, 7:00 PM PKT live clock, auto-publish toggles |
| Contacts | `pages/contacts.html` | Segments panel, contact table with avatars, import CSV button |
| Settings | `pages/settings.html` | Tabbed: WhatsApp API keys, AI model config, scheduler timezone, notifications, account |

---

## Tech Stack (UI only)
- **Tailwind CSS** v3 via CDN
- **Google Fonts** — Inter
- **Vanilla JS** — sidebar inject, tab switchers, live clock, research progress animation
- No frameworks, no build step

> **IMPORTANT:** This repository is strictly a **static UI mockup**. There is no backend logic, no API calls, and no real data. All interactions are faked using simple JavaScript and placeholder values. You can freely browse and modify everything without any live processes running.

## Deploying / Making the UI Live

Because the entire project consists of static HTML, CSS, and JavaScript files, you can host it anywhere that serves static files. Popular free options include:

1. **GitHub Pages**
    - Push the repository to GitHub.
    - In repo settings, enable **Pages** and point the source to the `main` branch (or `gh-pages`) and the root folder.
    - The site will be available at `https://<username>.github.io/<repo>/`.

2. **Netlify / Vercel**
    - Connect your GitHub repository to Netlify or Vercel.
    - Both services detect static projects automatically and require no build command. Just deploy and they'll give you a live URL (e.g. `https://your-site.netlify.app`).

3. **Any static file host or CDN**
    - Upload the contents of the project directory to a static web host such as Firebase Hosting, Surge.sh, Amazon S3, or even an `http.server` on your own server.

### Local testing
If you want to preview the site locally, use the built-in Python server as described above, or run
```bash
npx serve .
```
from the project root (npm required).

Once deployed, visitors can navigate the UI just like you do locally; all data remains mocked. If you later add a backend, you can swap out the mock scripts with real API endpoints.

### No‑GitHub Alternatives

If you prefer **not to push anything to GitHub**, you still have simple options:

* **Run a local server and share with ngrok** – install [`ngrok`](https://ngrok.com/), then:
    ```bash
    cd "/home/abdul-moiz/Desktop/WhatsApp Campaing Ai Chatbot"
    python3 -m http.server 5500 &                # start local server
    ngrok http 5500                              # expose it via a public URL
    ```
    ngrok gives you a temporary `https://...` URL you can send to others.

* **Manual deploy with Netlify drag‑and‑drop** – go to [Netlify Drop](https://app.netlify.com/drop) and simply drag the project folder onto the page; it will upload the files and give you a live site without any Git integration.

* **Host on your own machine or a VPS** – if you have a server or Raspberry Pi, just copy the directory there and run any static web server (`nginx`, `http-server`, etc.). No GitHub involved.

* **Use a USB stick or network share** – the UI works offline; any colleague can open `index.html` locally from a shared drive.
