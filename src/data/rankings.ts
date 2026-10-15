export interface RankItem {
  title: string;
  actors: string;
  desc: string;
  heat: string;
  img: string;
}

export interface RankSection {
  id: string;
  name: string;
  items: RankItem[];
}

export const RANKINGS: RankSection[] = [
  {
    id: "tencent",
    name: "腾讯视频 · 电视剧榜",
    items: [
      { title: "兰香如故", actors: "谭松韵、刘学义", desc: "落难千金化身丫鬟宅斗复仇", heat: "", img: "/posters/p01.jpg" },
      { title: "逐玉", actors: "张凌赫、田曦薇", desc: "杀猪少女与落难侯爷虐恋", heat: "", img: "/posters/rte02.jpg" },
      { title: "美人余", actors: "李一桐、何润东", desc: "婚姻狼人杀，全员嫌疑人", heat: "", img: "/posters/p03.jpg" },
      { title: "骄阳似我", actors: "宋威龙、赵今麦", desc: "都市男女双向治愈爱情", heat: "", img: "/posters/p04.jpg" },
      { title: "主角", actors: "张嘉译、刘浩存", desc: "舞台艺术家奋斗群像史", heat: "", img: "/posters/p05.jpg" },
      { title: "交锋", actors: "王凯、彭昱畅", desc: "", heat: "", img: "/posters/p06.jpg" },
      { title: "年少有为", actors: "彭昱畅、林允", desc: "", heat: "", img: "/posters/p07.jpg" },
      { title: "白日提灯", actors: "迪丽热巴、陈飞宇", desc: "", heat: "", img: "/posters/p08.jpg" },
      { title: "千里江山图", actors: "张若昀、刘诗诗", desc: "", heat: "", img: "/posters/rte09.jpg" },
      { title: "玉兰花君再来", actors: "杨紫、欧豪", desc: "", heat: "", img: "/posters/p10.jpg" },
    ],
  },
  {
    id: "iqiyi",
    name: "爱奇艺 · 电视剧榜",
    items: [
      { title: "魅影神捕", actors: "罗云熙、方逸伦", desc: "", heat: "", img: "/posters/p11.jpg" },
      { title: "喜剧之王", actors: "杨超越、蒋龙", desc: "", heat: "", img: "/posters/p12.jpg" },
      { title: "罚罪2", actors: "黄景瑜、王传君", desc: "警匪对决全新故事", heat: "", img: "/posters/p13.jpg" },
      { title: "低智商犯罪", actors: "田曦薇、王骁", desc: "热血女刑警冷幽默探案", heat: "", img: "/posters/p14.jpg" },
      { title: "逍遥", actors: "谭松韵、侯明昊", desc: "", heat: "", img: "/posters/p15.jpg" },
      { title: "冰湖重生", actors: "黄杨钿甜", desc: "", heat: "", img: "/posters/p16.jpg" },
      { title: "一瓯春", actors: "许凯、周也", desc: "庶女带心计回府复仇", heat: "", img: "/posters/p17.jpg" },
      { title: "余红旧事", actors: "王佳佳、王天辰", desc: "", heat: "", img: "/posters/p28.jpg" },
      { title: "双轨", actors: "虞书欣、何与", desc: "", heat: "", img: "/posters/p18.jpg" },
      { title: "轻年", actors: "霍建华、田雨", desc: "", heat: "", img: "/posters/p19.jpg" },
    ],
  },
  {
    id: "youku",
    name: "优酷 · 电视剧榜",
    items: [
      { title: "此处通往繁星", actors: "张雪迎、郭麒麟", desc: "", heat: "", img: "/posters/p20.jpg" },
      { title: "九门", actors: "陈伟霆、曾舜晞", desc: "民国悬疑冒险盗墓", heat: "", img: "/posters/p21.jpg" },
      { title: "早春晴朗", actors: "井柏然、孙千", desc: "毒舌总监追妻火葬场", heat: "", img: "/posters/p22.jpg" },
      { title: "唐宫奇案之青雾风鸣", actors: "白鹿、王星越", desc: "大唐诡案女官探案", heat: "", img: "/posters/p23.jpg" },
      { title: "一瓯春", actors: "许凯、周也", desc: "庶女带心计回府复仇", heat: "", img: "/posters/p24.jpg" },
      { title: "翘楚", actors: "陈都灵、周翊然", desc: "", heat: "", img: "/posters/p25.jpg" },
      { title: "千香", actors: "宋威龙、鞠婧祎", desc: "", heat: "", img: "/posters/p26.jpg" },
      { title: "师兄太稳健", actors: "敖瑞鹏、孙珍妮", desc: "", heat: "", img: "/posters/ryo08.jpg" },
      { title: "月鳞绮纪", actors: "鞠婧祎、曾舜晞", desc: "人妖三界古装狼人杀", heat: "", img: "/posters/ryo09.jpg" },
      { title: "悬案", actors: "", desc: "跨越二十年双案刑侦", heat: "", img: "/posters/p29.jpg" },
    ],
  },
  {
    id: "anime",
    name: "动漫榜",
    items: [
      { title: "凡人修仙传", actors: "金锋", desc: "韩立奔赴慕兰之战", heat: "", img: "/posters/p30.jpg" },
      { title: "牧神记", actors: "", desc: "放牛少年放牧诸神", heat: "", img: "/posters/p31.jpg" },
      { title: "时光代理人 第三季", actors: "苏尚卿、杨天翔", desc: "时光照相馆命运交叉", heat: "", img: "/posters/p32.jpg" },
      { title: "有兽焉", actors: "", desc: "神兽下凡福瑞相伴", heat: "", img: "/posters/p33.jpg" },
      { title: "将夜", actors: "", desc: "永夜将至拔刀向天", heat: "", img: "/posters/p34.jpg" },
      { title: "灵笼", actors: "", desc: "末日废土文明对峙", heat: "", img: "/posters/ran06.jpg" },
      { title: "镇魂街", actors: "", desc: "", heat: "", img: "/posters/p36.jpg" },
      { title: "凹凸世界", actors: "", desc: "", heat: "", img: "/posters/p37.jpg" },
      { title: "肥志百科 第十五季", actors: "", desc: "", heat: "", img: "/posters/p38.jpg" },
      { title: "中国奇谭2", actors: "", desc: "", heat: "", img: "/posters/p39.jpg" },
    ],
  },
];

export const RANK_UPDATED = "2026-10-15";
