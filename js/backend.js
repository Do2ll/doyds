// 简化的本地存储后端服务（更稳定）
// 数据存储在浏览器localStorage中

// ==================== 用户操作 ====================

// 获取所有用户
function getUsers() {
    const users = localStorage.getItem('doyds_users');
    return users ? JSON.parse(users) : [];
}

// 保存所有用户
function saveUsers(users) {
    localStorage.setItem('doyds_users', JSON.stringify(users));
    return true;
}

// 注册用户
function registerUser(name, email, password) {
    const users = getUsers();
    
    // 检查邮箱是否已存在
    if (users.find(u => u.email === email)) {
        throw new Error('该邮箱已被注册');
    }
    
    const newUser = {
        id: Date.now(),
        name: name,
        email: email,
        password: password,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=10b981&color=fff`,
        createdAt: Date.now()
    };
    
    users.push(newUser);
    saveUsers(users);
    
    // 返回不含密码的用户信息
    const { password: _, ...userWithoutPassword } = newUser;
    return Promise.resolve(userWithoutPassword);
}

// 登录用户
function loginUser(email, password) {
    const users = getUsers();
    const user = users.find(u => u.email === email && u.password === password);
    
    if (!user) {
        throw new Error('邮箱或密码错误');
    }
    
    const { password: _, ...userWithoutPassword } = user;
    return Promise.resolve(userWithoutPassword);
}

// ==================== 商品操作 ====================

// 获取所有商品
function getProducts() {
    const products = localStorage.getItem('doyds_products');
    return products ? JSON.parse(products) : [];
}

// 保存所有商品
function saveProducts(products) {
    localStorage.setItem('doyds_products', JSON.stringify(products));
    return true;
}

// 添加商品
function addProduct(product) {
    const products = getProducts();
    product.id = Date.now();
    product.createdAt = Date.now();
    products.unshift(product);
    saveProducts(products);
    return Promise.resolve(product);
}

// 删除商品
function deleteProduct(productId) {
    const products = getProducts();
    const filtered = products.filter(p => p.id !== productId);
    saveProducts(filtered);
    return Promise.resolve(true);
}

// ==================== 订单操作 ====================

// 获取所有订单
function getOrders() {
    const orders = localStorage.getItem('doyds_orders');
    return orders ? JSON.parse(orders) : [];
}

// 保存所有订单
function saveOrders(orders) {
    localStorage.setItem('doyds_orders', JSON.stringify(orders));
    return true;
}

// 添加订单
function addOrder(order) {
    const orders = getOrders();
    order.id = Date.now();
    order.createdAt = Date.now();
    orders.unshift(order);
    saveOrders(orders);
    return Promise.resolve(order);
}

// 更新订单状态
function updateOrderStatus(orderId, newStatus) {
    const orders = getOrders();
    const index = orders.findIndex(o => o.id === orderId);
    if (index !== -1) {
        orders[index].status = newStatus;
        orders[index].updatedAt = Date.now();
        saveOrders(orders);
        return Promise.resolve(orders[index]);
    }
    return Promise.resolve(null);
}

// 初始化Bins（空函数，保持兼容）
function initBins() {
    return Promise.resolve();
}

// 加载商品（从后端加载）
function loadProductsFromBackend() {
    const products = getProducts();
    return Promise.resolve(products);
}

console.log('后端服务已加载（本地存储模式）');
    
    if (!PRODUCTS_BIN_ID) {
        // 创建商品Bin
        const productsRes = await fetch(`${BASE_URL}/b`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': API_KEY,
                'X-Bin-Name': 'doyds-products'
            },
            body: JSON.stringify([])
        });
        const productsData = await productsRes.json();
        PRODUCTS_BIN_ID = productsData.metadata.id;
        localStorage.setItem('productsBinId', PRODUCTS_BIN_ID);
    }
    
    if (!USERS_BIN_ID) {
        // 创建用户Bin
        const usersRes = await fetch(`${BASE_URL}/b`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': API_KEY,
                'X-Bin-Name': 'doyds-users'
            },
            body: JSON.stringify([])
        });
        const usersData = await usersRes.json();
        USERS_BIN_ID = usersData.metadata.id;
        localStorage.setItem('usersBinId', USERS_BIN_ID);
    }
    
    if (!ORDERS_BIN_ID) {
        // 创建订单Bin
        const ordersRes = await fetch(`${BASE_URL}/b`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': API_KEY,
                'X-Bin-Name': 'doyds-orders'
            },
            body: JSON.stringify([])
        });
        const ordersData = await ordersRes.json();
        ORDERS_BIN_ID = ordersData.metadata.id;
        localStorage.setItem('ordersBinId', ORDERS_BIN_ID);
    }
    
    console.log('Bins initialized:', { PRODUCTS_BIN_ID, USERS_BIN_ID, ORDERS_BIN_ID });
}

// ==================== 商品操作 ====================

// 获取所有商品
async function getProducts() {
    if (!PRODUCTS_BIN_ID) {
        getBinIds();
        if (!PRODUCTS_BIN_ID) return [];
    }
    
    try {
        const res = await fetch(`${BASE_URL}/b/${PRODUCTS_BIN_ID}/latest`, {
            headers: {
                'X-Master-Key': API_KEY
            }
        });
        const data = await res.json();
        return data.record || [];
    } catch (error) {
        console.error('获取商品失败:', error);
        return [];
    }
}

// 保存所有商品
async function saveProducts(products) {
    if (!PRODUCTS_BIN_ID) {
        await initBins();
    }
    
    try {
        const res = await fetch(`${BASE_URL}/b/${PRODUCTS_BIN_ID}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': API_KEY
            },
            body: JSON.stringify(products)
        });
        return res.ok;
    } catch (error) {
        console.error('保存商品失败:', error);
        return false;
    }
}

