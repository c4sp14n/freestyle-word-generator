# 🎤 FreestyleFlow

**Random word generator for freestyle practice.** Get a random word, set your timer, and let the bars flow.

🔗 **[Try it live →](https://c4sp14n.github.io/freestyle-word-generator/)**

---

## ✨ Features

| | Feature | Description |
|---|---|---|
| 🌍 | **Multi-language** | Supports multiple languages — easy to add more |
| ⏱️ | **Adjustable timer** | Set word interval from 1 to 30 seconds |
| 🔐 | **Secure randomness** | Uses `crypto.getRandomValues()` for true random picks |
| 📱 | **Mobile-first** | Designed for phones, scales beautifully to desktop |
| ⌨️ | **Keyboard shortcut** | Press `Space` to start/stop |
| 📊 | **Session stats** | Tracks words shown and rounds completed |
| 🚀 | **Static & fast** | No backend, no API calls — runs entirely in your browser |

## 🚀 Getting Started

Just open `index.html` in your browser — no build tools or dependencies needed.

```bash
# Clone the repo
git clone https://github.com/c4sp14n/freestyle-word-generator.git

# Open in browser
open index.html
```

Or use a local server:

```bash
python3 -m http.server 8080
# → http://localhost:8080
```

## 🌍 Adding a New Language

Adding a language takes two simple steps:

**1.** Create a word list file in `data/` with one word per line:

```
data/EN.txt
```

**2.** Register it in `js/app.js` by adding an entry to the `LANGUAGES` array:

```javascript
const LANGUAGES = [
  { code: 'AZ', label: 'Azərbaycan', file: 'AZ.txt' },
  { code: 'EN', label: 'English', file: 'EN.txt' },  // ← add your language
]
```

That's it — the new language will appear in the dropdown automatically.

## 📁 Project Structure

```
freestyle-word-generator/
├── index.html        ← Main page
├── css/
│   └── style.css     ← Styling (dark theme, glassmorphism, animations)
├── js/
│   └── app.js        ← Core logic (timer, random words, state management)
└── data/
    └── AZ.txt        ← Azerbaijani word list (3111 words)
```

## 🛠️ Tech Stack

- **HTML5** — Semantic, accessible markup
- **Vanilla CSS** — Custom properties, glassmorphism, SVG animations
- **Vanilla JS** — Zero dependencies, IIFE module pattern
- **GitHub Pages** — Free static hosting

## 📄 License

MIT
