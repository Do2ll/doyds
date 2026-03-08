// JSONBin.io 后端服务
const API_KEY = '$2a$10$i1/eRUrCkDxuwdFW9F4f6erEjUpMBJSOvZn0Tt8jqM8t6iCOKjsMe';
const BASE_URL = 'https://api.jsonbin.io/v3';

// Bin IDs (首次运行后会被更新)
let PRODUCTS_BIN_ID = null;
let USERS_BIN_ID = null;
let ORDERS_BIN_ID = null;

// 从本地存储获取Bin IDs
function getBinIds() {
    PRODUCTS_BIN_ID = localStorage.getItem('productsBinId');
    USERS_BIN_ID = localStorage.getItem('usersBinId');
    ORDERS_BIN_ID = localStorage.getItem('ordersBinId');
}

// 初始化Bins（首次使用时创建）
async function initBins() {
    getBinIds();
    
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
    const users = await getUsers();
    
    // 检查邮箱是否已存在
    if (users.find(u => u.email === email)) {
        throw new Error('该邮箱已被注册');
    }
    
    const newUser = {
        id: Date.now(),
        name: name,
        email: email,
        password: password, // 实际应用中应该加密
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=10b981&color=fff`,
        createdAt: Date.now()
    };
    
    users.push(newUser);
    await saveUsers(users);
    
    // 返回不含密码的用户信息
    const { password: _, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
}

// 登录用户
async function loginUser(email, password) {
    const users = await getUsers();
    const user = users.find(u => u.email === email && u.password === password);
    
    if (!user) {
        throw new Error('邮箱或密码错误');
    }
    
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
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
