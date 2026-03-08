// 虎皮椒支付 - 创建订单
const crypto = require('crypto');

module.exports = async (req, res) => {
  // 设置 CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { orderId, amount, title, notify_url, return_url } = req.query;

    // 你的虎皮椒商户信息（请在虎皮椒后台获取后填入）
    const APPID = process.env.XUNHUPAY_APPID || '你的appid';  // ← 在 Vercel 环境变量中配置
    const APPSECRET = process.env.XUNHUPAY_APPSECRET || '你的appsecret';  // ← 在 Vercel 环境变量中配置

    // 支付网关地址
    const GATEWAY = 'https://api.xunhupay.com/payment/do.html';

    // 生成签名
    const nonce_str = Math.random().toString(36).substr(2);
    const hash = crypto.createHash('md5')
      .update(APPID + orderId + amount + nonce_str + APPSECRET)
      .digest('hex');

    // 构建支付参数
    const payUrl = `${GATEWAY}?` + new URLSearchParams({
      appid: APPID,
      trade_order_id: orderId,
      total_fee: amount,
      title: title,
      time: Math.floor(Date.now() / 1000),
      nonce_str: nonce_str,
      hash: hash,
      notify_url: notify_url || 'https://doyds.xyz/api/notify',
      return_url: return_url || 'https://doyds.xyz/#success',
      type: 'alipay'  // 或 'wechat'，可以让用户选择
    });

    // 返回支付链接
    res.json({
      success: true,
      pay_url: payUrl,
      order_id: orderId
    });

  } catch (error) {
    console.error('支付创建失败:', error);
    res.status(500).json({
      success: false,
      error: '支付创建失败'
    });
  }
};
