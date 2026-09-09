/**
 * موقع ء ريلز - المنطق التفاعلي (Interactive JavaScript)
 * إدارة منصة الريلز، تذاكر الدعم الفني، وإنشاء حسابات المستخدمين بواسطة الأدمن
 */

document.addEventListener('DOMContentLoaded', () => {
    // Navigation Elements
    const menuItems = document.querySelectorAll('.menu-item');
    const viewSections = document.querySelectorAll('.view-section');
    const topBarTitle = document.getElementById('topBarTitle');
    
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const mobileToggleBtn = document.getElementById('mobileToggleBtn');
    const mobileCloseBtn = document.getElementById('mobileCloseBtn');
    
    // Search Elements
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
    const adminMenuSection = document.getElementById('adminMenuSection');
    const adminPanelLink = document.getElementById('adminPanelLink');
    const adminWelcomeBanner = document.getElementById('adminWelcomeBanner');
    const adminUsernameDisplay = document.getElementById('adminUsernameDisplay');
    const openCreateUserModalBtn = document.getElementById('openCreateUserModalBtn');
    const quickAddUserBtn = document.getElementById('quickAddUserBtn');
    
    // Modals
    const loginModal = document.getElementById('loginModal');
    const closeLoginModalBtn = document.getElementById('closeLoginModalBtn');
    const loginForm = document.getElementById('loginForm');
    const loginErrorMsg = document.getElementById('loginErrorMsg');

    const createUserModal = document.getElementById('createUserModal');
    const closeCreateUserModalBtn = document.getElementById('closeCreateUserModalBtn');
    const createUserForm = document.getElementById('createUserForm');
    const createUserErrorMsg = document.getElementById('createUserErrorMsg');
    const createUserSuccessMsg = document.getElementById('createUserSuccessMsg');

    const replyTicketModal = document.getElementById('replyTicketModal');
    const closeReplyTicketModalBtn = document.getElementById('closeReplyTicketModalBtn');
    const replyTicketForm = document.getElementById('replyTicketForm');

    // Tickets Elements
    const createTicketForm = document.getElementById('createTicketForm');
    const ticketsContainer = document.getElementById('ticketsContainer');
    const ticketsCountBadge = document.getElementById('ticketsCountBadge');

    // Reels Elements
    const reelsGrid = document.getElementById('reelsGrid');

    // State Variables
    let currentView = 'homeView';
    let currentCategory = 'all';
    let searchQuery = '';
    let debounceTimer = null;
    let currentUser = null;

    const viewTitles = {
        'homeView': 'الرئيسية',
        'reelsView': 'منصة الريلزات',
        'searchView': 'صفحة البحث',
        'ticketsView': 'تذاكر الدعم الفني'
    };

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
    // 1. User Auth Status & Admin Controls
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

            if (topLoginText) topLoginText.textContent = username;
            if (topLoginBtn) {
                topLoginBtn.onclick = () => {
                    if (confirm('هل ترغب في تسجيل الخروج؟')) performLogout();
                };
            }

            if (isSuperuser) {
                const adminElements = document.querySelectorAll('.admin-only');
                adminElements.forEach(el => el.classList.remove('hidden'));
                if (adminUsernameDisplay) adminUsernameDisplay.textContent = username;
            }

        } else {
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

            const adminElements = document.querySelectorAll('.admin-only');
            adminElements.forEach(el => el.classList.add('hidden'));
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
                    loadTickets(); // Refresh tickets with admin privileges
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

    async function performLogout() {
        try {
            await fetch('/api/logout/', {
                method: 'POST',
                headers: {
                    'X-CSRFToken': getCookie('csrftoken') || ''
                }
            });
            updateUserUI(false);
            loadTickets();
        } catch (err) {
            console.error('Logout error:', err);
        }
    }

    // =========================================================================
    // 2. Admin Create User Modal
    // =========================================================================
    function openCreateUserModal() {
        if (createUserModal) createUserModal.classList.remove('hidden');
        if (createUserErrorMsg) createUserErrorMsg.classList.add('hidden');
        if (createUserSuccessMsg) createUserSuccessMsg.classList.add('hidden');
    }

    function closeCreateUserModal() {
        if (createUserModal) createUserModal.classList.add('hidden');
    }

    if (openCreateUserModalBtn) openCreateUserModalBtn.addEventListener('click', openCreateUserModal);
    if (quickAddUserBtn) quickAddUserBtn.addEventListener('click', openCreateUserModal);
    if (closeCreateUserModalBtn) closeCreateUserModalBtn.addEventListener('click', closeCreateUserModal);

    if (createUserForm) {
        createUserForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newUsername = document.getElementById('newUsername').value.trim();
            const newPassword = document.getElementById('newPassword').value.trim();
            const newEmail = document.getElementById('newEmail').value.trim();
            const newIsAdmin = document.getElementById('newIsAdmin').checked;
            const submitBtn = document.getElementById('submitCreateUserBtn');

            if (!newUsername || !newPassword) return;

            if (submitBtn) submitBtn.disabled = true;

            try {
                const response = await fetch('/api/admin/users/create/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': getCookie('csrftoken') || ''
                    },
                    body: JSON.stringify({
                        username: newUsername,
                        password: newPassword,
                        email: newEmail,
                        is_admin: newIsAdmin
                    })
                });

                const data = await response.json();

                if (response.ok && data.status === 'success') {
                    if (createUserSuccessMsg) {
                        createUserSuccessMsg.textContent = data.message;
                        createUserSuccessMsg.classList.remove('hidden');
                    }
                    if (createUserErrorMsg) createUserErrorMsg.classList.add('hidden');
                    createUserForm.reset();
                } else {
                    if (createUserErrorMsg) {
                        createUserErrorMsg.textContent = data.message || 'فشل إنشاء الحساب';
                        createUserErrorMsg.classList.remove('hidden');
                    }
                    if (createUserSuccessMsg) createUserSuccessMsg.classList.add('hidden');
                }
            } catch (err) {
                if (createUserErrorMsg) {
                    createUserErrorMsg.textContent = 'حدث خطأ أثناء إنشاء الحساب';
                    createUserErrorMsg.classList.remove('hidden');
                }
            } finally {
                if (submitBtn) submitBtn.disabled = false;
            }
        });
    }

    // =========================================================================
    // 3. Navigation & View Switcher (SPA)
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

        if (targetViewId === 'reelsView') loadReels();
        if (targetViewId === 'ticketsView') loadTickets();
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
    // 4. Reels Platform Engine
    // =========================================================================
    async function loadReels() {
        if (!reelsGrid) return;
        try {
            const response = await fetch('/api/reels/');
            const data = await response.json();
            renderReels(data.reels || []);
        } catch (err) {
            console.error('Reels load error:', err);
        }
    }

    function renderReels(reels) {
        if (!reelsGrid) return;
        if (!reels || reels.length === 0) {
            reelsGrid.innerHTML = `<div class="empty-state"><p>لا توجد ريلزات متوفرة حالياً</p></div>`;
            return;
        }

        reelsGrid.innerHTML = reels.map(r => `
            <div class="reel-card">
                <div class="reel-video-container">
                    <video class="reel-video" src="${r.video_url}" poster="${r.thumbnail_url || ''}" controls preload="metadata"></video>
                    <div class="reel-overlay">
                        <div class="reel-top-bar">
                            <span class="reel-category-tag">#${r.category}</span>
                        </div>
                        <div class="reel-bottom-bar">
                            <div class="reel-publisher">@${r.publisher}</div>
                            <h3 class="reel-title">${r.title}</h3>
                        </div>
                    </div>
                </div>
                <div class="reel-actions-bar">
                    <button class="btn-like" onclick="likeReel(${r.id}, this)">
                        <i class="bi bi-heart-fill"></i> <span class="like-count">${r.likes_count}</span>
                    </button>
                    <span class="reel-views"><i class="bi bi-eye"></i> ${r.views_count.toLocaleString()}</span>
                </div>
            </div>
        `).join('');
    }

    window.likeReel = async function(reelId, btnElement) {
        try {
            const response = await fetch(`/api/reels/${reelId}/like/`, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': getCookie('csrftoken') || ''
                }
            });
            const data = await response.json();
            if (response.ok && data.status === 'success') {
                const countSpan = btnElement.querySelector('.like-count');
                if (countSpan) countSpan.textContent = data.likes_count;
                btnElement.classList.add('liked');
            }
        } catch (err) {
            console.error('Like error:', err);
        }
    };

    // =========================================================================
    // 5. Support Ticket System Engine
    // =========================================================================
    async function loadTickets() {
        if (!ticketsContainer) return;
        try {
            const response = await fetch('/api/tickets/');
            const data = await response.json();
            renderTickets(data.tickets || []);
        } catch (err) {
            console.error('Tickets load error:', err);
        }
    }

    function renderTickets(tickets) {
        if (!ticketsContainer) return;
        if (ticketsCountBadge) ticketsCountBadge.textContent = tickets.length;

        if (!tickets || tickets.length === 0) {
            ticketsContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon"><i class="bi bi-inbox-fill"></i></div>
                    <p>لا توجد تذاكر دعم فني حالياً. يمكنك إرسال أول تذكرة من النموذج المجاور!</p>
                </div>
            `;
            return;
        }

        const isSuperuser = currentUser && currentUser.is_superuser;

        ticketsContainer.innerHTML = tickets.map(t => `
            <div class="ticket-card" id="ticket-${t.id}">
                <div class="ticket-header">
                    <span class="ticket-id">تذكرة #${t.id} - ${t.sender_name}</span>
                    <span class="badge-status status-${t.status}">
                        <i class="bi bi-circle-fill"></i> ${t.status_display}
                    </span>
                </div>
                <h4 class="ticket-title">${t.title}</h4>
                <p class="ticket-desc">${t.description}</p>
                
                ${t.admin_reply ? `
                    <div class="ticket-admin-reply-box">
                        <div class="reply-header"><i class="bi bi-shield-check"></i> رد الإدارة (الأدمن):</div>
                        <p class="reply-text">${t.admin_reply}</p>
                    </div>
                ` : ''}

                <div class="ticket-footer">
                    <span>${t.created_at}</span>
                    ${isSuperuser ? `
                        <button class="btn btn-outline btn-sm" onclick="openReplyModal(${t.id}, '${t.status}', \`${(t.admin_reply || '').replace(/`/g, '\\`')}\`)">
                            <i class="bi bi-reply"></i> الرد وتغيير الحالة
                        </button>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    // Submit New Ticket
    if (createTicketForm) {
        createTicketForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const titleInput = document.getElementById('ticketTitle');
            const descInput = document.getElementById('ticketDescription');
            const senderInput = document.getElementById('ticketSenderName');
            const submitBtn = document.getElementById('submitTicketBtn');

            if (!titleInput || !descInput) return;

            const title = titleInput.value.trim();
            const description = descInput.value.trim();
            const sender_name = senderInput ? senderInput.value.trim() : '';

            if (!title || !description) return;

            if (submitBtn) submitBtn.disabled = true;

            try {
                const response = await fetch('/api/tickets/create/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': getCookie('csrftoken') || ''
                    },
                    body: JSON.stringify({ title, description, sender_name })
                });

                const data = await response.json();
                if (response.ok && data.status === 'success') {
                    alert(data.message);
                    createTicketForm.reset();
                    loadTickets();
                } else {
                    alert(data.message || 'فشل إرسال التذكرة');
                }
            } catch (err) {
                alert('حدث خطأ أثناء إرسال التذكرة');
            } finally {
                if (submitBtn) submitBtn.disabled = false;
            }
        });
    }

    // Admin Ticket Reply Modal
    window.openReplyModal = function(ticketId, currentStatus, currentReply) {
        const replyTicketId = document.getElementById('replyTicketId');
        const replyStatusSelect = document.getElementById('replyStatusSelect');
        const replyAdminText = document.getElementById('replyAdminText');

        if (replyTicketId) replyTicketId.value = ticketId;
        if (replyStatusSelect) replyStatusSelect.value = currentStatus || 'resolved';
        if (replyAdminText) replyAdminText.value = currentReply || '';

        if (replyTicketModal) replyTicketModal.classList.remove('hidden');
    };

    function closeReplyModal() {
        if (replyTicketModal) replyTicketModal.classList.add('hidden');
    }

    if (closeReplyTicketModalBtn) closeReplyTicketModalBtn.addEventListener('click', closeReplyModal);

    if (replyTicketForm) {
        replyTicketForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const ticketId = document.getElementById('replyTicketId').value;
            const status = document.getElementById('replyStatusSelect').value;
            const admin_reply = document.getElementById('replyAdminText').value.trim();

            try {
                const response = await fetch('/api/tickets/reply/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': getCookie('csrftoken') || ''
                    },
                    body: JSON.stringify({ ticket_id: ticketId, status, admin_reply })
                });

                const data = await response.json();
                if (response.ok && data.status === 'success') {
                    closeReplyModal();
                    loadTickets();
                } else {
                    alert(data.message || 'فشل حفظ الرد');
                }
            } catch (err) {
                alert('حدث خطأ أثناء تحديث التذكرة');
            }
        });
    }

    // =========================================================================
    // 6. Live Search Engine
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
            if (!response.ok) throw new Error('فشل البينات');
            const data = await response.json();
            renderSearchResults(data.results, data.count);
        } catch (error) {
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
            debounceTimer = setTimeout(performSearch, 250);
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

    // Init App
    checkUserStatus();
    loadReels();
    loadTickets();
    performSearch();
});
