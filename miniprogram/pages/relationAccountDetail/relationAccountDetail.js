Page({
  data: {
    accountInfo: {}
  },
  onLoad(option){
    if (option.params) {
      // 新增跳转
      const dataParams = JSON.parse(option.params);
      this.setData({
        accountInfo: dataParams
      });
      // console.log("明细跳转数据：", dataParams);
    }
  }
})