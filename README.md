# BigQuery Release Notes Tracker 📊

A sleek, modern, and dark-themed web application built with **Python Flask** and **plain vanilla HTML, CSS, and JavaScript**. This app fetches the live Google Cloud BigQuery RSS/Atom XML feed, parses the updates into distinct cards, and allows you to search, filter, and share updates directly on X (Twitter).

## 🚀 Features

- **Live XML Feed Fetching**: Pulls real-time release notes directly from Google Cloud.
- **Categorized Badges**: Automatically separates and labels updates as `Feature`, `Issue`, or `Deprecation`.
- **Dynamic Timeline**: Grouped chronologically by date in a clean vertical timeline.
- **Real-Time Client-Side Search**: Instantly search updates by keywords (e.g., "Gemini", "SQL", "GA").
- **Category Filter Pills**: Filter notes by type with one click.
- **X (Twitter) Composer Modal**: Edit and preview updates in a custom in-app mockup before publishing to X.
- **Local Cache Fallback**: Keeps the app functional even when offline or if the feed is temporarily unavailable.

## 🛠️ Tech Stack

- **Backend**: Python 3.x, Flask
- **Frontend**: Vanilla HTML5, CSS3, JavaScript (ES6)
- **Icons**: Font Awesome (via CDN)
- **Typography**: Google Fonts (Outfit, Inter)

## 💻 How to Run Locally

1. **Clone the repository**:
   ```bash
   git clone <your-github-repo-url>
   cd bigquery-release-notes-app
   ```

2. **Install requirements** (Flask is the only requirement):
   ```bash
   pip install flask
   ```

3. **Start the Flask server**:
   ```bash
   python app.py
   ```

4. **Open in browser**:
   Go to [http://127.0.0.1:5000](http://127.0.0.1:5000)

---
*Created as part of my cloud development and data engineering learning journey!*
