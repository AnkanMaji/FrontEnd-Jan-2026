// ===========================
// MODERN E-COMMERCE APP
// Vanilla JavaScript Implementation
// ===========================

// ===========================
// STATE MANAGEMENT
// ===========================

const state = {
    allProducts: [],
    filteredProducts: [],
    cart: [],
    categories: [],
    currentPage: 1,
    productsPerPage: 12,
    searchTerm: '',
    selectedCategory: null,
    maxPrice: 2000,
    sortBy: 'relevance',
    loading: false,
    darkMode: localStorage.getItem('darkMode') === 'true'
};

// ===========================
// DOM ELEMENTS
// ===========================

const elements = {
    // Navbar
    logo: document.querySelector('.logo'),
    searchInput: document.getElementById('searchInput'),
    cartBtn: document.getElementById('cartBtn'),
    cartCount: document.getElementById('cartCount'),
    themeToggle: document.getElementById('themeToggle'),

    // Main content
    loader: document.getElementById('loader'),
    errorMessage: document.getElementById('errorMessage'),
    errorText: document.getElementById('errorText'),
    retryBtn: document.getElementById('retryBtn'),
    productsGrid: document.getElementById('productsGrid'),
    noResults: document.getElementById('noResults'),
    pagination: document.getElementById('pagination'),

    // Filters
    categoriesList: document.getElementById('categoriesList'),
    priceRange: document.getElementById('priceRange'),
    priceValue: document.getElementById('priceValue'),
    sortSelect: document.getElementById('sortSelect'),
    clearFilters: document.getElementById('clearFilters'),

    // Modal
    productModal: document.getElementById('productModal'),
    modalOverlay: document.getElementById('modalOverlay'),
    modalBody: document.getElementById('modalBody'),

    // Cart
    cartSidebar: document.getElementById('cartSidebar'),
    cartOverlay: document.getElementById('cartOverlay'),
    cartItems: document.getElementById('cartItems'),
    cartEmpty: document.getElementById('cartEmpty'),
    cartFooter: document.getElementById('cartFooter'),
    cartClose: document.getElementById('cartClose')
};

// ===========================
// API FUNCTIONS
// ===========================

/**
 * Fetch all products from DummyJSON API
 */
async function fetchProducts() {
    try {
        state.loading = true;
        showLoader();
        hideError();

        const response = await fetch('https://dummyjson.com/products?limit=100');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        state.allProducts = data.products;
        
        // Extract unique categories
        extractCategories();
        
        // Initial filter and display
        applyFilters();
        updateCartCount();
        
        state.loading = false;
        hideLoader();

    } catch (error) {
        console.error('Error fetching products:', error);
        showError('Failed to load products. Please check your connection.');
        state.loading = false;
        hideLoader();
    }
}

/**
 * Extract unique categories from products
 */
function extractCategories() {
    const categorySet = new Set(state.allProducts.map(product => product.category));
    state.categories = Array.from(categorySet).sort();
    renderCategories();
}

// ===========================
// FILTER & SEARCH FUNCTIONS
// ===========================

/**
 * Apply all filters and display results
 */
function applyFilters() {
    // Start with all products
    let filtered = [...state.allProducts];

    // Filter by search term
    if (state.searchTerm) {
        filtered = filtered.filter(product =>
            product.title.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
            product.description.toLowerCase().includes(state.searchTerm.toLowerCase())
        );
    }

    // Filter by category
    if (state.selectedCategory) {
        filtered = filtered.filter(product => product.category === state.selectedCategory);
    }

    // Filter by price
    filtered = filtered.filter(product => product.price <= state.maxPrice);

    // Apply sorting
    filtered = sortProducts(filtered);

    state.filteredProducts = filtered;
    state.currentPage = 1;
    
    renderProducts();
    renderPagination();
}

/**
 * Sort products based on selected criteria
 */
function sortProducts(products) {
    const sorted = [...products];

    switch (state.sortBy) {
        case 'price-low':
            sorted.sort((a, b) => a.price - b.price);
            break;
        case 'price-high':
            sorted.sort((a, b) => b.price - a.price);
            break;
        case 'rating':
            sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
            break;
        case 'newest':
            sorted.reverse();
            break;
        case 'relevance':
        default:
            // Keep original order for relevance
            break;
    }

    return sorted;
}

/**
 * Handle search input
 */
function handleSearch(e) {
    state.searchTerm = e.target.value.trim();
    applyFilters();
}

/**
 * Handle category filter click
 */
function handleCategoryClick(category) {
    state.selectedCategory = state.selectedCategory === category ? null : category;
    applyFilters();
    highlightActiveCategory();
}

/**
 * Handle price range change
 */
