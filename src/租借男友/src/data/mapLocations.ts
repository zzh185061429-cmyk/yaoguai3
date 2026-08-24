/**
 * 地图地点数据 — 从 MapModal.tsx 提取的共享地点定义
 *
 * 供 MapModal 组件渲染和 phoneApi 派单 AI prompt 共用，
 * 确保前端展示的地点与 AI 生成的订单地点一致。
 */

export type AreaType = "residential" | "campus" | "commercial" | "city";

export type InteriorSpot = { name: string; x: number; y: number };
export type InteriorSubarea = { name: string; x: number; y: number; spots: InteriorSpot[] };
export type LocationInterior = {
  spots?: InteriorSpot[];
  subareas?: InteriorSubarea[];
};

// ============================================================
// 区域 → 地点名 + 坐标
// ============================================================
export const AREA_SPOTS: Record<AreaType, { name: string; x: number; y: number }[]> = {
  residential: [
    { name: "沈家别墅", x: 22, y: 28 },
    { name: "傅霁公寓", x: 68, y: 35 },
    { name: "霍罗同居公寓", x: 45, y: 72 },
    { name: "陆时予公寓", x: 85, y: 68 },
    { name: "许不倦公寓", x: 15, y: 60 },
  ],
  campus: [
    { name: "燕大校区", x: 35, y: 48 },
    { name: "大学城公园", x: 68, y: 28 },
  ],
  commercial: [
    { name: "鹿角奶茶店", x: 20, y: 25 },
    { name: "二十四帧电影院", x: 52, y: 18 },
    { name: "辣当家麻辣烫", x: 82, y: 35 },
    { name: "落日居酒屋", x: 25, y: 62 },
    { name: "龙与骰子桌游卡牌店", x: 58, y: 68 },
    { name: "南门小吃街", x: 80, y: 78 },
  ],
  city: [
    { name: "回头草咖啡", x: 18, y: 20 },
    { name: "云顶商场", x: 48, y: 15 },
    { name: "星河乐园", x: 80, y: 22 },
    { name: "利刃击剑会所", x: 15, y: 45 },
    { name: "铁砧兵击俱乐部", x: 42, y: 42 },
    { name: "季明舒公寓", x: 60, y: 55 },
    { name: "市立音乐厅", x: 75, y: 50 },
    { name: "姜氏集团总部", x: 85, y: 68 },
    { name: "市立福利院", x: 25, y: 72 },
    { name: "姜朝渔住所", x: 52, y: 78 },
    { name: "裴今歌住所", x: 75, y: 82 },
    { name: "织部宵公寓", x: 40, y: 75 },
  ],
};

// ============================================================
// 省外地点
// ============================================================
export const PROVINCE_LOCATIONS = [
  { name: "周念安母亲菜摊", x: 30, y: 35 },
  { name: "温知晚家", x: 55, y: 55 },
  { name: "傅霁爷爷家", x: 72, y: 28 },
];

