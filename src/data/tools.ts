import {
  Smartphone,
  Sprout,
  Guitar,
  Clapperboard,
  FolderSearch,
  type LucideIcon,
} from "lucide-react";

/**
 * 工具配置中心 — 首页卡片、分类、搜索全部由此生成。
 * 加新工具时只需追加一条，无需改页面代码。
 */
export interface Tool {
  id: string;
  name: string;
  description: string;
  category: string;
  href: string;
  external?: boolean;
  Icon: LucideIcon;
  /** 图标底色 */
  iconTile: string;
  tags: string[];
}

export const CATEGORIES = [
  "全部工具",
  "生活实用",
  "休闲娱乐",
  "学习成长",
  "资源搜索",
] as const;

export const TOOLS: Tool[] = [
  {
    id: "phone",
    name: "手机比价",
    description: "OPPO Find X10 E 多平台到手价，一小时核对一次",
    category: "生活实用",
    href: "/phone",
    Icon: Smartphone,
    iconTile: "bg-[#e7ebff] text-[#4a3fd6]",
    tags: ["OPPO", "价格", "比价", "购物", "手机"],
  },
  {
    id: "game",
    name: "后院保卫战",
    description: "种植物、挡僵尸的塔防小游戏，撑过 10 波进攻",
    category: "休闲娱乐",
    href: "/game",
    Icon: Sprout,
    iconTile: "bg-[#dcf3e4] text-[#2e7d4f]",
    tags: ["游戏", "塔防", "植物", "僵尸"],
  },
  {
    id: "music",
    name: "音乐教室",
    description: "吉他调音器、变调夹、钢琴、新手教程与网红谱",
    category: "学习成长",
    href: "/music",
    Icon: Guitar,
    iconTile: "bg-[#ebe3ff] text-[#6f42d8]",
    tags: ["吉他", "钢琴", "调音", "和弦", "教程", "乐谱"],
  },
  {
    id: "rank",
    name: "影视排行榜",
    description: "腾讯、爱奇艺、优酷热播榜 + 动漫榜，附海报",
    category: "休闲娱乐",
    href: "/rank",
    Icon: Clapperboard,
    iconTile: "bg-[#fdeecd] text-[#b07a1e]",
    tags: ["电视剧", "动漫", "热播", "榜单", "追剧"],
  },
  {
    id: "pansou",
    name: "盘搜",
    description: "网盘资源搜索，找你想要的资源",
    category: "资源搜索",
    href: "https://pansou.de",
    external: true,
    Icon: FolderSearch,
    iconTile: "bg-[#d9effa] text-[#2b7fb8]",
    tags: ["网盘", "资源", "搜索", "下载"],
  },
];

/** 搜索：名称 / 描述 / 分类 / 标签，大小写不敏感 */
export function searchTools(query: string): Tool[] {
  const q = query.trim().toLowerCase();
  if (!q) return TOOLS;
  return TOOLS.filter((t) =>
    [t.name, t.description, t.category, ...t.tags].some((s) =>
      s.toLowerCase().includes(q)
    )
  );
}
