/**
 * موقع ء - المنطق التفاعلي (Interactive JavaScript)
 * إدارة التنقل بين الصفحات والبحث الفوري عبر Django API
 */

document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const menuItems = document.querySelectorAll('.menu-item');
    const viewSections = document.querySelectorAll('.view-section');
    const topBarTitle = document.getElementById('topBarTitle');
    
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const mobileToggleBtn = document.getElementById('mobileToggleBtn');
    const mobileCloseBtn = document.getElementById('mobileCloseBtn');
    
    const searchInput = document.getElementById('searchInput');
    const searchClearBtn = document.getElementById('searchClearBtn');
    const pillBtns = document.querySelectorAll('.pill-btn');
    const resultsGrid = document.getElementById('resultsGrid');
    const resultsCountText = document.getElementById('resultsCountText');
    const emptyState = document.getElementById('emptyState');
    const resetSearchBtn = document.getElementById('resetSearchBtn');

    // State Variables
    let currentView = 'homeView';
    let currentCategory = 'all';
    let searchQuery = '';
    let debounceTimer = null;

    // View Titles Mapping
    const viewTitles = {
        'homeView': 'الرئيسية',
        'searchView': 'صفحة البحث'
    };

    // =========================================================================
    // 1. Navigation & View Switcher (SPA)
    // =========================================================================
    window.switchView = function(targetViewId) {
        if (!targetViewId || !document.getElementById(targetViewId)) return;

        currentView = targetViewId;

        // Update active menu link
        menuItems.forEach(item => {
            if (item.getAttribute('data-view') === targetViewId) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        // Switch active view section
        viewSections.forEach(section => {
            if (section.id === targetViewId) {
                section.classList.add('active');
            } else {
                section.classList.remove('active');
            }
        });

        // Update Header Title
        if (topBarTitle && viewTitles[targetViewId]) {
            topBarTitle.textContent = viewTitles[targetViewId];
        }

        // Close Mobile Drawer if open
        closeMobileSidebar();

        // Trigger search load if switching to search view
        if (targetViewId === 'searchView') {
            performSearch();
            if (searchInput) searchInput.focus();
        }

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetView = item.getAttribute('data-view');
            switchView(targetView);
        });
    });

    // =========================================================================
    // 2. Mobile Drawer Controls
    // =========================================================================
    function openMobileSidebar() {
        if (sidebar) sidebar.classList.add('open');
        if (sidebarOverlay) sidebarOverlay.classList.add('active');
    }

    function closeMobileSidebar() {
        if (sidebar) sidebar.classList.remove('open');
        if (sidebarOverlay) sidebarOverlay.classList.remove('active');
    }

    if (mobileToggleBtn) mobileToggleBtn.addEventListener('click', openMobileSidebar);
    if (mobileCloseBtn) mobileCloseBtn.addEventListener('click', closeMobileSidebar);
    if (sidebarOverlay) sidebarOverlay.addEventListener('click', closeMobileSidebar);

    // =========================================================================
    // 3. Live AJAX Search via Django API
    // =========================================================================
    async function performSearch() {
        searchQuery = searchInput ? searchInput.value.trim() : '';

        // Show/hide clear button
        if (searchClearBtn) {
            if (searchQuery.length > 0) {
                searchClearBtn.classList.add('visible');
            } else {
                searchClearBtn.classList.remove('visible');
            }
        }

        try {
            const url = `/api/search/?q=${encodeURIComponent(searchQuery)}&category=${encodeURIComponent(currentCategory)}`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error('فشل جلب البيانات من الخادم');
            }

            const data = await response.json();
            renderSearchResults(data.results, data.count);

        } catch (error) {
            console.error('Search error:', error);
            renderSearchResults([], 0);
        }
    }

    // Render Results HTML
    function renderSearchResults(items, count) {
        if (!resultsGrid || !resultsCountText || !emptyState) return;

        resultsCountText.textContent = `تم العثور على (${count}) نتيجة`;

        if (!items || items.length === 0) {
            resultsGrid.innerHTML = '';
            emptyState.classList.remove('hidden');
            return;
        }

        emptyState.classList.add('hidden');
        
        resultsGrid.innerHTML = items.map(item => `
            <article class="result-card">
                <div class="card-top">
                    <div class="card-header-flex">
                        <div class="card-icon">
                            <i class="bi ${item.icon || 'bi-file-text'}"></i>
                        </div>
                        <span class="card-category">${item.category}</span>
                    </div>
                    <h3 class="card-title">${item.title}</h3>
                    <p class="card-desc">${item.description}</p>
                </div>
                <div class="card-footer">
                    <div class="card-tags">
                        ${(item.tags || []).map(tag => `<span class="tag-badge">#${tag}</span>`).join(' ')}
                    </div>
                    <span class="card-date">${item.date}</span>
                </div>
            </article>
        `).join('');
    }

    // Search Input Event
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                performSearch();
            }, 250);
        });
    }

    // Search Clear Button Event
    if (searchClearBtn) {
        searchClearBtn.addEventListener('click', () => {
            if (searchInput) searchInput.value = '';
            performSearch();
            searchInput.focus();
        });
    }

    // Category Pill Event Listeners
    pillBtns.forEach(pill => {
        pill.addEventListener('click', () => {
            pillBtns.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            currentCategory = pill.getAttribute('data-category');
            performSearch();
        });
    });

    // Reset Search Button Event
    if (resetSearchBtn) {
        resetSearchBtn.addEventListener('click', () => {
            if (searchInput) searchInput.value = '';
            currentCategory = 'all';
            pillBtns.forEach(p => {
                if (p.getAttribute('data-category') === 'all') {
                    p.classList.add('active');
                } else {
                    p.classList.remove('active');
                }
            });
            performSearch();
        });
    }

    // Initial Search Load
    performSearch();
});