// ============================================================
// 地点内部结构数据
// ============================================================
export const LOCATION_INTERIORS: Record<string, LocationInterior> = {
  // === 住宅区 ===
  "沈家别墅": { spots: [
    { name: "前院", x: 25, y: 12 },
    { name: "后院", x: 75, y: 12 },
    { name: "一楼玄关", x: 35, y: 32 },
    { name: "一楼客厅", x: 65, y: 32 },
    { name: "一楼开放式厨房", x: 82, y: 52 },
    { name: "二楼<user>卧室", x: 22, y: 48 },
    { name: "二楼千金卧室", x: 50, y: 52 },
    { name: "二楼共用浴室", x: 78, y: 68 },
    { name: "三楼原书房", x: 30, y: 75 },
    { name: "三楼储物间", x: 60, y: 82 },
  ]},
  "傅霁公寓": { spots: [
    { name: "客厅", x: 30, y: 38 },
    { name: "卧室", x: 70, y: 28 },
    { name: "独立卫浴", x: 55, y: 72 },
  ]},
  "霍罗同居公寓": { spots: [
    { name: "客厅", x: 30, y: 32 },
    { name: "开放式厨房", x: 68, y: 28 },
    { name: "罗兰卧室", x: 25, y: 72 },
    { name: "霍千黎卧室", x: 72, y: 72 },
  ]},
  "陆时予公寓": { spots: [
    { name: "地下车库专属车位", x: 25, y: 72 },
    { name: "开放式厨房", x: 68, y: 28 },
    { name: "客厅", x: 30, y: 32 },
    { name: "卧室", x: 65, y: 55 },
  ]},
  "许不倦公寓": { spots: [
    { name: "小区门禁入口", x: 50, y: 82 },
    { name: "客厅", x: 30, y: 38 },
    { name: "厨房", x: 68, y: 32 },
    { name: "卧室", x: 50, y: 65 },
  ]},

  // === 大学城 ===
  "燕大校区": { subareas: [
    { name: "教学区", x: 22, y: 20, spots: [
      { name: "A101阶梯教室", x: 15, y: 18 },
      { name: "A204教室", x: 38, y: 14 },
      { name: "A302教室", x: 60, y: 18 },
      { name: "B102教室", x: 18, y: 42 },
      { name: "B206教室", x: 42, y: 38 },
      { name: "B305教室", x: 65, y: 42 },
      { name: "C204自习室", x: 22, y: 70 },
      { name: "C301多媒体教室", x: 50, y: 75 },
      { name: "C405开放画室", x: 78, y: 70 },
      { name: "燕大形势与政策教研室", x: 85, y: 38 },
    ]},
    { name: "艺术区", x: 75, y: 20, spots: [
      { name: "艺术楼一楼大厅", x: 25, y: 22 },
      { name: "艺术楼二楼排练厅", x: 62, y: 18 },
      { name: "艺术楼练功房", x: 82, y: 40 },
      { name: "艺术楼四楼理论教室", x: 28, y: 65 },
      { name: "艺术楼琴房", x: 65, y: 70 },
    ]},
    { name: "生活区", x: 22, y: 55, spots: [
      { name: "食堂一楼", x: 15, y: 18 },
      { name: "食堂二楼", x: 42, y: 14 },
      { name: "食堂三楼", x: 70, y: 18 },
      { name: "宿舍楼大门", x: 15, y: 42 },
      { name: "宿管台", x: 38, y: 38 },
      { name: "温知晚宿舍", x: 65, y: 42 },
      { name: "步玲燕宿舍", x: 22, y: 70 },
      { name: "周念安宿舍", x: 52, y: 75 },
      { name: "椎名律宿舍", x: 80, y: 70 },
    ]},
    { name: "休息区", x: 50, y: 82, spots: [
      { name: "校门口便利店", x: 50, y: 50 },
    ]},
    { name: "公共区", x: 78, y: 55, spots: [
      { name: "图书馆一楼借还台", x: 12, y: 18 },
      { name: "图书馆二楼文史哲区", x: 35, y: 14 },
      { name: "图书馆三楼经管法学区", x: 58, y: 18 },
      { name: "图书馆四楼自习区", x: 80, y: 14 },
      { name: "400米跑道", x: 15, y: 42 },
      { name: "内圈足球场", x: 42, y: 42 },
      { name: "操场看台", x: 72, y: 42 },
      { name: "银杏树下步道", x: 38, y: 75 },
    ]},
  ]},
  "大学城公园": { spots: [
    { name: "人工湖岸", x: 35, y: 42 },
    { name: "环湖步道", x: 65, y: 55 },
  ]},

  // === 商业街区 ===
  "鹿角奶茶店": { spots: [
    { name: "一楼点单区", x: 35, y: 45 },
    { name: "二楼落地窗座位区", x: 62, y: 28 },
  ]},
  "二十四帧电影院": { spots: [
    { name: "影院售票大厅", x: 50, y: 22 },
    { name: "一号放映厅", x: 25, y: 62 },
    { name: "二号放映厅", x: 75, y: 62 },
  ]},
  "辣当家麻辣烫": { spots: [
    { name: "选菜冷柜区", x: 30, y: 38 },
    { name: "室内用餐区", x: 65, y: 55 },
  ]},
  "落日居酒屋": { spots: [
    { name: "居酒屋吧台", x: 35, y: 38 },
    { name: "日式木质隔间", x: 65, y: 55 },
  ]},
  "龙与骰子桌游卡牌店": { spots: [
    { name: "地下二层展示区", x: 30, y: 38 },
    { name: "地下二层对战桌区", x: 65, y: 55 },
  ]},
  "南门小吃街": { spots: [
    { name: "流动小吃摊位区", x: 30, y: 42 },
    { name: "步玲燕算命摊位", x: 65, y: 55 },
  ]},

  // === 市区 ===
  "回头草咖啡": { spots: [
    { name: "咖啡吧台", x: 28, y: 32 },
    { name: "靠窗座位区", x: 68, y: 28 },
    { name: "员工换装区", x: 48, y: 72 },
  ]},
  "云顶商场": { spots: [
    { name: "美食广场", x: 18, y: 22 },
    { name: "服装区", x: 50, y: 14 },
    { name: "影院", x: 82, y: 22 },
    { name: "溜冰场", x: 28, y: 55 },
    { name: "顶楼露台", x: 72, y: 68 },
  ]},
  "星河乐园": { spots: [
    { name: "过山车区", x: 18, y: 22 },
    { name: "鬼屋", x: 65, y: 18 },
    { name: "摩天轮区", x: 82, y: 55 },
    { name: "游客休息区", x: 32, y: 72 },
  ]},
  "利刃击剑会所": { spots: [
    { name: "单人练习场", x: 25, y: 32 },
    { name: "对练场", x: 68, y: 28 },
    { name: "更衣室", x: 45, y: 72 },
  ]},
  "铁砧兵击俱乐部": { spots: [
    { name: "防滑垫训练区", x: 25, y: 32 },
    { name: "器材室", x: 68, y: 28 },
    { name: "休息区", x: 45, y: 72 },
  ]},
  "市立音乐厅": { spots: [
    { name: "音乐厅一楼观众席", x: 25, y: 32 },
    { name: "音乐厅二楼观众席", x: 68, y: 28 },
    { name: "音乐厅三楼观众席", x: 45, y: 72 },
  ]},
  "姜氏集团总部": { spots: [
    { name: "董事长办公室", x: 25, y: 28 },
    { name: "大会议室", x: 68, y: 22 },
    { name: "办公区", x: 45, y: 65 },
  ]},
  "市立福利院": { spots: [
    { name: "儿童活动室", x: 25, y: 32 },
    { name: "儿童宿舍区", x: 68, y: 28 },
    { name: "福利院食堂", x: 45, y: 72 },
  ]},
  "姜朝渔住所": { spots: [
    { name: "客厅", x: 22, y: 32 },
    { name: "主卧", x: 68, y: 24 },
    { name: "书房", x: 78, y: 60 },
    { name: "落地窗前区域", x: 28, y: 70 },
  ]},
  "裴今歌住所": { spots: [
    { name: "一楼地毯投影区", x: 28, y: 32 },
    { name: "二楼卧室", x: 68, y: 28 },
    { name: "二楼阳台", x: 45, y: 72 },
  ]},
  "季明舒公寓": { spots: [
    { name: "客厅", x: 28, y: 32 },
    { name: "主卧", x: 68, y: 28 },
    { name: "次卧", x: 45, y: 72 },
  ]},
  "织部宵公寓": { spots: [
    { name: "楼层走廊", x: 50, y: 82 },
    { name: "客厅与阳台", x: 30, y: 32 },
    { name: "开放式厨房", x: 68, y: 28 },
    { name: "卧室", x: 50, y: 65 },
  ]},

  // === 省外 ===
  "温知晚家": { spots: [
    { name: "传统茶室", x: 35, y: 38 },
    { name: "温知晚卧室", x: 65, y: 55 },
  ]},
  "傅霁爷爷家": { spots: [
    { name: "老公寓客厅", x: 35, y: 38 },
    { name: "画室", x: 65, y: 55 },
  ]},
};

// ============================================================
// 工具函数：提取所有合法地点名
// ============================================================

/**
 * 返回所有合法地点的完整路径列表（"区域/子地点"格式），
 * 供 AI 派单 prompt 使用，防止生成不存在的地点。
 */
export function getAllLocationNames(): string[] {
  const result: string[] = [];

  for (const area of Object.keys(AREA_SPOTS) as AreaType[]) {
    for (const spot of AREA_SPOTS[area]) {
      // 区域名本身
      result.push(spot.name);
      // 子地点
      const interior = LOCATION_INTERIORS[spot.name];
      if (interior?.spots) {
        for (const s of interior.spots) {
          result.push(`${spot.name}/${s.name}`);
        }
      }
      if (interior?.subareas) {
        for (const sa of interior.subareas) {
          for (const s of sa.spots) {
            result.push(`${spot.name}/${sa.name}/${s.name}`);
          }
        }
      }
    }
  }

  // 省外地点
  for (const p of PROVINCE_LOCATIONS) {
    result.push(p.name);
    const interior = LOCATION_INTERIORS[p.name];
    if (interior?.spots) {
      for (const s of interior.spots) {
        result.push(`${p.name}/${s.name}`);
      }
    }
  }

  return result;
}
