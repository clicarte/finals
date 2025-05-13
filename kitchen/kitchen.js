document.addEventListener('DOMContentLoaded', function () {
    let inputCode = null, accessCode = 1234;
    do {
        inputCode = parseInt(prompt('Enter access code:'));
    } while (inputCode !== accessCode);

    // DOM Elements
    const ordersContainer = document.getElementById('orders-container');
    const noOrdersMessage = document.getElementById('no-orders-message');
    const filterButtons = document.querySelectorAll('.filter-btn');

    // State
    let orders = [];
    let activeFilter = 'pending'; // Default filter

    // Initialize
    loadOrders();
    setInterval(loadOrders, 10000); // Refresh every 10 seconds

    // Set active filter button
    filterButtons.forEach(btn => {
        btn.addEventListener('click', function () {
            activeFilter = this.dataset.status;

            // Update active state
            filterButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            renderOrders();
        });
    });

    function loadOrders() {
        orders = JSON.parse(localStorage.getItem('posOrders')) || [];
        renderOrders();
    }

    function renderOrders() {
        const filteredOrders = orders.filter(order => order.status === activeFilter);

        if (filteredOrders.length === 0) {
            noOrdersMessage.style.display = 'block';
            noOrdersMessage.textContent = `No ${activeFilter} orders.`;
            ordersContainer.innerHTML = '';
            return;
        }

        noOrdersMessage.style.display = 'none';

        // Sort orders by timestamp (newest first)
        filteredOrders.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        ordersContainer.innerHTML = filteredOrders.map(order => {
            const orderDate = new Date(order.timestamp);
            const formattedTime = orderDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const formattedDate = orderDate.toLocaleDateString();

            return `
                <div class="order-card" data-id="${order.id}">
                    <div class="order-header-container">
                        <div class="order-header">
                            <span class="order-number">${order.id}</span>
                            <span class="order-time">${formattedTime}, ${formattedDate}</span>
                        </div>
                        <div class="order-header">
                            <span class="order-time">Table ${order.tableNumber}</span>
                            <span class="order-time">${order.guestCount} guests</span>
                        </div>
                    </div>
                    <span class="order-status status-${order.status}">${capitalizeFirst(order.status)}</span>
                    
                    <ul class="order-items-list">
                        ${order.items.map(item => `
                            <li>
                                <span class="item-name">${item.name}</span>
                                <span class="item-quantity">x${item.quantity}</span>
                            </li>
                        `).join('')}
                    </ul>
                    
                    ${getActionButtonsForStatus(order.status, order.id)}
                </div>
            `;
        }).join('');

        // Add event listeners to order action buttons
        addButtonEventListeners();
    }

    function getActionButtonsForStatus(status, orderId) {
        switch (status) {
            case 'pending':
                return `
                    <div class="order-action-buttons">
                        <button class="btn btn-primary prepare-btn" data-id="${orderId}">Start Preparing</button>
                    </div>
                `;
            case 'preparing':
                return `
                    <div class="order-action-buttons">
                        <button class="btn btn-primary ready-btn" data-id="${orderId}">Mark as Ready</button>
                    </div>
                `;
            case 'ready':
                return `
                    <div class="order-action-buttons">
                        <button class="btn btn-primary complete-btn" data-id="${orderId}">Complete Order</button>
                    </div>
                `;
            default:
                return '';
        }
    }

    function addButtonEventListeners() {
        // Prepare buttons
        document.querySelectorAll('.prepare-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                updateOrderStatus(this.dataset.id, 'preparing');
            });
        });

        // Ready buttons
        document.querySelectorAll('.ready-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                updateOrderStatus(this.dataset.id, 'ready');
            });
        });

        // Complete buttons
        document.querySelectorAll('.complete-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                updateOrderStatus(this.dataset.id, 'completed');
            });
        });
    }

    function updateOrderStatus(orderId, newStatus) {
        const orderIndex = orders.findIndex(o => o.id === orderId);
        if (orderIndex === -1) return;

        orders[orderIndex].status = newStatus;

        // Save to localStorage
        localStorage.setItem('posOrders', JSON.stringify(orders));

        // Re-render orders
        renderOrders();

        // Show notification
        showNotification(`Order ${orderId} ${getStatusActionVerb(newStatus)}`);
    }

    function getStatusActionVerb(status) {
        switch (status) {
            case 'preparing': return 'is now being prepared';
            case 'ready': return 'is now ready for pickup';
            case 'completed': return 'has been completed';
            default: return 'status updated';
        }
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
});