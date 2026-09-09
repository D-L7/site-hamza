/**
 * موقع ء - المنطق التفاعلي (Interactive JavaScript)
 * إدارة التنقل بين الصفحات والبحث الفوري وتطبيقات تسحيل الدخول ونظام المستخدمين عبر Django API
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

    // Auth & User Elements
    const userBox = document.getElementById('userBox');
    const topLoginBtn = document.getElementById('topLoginBtn');
    const topLoginText = document.getElementById('topLoginText');
    const adminPanelLink = document.getElementById('adminPanelLink');
    const adminWelcomeBanner = document.getElementById('adminWelcomeBanner');
    const adminUsernameDisplay = document.getElementById('adminUsernameDisplay');
    const loginModal = document.getElementById('loginModal');
    const closeLoginModalBtn = document.getElementById('closeLoginModalBtn');
    const loginForm = document.getElementById('loginForm');
    const loginErrorMsg = document.getElementById('loginErrorMsg');

    // State Variables
    let currentView = 'homeView';
    let currentCategory = 'all';
    let searchQuery = '';
    let debounceTimer = null;
    let currentUser = null;

    const viewTitles = {
        'homeView': 'الرئيسية',
        'searchView': 'صفحة البحث'
    };

    // Helper: Get CSRF Cookie Token
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    // =========================================================================
    // 1. User Auth & Session Management
    // =========================================================================
    async function checkUserStatus() {
        try {
            const response = await fetch('/api/user-status/');
            const data = await response.json();

            if (data.is_authenticated) {
                currentUser = data;
                updateUserUI(true, data.username, data.is_superuser);
            } else {
                currentUser = null;
                updateUserUI(false);
            }
        } catch (err) {
            console.error('User status check failed:', err);
            updateUserUI(false);
        }
    }

    function updateUserUI(isAuthenticated, username = '', isSuperuser = false) {
        if (isAuthenticated) {
            // Update User Box in Sidebar
            if (userBox) {
                userBox.innerHTML = `
                    <div class="user-card-sm">
                        <div class="user-avatar">${username.charAt(0).toUpperCase()}</div>
                        <div class="user-details">
                            <span class="user-name">${username}</span>
                            <span class="user-role">${isSuperuser ? 'مسؤول (Admin)' : 'عضو'}</span>
                        </div>
                        <button class="btn-logout-icon" id="logoutBtn" title="تسجيل الخروج">
                            <i class="bi bi-box-arrow-left"></i>
                        </button>
                    </div>
                `;
                const logoutBtn = document.getElementById('logoutBtn');
                if (logoutBtn) logoutBtn.addEventListener('click', performLogout);
            }

            // Update Top bar button
            if (topLoginText) topLoginText.textContent = username;
            if (topLoginBtn) {
                topLoginBtn.onclick = () => {
                    if (confirm('هل ترغب في تسجيل الخروج؟')) performLogout();
                };
            }

            // Show Admin elements if superuser
            if (isSuperuser) {
                if (adminPanelLink) adminPanelLink.classList.remove('hidden');
                if (adminWelcomeBanner) adminWelcomeBanner.classList.remove('hidden');
                if (adminUsernameDisplay) adminUsernameDisplay.textContent = username;
            }

        } else {
            // Unauthenticated state
            if (userBox) {
                userBox.innerHTML = `
                    <button class="btn btn-outline w-100 btn-sm" id="sidebarLoginBtn">
                        <i class="bi bi-box-arrow-in-right"></i> تسجيل الدخول
                    </button>
                `;
                const sidebarLoginBtn = document.getElementById('sidebarLoginBtn');
                if (sidebarLoginBtn) sidebarLoginBtn.addEventListener('click', openLoginModal);
            }

            if (topLoginText) topLoginText.textContent = 'تسجيل الدخول';
            if (topLoginBtn) topLoginBtn.onclick = openLoginModal;

            if (adminPanelLink) adminPanelLink.classList.add('hidden');
            if (adminWelcomeBanner) adminWelcomeBanner.classList.add('hidden');
        }
    }

    function openLoginModal() {
        if (loginModal) loginModal.classList.remove('hidden');
        if (loginErrorMsg) loginErrorMsg.classList.add('hidden');
    }

    function closeLoginModal() {
        if (loginModal) loginModal.classList.add('hidden');
    }

    if (closeLoginModalBtn) closeLoginModalBtn.addEventListener('click', closeLoginModal);
    if (loginModal) {
        loginModal.addEventListener('click', (e) => {
            if (e.target === loginModal) closeLoginModal();
        });
    }

    // Login Form Submit
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const usernameInput = document.getElementById('loginUsername');
            const passwordInput = document.getElementById('loginPassword');
            const submitBtn = document.getElementById('loginSubmitBtn');

            if (!usernameInput || !passwordInput) return;

            const username = usernameInput.value.trim();
            const password = passwordInput.value.trim();

            if (!username || !password) return;

            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'جاري التحقق...';
            }

            try {
                const response = await fetch('/api/login/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': getCookie('csrftoken') || ''
                    },
                    body: JSON.stringify({ username, password })
                });

                const data = await response.json();

                if (response.ok && data.status === 'success') {
                    closeLoginModal();
                    updateUserUI(true, data.user.username, data.user.is_superuser);
                    usernameInput.value = '';
                    passwordInput.value = '';
                } else {
                    if (loginErrorMsg) {
                        loginErrorMsg.textContent = data.message || 'خطأ في بيانات الدخول';
                        loginErrorMsg.classList.remove('hidden');
                    }
                }
            } catch (err) {
                if (loginErrorMsg) {
                    loginErrorMsg.textContent = 'حدث خطأ بالاتصال مع الخادم';
                    loginErrorMsg.classList.remove('hidden');
                }
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'تسجيل الدخول';
                }
            }
        });
    }

    // Logout Process
    async function performLogout() {
        try {
            await fetch('/api/logout/', {
                method: 'POST',
                headers: {
                    'X-CSRFToken': getCookie('csrftoken') || ''
                }
            });
            updateUserUI(false);
        } catch (err) {
            console.error('Logout error:', err);
        }
    }

    // =========================================================================
    // 2. Navigation & View Switcher (SPA)
    // =========================================================================
    window.switchView = function(targetViewId) {
        if (!targetViewId || !document.getElementById(targetViewId)) return;

        currentView = targetViewId;

        menuItems.forEach(item => {
            if (item.getAttribute('data-view') === targetViewId) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        viewSections.forEach(section => {
            if (section.id === targetViewId) {
                section.classList.add('active');
            } else {
                section.classList.remove('active');
            }
        });

        if (topBarTitle && viewTitles[targetViewId]) {
            topBarTitle.textContent = viewTitles[targetViewId];
        }

        closeMobileSidebar();

        if (targetViewId === 'searchView') {
            performSearch();
            if (searchInput) searchInput.focus();
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    menuItems.forEach(item => {
        if (item.hasAttribute('data-view')) {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const targetView = item.getAttribute('data-view');
                switchView(targetView);
            });
        }
    });

    // =========================================================================
    // 3. Mobile Drawer Controls
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
    // 4. Live AJAX Search via Django API
    // =========================================================================
    async function performSearch() {
        searchQuery = searchInput ? searchInput.value.trim() : '';

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

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                performSearch();
            }, 250);
        });
    }

    if (searchClearBtn) {
        searchClearBtn.addEventListener('click', () => {
            if (searchInput) searchInput.value = '';
            performSearch();
            searchInput.focus();
        });
    }

    pillBtns.forEach(pill => {
        pill.addEventListener('click', () => {
            pillBtns.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            currentCategory = pill.getAttribute('data-category');
            performSearch();
        });
    });

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

    // Init User Status and initial search
    checkUserStatus();
    performSearch();
});