function handlePriceChange(e) {
    state.maxPrice = parseInt(e.target.value);
    elements.priceValue.textContent = state.maxPrice;
    applyFilters();
}

/**
 * Handle sort change
 */
function handleSortChange(e) {
    state.sortBy = e.target.value;
    applyFilters();
}

/**
 * Clear all filters
 */
function clearAllFilters() {
    state.searchTerm = '';
    state.selectedCategory = null;
    state.maxPrice = 2000;
    state.sortBy = 'relevance';

    elements.searchInput.value = '';
    elements.priceRange.value = 2000;
    elements.priceValue.textContent = 2000;
    elements.sortSelect.value = 'relevance';

    applyFilters();
    highlightActiveCategory();
}

// ===========================
// RENDERING FUNCTIONS
// ===========================

/**
 * Render categories in filter section
 */
function renderCategories() {
    elements.categoriesList.innerHTML = '';

    state.categories.forEach(category => {
        const button = document.createElement('button');
        button.className = 'category-btn';
        button.textContent = category.charAt(0).toUpperCase() + category.slice(1);
        button.addEventListener('click', () => handleCategoryClick(category));
        elements.categoriesList.appendChild(button);
    });
}

/**
 * Highlight active category
 */
function highlightActiveCategory() {
    const buttons = elements.categoriesList.querySelectorAll('.category-btn');
    buttons.forEach(btn => {
        const category = btn.textContent.toLowerCase();
        if (category === state.selectedCategory) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

/**
 * Render product grid
 */
function renderProducts() {
    const startIndex = (state.currentPage - 1) * state.productsPerPage;
    const endIndex = startIndex + state.productsPerPage;
    const productsToDisplay = state.filteredProducts.slice(startIndex, endIndex);

    if (productsToDisplay.length === 0) {
        elements.productsGrid.innerHTML = '';
        elements.noResults.style.display = 'flex';
        elements.pagination.innerHTML = '';
        return;
    }

    elements.noResults.style.display = 'none';
    elements.productsGrid.innerHTML = productsToDisplay.map(product => createProductCard(product)).join('');

    // Add event listeners to product cards
    document.querySelectorAll('.product-card').forEach((card, index) => {
        const product = productsToDisplay[index];
        card.addEventListener('click', () => openProductModal(product));
    });

    // Add event listeners to add to cart buttons
    document.querySelectorAll('.add-to-cart-btn').forEach((btn, index) => {
        const product = productsToDisplay[index];
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            addToCart(product);
        });
    });
}

/**
 * Create product card HTML
 */
function createProductCard(product) {
    const discount = product.discountPercentage ? Math.round(product.discountPercentage) : 0;
    const originalPrice = discount ? (product.price / (1 - discount / 100)).toFixed(2) : null;
    const rating = product.rating ? product.rating.toFixed(1) : 'N/A';
    const stars = renderStars(product.rating || 0);

    return `
        <div class="product-card fade-in">
            <div class="product-image">
                <img 
                    src="${product.thumbnail}" 
                    alt="${product.title}"
                    loading="lazy"
                    onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Crect fill=%22%23f0f0f0%22 width=%22100%22 height=%22100%22/%3E%3Ctext x=%2250%22 y=%2250%22 text-anchor=%22middle%22 dy=%22.3em%22 font-family=%22sans-serif%22 font-size=%2214%22 fill=%22%23999%22%3EImage%3C/text%3E%3C/svg%3E'"
                >
            </div>
            <div class="product-info">
                <div class="product-brand">${product.brand || 'Brand'}</div>
                <h3 class="product-title">${product.title}</h3>
                <div class="product-rating">
                    <div class="stars">${stars}</div>
                    <span class="rating-value">${rating}</span>
                </div>
                <div class="product-footer">
                    <div>
                        <div class="product-price">$${product.price.toFixed(2)}</div>
                        ${originalPrice ? `<div class="product-original-price">$${originalPrice}</div>` : ''}
                    </div>
                    ${discount ? `<div class="product-discount">-${discount}%</div>` : ''}
                </div>
                <button class="add-to-cart-btn">Add to Cart</button>
            </div>
        </div>
    `;
}

/**
 * Generate star rating display
 */
function renderStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const stars = [];

    for (let i = 0; i < 5; i++) {
        if (i < fullStars) {
            stars.push('★');
        } else if (i === fullStars && hasHalfStar) {
            stars.push('☆');
        } else {
            stars.push('☆');
        }
    }

    return stars.join('');
}

/**
 * Render pagination controls
 */
