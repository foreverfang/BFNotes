// 云函数入口文件
const cloud = require('wx-server-sdk')

//初始化云函数
cloud.init()

// 云函数入口函数
exports.main = async ( event, context) => {
  try {
    const res = await cloud.openapi.security.imgSecCheck({
      media: {
        contentType: 'image/*',
        value: toBuffer(event.value)
      }
    });
    return res;
  } catch (err) {
    return err;
  }
}

// 将 arrayBuffer 转为 buffer 
function toBuffer(ab) {
  const buf = Buffer.from(ab)
  return buf;
}
