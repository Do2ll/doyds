// 简化的本地存储后端服务
// 数据存储在浏览器localStorage中

// ==================== 用户操作 ====================

function getUsers() {
    try {
        const users = localStorage.getItem('doyds_users');
        return users ? JSON.parse(users) : [];
    } catch (e) {
        return [];
    }
}

function saveUsers(users) {
    localStorage.setItem('doyds_users', JSON.stringify(users));
    return true;
}

function registerUser(name, email, password) {
    const users = getUsers();
    const existing = users.find(u => u.email === email);
    if (existing) {
        throw new Error('该邮箱已被注册');
    }
    const newUser = {
        id: Date.now(),
        name: name,
        email: email,
        password: password,
        avatar: 'https://ui-avatars.com/api/?name=' + encodeURIComponent(name) + '&background=10b981&color=fff',
        createdAt: Date.now()
    };
    users.push(newUser);
    saveUsers(users);
    return { id: newUser.id, name: newUser.name, email: newUser.email, avatar: newUser.avatar, createdAt: newUser.createdAt };
}

function loginUser(email, password) {
    const users = getUsers();
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) {
        throw new Error('邮箱或密码错误');
    }
    return { id: user.id, name: user.name, email: user.email, avatar: user.avatar, createdAt: user.createdAt };
}

// ==================== 商品操作 ====================

function getProducts() {
    try {
        const products = localStorage.getItem('doyds_products');
        return products ? JSON.parse(products) : [];
    } catch (e) {
        return [];
    }
}

function saveProducts(products) {
    localStorage.setItem('doyds_products', JSON.stringify(products));
    return true;
}

function addProduct(product) {
    const products = getProducts();
    product.id = Date.now();
    product.createdAt = Date.now();
    products.unshift(product);
    saveProducts(products);
    return product;
}

function deleteProduct(productId) {
    const products = getProducts();
    const filtered = products.filter(p => p.id !== productId);
    saveProducts(filtered);
    return true;
}

// ==================== 订单操作 ====================

function getOrders() {
    try {
        const orders = localStorage.getItem('doyds_orders');
        return orders ? JSON.parse(orders) : [];
    } catch (e) {
        return [];
    }
}

function saveOrders(orders) {
    localStorage.setItem('doyds_orders', JSON.stringify(orders));
    return true;
}

function addOrder(order) {
    const orders = getOrders();
    order.id = Date.now();
    order.createdAt = Date.now();
    orders.unshift(order);
    saveOrders(orders);
    return order;
}

function updateOrderStatus(orderId, newStatus) {
    const orders = getOrders();
    const index = orders.findIndex(o => o.id === orderId);
    if (index !== -1) {
        orders[index].status = newStatus;
        orders[index].updatedAt = Date.now();
        saveOrders(orders);
        return orders[index];
    }
    return null;
}

function initBins() {}
function loadProductsFromBackend() { return getProducts(); }

console.log('后端服务已加载');
