import * as echarts from '../../lib/ec-canvas/echarts';
import mapData from '../../lib/chinaData'; // 省市坐标数据
import geoJson from '../../lib/china'; // 地图数据

/*
* 省市数据格式化(前两位为坐标，第三位为value值，形如 [120.13, 33.38, 'value'])
*/
 function convertData(data) {
  let res = [];
  for (let i = 0; i < data.length; i++) {
      const geoCoord = mapData.geoCoordMap[data[i].name];
      if (geoCoord) {
          res.push({
              name: data[i].name,
              value: geoCoord.concat(data[i].value)
          });
      }
  }
  return res;
}

let chart = null;

function initChart(canvas, width, height, dpr) {
  chart = echarts.init(canvas, null, {
    width: width,
    height: height,
    devicePixelRatio: dpr // new
  });
  canvas.setChart(chart);
  echarts.registerMap('china', geoJson); // 绘制中国地图
  const option = {
    title: {
      x: 'center',
      text: "环游世界（国内）",
      padding: 5,
      textStyle: {
        fontSize: 18,
        fontWeight: 'bolder',
        color: '#d93a49' // 主标题文字颜色
      }
    },
    tooltip: {
      trigger: 'item',
      backgroundColor: "#FFF",
      padding: [10, 15, 8, 15],
      extraCssText: 'box-shadow: 2px 2px 10px rgba(21, 126, 245, 0.35);',
      textStyle: {
        fontFamily: "'Microsoft YaHei', Arial, 'Avenir', Helvetica, sans-serif",
        color: '#005dff',
        fontSize: 12,
      },
      formatter: function (params) {
        if(typeof(params.value)[2] == "undefined"){
          return params.name + ' : 未去过' ;
        }else{
          return params.name + ' : 想去';
        }
      }
    },
    geo: [
      {
        // 地理坐标系组件
        map: "china",
        roam: false, // 可以缩放和平移
        aspectScale: 0.8, // 比例
        layoutCenter: ["50%", "38%"], // position位置
        layoutSize: 320, // 地图大小，保证了不超过 370x370 的区域
        label: {
          // 图形上的文本标签
          normal: {
            show: true,
            textStyle: {
              color: "#E8E8E8",
              fontSize: '8'
            }
          },
          emphasis: { // 高亮时样式
            color: "#333",
            show: false
          }
        },
        itemStyle: {
          // 图形上的地图区域
          normal: {
            borderColor: "#FFD700",
            areaColor: "#87CEFF"
            //#000000 #87CEFF
          }
        }
      }
    ],
    visualMap: {
      show: false,
      min: 0,
      max: 150,
      left: 'left',
      top: 'bottom',
      text: ['high'], // 文本，默认为数值文本
      calculable: true,
      seriesIndex: [1],
      inRange: { 
          color: ['#63B8FF', '#FFD700','#EE0000'] //渐变颜色
      }
    },
    series: [{
      type: 'map',
      mapType: 'china',
      geoIndex: 0,
      roam: false, // 鼠标是否可以缩放
      label: {
        normal: {
          show: false,
        },
        emphasis: {
          show: false
        }
      },
      itemStyle: {
        normal: {
            color: '#05C3F9',
            fontSize: '8'
        },
      },
      data: []
    },{
      name: '散点',
      type: 'scatter',
      coordinateSystem: 'geo',
      symbolSize: function (val) {
          return val[2] / 10;
      },
      label: {
        normal: {
            formatter: '{b}',
            position: 'left',
            show: false,
            textStyle: {
              color: "rgba(0, 0, 0, 0.9)",
              fontSize: '8'
            }
        },
        emphasis: {
            show: true,
            textStyle: {
              color: "rgba(0, 0, 0, 0.9)",
              fontSize: '8'
            }
        },
      },
      itemStyle: {
          normal: {
              color: '#FFD700'
          }
      },
      data: []
    }]
  };

  chart.setOption(option);
  return chart;
}

Page({
  data: {
    ec: {
      onInit: initChart
    }
  },
  onLoad(options) {},
  onShow: function () {
    var that = this;
    setTimeout(function () {
      that.getEchartsInfo()
    }, 500)
  },
  onUnload(){},
  // 获取目的地数据
  getEchartsInfo() {
    wx.showLoading({
      title: '正在加载...',
      mask: true
    });
    const that = this;
    const db = wx.cloud.database({env:'scallop-2g4ppt2ya3b48261'});
    db.collection('fang_travel').get().then(res=>{
      wx.hideLoading();
      const option = chart.getOption();
      const echartsData = res.data;
      let dataset = [];
      for(let i = 0; i < echartsData.length; i++) {
        const dataItem = echartsData[i];
        dataset.push({
          name: dataItem.destination,
          value: i + 150
        });
      }
      option.series[0].data = convertData(mapData.data);
      option.series[1].data = convertData(dataset);
      chart.setOption(option, true);
    }).catch(err=>{
      console.error(err);
      wx.hideLoading();
    })
  }
})