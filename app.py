import os
import re
import urllib.request
import xml.etree.ElementTree as ET
import json
from flask import Flask, jsonify, render_template, request

app = Flask(__name__)

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"
CACHE_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "cache.json")

def clean_html_to_text(html_content):
    # Remove HTML tags
    text = re.sub(r'<[^>]+>', '', html_content)
    # Decode common HTML entities
    text = text.replace('&nbsp;', ' ').replace('&amp;', '&').replace('&lt;', '<').replace('&gt;', '>').replace('&quot;', '"').replace('&#39;', "'")
    # Collapse multiple whitespaces/newlines
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def split_release_notes(content_html, entry_link):
    # Find all occurrences of <h3>...</h3> and the text following it up to the next <h3> or end of string
    pattern = r'<h3>(.*?)</h3>(.*?)(?=<h3>|$)'
    matches = re.findall(pattern, content_html, re.DOTALL)
    
    items = []
    for match in matches:
        update_type = match[0].strip()
        update_content = match[1].strip()
        
        # Extract direct link if possible (Google Cloud release notes use anchors like #June_15_2026)
        # We can append the type to the link to make it more specific
        clean_type_anchor = update_type.lower().replace(" ", "-")
        specific_link = f"{entry_link}#{clean_type_anchor}" if entry_link else FEED_URL
        
        items.append({
            'type': update_type,
            'content': update_content,
            'plain_text': clean_html_to_text(update_content),
            'link': specific_link
        })
        
    if not matches:
        # Fallback if there are no H3 tags
        items.append({
            'type': 'Update',
            'content': content_html,
            'plain_text': clean_html_to_text(content_html),
            'link': entry_link or FEED_URL
        })
        
    return items

def fetch_and_parse_feed():
    try:
        req = urllib.request.Request(
            FEED_URL, 
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
        )
        with urllib.request.urlopen(req, timeout=10) as response:
            xml_data = response.read()
            
        root = ET.fromstring(xml_data)
        ns = {'atom': 'http://www.w3.org/2005/Atom'}
        
        all_updates = []
        
        for entry in root.findall('atom:entry', ns):
            title = entry.find('atom:title', ns).text  # Usually the date, e.g. "June 15, 2026"
            updated = entry.find('atom:updated', ns).text
            content_elem = entry.find('atom:content', ns)
            content_html = content_elem.text if content_elem is not None else ""
            
            link_elem = entry.find('atom:link', ns)
            entry_link = link_elem.attrib.get('href') if link_elem is not None else ""
            
            split_items = split_release_notes(content_html, entry_link)
            
            for index, item in enumerate(split_items):
                # Unique ID for UI selections/filtering
                unique_id = f"{updated.replace(':', '-').replace('+', '-')}-{index}"
                all_updates.append({
                    'id': unique_id,
                    'date': title,
                    'updated': updated,
                    'type': item['type'],
                    'content': item['content'],
                    'plain_text': item['plain_text'],
                    'link': item['link']
                })
                
        # Write to cache
        with open(CACHE_FILE, 'w', encoding='utf-8') as f:
            json.dump(all_updates, f, ensure_ascii=False, indent=2)
            
        return all_updates, None
    except Exception as e:
        print(f"Error fetching or parsing feed: {str(e)}")
        # Try to read from cache if network fails
        if os.path.exists(CACHE_FILE):
            try:
                with open(CACHE_FILE, 'r', encoding='utf-8') as f:
                    cached_data = json.load(f)
                return cached_data, f"Failed to fetch live feed. Showing cached data. Error: {str(e)}"
            except Exception as cache_err:
                return [], f"Failed to fetch live feed and cache read failed: {str(cache_err)}"
        return [], f"Failed to fetch live feed: {str(e)}"

def get_release_notes(force_refresh=False):
    if not force_refresh and os.path.exists(CACHE_FILE):
        try:
            with open(CACHE_FILE, 'r', encoding='utf-8') as f:
                return json.load(f), None
        except Exception:
            pass
    return fetch_and_parse_feed()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/notes')
def get_notes_api():
    notes, error = get_release_notes()
    return jsonify({
        'success': error is None or len(notes) > 0,
        'notes': notes,
        'error': error
    })

@app.route('/api/refresh')
def refresh_api():
    notes, error = get_release_notes(force_refresh=True)
    return jsonify({
        'success': error is None or len(notes) > 0,
        'notes': notes,
        'error': error
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)