function renderPagination() {
    const totalPages = Math.ceil(state.filteredProducts.length / state.productsPerPage);

    if (totalPages <= 1) {
        elements.pagination.innerHTML = '';
        return;
    }

    let html = '';

    // Previous button
    if (state.currentPage > 1) {
        html += `<button class="prev-btn" data-page="${state.currentPage - 1}">← Previous</button>`;
    } else {
        html += `<button disabled>← Previous</button>`;
    }

    // Page numbers
    const maxVisible = 5;
    let startPage = Math.max(1, state.currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage + 1 < maxVisible) {
        startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        if (i === state.currentPage) {
            html += `<button class="active">${i}</button>`;
        } else {
            html += `<button data-page="${i}">${i}</button>`;
        }
    }

    // Next button
    if (state.currentPage < totalPages) {
        html += `<button class="next-btn" data-page="${state.currentPage + 1}">Next →</button>`;
    } else {
        html += `<button disabled>Next →</button>`;
    }

    elements.pagination.innerHTML = html;

    // Add event listeners
    elements.pagination.querySelectorAll('button[data-page]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            state.currentPage = parseInt(e.target.dataset.page);
            renderProducts();
            renderPagination();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });
}

// ===========================
// PRODUCT DETAIL MODAL
// ===========================

/**
 * Open product detail modal
 */
function openProductModal(product) {
    const rating = product.rating ? product.rating.toFixed(1) : 'N/A';
    const stars = renderStars(product.rating || 0);
    const stock = product.stock || 0;

    const html = `
        <div class="product-detail-image">
            <img src="${product.images?.[0] || product.thumbnail}" alt="${product.title}">
        </div>
        <div class="product-detail-info">
            <h2>${product.title}</h2>
            <div class="detail-brand">${product.brand || 'Brand'}</div>
            <div class="detail-rating">
                <div class="stars">${stars}</div>
                <span>${rating} (${product.reviews?.length || 0} reviews)</span>
            </div>
            <div class="detail-price">$${product.price.toFixed(2)}</div>
            <p class="detail-description">${product.description}</p>
            
            <div class="detail-specs">
                <h4>Details</h4>
                <div class="spec-item">
                    <span>Category:</span>
                    <span>${product.category}</span>
                </div>
                <div class="spec-item">
                    <span>Stock:</span>
                    <span>${stock > 0 ? `${stock} available` : 'Out of stock'}</span>
                </div>
                <div class="spec-item">
                    <span>SKU:</span>
                    <span>${product.sku || 'N/A'}</span>
                </div>
                <div class="spec-item">
                    <span>Weight:</span>
                    <span>${product.weight || 'N/A'} lbs</span>
                </div>
            </div>

            <button class="btn-add-to-cart" onclick="addToCartAndClose(${product.id})">Add to Cart</button>
        </div>
    `;

    elements.modalBody.innerHTML = html;
    elements.productModal.classList.add('active');
    elements.modalOverlay.classList.add('active');
}

/**
 * Close product modal
 */
function closeProductModal() {
    elements.productModal.classList.remove('active');
    elements.modalOverlay.classList.remove('active');
}

/**
 * Add to cart and close modal
 */
function addToCartAndClose(productId) {
    const product = state.allProducts.find(p => p.id === productId);
    if (product) {
        addToCart(product);
        closeProductModal();
    }
}

// ===========================
// CART MANAGEMENT
// ===========================

/**
 * Add product to cart
 */
function addToCart(product) {
    const existingItem = state.cart.find(item => item.id === product.id);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        state.cart.push({
            id: product.id,
            title: product.title,
            price: product.price,
            image: product.thumbnail,
            quantity: 1
        });
    }

    saveCart();
    updateCartCount();
    renderCart();

    // Show feedback
    showCartNotification('Product added to cart!');
}

/**
 * Remove product from cart
 */
function removeFromCart(productId) {
    state.cart = state.cart.filter(item => item.id !== productId);
    saveCart();
    updateCartCount();
    renderCart();
}

/**
 * Update product quantity in cart
 */
function updateCartQuantity(productId, newQuantity) {
    if (newQuantity <= 0) {
        removeFromCart(productId);
        return;
    }

    const item = state.cart.find(item => item.id === productId);
    if (item) {
        item.quantity = newQuantity;
        saveCart();
        renderCart();
    }
}

/**
 * Calculate cart totals
 */
function calculateCartTotals() {
    const subtotal = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.1;
    const total = subtotal + tax;

    return { subtotal, tax, total };
}

/**
 * Render cart items
 */
