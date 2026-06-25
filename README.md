# Release Notes Tracker 📊

Built a modern, dark-themed web application using Python Flask, HTML, CSS, and JavaScript that tracks Google Cloud BigQuery release notes in real time. The system fetches and parses live RSS/Atom XML feeds, organizes updates into categorized timelines, supports instant keyword search and filtering, enables direct sharing to X (Twitter), and includes offline cache fallback for improved reliability. The project was developed by applying concepts learned through Google's AI Agents Intensive Course

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