// 添加商品
async function addProduct(product) {
    const products = await getProducts();
    product.id = Date.now();
    product.createdAt = Date.now();
    products.unshift(product);
    await saveProducts(products);
    return product;
}

// 更新商品
async function updateProduct(productId, updates) {
    const products = await getProducts();
    const index = products.findIndex(p => p.id === productId);
    if (index !== -1) {
        products[index] = { ...products[index], ...updates };
        await saveProducts(products);
        return products[index];
    }
    return null;
}

// 删除商品
async function deleteProduct(productId) {
    const products = await getProducts();
    const filtered = products.filter(p => p.id !== productId);
    await saveProducts(filtered);
    return true;
}

// ==================== 用户操作 ====================

// 获取所有用户
async function getUsers() {
    if (!USERS_BIN_ID) {
        getBinIds();
        if (!USERS_BIN_ID) return [];
    }
    
    try {
        const res = await fetch(`${BASE_URL}/b/${USERS_BIN_ID}/latest`, {
            headers: {
                'X-Master-Key': API_KEY
            }
        });
        
        if (!res.ok) {
            console.error('获取用户失败:', res.status);
            return [];
        }
        
        const data = await res.json();
        return data.record || [];
    } catch (error) {
        console.error('获取用户失败:', error);
        return [];
    }
}

// 保存所有用户
async function saveUsers(users) {
    if (!USERS_BIN_ID) {
        await initBins();
    }
    
    try {
        const res = await fetch(`${BASE_URL}/b/${USERS_BIN_ID}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': API_KEY
            },
            body: JSON.stringify(users)
        });
        return res.ok;
    } catch (error) {
        console.error('保存用户失败:', error);
        return false;
    }
}

// 注册用户
async function registerUser(name, email, password) {
    try {
        // 确保Bins已初始化
        if (!USERS_BIN_ID) {
            await initBins();
        }
        
        let users = await getUsers();
        // 确保 users 是有效数组
        if (!Array.isArray(users)) {
            users = [];
        }
        
        console.log('当前用户列表:', users);
        
        // 安全检查 - 检查邮箱是否已存在
        try {
            const existingUser = users.find(u => u && u.email === email);
            if (existingUser) {
                throw new Error('该邮箱已被注册');
            }
        } catch (findError) {
            if (findError.message === '该邮箱已被注册') {
                throw findError;
            }
            console.log('检查用户时出错:', findError);
        }
        
        const newUser = {
            id: Date.now(),
            name: name,
            email: email,
            password: password,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=10b981&color=fff`,
            createdAt: Date.now()
        };
        
        users.push(newUser);
        const saved = await saveUsers(users);
        
        if (!saved) {
            throw new Error('注册失败，请稍后重试');
        }
        
        console.log('注册成功:', newUser);
        
        // 返回不含密码的用户信息
        const { password: _, ...userWithoutPassword } = newUser;
        return userWithoutPassword;
    } catch (error) {
        console.error('注册错误:', error);
        throw error;
    }
}

// 登录用户
async function loginUser(email, password) {
    try {
        let users = await getUsers();
        if (!users) users = []; // 确保 users 是数组
        
        console.log('用户列表:', users);
        
        const user = users.find(u => u && u.email === email && u.password === password);
        
        if (!user) {
            throw new Error('邮箱或密码错误，或账户不存在，请先注册');
        }
        
        const { password: _, ...userWithoutPassword } = user;
        return userWithoutPassword;
    } catch (error) {
        console.error('登录错误:', error);
        throw error;
    }
}
        
        const { password: _, ...userWithoutPassword } = user;
        return userWithoutPassword;
    } catch (error) {
        console.error('登录错误:', error);
        throw error;
    }
}

// ==================== 订单操作 ====================

// 获取所有订单
async function getOrders() {
    if (!ORDERS_BIN_ID) {
        getBinIds();
        if (!ORDERS_BIN_ID) return [];
    }
    
    try {
        const res = await fetch(`${BASE_URL}/b/${ORDERS_BIN_ID}/latest`, {
            headers: {
                'X-Master-Key': API_KEY
            }
        });
        const data = await res.json();
        return data.record || [];
    } catch (error) {
        console.error('获取订单失败:', error);
        return [];
    }
}

// 保存所有订单
async function saveOrders(orders) {
    if (!ORDERS_BIN_ID) {
        await initBins();
    }
    
    try {
        const res = await fetch(`${BASE_URL}/b/${ORDERS_BIN_ID}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': API_KEY
            },
            body: JSON.stringify(orders)
        });
        return res.ok;
    } catch (error) {
        console.error('保存订单失败:', error);
        return false;
    }
}

// 添加订单
async function addOrder(order) {
    const orders = await getOrders();
    order.id = Date.now();
    order.createdAt = Date.now();
    orders.unshift(order);
    await saveOrders(orders);
    return order;
}

// 更新订单状态
async function updateOrderStatus(orderId, newStatus) {
    const orders = await getOrders();
    const index = orders.findIndex(o => o.id === orderId);
    if (index !== -1) {
        orders[index].status = newStatus;
        orders[index].updatedAt = Date.now();
        await saveOrders(orders);
        return orders[index];
    }
    return null;
}

// 初始化
getBinIds();
