import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, MapPin, ArrowLeft, Train, Maximize2, Minimize2, Building2, Users, Footprints, ImageIcon } from "lucide-react";
import { useGameContext } from "../../state/GameContext";
import { cn } from "../../utils";
import { getCharactersAtSpot, getAllCharacterLocations } from "../../data/scheduleData";
import { CHARACTER_CHIBIS } from "../../data/characterData";
import { LOCATION_IMAGES, getLocationImage, isNightTime, hasLocationImage } from "../../data/locationImages";

type AreaType = "residential" | "campus" | "commercial" | "city";
type ViewType = "main" | "area" | "province" | "location" | "subarea";

// ============================================================
// 区域配置
// ============================================================
const AREA_CONFIG: Record<AreaType, {
  color: string; label: string; tag: string;
  themeBg: string; themeAccent: string; themeRing: string;
  pinIcon: string; headerBg: string; headerText: string; roadColor: string;
}> = {
  residential: {
    color: "bg-pop-yellow", label: "住宅区", tag: "RESIDENTIAL",
    themeBg: "bg-amber-900", themeAccent: "bg-pop-yellow", themeRing: "ring-white",
    pinIcon: "text-pop-black", headerBg: "bg-pop-yellow", headerText: "text-pop-black", roadColor: "#fbbf24",
  },
  campus: {
    color: "bg-pop-cyan", label: "大学城", tag: "CAMPUS",
    themeBg: "bg-cyan-900", themeAccent: "bg-pop-cyan", themeRing: "ring-white",
    pinIcon: "text-pop-black", headerBg: "bg-pop-cyan", headerText: "text-pop-black", roadColor: "#22d3ee",
  },
  commercial: {
    color: "bg-pop-pink", label: "商业街区", tag: "COMMERCIAL",
    themeBg: "bg-rose-900", themeAccent: "bg-pop-pink", themeRing: "ring-white",
    pinIcon: "text-white", headerBg: "bg-pop-pink", headerText: "text-white", roadColor: "#fb7185",
  },
  city: {
    color: "bg-white", label: "市区", tag: "CITY",
    themeBg: "bg-gray-800", themeAccent: "bg-white", themeRing: "ring-pop-pink",
    pinIcon: "text-pop-black", headerBg: "bg-white", headerText: "text-pop-black", roadColor: "#9ca3af",
  },
};

const AREA_POSITIONS: Record<AreaType, { x: number; y: number }> = {
  residential: { x: 18, y: 30 },
  campus: { x: 42, y: 25 },
  commercial: { x: 42, y: 62 },
  city: { x: 78, y: 40 },
};

const AREA_SPOTS: Record<AreaType, { name: string; x: number; y: number }[]> = {
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
  ],
};

const PROVINCE_LOCATIONS = [
  { name: "周念安母亲菜摊", x: 30, y: 35 },
  { name: "温知晚家", x: 55, y: 55 },
  { name: "傅霁爷爷家", x: 72, y: 28 },
];

// ============================================================
// 地点内部结构数据
// ============================================================
type InteriorSpot = { name: string; x: number; y: number };
type InteriorSubarea = { name: string; x: number; y: number; spots: InteriorSpot[] };
type LocationInterior = {
  spots?: InteriorSpot[];
  subareas?: InteriorSubarea[];
};

