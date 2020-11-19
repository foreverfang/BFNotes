Page({
  data: {
    detailInfo: {}
  },
  onLoad(option){
    if (option.params) {
      // 首页详情跳转
      const dataParams = JSON.parse(option.params);
      this.setData({
        detailInfo: dataParams
      });
    }
  }
})