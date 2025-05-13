document.addEventListener('DOMContentLoaded', async function () {
    // DOM Elements
    const menuItemsContainer = document.getElementById('menu-items');
    const noMenuItemsMessage = document.getElementById('no-menu-items-message');
    const orderItemsContainer = document.getElementById('order-items');
    const emptyOrderMessage = document.getElementById('empty-order-message');
    const subtotalElement = document.getElementById('subtotal');
    const taxElement = document.getElementById('tax');
    const totalElement = document.getElementById('total');
    const placeOrderBtn = document.getElementById('place-order-btn');
    const clearOrderBtn = document.getElementById('clear-order-btn');
    const orderConfirmationModal = document.getElementById('order-confirmation');
    const orderNumberElement = document.getElementById('order-number');
    const categoryList = document.getElementById('categoryList');
    const newOrderBtn = document.getElementById('new-order-btn');
    const closeModalBtn = document.querySelector('.close-modal');

    // Table data
    let tableNumber = null, guestCount = null;
    do {
        tableNumber = prompt('Enter table number:');
        guestCount = prompt('Enter guest count:');
    } while (!tableNumber || !guestCount);

    tableNumber = parseInt(tableNumber);
    document.getElementById('tableNumber').textContent = `Table ${tableNumber} (${guestCount} guest${guestCount == 1 ? '' : 's'})`;

    // State
    let loadingData = true;
    noMenuItemsMessage.textContent = 'Loading...';
    let products = localStorage.getItem('posProducts');

    if (products) {
        try {
            products = JSON.parse(products);
        } catch (error) {
            console.error('Error parsing posProducts from localStorage:', error);
            products = [];
        }
    } else {
        const data = await fetch("https://free-food-menus-api-two.vercel.app/all")
            .then(res => res.json())
            .then(data => {

                // remove pagination, our foods, and best foods
                const response = data;
                delete response.pagination;
                delete response['our-foods'];
                delete response['best-foods'];

                const reducedData = {};
                const productArray = [];

                for (const [category, products] of Object.entries(response)) {
                    // limit data received to 10 so as to not cause lag
                    reducedData[category] = products.slice(0, 10);

                    // push products to productArray with converted format
                    reducedData[category].forEach(product => {
                        productArray.push({
                            id: product.id,
                            name: product.name,
                            price: product.price,
                            category: category.replace('-', ' '),
                            image: product.img
                        });
                    })
                }

                return productArray;
            });

        localStorage.setItem('posProducts', JSON.stringify(data));
    }

    let currentOrder = {
        id: generateOrderId(),
        items: [],
        status: 'pending',
        timestamp: new Date().toISOString()
    };
    let currentCategory = 'all';

    // Initialize
    await renderCategories()

    renderMenu();
    updateOrderSummary();

    placeOrderBtn.addEventListener('click', placeOrder);
    clearOrderBtn.addEventListener('click', clearOrder);
    newOrderBtn.addEventListener('click', startNewOrder);
    closeModalBtn.addEventListener('click', closeModal);

    function renderMenu() {
        if (products.length === 0) {
            noMenuItemsMessage.style.display = 'block';
            menuItemsContainer.innerHTML = '';
            return;
        }

        let filteredProducts = products;
        if (currentCategory !== 'all') {
            filteredProducts = products.filter(p => p.category.toLowerCase() === currentCategory.toLowerCase());
        }

        if (filteredProducts.length === 0) {
            noMenuItemsMessage.textContent = 'No items in this category.';
            noMenuItemsMessage.style.display = 'block';
            menuItemsContainer.innerHTML = '';
            return;
        }

        noMenuItemsMessage.style.display = 'none';
        menuItemsContainer.innerHTML = filteredProducts.map(product => `
            <div class="menu-item" data-id="${product.id}">
                <img src="${product.image}" alt="${product.name}" class="menu-item-image">
                <h3 class="menu-item-name">${product.name}</h3>
                <p class="menu-item-price">₱${product.price.toLocaleString()}</p>
            </div>
        `).join('');

        // Add click event to menu items
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', function () {
                const productId = this.dataset.id;
                addToOrder(productId);
            });
        });
    }

    function addToOrder(productId) {
        const product = products.find(p => p.id === productId);
        if (!product) return;

        // Check if product is already in order
        const existingItem = currentOrder.items.find(item => item.productId === productId);

        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            currentOrder.items.push({
                productId,
                name: product.name,
                price: product.price,
                quantity: 1
            });
        }

        renderOrder();
        updateOrderSummary();

        // Show brief animation on the added item
        const addedItem = document.querySelector(`.order-item[data-id="${productId}"]`);
        if (addedItem) {
            addedItem.classList.add('highlight');
            setTimeout(() => {
                addedItem.classList.remove('highlight');
            }, 500);
        }
    }

    function updateQuantity(productId, change) {
        const itemIndex = currentOrder.items.findIndex(item => item.productId === productId);
        if (itemIndex === -1) return;

        const newQuantity = currentOrder.items[itemIndex].quantity + change;

        if (newQuantity <= 0) {
            // Remove item
            currentOrder.items.splice(itemIndex, 1);
        } else {
            // Update quantity
            currentOrder.items[itemIndex].quantity = newQuantity;
        }

        renderOrder();
        updateOrderSummary();
    }

    function renderOrder() {
        if (currentOrder.items.length === 0) {
            emptyOrderMessage.style.display = 'block';
            orderItemsContainer.innerHTML = '';
            return;
        }

        emptyOrderMessage.style.display = 'none';
        orderItemsContainer.innerHTML = currentOrder.items.map(item => `
            <div class="order-item" data-id="${item.productId}">
                <div class="order-item-details">
                    <span class="order-item-name">${item.name}</span>
                    <span class="order-item-price">₱${(item.price * item.quantity).toLocaleString()}</span>
                </div>
                <div class="order-item-quantity">
                    <button class="quantity-btn decrease-btn" data-id="${item.productId}">-</button>
                    <span>${item.quantity}</span>
                    <button class="quantity-btn increase-btn" data-id="${item.productId}">+</button>
                </div>
            </div>
        `).join('');

        // Add event listeners to quantity buttons
        document.querySelectorAll('.decrease-btn').forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                updateQuantity(btn.dataset.id, -1);
            });
        });

        document.querySelectorAll('.increase-btn').forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                updateQuantity(btn.dataset.id, 1);
            });
        });
    }

    function updateOrderSummary() {
        const subtotal = currentOrder.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const taxRate = 0.12; // 8% tax
        const tax = subtotal * taxRate;
        const total = subtotal + tax;

        subtotalElement.textContent = `₱${subtotal.toLocaleString()}`;
        taxElement.textContent = `₱${tax.toLocaleString()}`;
        totalElement.textContent = `₱${total.toLocaleString()}`;

        // Enable/disable order button based on items
        placeOrderBtn.disabled = currentOrder.items.length === 0;
        clearOrderBtn.disabled = currentOrder.items.length === 0;

        if (currentOrder.items.length === 0) {
            placeOrderBtn.classList.add('disabled');
            clearOrderBtn.classList.add('disabled');
        } else {
            placeOrderBtn.classList.remove('disabled');
            clearOrderBtn.classList.remove('disabled');
        }
    }

    function placeOrder() {
        if (currentOrder.items.length === 0) return;

        // Get existing orders
        let orders = JSON.parse(localStorage.getItem('posOrders')) || [];

        // Add timestamp and status
        currentOrder.timestamp = new Date().toISOString();
        currentOrder.status = 'pending';
        currentOrder.tableNumber = tableNumber;
        currentOrder.guestCount = guestCount;

        // Add order to orders array
        orders.push(currentOrder);

        // Save to localStorage
        localStorage.setItem('posOrders', JSON.stringify(orders));

        // Show confirmation
        orderNumberElement.textContent = currentOrder.id;
        orderConfirmationModal.classList.add('show');
    }

    function clearOrder() {
        currentOrder.items = [];
        renderOrder();
        updateOrderSummary();
    }

    function startNewOrder() {
        clearOrder();
        currentOrder.id = generateOrderId();
        closeModal();
    }

    function closeModal() {
        orderConfirmationModal.classList.remove('show');
    }

    function generateOrderId() {
        return 'ORD' + Math.floor(10000 + Math.random() * 90000);
    }

    // Add CSS for highlight effect
    const style = document.createElement('style');
    style.textContent = `
        .order-item.highlight {
            background-color: var(--apple-light-gray);
            transition: background-color 0.5s;
        }
        
        .disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
    `;
    document.head.appendChild(style);

    async function renderCategories() {
        const data = await fetch("https://free-food-menus-api-two.vercel.app/pagination")
            .then(res => res.json());
        let categories = Object.keys(data.pagination);

        // exclude 'Our Foods' and 'Best Foods'
        categories = categories.filter(category => category !== 'our-foods' && category !== 'best-foods');

        // replace '-' with ' '
        categories.forEach((category, index) => {
            categories[index] = category.replace('-', ' ');
        });

        // Add categories to category list
        categories.forEach(category => {
            const categoryTag = document.createElement('button');
            categoryTag.classList.add('filter-btn');
            categoryTag.dataset.category = category;
            categoryTag.textContent = category.charAt(0).toUpperCase() + category.slice(1); // capitalize first letter
            categoryList.appendChild(categoryTag);
        });

        // Update category filters
        const categoryFilterBtns = document.querySelectorAll('.filter-btn');
        // Event Listeners
        categoryFilterBtns.forEach(btn => {
            btn.addEventListener('click', function () {
                currentCategory = this.dataset.category;

                // Update active state
                categoryFilterBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');

                renderMenu();
            });
        });
    }
});