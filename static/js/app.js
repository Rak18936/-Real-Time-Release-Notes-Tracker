// Global State
let allNotes = [];
let filteredNotes = [];
let currentFilter = 'all';
let searchQuery = '';

// DOM Elements
const notesContainer = document.getElementById('notes-container');
const loadingState = document.getElementById('loading-state');
const emptyState = document.getElementById('empty-state');
const errorBanner = document.getElementById('error-banner');
const errorMessage = document.getElementById('error-message');
const btnRefresh = document.getElementById('btn-refresh');
const searchInput = document.getElementById('search-input');
const btnClearSearch = document.getElementById('btn-clear-search');
const filterPills = document.querySelectorAll('.filter-pill');
const btnResetFilters = document.getElementById('btn-reset-filters');

// Stats Elements
const statTotal = document.querySelector('#stat-total .stat-value');
const statFeature = document.querySelector('#stat-feature .stat-value');
const statIssue = document.querySelector('#stat-issue .stat-value');

// Modal Elements
const tweetModal = document.getElementById('tweet-modal');
const tweetTextarea = document.getElementById('tweet-textarea');
const charCount = document.getElementById('char-count');
const charProgress = document.getElementById('char-progress');
const btnCloseModal = document.getElementById('btn-close-modal');
const btnCancelTweet = document.getElementById('btn-cancel-tweet');
const btnSendTweet = document.getElementById('btn-send-tweet');
const attachmentUrl = document.getElementById('attachment-url');

// Constants
const MAX_TWEET_LENGTH = 280;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    fetchNotes(false);
    setupEventListeners();
});

// Event Listeners Setup
function setupEventListeners() {
    // Refresh button click
    btnRefresh.addEventListener('click', () => {
        fetchNotes(true);
    });

    // Search input
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase().trim();
        btnClearSearch.style.display = searchQuery ? 'block' : 'none';
        applyFiltersAndSearch();
    });

    // Clear search button
    btnClearSearch.addEventListener('click', () => {
        searchInput.value = '';
        searchQuery = '';
        btnClearSearch.style.display = 'none';
        applyFiltersAndSearch();
    });

    // Filter pills
    filterPills.forEach(pill => {
        pill.addEventListener('click', () => {
            filterPills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            currentFilter = pill.getAttribute('data-type');
            applyFiltersAndSearch();
        });
    });

    // Reset filters
    btnResetFilters.addEventListener('click', resetSearchAndFilters);
    
    // Alert close
    document.querySelector('.alert-close').addEventListener('click', () => {
        errorBanner.style.display = 'none';
    });

    // Tweet Modal actions
    btnCloseModal.addEventListener('click', closeTweetModal);
    btnCancelTweet.addEventListener('click', closeTweetModal);
    
    // Character limit counter for tweet composer
    tweetTextarea.addEventListener('input', updateCharCounter);

    // Send tweet
    btnSendTweet.addEventListener('click', publishTweet);

    // Close modal if clicking outside
    tweetModal.addEventListener('click', (e) => {
        if (e.target === tweetModal) {
            closeTweetModal();
        }
    });
}

// Fetch Notes from API
async function fetchNotes(forceRefresh = false) {
    showLoading(true);
    errorBanner.style.display = 'none';
    
    // Add spinning animation to refresh icon
    const refreshIcon = btnRefresh.querySelector('.btn-icon');
    if (refreshIcon) refreshIcon.classList.add('spinning');
    btnRefresh.disabled = true;

    const endpoint = forceRefresh ? '/api/refresh' : '/api/notes';
    
    try {
        const response = await fetch(endpoint);
        const data = await response.json();
        
        if (data.success) {
            allNotes = data.notes;
            if (data.error) {
                // If there's a soft error (e.g. read from cache on network failure)
                showError(data.error);
            }
            updateStats();
            applyFiltersAndSearch();
        } else {
            showError(data.error || 'Failed to fetch release notes.');
            showLoading(false);
            notesContainer.style.display = 'none';
            emptyState.style.display = 'flex';
        }
    } catch (err) {
        showError('Network error occurred while fetching release notes.');
        showLoading(false);
        notesContainer.style.display = 'none';
        emptyState.style.display = 'flex';
    } finally {
        if (refreshIcon) refreshIcon.classList.remove('spinning');
        btnRefresh.disabled = false;
    }
}