const LOCATION_INTERIORS: Record<string, LocationInterior> = {
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
// 组件
// ============================================================
export function MapModal() {
  const { isMapOpen, setIsMapOpen, currentLocation, gameTime, setPendingMessage, scriptCharacterLocations } = useGameContext();
  const [view, setView] = useState<ViewType>("main");
  const [selectedArea, setSelectedArea] = useState<AreaType | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [selectedSubarea, setSelectedSubarea] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showAllChars, setShowAllChars] = useState(false);
  /** 是否正在浏览省外地点的内部 */
  const [isProvinceLocation, setIsProvinceLocation] = useState(false);
  /** 点击地点后弹出的背景图+前往按钮 */
  const [spotPopup, setSpotPopup] = useState<{ spotName: string; parentLocation: string } | null>(null);

  const handleClose = () => {
    setIsMapOpen(false);
    setView("main");
    setSelectedArea(null);
    setSelectedLocation(null);
    setSelectedSubarea(null);
    setSpotPopup(null);
    setIsProvinceLocation(false);
  };

  const handleBack = () => {
    if (view === "subarea") { setView("location"); setSelectedSubarea(null); }
    else if (view === "location") {
      if (isProvinceLocation) { setView("province"); setIsProvinceLocation(false); }
      else { setView("area"); }
      setSelectedLocation(null);
      setSelectedSubarea(null);
    }
    else if (view === "area" || view === "province") { setView("main"); setSelectedArea(null); }
  };

  /** 进入区域小地图 */
  const enterArea = (area: AreaType) => {
    setSelectedArea(area);
    setView("area");
  };

  /** 进入地点内部 */
  const enterLocation = (locName: string) => {
    const interior = LOCATION_INTERIORS[locName];
    if (!interior) return; // 无内部结构（如周念安母亲菜摊）
    // 检查是否为省外地点
    if (PROVINCE_LOCATIONS.some(p => p.name === locName)) {
      setIsProvinceLocation(true);
    }
    setSelectedLocation(locName);
    setView("location");
  };

  /** 进入子区域 */
  const enterSubarea = (subName: string) => {
    setSelectedSubarea(subName);
    setView("subarea");
  };

  /** 根据地点名查找所属区域 */
  const findAreaForLocation = (locName: string): AreaType | null => {
    for (const area of Object.keys(AREA_SPOTS) as AreaType[]) {
      const spots = AREA_SPOTS[area];
      // 直接匹配区域顶层地点
      if (spots.some(s => s.name === locName)) return area;
      // 匹配地点内部位置
      for (const s of spots) {
        const interior = LOCATION_INTERIORS[s.name];
        if (interior?.spots?.some(sp => sp.name === locName)) return area;
        if (interior?.subareas?.some(sa => sa.spots.some(sp => sp.name === locName))) return area;
      }
    }
    return null;
  };

  /** 根据地点名查找所属顶层地点（用于进入地点内部） */
  const findParentLocation = (locName: string): string | null => {
    for (const area of Object.keys(AREA_SPOTS) as AreaType[]) {
      for (const s of AREA_SPOTS[area]) {
        if (s.name === locName) return s.name;
        const interior = LOCATION_INTERIORS[s.name];
        if (interior?.spots?.some(sp => sp.name === locName)) return s.name;
        if (interior?.subareas?.some(sa => sa.spots.some(sp => sp.name === locName))) return s.name;
      }
    }
    // 省外地点：检查是否为省外地点本身或其内部位置
    for (const p of PROVINCE_LOCATIONS) {
      if (p.name === locName) return p.name;
      const interior = LOCATION_INTERIORS[p.name];
      if (interior?.spots?.some(sp => sp.name === locName)) return p.name;
      if (interior?.subareas?.some(sa => sa.spots.some(sp => sp.name === locName))) return p.name;
    }
    return null;
  };

  /** 点击角色列表项，跳转到角色所在区域/地点 */
  const navigateToCharacter = (locName: string, parentLocation?: string) => {
    const area = findAreaForLocation(locName);
    // 优先使用传入的 parentLocation（来自正文 overrides 或日程表），避免重名子位置跳错
    const parent = parentLocation || findParentLocation(locName);
    if (area) {
      setSelectedArea(area);
      // 如果角色在某个地点内部，直接进入该地点
      if (parent && parent !== locName && LOCATION_INTERIORS[parent]) {
        setSelectedLocation(parent);
        // 如果地点有子区域，检查角色在哪个子区域
        const interior = LOCATION_INTERIORS[parent];
        if (interior.subareas) {
          const sub = interior.subareas.find(sa => sa.spots.some(sp => sp.name === locName));
          if (sub) {
            setSelectedSubarea(sub.name);
            setView("subarea");
          } else {
            setView("location");
          }
        } else {
          setView("location");
        }
      } else {
        setView("area");
      }
    } else if (parent && LOCATION_INTERIORS[parent]) {
      // 省外地点内部：进入该省外地点的内部视图
      setIsProvinceLocation(true);
      setSelectedLocation(parent);
      if (parent !== locName) {
        const interior = LOCATION_INTERIORS[parent];
        if (interior?.subareas) {
          const sub = interior.subareas.find(sa => sa.spots.some(sp => sp.name === locName));
          if (sub) {
            setSelectedSubarea(sub.name);
            setView("subarea");
          } else {
            setView("location");
          }
        } else {
          setView("location");
        }
      } else {
        setView("location");
      }
    } else {
      // 省外
      setView("province");
    }
    setShowAllChars(false);
  };

  /** 省外地点内部的主题配置 */
  const PROVINCE_CFG = {
    themeBg: "bg-rose-900",
    themeAccent: "bg-pop-pink",
    themeRing: "ring-pop-cyan",
    pinIcon: "text-white",
    roadColor: "#fb7185",
    headerBg: "bg-pop-pink",
    headerText: "text-white",
  } as const;

  /** 获取当前视图的区域配置（用于着色） */
  const currentAreaCfg = () => {
    if (isProvinceLocation) return PROVINCE_CFG;
    if ((view === "area" || view === "location" || view === "subarea") && selectedArea) {
      return AREA_CONFIG[selectedArea];
    }
    return null;
  };

  /** 头部配置 */
  const headerConfig = () => {
    const cfg = currentAreaCfg();
    if (view === "subarea" && cfg && selectedSubarea) {
      return { bg: cfg.headerBg, text: cfg.headerText, title: selectedSubarea };
    }
    if (view === "location" && cfg && selectedLocation) {
      return { bg: cfg.headerBg, text: cfg.headerText, title: selectedLocation };
    }
    if (view === "area" && cfg && !isProvinceLocation) {
      return { bg: cfg.headerBg, text: cfg.headerText, title: `${cfg.label} / ${cfg.tag}` };
    }
    if (view === "province") {
      return { bg: "bg-pop-pink", text: "text-white", title: "省外 / PROVINCE" };
    }
    return { bg: "bg-pop-cyan", text: "text-pop-black", title: "MAP / 地图" };
  };

  const hc = headerConfig();
  const cfg = currentAreaCfg();

  /** 点击地点标记 → 如果有背景图则弹出弹窗 */
  const handleSpotClick = (spotName: string, parentLocation: string, fallback?: () => void) => {
    if (hasLocationImage(parentLocation, spotName)) {
      setSpotPopup({ spotName, parentLocation });
    } else if (fallback) {
      fallback();
    }
  };

  /** 点击「前往」按钮 → 写入 ChatBar 并关闭地图 */
  const handleGoToSpot = (spotName: string, parentLocation: string) => {
    const msg = parentLocation === spotName
      ? `我前往了${spotName}`
      : `我前往了${parentLocation}的${spotName}`;
    setPendingMessage(msg);
    console.info(`[MapModal] 前往: ${msg}`);
    setSpotPopup(null);
    setIsMapOpen(false);
  };

  /** 渲染地点标记的通用组件 */
  const renderSpot = (
    spot: { name: string; x: number; y: number },
    idx: number,
    accentColor: string,
    ringColor: string,
    iconColor: string,
    roadColor: string,
    parentLocation: string,
    onSpotClick?: () => void,
    delayBase: number = 0.1,
  ) => {
    const isCurrent = currentLocation === spot.name;
    // 查询当前在该地点的角色
    const charsHere = getCharactersAtSpot(spot.name, gameTime, scriptCharacterLocations, parentLocation);
    // 是否有背景图（决定是否可点击弹出）
    const hasImg = hasLocationImage(parentLocation, spot.name);
    return (
      <div
        key={spot.name}
        className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
        style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
      >
        {/* 小人站在地点标记上方 */}
        {charsHere.length > 0 && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 flex items-end gap-1 z-40">
            {charsHere.map((charLoc) => (
              <div
                key={charLoc.character}
                className="relative flex flex-col items-center"
                title={`${charLoc.character} · ${charLoc.activity}`}
              >
                <img
                  src={CHARACTER_CHIBIS[charLoc.character]}
                  alt={charLoc.character}
                  className="w-20 h-20 md:w-24 md:h-24 object-contain drop-shadow-[2px_2px_0_rgba(0,0,0,0.7)]"
                />
                <div className="px-1.5 py-0.5 whitespace-nowrap bg-pop-black text-white text-[9px] md:text-[10px] font-bold rounded-sm -mt-1">
                  {charLoc.character}
                </div>
              </div>
            ))}
          </div>
        )}

        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: delayBase + idx * 0.06, type: "spring", damping: 12, stiffness: 200 }}
          whileHover={{ scale: 1.25, zIndex: 50 }}
          whileTap={{ scale: 0.9 }}
          onClick={onSpotClick}
        >
          <div
            className={cn(
              "relative flex items-center justify-center pop-border shadow-pop clip-diagonal transition-all",
              accentColor,
              isCurrent
                ? cn("w-9 h-9 md:w-10 md:h-10 ring-4", ringColor)
                : "w-7 h-7 md:w-8 md:h-8"
            )}
          >
            <MapPin className={cn("w-4 h-4 md:w-5 md:h-5", iconColor)} strokeWidth={3} />
            {hasImg && (
              <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-pop-pink rounded-full flex items-center justify-center pop-border z-10" title="有背景图">
                <ImageIcon className="w-2.5 h-2.5 text-white" strokeWidth={3} />
              </div>
            )}
            {isCurrent && (
              <motion.div
                className={cn("absolute -inset-1 border-2 rounded-full", ringColor.replace("ring-", "border-"))}
                animate={{ scale: [1, 1.3, 1], opacity: [1, 0, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            )}
          </div>
        </motion.button>

        <div
          className={cn(
            "absolute top-full left-1/2 -translate-x-1/2 mt-1 px-1.5 py-0.5 whitespace-nowrap pop-border shadow-pop text-[9px] md:text-[11px] font-black italic -skew-x-6 transition-all",
            isCurrent
              ? cn(accentColor, iconColor, "z-50")
              : "bg-white text-pop-black group-hover:bg-pop-yellow group-hover:z-50"
          )}
        >
          {spot.name}
        </div>
      </div>
    );
  };

  /** 渲染道路连线 */
  const renderRoads = (spots: { x: number; y: number }[], roadColor: string) => (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
      {spots.length > 1 && spots.map((loc, i) => {
        if (i === 0) return null;
        const prev = spots[i - 1];
        return (
          <line key={i} x1={`${prev.x}%`} y1={`${prev.y}%`} x2={`${loc.x}%`} y2={`${loc.y}%`}
            stroke={roadColor} strokeWidth="2.5" strokeDasharray="6 3" opacity="0.5" />
        );
      })}
    </svg>
  );

  return (
    <AnimatePresence>
      {isMapOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-2 md:p-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-pop-black/80 backdrop-blur-sm" onClick={handleClose}
          />

          <motion.div
            initial={{ scale: 0.8, y: 50, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.8, y: 50, opacity: 0 }}
            transition={{ type: "spring", bounce: 0.4 }}
            className={cn(
              "relative bg-white pop-border shadow-[8px_8px_0_#00e5ff] z-10 flex flex-col overflow-hidden clip-diagonal transition-all duration-300",
              isFullscreen ? "w-full h-full max-w-none max-h-none" : "w-full h-full md:max-w-3xl md:max-h-[88vh]"
            )}
          >
            {/* 头部 */}
            <div className={cn(
              "p-3 md:p-4 flex justify-between items-center border-b-4 border-pop-black shrink-0 transition-colors",
              hc.bg, hc.text
            )}>
              <div className="flex items-center gap-2">
                {view !== "main" ? (
                  <button onClick={handleBack}
                    className="flex items-center gap-1 bg-pop-black text-white px-2 py-1 hover:scale-105 active:scale-95 transition-transform clip-diagonal shadow-pop">
                    <ArrowLeft className="w-4 h-4" />
                    <span className="font-black text-xs italic">返回</span>
                  </button>
                ) : (
                  <MapPin className="w-5 h-5 md:w-6 md:h-6 shrink-0" />
                )}
                <h3 className="text-lg md:text-2xl font-black italic">{hc.title}</h3>
              </div>
              <div className="flex items-center gap-1.5 md:gap-2">
                <button onClick={() => setShowAllChars(!showAllChars)}
                  className={cn(
                    "flex items-center gap-1 px-2 py-1.5 md:px-2.5 md:py-2 transition-transform clip-diagonal shadow-[2px_2px_0_#ff3366] font-black text-xs italic",
                    showAllChars ? "bg-pop-yellow text-pop-black scale-105" : "bg-pop-black text-white hover:scale-110 active:scale-90"
                  )}
                  title="角色位置一览">
                  <Users className="w-4 h-4 md:w-5 md:h-5" />
                  <span className="hidden md:inline">角色</span>
                </button>
                <button onClick={() => setIsFullscreen(!isFullscreen)}
                  className="bg-pop-black text-white p-1.5 md:p-2 hover:scale-110 active:scale-90 transition-transform clip-diagonal shadow-[2px_2px_0_#ff3366]"
                  title={isFullscreen ? "退出全屏" : "全屏"}>
                  {isFullscreen ? <Minimize2 className="w-5 h-5 md:w-6 md:h-6" /> : <Maximize2 className="w-5 h-5 md:w-6 md:h-6" />}
                </button>
                <button onClick={handleClose}
                  className="bg-pop-black text-white p-1.5 md:p-2 hover:scale-110 active:scale-90 transition-transform clip-diagonal shadow-[2px_2px_0_#ff3366]">
                  <X className="w-5 h-5 md:w-6 md:h-6" />
                </button>
              </div>
            </div>

            {/* 地图区域 */}
            <div className="flex-1 relative overflow-auto hide-scrollbar bg-pop-black">
              <div className={cn(
                "relative w-full border-4 border-pop-black shadow-pop clip-diagonal transition-all duration-300",
                isFullscreen
                  ? "min-w-[900px] min-h-[600px] aspect-[3/2] m-1"
                  : "min-w-[640px] min-h-[480px] md:min-h-[560px] aspect-[4/3] m-2"
              )}>
                <div className="absolute inset-0 bg-halftone opacity-15 pointer-events-none" />

                {/* === 主地图 === */}
                {view === "main" && (
                  <>
                    <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
                      <line x1="0%" y1="45%" x2="100%" y2="45%" stroke="#1a1a1a" strokeWidth="3" strokeDasharray="8 4" opacity="0.3" />
                      <line x1="60%" y1="0%" x2="60%" y2="100%" stroke="#1a1a1a" strokeWidth="3" strokeDasharray="8 4" opacity="0.3" />
                    </svg>

                    {/* 区域大卡片（做大） */}
                    {(Object.keys(AREA_POSITIONS) as AreaType[]).map((area, idx) => {
                      const acfg = AREA_CONFIG[area];
                      const pos = AREA_POSITIONS[area];
                      const locCount = AREA_SPOTS[area].length;
                      const hasCurrent = AREA_SPOTS[area].some(s => s.name === currentLocation || LOCATION_INTERIORS[s.name]?.spots?.some(ss => ss.name === currentLocation) || LOCATION_INTERIORS[s.name]?.subareas?.some(sa => sa.spots.some(ss => ss.name === currentLocation)));
                      // 收集该区域内所有地点的所有内部位置名
                      const allSpotNames: string[] = [];
                      AREA_SPOTS[area].forEach(loc => {
                        allSpotNames.push(loc.name);
                        const interior = LOCATION_INTERIORS[loc.name];
                        if (interior?.spots) allSpotNames.push(...interior.spots.map(s => s.name));
                        if (interior?.subareas) interior.subareas.forEach(sa => allSpotNames.push(...sa.spots.map(s => s.name)));
                      });
                      // 查询当前在该区域内的角色（包括有默认位置的空闲角色）
                      const charsInArea = getAllCharacterLocations(gameTime, scriptCharacterLocations).filter(c => allSpotNames.includes(c.location));
                      return (
                        <motion.div key={area} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${pos.x}%`, top: `${pos.y}%` }}>
                          <motion.button
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: idx * 0.1, type: "spring", damping: 14, stiffness: 180 }}
                            whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.92 }}
                            onClick={() => enterArea(area)}
                            className={cn(
                              "relative flex flex-col items-center justify-center gap-2 px-6 py-5 md:px-8 md:py-6 pop-border shadow-pop clip-diagonal font-black italic -skew-x-6 transition-all cursor-pointer text-pop-black",
                              acfg.color,
                            )}>
                            <Building2 className="w-6 h-6 md:w-8 md:h-8" />
                            <span className="text-lg md:text-xl">{acfg.label}</span>
                            <span className="text-[10px] md:text-xs opacity-60">{acfg.tag} · {locCount} 地点</span>
                            {hasCurrent && (
                              <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-pop-pink rounded-full pop-border" />
                            )}
                            {/* 角色小人站立在卡片上方 */}
                            {charsInArea.length > 0 && (
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 flex items-end gap-1 z-40">
                                {charsInArea.slice(0, 4).map((charLoc) => (
                                  <div key={charLoc.character} className="relative flex flex-col items-center" title={`${charLoc.character} · ${charLoc.activity}`}>
                                    <img
                                      src={CHARACTER_CHIBIS[charLoc.character]}
                                      alt={charLoc.character}
                                      className="w-16 h-16 md:w-20 md:h-20 object-contain drop-shadow-[2px_2px_0_rgba(0,0,0,0.7)]"
                                    />
                                    <div className="px-1.5 py-0.5 whitespace-nowrap bg-pop-black text-white text-[9px] md:text-[10px] font-bold rounded-sm -mt-1">
                                      {charLoc.character}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </motion.button>
                        </motion.div>
                      );
                    })}

                    <motion.button
                      initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.5, type: "spring", damping: 12 }}
                      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      onClick={() => { setView("province"); setSelectedArea(null); }}
                      className="absolute bottom-4 right-4 flex items-center gap-2 bg-pop-pink text-white px-3 py-2 pop-border shadow-pop clip-diagonal font-black text-xs italic -skew-x-6 hover:bg-pop-black transition-colors z-30">
                      <Train className="w-4 h-4" /><span>前往省外</span>
                    </motion.button>
                  </>
                )}

                {/* === 区域小地图 === */}
                <AnimatePresence mode="wait">
                  {view === "area" && selectedArea && cfg && (
                    <motion.div key={selectedArea}
                      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.25 }} className="absolute inset-0">
                      <div className={cn("absolute inset-0", cfg.themeBg)} />
                      <div className="absolute top-3 left-4 font-black text-xs md:text-sm italic text-white/15 -skew-x-6 pointer-events-none">{cfg.tag} AREA</div>
                      {renderRoads(AREA_SPOTS[selectedArea], cfg.roadColor)}
                      {AREA_SPOTS[selectedArea].map((loc, idx) =>
                        renderSpot(loc, idx, cfg.themeAccent, cfg.themeRing, cfg.pinIcon, cfg.roadColor, loc.name,
                          () => handleSpotClick(loc.name, loc.name, () => enterLocation(loc.name)))
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* === 地点内部视图 === */}
                <AnimatePresence mode="wait">
                  {view === "location" && selectedLocation && cfg && (
                    <motion.div key={selectedLocation}
                      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.25 }} className="absolute inset-0">
                      <div className={cn("absolute inset-0", cfg.themeBg)} />
                      <div className="absolute top-3 left-4 font-black text-xs md:text-sm italic text-white/15 -skew-x-6 pointer-events-none">{selectedLocation}</div>
                      {(() => {
                        const interior = LOCATION_INTERIORS[selectedLocation];
                        if (!interior) return null;
                        // 图片父级就是地点名本身（如"温知晚家"、"傅霁爷爷家"）
                        const imgParent = selectedLocation;

                        // 有子区域：显示子区域大卡片
                        if (interior.subareas) {
                          return interior.subareas.map((sub, idx) => {
                            const spotCount = sub.spots.length;
                            const hasCurrent = sub.spots.some(s => s.name === currentLocation);
                            return (
                              <motion.div key={sub.name} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${sub.x}%`, top: `${sub.y}%` }}>
                                <motion.button
                                  initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                                  transition={{ delay: idx * 0.08, type: "spring", damping: 14, stiffness: 180 }}
                                  whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.92 }}
                                  onClick={() => enterSubarea(sub.name)}
                                  className={cn(
                                    "relative flex flex-col items-center justify-center gap-1.5 px-5 py-4 md:px-6 md:py-5 pop-border shadow-pop clip-diagonal font-black italic -skew-x-6 transition-all cursor-pointer text-pop-black",
                                    cfg.themeAccent,
                                  )}>
                                  <Building2 className="w-5 h-5 md:w-6 md:h-6" />
                                  <span className="text-sm md:text-base">{sub.name}</span>
                                  <span className="text-[9px] md:text-[10px] opacity-60">{spotCount} 个位置</span>
                                  {hasCurrent && <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-pop-pink rounded-full pop-border" />}
                                </motion.button>
                              </motion.div>
                            );
                          });
                        }

                        // 直接位置：显示标记
                        if (interior.spots) {
                          return (
                            <>
                              {renderRoads(interior.spots, cfg.roadColor)}
                              {interior.spots.map((spot, idx) =>
                                renderSpot(spot, idx, cfg.themeAccent, cfg.themeRing, cfg.pinIcon, cfg.roadColor, imgParent,
                                  () => handleSpotClick(spot.name, imgParent))
                              )}
                            </>
                          );
                        }
                        return null;
                      })()}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* === 子区域视图 === */}
                <AnimatePresence mode="wait">
                  {view === "subarea" && selectedLocation && selectedSubarea && cfg && (
                    <motion.div key={selectedSubarea}
                      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.25 }} className="absolute inset-0">
                      <div className={cn("absolute inset-0", cfg.themeBg)} />
                      <div className="absolute top-3 left-4 font-black text-xs md:text-sm italic text-white/15 -skew-x-6 pointer-events-none">{selectedSubarea}</div>
                      {(() => {
                        const interior = LOCATION_INTERIORS[selectedLocation];
                        const sub = interior?.subareas?.find(s => s.name === selectedSubarea);
                        if (!sub) return null;
                        const imgParent = selectedLocation;
                        return (
                          <>
                            {renderRoads(sub.spots, cfg.roadColor)}
                            {sub.spots.map((spot, idx) =>
                              renderSpot(spot, idx, cfg.themeAccent, cfg.themeRing, cfg.pinIcon, cfg.roadColor, imgParent,
                                () => handleSpotClick(spot.name, imgParent))
                            )}
                          </>
                        );
                      })()}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* === 省外地图 === */}
                {view === "province" && (
                  <>
                    <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
                      <line x1="20%" y1="50%" x2="80%" y2="50%" stroke="#1a1a1a" strokeWidth="3" strokeDasharray="8 4" opacity="0.3" />
                    </svg>
                    <div className="absolute top-3 left-4 font-black text-xs md:text-sm italic text-pop-black/30 -skew-x-6">PROVINCE AREA</div>
                    {PROVINCE_LOCATIONS.map((loc, idx) =>
                      renderSpot(loc, idx, "bg-pop-pink", "ring-pop-cyan", "text-white", "#fb7185", loc.name,
                        () => handleSpotClick(loc.name, loc.name, () => enterLocation(loc.name)), 0.2)
                    )}
                  </>
                )}
              </div>
            </div>

            {/* === 角色位置一览浮动面板 === */}
            <AnimatePresence>
              {showAllChars && (
                <motion.div
                  initial={{ x: 300, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 300, opacity: 0 }}
                  transition={{ type: "spring", damping: 20, stiffness: 200 }}
                  className="absolute top-16 right-2 bottom-12 w-72 md:w-80 bg-pop-black/95 backdrop-blur pop-border shadow-pop z-50 flex flex-col overflow-hidden"
                >
                  <div className="flex items-center justify-between px-3 py-2 bg-pop-yellow text-pop-black shrink-0">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-4 h-4" />
                      <span className="font-black text-xs italic">角色位置一览</span>
                    </div>
                    <button onClick={() => setShowAllChars(false)}
                      className="hover:scale-110 active:scale-90 transition-transform">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
                    {(() => {
                      const allLocs = getAllCharacterLocations(gameTime, scriptCharacterLocations);
                      if (allLocs.length === 0) {
                        return (
                          <div className="text-white/50 text-center py-8 text-xs">
                            未找到角色位置数据
                          </div>
                        );
                      }
                      return allLocs.map((charLoc) => {
                        const area = findAreaForLocation(charLoc.location);
                        const areaLabel = area ? AREA_CONFIG[area].label : "省外";
                        return (
                          <button
                            key={charLoc.character}
                            onClick={() => navigateToCharacter(charLoc.location, charLoc.parentLocation)}
                            className="w-full flex items-center gap-2 p-1.5 bg-white/5 hover:bg-white/15 rounded transition-colors text-left group"
                          >
                            <img
                              src={CHARACTER_CHIBIS[charLoc.character]}
                              alt={charLoc.character}
                              className="w-12 h-12 md:w-14 md:h-14 object-contain shrink-0 drop-shadow-[1px_1px_0_rgba(0,0,0,0.5)]"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="text-white text-xs font-bold truncate">{charLoc.character}</div>
                              <div className="text-pop-yellow text-[10px] truncate">{charLoc.location}</div>
                              <div className="text-white/40 text-[9px] truncate">{charLoc.activity} · {areaLabel}</div>
                            </div>
                            <MapPin className="w-3 h-3 text-white/30 group-hover:text-pop-pink transition-colors shrink-0" />
                          </button>
                        );
                      });
                    })()}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 底部图例 */}
            <div className="shrink-0 bg-pop-black text-white p-2 md:p-3 flex items-center justify-center gap-3 md:gap-5 flex-wrap border-t-4 border-pop-black">
              {view === "main" ? (
                <>
                  {(Object.keys(AREA_CONFIG) as AreaType[]).map((key) => (
                    <div key={key} className="flex items-center gap-1.5">
                      <div className={cn("w-3 h-3 pop-border", AREA_CONFIG[key].color)} />
                      <span className="font-bold text-[10px] md:text-xs">{AREA_CONFIG[key].label}</span>
                    </div>
                  ))}
                </>
              ) : view === "area" && selectedArea ? (
                <div className="flex items-center gap-1.5">
                  <div className={cn("w-3 h-3 pop-border", AREA_CONFIG[selectedArea].themeAccent)} />
                  <span className="font-bold text-[10px] md:text-xs">{AREA_CONFIG[selectedArea].label} · {AREA_SPOTS[selectedArea].length} 个地点</span>
                </div>
              ) : view === "location" && selectedLocation ? (
                <div className="flex items-center gap-1.5">
                  <div className={cn("w-3 h-3 pop-border", cfg?.themeAccent)} />
                  <span className="font-bold text-[10px] md:text-xs">{selectedLocation}</span>
                </div>
              ) : view === "subarea" && selectedSubarea ? (
                <div className="flex items-center gap-1.5">
                  <div className={cn("w-3 h-3 pop-border", cfg?.themeAccent)} />
                  <span className="font-bold text-[10px] md:text-xs">{selectedLocation} · {selectedSubarea}</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 bg-pop-pink pop-border" />
                  <span className="font-bold text-[10px] md:text-xs">省外地点</span>
                </div>
              )}
              {currentLocation && (
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 bg-pop-pink pop-border ring-2 ring-pop-pink" />
                  <span className="font-bold text-[10px] md:text-xs text-pop-yellow">当前: {currentLocation}</span>
                </div>
              )}
            </div>

            {/* === 地点详情弹窗（背景图+前往按钮） === */}
            <AnimatePresence>
              {spotPopup && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-60 flex items-center justify-center bg-pop-black/80 backdrop-blur-sm p-4"
                  onClick={() => setSpotPopup(null)}
                >
                  <motion.div
                    initial={{ scale: 0.8, y: 30, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    exit={{ scale: 0.8, y: 30, opacity: 0 }}
                    transition={{ type: "spring", bounce: 0.4 }}
                    className="relative bg-white pop-border shadow-[8px_8px_0_#ff3366] max-w-2xl w-full overflow-hidden clip-diagonal"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* 关闭按钮 */}
                    <button
                      onClick={() => setSpotPopup(null)}
                      className="absolute top-2 right-2 z-10 bg-pop-black text-white p-1.5 hover:scale-110 active:scale-90 transition-transform clip-diagonal shadow-pop"
                    >
                      <X className="w-5 h-5" />
                    </button>

                    {/* 背景图 */}
                    <div className="relative aspect-16/10 bg-pop-black overflow-hidden">
                      <img
                        src={getLocationImage(spotPopup.parentLocation, spotPopup.spotName, gameTime) || ""}
                        alt={spotPopup.spotName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      {/* 地点名覆盖 */}
                      <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-pop-black/90 via-pop-black/50 to-transparent p-4 pt-12">
                        <h4 className="text-white font-black italic text-xl md:text-2xl drop-shadow-[2px_2px_0_#ff3366]">
                          {spotPopup.spotName}
                        </h4>
                        <p className="text-pop-yellow text-sm font-bold mt-0.5">
                          {spotPopup.parentLocation} · {isNightTime(gameTime) ? "夜晚" : "白日"}
                        </p>
                      </div>
                    </div>

                    {/* 前往按钮 */}
                    <div className="p-4 flex justify-center gap-3 bg-pop-black">
                      <button
                        onClick={() => handleGoToSpot(spotPopup.spotName, spotPopup.parentLocation)}
                        className="px-8 py-3 bg-pop-yellow text-pop-black font-black italic text-lg border-4 border-white shadow-pop-pink hover:scale-105 active:scale-95 transition-all clip-diagonal flex items-center gap-2"
                      >
                        <Footprints className="w-5 h-5" />
                        前往此地
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
