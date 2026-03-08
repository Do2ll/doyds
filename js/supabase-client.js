// Supabase 客户端配置
// 请将下面的 URL 和 KEY 替换为你自己的

const SUPABASE_URL = 'https://hzexfwvuzemzhckcvtag.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6ZXhmd3Z1emVtaHpja3Z0YWciLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY0MjU0MTYwMCwiZXhwIjoxOTU4MTE3NjAwfQ.H3nQ0C3P4nFk7m3nL5rK0P1o2k4w8v9x2y6z3A7B0C';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 检查登录状态
async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        currentUser = {
            id: session.user.id,
            name: session.user.email.split('@')[0],
            email: session.user.email,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(session.user.email.split('@')[0])}&background=10b981&color=fff`
        };
        updateUserUI();
    }
}

// 注册
async function signUp(email, password, username) {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                username: username
            }
        }
    });
    if (error) throw error;
    return data;
}

// 登录
async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });
    if (error) throw error;
    return data;
}

// 登出
async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
}

// 获取商品列表
async function fetchProducts(category = null, searchTerm = null) {
    let query = supabase
        .from('products')
        .select('*')
        .eq('status', 'available')
        .order('created_at', { ascending: false });

    if (category) {
        query = query.eq('category', category);
    }

    if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
}

// 发布商品
async function publishProduct(productData) {
    const { data, error } = await supabase
        .from('products')
        .insert([{
            title: productData.title,
            description: productData.description,
            price: productData.price,
            original_price: productData.originalPrice || null,
            category: productData.category,
            condition: productData.condition,
            image_url: productData.image,
            seller_id: currentUser.id,
            seller_name: currentUser.name,
            seller_avatar: currentUser.avatar,
            contact: {
                wechat: productData.contact?.wechat || null,
                qq: productData.contact?.qq || null,
                phone: productData.contact?.phone || null,
                email: productData.contact?.email || null
            }
        }])
        .select();

    if (error) throw error;
    return data[0];
}

// 获取用户商品
async function fetchMyProducts() {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('seller_id', currentUser.id)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

// 删除商品
async function deleteProduct(productId) {
    const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

    if (error) throw error;
}

// 获取收藏
async function fetchFavorites() {
    const { data, error } = await supabase
        .from('favorites')
        .select('product_id')
        .eq('user_id', currentUser.id);

    if (error) throw error;
    return data?.map(f => f.product_id) || [];
}

// 切换收藏
async function toggleFavorite(productId) {
    const { data: existing } = await supabase
        .from('favorites')
        .select('*')
        .eq('user_id', currentUser.id)
        .eq('product_id', productId)
        .single();

    if (existing) {
        await supabase.from('favorites').delete().eq('id', existing.id);
        return false;
    } else {
        await supabase.from('favorites').insert([{
            user_id: currentUser.id,
            product_id: productId
        }]);
        return true;
    }
}

// 创建订单
async function createOrder(orderData) {
    const { data, error } = await supabase
        .from('orders')
        .insert([{
            order_number: 'DOYDS' + Date.now(),
            product_id: orderData.productId,
            product_title: orderData.productTitle,
            product_image: orderData.productImage,
            product_price: orderData.productPrice,
            seller_id: orderData.sellerId,
            seller_name: orderData.sellerName,
            buyer_id: currentUser.id,
            buyer_name: currentUser.name,
            status: 'pending',
            shipping_address: orderData.shippingAddress
        }])
        .select();

    if (error) throw error;
    return data[0];
}

// 获取订单列表
async function fetchOrders() {
    const { data, error } = await supabase
        .from('orders')
        .select('*')
        .or(`buyer_id.eq.${currentUser.id},seller_id.eq.${currentUser.id}`)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

// 更新订单状态
async function updateOrderStatus(orderId, newStatus) {
    const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

    if (error) throw error;
}

// 获取聊天消息
async function fetchMessages(productId, otherUserId) {
    const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUser.id})`)
        .eq('product_id', productId)
        .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
}

// 发送消息
async function sendMessage(receiverId, productId, content) {
    const { data, error } = await supabase
        .from('messages')
        .insert([{
            sender_id: currentUser.id,
            receiver_id: receiverId,
            product_id: productId,
            content: content
        }])
        .select();

    if (error) throw error;
    return data[0];
}

// 监听登录状态变化
supabase.auth.onAuthStateChange((event, session) => {
    if (session) {
        currentUser = {
            id: session.user.id,
            name: session.user.email.split('@')[0],
            email: session.user.email,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(session.user.email.split('@')[0])}&background=10b981&color=fff`
        };
        updateUserUI();
    } else {
        currentUser = null;
        updateUserUI();
    }
});