// UI State Toggles
function showLoading(isLoading) {
    if (isLoading) {
        loadingState.style.display = 'flex';
        notesContainer.style.display = 'none';
        emptyState.style.display = 'none';
    } else {
        loadingState.style.display = 'none';
    }
}

function showError(msg) {
    errorMessage.textContent = msg;
    errorBanner.style.display = 'flex';
    // Scroll to top to show error
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Reset filters to default state
function resetSearchAndFilters() {
    searchInput.value = '';
    searchQuery = '';
    btnClearSearch.style.display = 'none';
    
    filterPills.forEach(p => p.classList.remove('active'));
    document.querySelector('[data-type="all"]').classList.add('active');
    currentFilter = 'all';
    
    applyFiltersAndSearch();
}

// Update Dashboard Statistics
function updateStats() {
    const total = allNotes.length;
    const features = allNotes.filter(n => n.type.toLowerCase() === 'feature').length;
    const issues = allNotes.filter(n => n.type.toLowerCase() === 'issue').length;
    
    statTotal.textContent = total;
    statFeature.textContent = features;
    statIssue.textContent = issues;
}

// Filter and Search Logic
function applyFiltersAndSearch() {
    filteredNotes = allNotes.filter(note => {
        // Apply Filter Pill
        let matchesFilter = true;
        if (currentFilter !== 'all') {
            if (currentFilter === 'other') {
                const knownTypes = ['feature', 'issue', 'deprecation'];
                matchesFilter = !knownTypes.includes(note.type.toLowerCase());
            } else {
                matchesFilter = note.type.toLowerCase() === currentFilter.toLowerCase();
            }
        }
        
        // Apply Search query
        let matchesSearch = true;
        if (searchQuery) {
            matchesSearch = note.date.toLowerCase().includes(searchQuery) ||
                            note.type.toLowerCase().includes(searchQuery) ||
                            note.plain_text.toLowerCase().includes(searchQuery) ||
                            note.content.toLowerCase().includes(searchQuery);
        }
        
        return matchesFilter && matchesSearch;
    });

    renderNotes();
}

// Render release notes to feed container
function renderNotes() {
    showLoading(false);
    notesContainer.innerHTML = '';
    
    if (filteredNotes.length === 0) {
        notesContainer.style.display = 'none';
        emptyState.style.display = 'flex';
        return;
    }
    
    emptyState.style.display = 'none';
    notesContainer.style.display = 'grid';
    
    // Group updates by date
    const grouped = {};
    filteredNotes.forEach(note => {
        if (!grouped[note.date]) {
            grouped[note.date] = [];
        }
        grouped[note.date].push(note);
    });
    
    // Render grouped layout
    for (const date in grouped) {
        const dateSection = document.createElement('div');
        dateSection.className = 'date-section';
        
        // Date Header
        const dateHeader = document.createElement('div');
        dateHeader.className = 'date-header';
        dateHeader.innerHTML = `<span class="date-badge">${date}</span>`;
        dateSection.appendChild(dateHeader);
        
        // Updates Wrapper
        const contentWrapper = document.createElement('div');
        contentWrapper.className = 'date-content-wrapper';
        
        grouped[date].forEach(note => {
            const card = document.createElement('article');
            const lowerType = note.type.toLowerCase();
            let cardClass = 'update-card';
            let tagClass = 'update-tag';
            
            if (lowerType === 'feature') {
                cardClass += ' card-feature';
                tagClass += ' tag-feature';
            } else if (lowerType === 'issue') {
                cardClass += ' card-issue';
                tagClass += ' tag-issue';
            } else if (lowerType === 'deprecation') {
                cardClass += ' card-deprecation';
                tagClass += ' tag-deprecation';
            } else {
                tagClass += ' tag-other';
            }
            
            card.className = cardClass;
            card.id = note.id;
            
            card.innerHTML = `
                <div class="card-header-line">
                    <span class="${tagClass}">${note.type}</span>
                    <div class="card-actions">
                        <button class="card-action-btn tweet-btn-inline" onclick="openTweetModal('${note.id}')" title="Tweet about this update">
                            <i class="fa-brands fa-x-twitter"></i> Tweet
                        </button>
                        <a href="${note.link}" target="_blank" class="card-action-btn" title="View original documentation">
                            <i class="fa-solid fa-arrow-up-right-from-square"></i> Docs
                        </a>
                    </div>
                </div>
                <div class="card-body">
                    ${note.content}
                </div>
            `;
            
            contentWrapper.appendChild(card);
        });
        
        dateSection.appendChild(contentWrapper);
        notesContainer.appendChild(dateSection);
    }
}

// Tweet Composer Modal Logic
function openTweetModal(id) {
    const note = allNotes.find(n => n.id === id);
    if (!note) return;
    
    // Create pre-composed tweet text
    // Example: BigQuery Update: Gemini Cloud Assist is in Preview...
    // Strip hashtags or format clean text
    const dateStr = note.date;
    const typeStr = note.type.toUpperCase();
    const cleanText = note.plain_text;
    
    // Format link nicely
    const linkStr = note.link;
    const cleanDomain = new URL(linkStr).hostname;
    attachmentUrl.textContent = cleanDomain;
    
    // Compose standard prefix and suffix
    const prefix = `BigQuery Release Note (${dateStr} - #${typeStr}): `;
    const suffix = `\n\nRead details: `;
    
    // Compute remaining chars for plain text
    const baseLength = prefix.length + suffix.length + linkStr.length;
    const maxDescLength = MAX_TWEET_LENGTH - baseLength;
    
    let descriptionText = cleanText;
    if (descriptionText.length > maxDescLength) {
        descriptionText = descriptionText.substring(0, maxDescLength - 4) + '...';
    }
    
    const fullTweetText = `${prefix}${descriptionText}${suffix}${linkStr}`;
    
    // Populate modal textarea
    tweetTextarea.value = fullTweetText;
    tweetTextarea.dataset.link = linkStr; // Store link for later
    
    // Update character counters
    updateCharCounter();
    
    // Show Modal
    tweetModal.classList.add('active');
    tweetTextarea.focus();
}

function closeTweetModal() {
    tweetModal.classList.remove('active');
}

function updateCharCounter() {
    const textLength = tweetTextarea.value.length;
    const remaining = MAX_TWEET_LENGTH - textLength;
    
    charCount.textContent = remaining;
    
    // Progress Ring rendering
    const circle = document.getElementById('char-progress');
    const radius = circle.r.baseVal.value;
    const circumference = 2 * Math.PI * radius;
    
    // Calculate percentage
    const pct = Math.min(textLength / MAX_TWEET_LENGTH, 1);
    const offset = circumference - (pct * circumference);
    
    circle.style.strokeDashoffset = offset;
    
    // Color coding counter
    if (remaining < 0) {
        circle.style.stroke = '#ef4444'; // Red
        charCount.style.color = '#ef4444';
        btnSendTweet.disabled = true;
    } else if (remaining <= 20) {
        circle.style.stroke = '#f59e0b'; // Amber
        charCount.style.color = '#f59e0b';
        btnSendTweet.disabled = false;
    } else {
        circle.style.stroke = '#1da1f2'; // Twitter Blue
        charCount.style.color = '#8899a6';
        btnSendTweet.disabled = false;
    }
}

function publishTweet() {
    const text = tweetTextarea.value;
    if (text.length > MAX_TWEET_LENGTH) return;
    
    // Open Twitter intent window
    const twitterIntentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(twitterIntentUrl, '_blank');
    
    closeTweetModal();
}