function renderCart() {
    if (state.cart.length === 0) {
        elements.cartEmpty.style.display = 'flex';
        elements.cartFooter.style.display = 'none';
        elements.cartItems.innerHTML = '';
        return;
    }

    elements.cartEmpty.style.display = 'none';
    elements.cartFooter.style.display = 'block';

    const html = state.cart.map(item => `
        <div class="cart-item">
            <div class="cart-item-image">
                <img src="${item.image}" alt="${item.title}">
            </div>
            <div class="cart-item-details">
                <h4 class="cart-item-title">${item.title}</h4>
                <div class="cart-item-price">$${(item.price * item.quantity).toFixed(2)}</div>
                <div class="cart-item-quantity">
                    <button class="qty-btn" onclick="updateCartQuantity(${item.id}, ${item.quantity - 1})">−</button>
                    <span class="qty-display">${item.quantity}</span>
                    <button class="qty-btn" onclick="updateCartQuantity(${item.id}, ${item.quantity + 1})">+</button>
                </div>
                <button class="remove-from-cart" onclick="removeFromCart(${item.id})">Remove</button>
            </div>
        </div>
    `).join('');

    elements.cartItems.innerHTML = html;

    // Update totals
    const { subtotal, tax, total } = calculateCartTotals();
    document.getElementById('subtotal').textContent = '$' + subtotal.toFixed(2);
    document.getElementById('tax').textContent = '$' + tax.toFixed(2);
    document.getElementById('total').textContent = '$' + total.toFixed(2);
}

/**
 * Update cart count badge
 */
function updateCartCount() {
    const totalItems = state.cart.reduce((sum, item) => sum + item.quantity, 0);
    elements.cartCount.textContent = totalItems;
}

/**
 * Save cart to localStorage
 */
function saveCart() {
    localStorage.setItem('cart', JSON.stringify(state.cart));
}

/**
 * Load cart from localStorage
 */
function loadCart() {
    const saved = localStorage.getItem('cart');
    if (saved) {
        state.cart = JSON.parse(saved);
    }
}

/**
 * Open cart sidebar
 */
function openCart() {
    elements.cartSidebar.classList.add('active');
    elements.cartOverlay.classList.add('active');
}

/**
 * Close cart sidebar
 */
function closeCart() {
    elements.cartSidebar.classList.remove('active');
    elements.cartOverlay.classList.remove('active');
}

// ===========================
// THEME & UI UTILITIES
// ===========================

/**
 * Toggle dark mode
 */
function toggleDarkMode() {
    state.darkMode = !state.darkMode;
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', state.darkMode);
}

/**
 * Show loader
 */
function showLoader() {
    elements.loader.style.display = 'flex';
}

/**
 * Hide loader
 */
function hideLoader() {
    elements.loader.style.display = 'none';
}

/**
 * Show error message
 */
function showError(message) {
    elements.errorText.textContent = message;
    elements.errorMessage.style.display = 'block';
}

/**
 * Hide error message
 */
function hideError() {
    elements.errorMessage.style.display = 'none';
}

/**
 * Show cart notification
 */
function showCartNotification(message) {
    // Create and show a temporary notification
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: var(--color-primary);
        color: var(--color-secondary);
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        font-weight: 500;
        z-index: 2000;
        animation: slideUp 0.3s ease-out;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'fadeIn 0.3s ease-out reverse';
        setTimeout(() => notification.remove(), 300);
    }, 2000);
}

// ===========================
// EVENT LISTENERS
// ===========================

/**
 * Initialize event listeners
 */
function initializeEventListeners() {
    // Search
    elements.searchInput.addEventListener('input', handleSearch);

    // Filters
    elements.priceRange.addEventListener('change', handlePriceChange);
    elements.sortSelect.addEventListener('change', handleSortChange);
    elements.clearFilters.addEventListener('click', clearAllFilters);

    // Theme
    elements.themeToggle.addEventListener('click', toggleDarkMode);

    // Cart
    elements.cartBtn.addEventListener('click', openCart);
    elements.cartClose.addEventListener('click', closeCart);
    elements.cartOverlay.addEventListener('click', closeCart);

    // Modal
    const modalClose = document.querySelector('.modal-close');
    if (modalClose) {
        modalClose.addEventListener('click', closeProductModal);
    }
    elements.modalOverlay.addEventListener('click', closeProductModal);

    // Retry button
    elements.retryBtn.addEventListener('click', fetchProducts);

    // Logo click to reset
    elements.logo.addEventListener('click', clearAllFilters);

    // Prevent modal close when clicking on content
    elements.productModal.addEventListener('click', (e) => {
        if (e.target === elements.productModal) {
            closeProductModal();
        }
    });
}

// ===========================
// INITIALIZATION
// ===========================

/**
 * Initialize the application
 */
function init() {
    // Apply saved dark mode preference
    if (state.darkMode) {
        document.body.classList.add('dark-mode');
    }

    // Load cart from localStorage
    loadCart();
    updateCartCount();

    // Initialize event listeners
    initializeEventListeners();

    // Fetch products
    fetchProducts();
}

// Start the app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
