document.addEventListener('DOMContentLoaded', function () {
    let inputCode = null, accessCode = 4321;
    do {
        inputCode = parseInt(prompt('Enter access code:'));
    } while (inputCode !== accessCode);
    
    // DOM Elements
    const productForm = document.getElementById('product-form');
    const productList = document.getElementById('product-list');
    const noProductsMessage = document.getElementById('no-products-message');
    const productCategory = document.getElementById("product-category");

    // Load products from localStorage
    let products = JSON.parse(localStorage.getItem('posProducts')) || [];

    // Initialize display
    renderProducts();

    // Event Listeners
    productForm.addEventListener('submit', handleProductSubmit);

    function handleProductSubmit(e) {
        e.preventDefault();

        const name = document.getElementById('product-name').value.trim();
        const price = parseFloat(document.getElementById('product-price').value);
        const category = document.getElementById('product-category').value;
        const image = `https://placehold.co/300x200?text=${encodeURIComponent(name)}`;

        const product = {
            id: Date.now().toString(),
            name,
            price,
            category,
            image
        };

        products.push(product);
        saveProducts();
        renderProducts();

        // Reset form
        productForm.reset();

        // Show success feedback
        showNotification('Product added successfully');
    }

    function renderProducts() {
        if (products.length === 0) {
            noProductsMessage.style.display = 'block';
            productList.innerHTML = '';
            return;
        }

        noProductsMessage.style.display = 'none';
        productList.innerHTML = products.map(product => `
            <div class="product-card" data-id="${product.id}">
                <img src="${product.image}" alt="${product.name}" class="product-image">
                <h3 class="product-name">${product.name}</h3>
                <p class="product-price">₱${product.price.toLocaleString()}</p>
                <span class="product-category">${capitalizeFirst(product.category)}</span>
                <div class="product-actions">
                    <button class="action-btn edit-btn" data-id="${product.id}">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708l-3-3zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207l6.5-6.5zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.499.499 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11l.178-.178z"/>
                        </svg>
                    </button>
                    <button class="action-btn delete-btn" data-id="${product.id}">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                            <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                        </svg>
                    </button>
                </div>
            </div>
        `).join('');

        // Add event listeners for edit and delete buttons
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', handleEditProduct);
        });

        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', handleDeleteProduct);
        });
    }

    function handleEditProduct(e) {
        const productId = e.currentTarget.dataset.id;
        const product = products.find(p => p.id === productId);

        if (!product) return;

        // Populate form with product data
        document.getElementById('product-name').value = product.name;
        document.getElementById('product-price').value = product.price;
        document.getElementById('product-category').value = product.category;
        document.getElementById('product-image').value = product.image;

        // Update form to edit mode
        const submitBtn = productForm.querySelector('button[type="submit"]');
        submitBtn.textContent = 'Update Product';
        submitBtn.dataset.editing = productId;

        // Scroll to form
        productForm.scrollIntoView({ behavior: 'smooth' });

        // Update form submission handler
        productForm.removeEventListener('submit', handleProductSubmit);
        productForm.addEventListener('submit', handleProductUpdate);
    }

    function handleProductUpdate(e) {
        e.preventDefault();

        const productId = e.currentTarget.querySelector('button[type="submit"]').dataset.editing;
        const productIndex = products.findIndex(p => p.id === productId);

        if (productIndex === -1) return;

        const name = document.getElementById('product-name').value.trim();
        const price = parseFloat(document.getElementById('product-price').value);
        const category = document.getElementById('product-category').value;
        const image = `https://placehold.co/300x200?text=${encodeURIComponent(name)}`;

        products[productIndex] = {
            ...products[productIndex],
            name,
            price,
            category,
            image
        };

        saveProducts();
        renderProducts();

        // Reset form and return to add mode
        productForm.reset();
        const submitBtn = productForm.querySelector('button[type="submit"]');
        submitBtn.textContent = 'Add Product';
        delete submitBtn.dataset.editing;

        // Reset event listeners
        productForm.removeEventListener('submit', handleProductUpdate);
        productForm.addEventListener('submit', handleProductSubmit);

        // Show success feedback
        showNotification('Product updated successfully');
    }

    function handleDeleteProduct(e) {
        const productId = e.currentTarget.dataset.id;

        // Confirmation dialog
        if (confirm('Are you sure you want to delete this product?')) {
            products = products.filter(p => p.id !== productId);
            saveProducts();
            renderProducts();
            showNotification('Product deleted successfully');
        }
    }

    function saveProducts() {
        localStorage.setItem('posProducts', JSON.stringify(products));
        console.log('Saved posProducts:', localStorage.getItem('posProducts'));
    }

    function capitalizeFirst(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    function showNotification(message) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;

        // Style the notification
        notification.style.position = 'fixed';
        notification.style.bottom = '20px';
        notification.style.right = '20px';
        notification.style.backgroundColor = 'var(--apple-blue)';
        notification.style.color = 'white';
        notification.style.padding = '10px 20px';
        notification.style.borderRadius = 'var(--radius-sm)';
        notification.style.boxShadow = 'var(--shadow-md)';
        notification.style.zIndex = '1000';
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(10px)';
        notification.style.transition = 'opacity 0.3s, transform 0.3s';

        // Add to DOM
        document.body.appendChild(notification);

        // Trigger animation
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateY(0)';
        }, 10);

        // Remove after delay
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateY(10px)';

            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    async function renderCategories() {
        const data = await fetch("https://free-food-menus-api-two.vercel.app/pagination")
            .then(res => res.json());

        const categories = Object.keys(data.pagination);

        categories.forEach(category => {
            const categoryOption = document.createElement('option');
            categoryOption.value = category;
            categoryOption.textContent = capitalizeFirst(category);
            productCategory.appendChild(categoryOption);
        });
    }

    renderCategories()
});