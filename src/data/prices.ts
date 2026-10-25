/**
 * ★ 每小时自动更新请改这里 ★
 *
 * 只要修改下面 PRICE_DATA 里对应平台的 price / guobu / note / updated，
 * 页面会自动重新渲染、重新排序。type: "real"=实查 "est"=估算。
 */
export interface Platform {
  name: string;
  sub: string;
  price: number;
  priceLabel?: string;
  type: "real" | "est";
  guobu: string;
  note: string;
  url: string;
  color: string;
}

export interface PriceData {
  updated: string;
  platforms: Platform[];
}

export const PRICE_DATA: PriceData = {
  updated: "2026-10-25 11:13",
  platforms: [
    {
      name: "OPPO 官网",
      sub: "欢太商城 · 官方直营",
      price: 5499,
      type: "real",
      guobu: "国补后约 ¥4,999",
      note: "官方直营，价格基准；国补需符合当地资格。",
      url: "https://www.oppo.com/cn/",
      color: "#1a73e8",
    },
    {
      name: "京东自营",
      sub: "需登录看实时价",
      price: 4999,
      type: "real",
      guobu: "疑似国补到手价",
      note: "第三方报价页显示 ¥4,999；京东自营需登录查看实时价。",
      url: "https://search.jd.com/Search?keyword=OPPO%20Find%20X10%20E&enc=utf-8",
      color: "#e1251b",
    },
    {
      name: "天猫官方旗舰店",
      sub: "OPPO 官方旗舰店",
      price: 5499,
      type: "est",
      guobu: "国补后约 ¥4,999",
      note: "官方旗舰店通常与官网同价；未找到具体成交价报道。",
      url: "https://list.tmall.com/search_product.htm?q=OPPO%20Find%20X10%20E",
      color: "#ff0036",
    },
    {
      name: "淘宝",
      sub: "第三方店铺",
      price: 5499,
      type: "est",
      guobu: "国补后约 ¥4,999",
      note: "第三方店铺价或略低；无公开具体报价。",
      url: "https://s.taobao.com/search?q=OPPO%20Find%20X10%20E",
      color: "#ff6a00",
    },
    {
      name: "拼多多",
      sub: "需登录看实时价",
      price: 5299,
      priceLabel: "¥5,199 – 5,399",
      type: "est",
      guobu: "无国补",
      note: "未找到百亿补贴价；参照同档新机补贴力度估算，需登录查看实时价。",
      url: "https://www.pinduoduo.com/",
      color: "#e02e24",
    },
    {
      name: "苏宁易购",
      sub: "需登录看实时价",
      price: 5499,
      type: "est",
      guobu: "国补后约 ¥4,999",
      note: "苏宁需登录才显示价格，未实查；以页面为准。",
      url: "https://search.suning.com/OPPO%20Find%20X10%20E/",
      color: "#f90",
    },
    {
      name: "抖音商城",
      sub: "直播间偶有券",
      price: 5499,
      type: "est",
      guobu: "",
      note: "未找到具体报价；抖音小店价格波动大，以直播间实时价为准。",
      url: "https://www.douyin.com/",
      color: "#000000",
    },
    {
      name: "快手小店",
      sub: "",
      price: 5499,
      type: "est",
      guobu: "",
      note: "未找到具体报价；价格以实时为准。",
      url: "https://www.kuaishou.com/",
      color: "#ff4906",
    },
    {
      name: "唯品会",
      sub: "多为第三方商家",
      price: 5499,
      type: "est",
      guobu: "",
      note: "未找到具体报价；唯品会手机多为第三方商家，价格或略低。",
      url: "https://www.vip.com/",
      color: "#d63384",
    },
    {
      name: "国美",
      sub: "",
      price: 5499,
      type: "est",
      guobu: "国补后约 ¥4,999",
      note: "未找到具体报价；以页面实时价为准。",
      url: "https://www.gome.com.cn/",
      color: "#c00",
    },
  ],
};
