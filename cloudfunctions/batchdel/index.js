// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init()
const db = cloud.database()
const _ = db.command

// 批量删除收礼账本内部数据
exports.main = async (event, context) => {
  console.log("event", event);
  const { accountId } = event;
  try{
    return await db.collection('fang_receive_users').where({
      accountId: accountId
    }).remove();
  }catch(err){
    console.error(err);
  }
}