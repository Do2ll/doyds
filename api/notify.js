// 虎皮椒支付 - 异步通知回调
const crypto = require('crypto');

module.exports = async (req, res) => {
  // 设置 CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const body = req.body;

    // 虎皮椒商户信息
    const APPSECRET = process.env.XUNHUPAY_APPSECRET || '你的appsecret';

    // 验证签名
    const hash = crypto.createHash('md5')
      .update(body.trade_order_id + body.total_fee + body.transaction_id + body.appid + APPSECRET)
      .digest('hex');

    if (hash !== body.hash) {
      console.error('签名验证失败');
      return res.status(400).send('FAIL');
    }

    // 检查支付状态
    if (body.status !== 'OD') {
      console.log('支付未成功:', body.status);
      return res.send('SUCCESS');  // 即使未成功也要返回
    }

    // 支付成功，更新订单状态
    // 这里你可以：
    // 1. 存储订单到数据库
    // 2. 发送通知给买家和卖家
    // 3. 更新商品状态等

    console.log('支付成功:', {
      订单号: body.trade_order_id,
      支付金额: body.total_fee,
      交易流水: body.transaction_id,
      支付方式: body.type === 1 ? '支付宝' : '微信'
    });

    // 返回成功
    res.send('SUCCESS');

  } catch (error) {
    console.error('回调处理失败:', error);
    res.status(500).send('FAIL');
  }
};
