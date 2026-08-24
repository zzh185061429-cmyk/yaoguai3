/**
 * 燕京地点图片资源映射表 v2
 *
 * 结构：常驻地点树 + 复用场景模板池
 * - 常驻地点 key 格式: "区域/分区/.../场景名"，如 "内城/北城/07肃王府/肃王府大门前庭"
 * - 复用场景 key 格式: "场景名"，如 "荒庙"、"祠堂"
 *
 * 查找逻辑:
 *   1. 先按完整路径在 RESIDENT_LOCATIONS 中精确匹配
 *   2. 找不到则按最后一段名字在 TEMPLATE_LOCATIONS 中匹配
 *   3. 都找不到则返回 undefined
 *
 * 数据来源: D:\BaiduNetdiskDownload\妖怪\地图\燕京 下的图床链接.txt 文件
 * 由 tools/parse_map_links.js 自动生成
 */

/** 图片变体类型 */
export type ImageVariant = '昼' | '夜' | '晴昼' | '晴夜' | '阴昼' | '阴夜' | '雪昼' | '雪夜';

/** 图片变体及对应URL */
export interface LocationImageVariants {
  [variant: string]: string;
}

/** 常驻地点条目 */
export interface ResidentLocationEntry {
  /** 地点名称 */
  name: string;
  /** 完整路径，如 "内城/北城/07肃王府" */
  fullPath: string;
  /** indoor = 室内(仅昼夜), outdoor = 室外(晴阴雪×昼夜) */
  type: 'indoor' | 'outdoor';
  /** 图片变体及对应URL */
  variants: LocationImageVariants;
}

/** 复用场景模板条目 */
export interface TemplateLocationEntry {
  /** 场景名称 */
  name: string;
  /** indoor = 室内(仅昼夜), outdoor = 室外(晴阴雪×昼夜) */
  type: 'indoor' | 'outdoor';
  /** 图片变体及对应URL */
  variants: LocationImageVariants;
}

/** 常驻地点映射表
 *  key: "区域/分区/.../场景名" */
export const RESIDENT_LOCATIONS: Record<string, ResidentLocationEntry> = {
  '宫城/01外朝/东华门': {
    name: '东华门',
    fullPath: '宫城/01外朝',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/fWfhgV5y/dong-hua-men-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/44QTFYwP/dong-hua-men-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/ZKfz4XGT/dong-hua-men-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/RVPx42kq/dong-hua-men-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/X7N0MnDh/dong-hua-men-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/Kv9hxCd6/dong-hua-men-yin-zhou.png'
    }
  },
  '宫城/01外朝/会极门廊庑': {
    name: '会极门廊庑',
    fullPath: '宫城/01外朝',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/x1cDCtQv/hui-ji-men-lang-wu-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/P59G8Yf6/hui-ji-men-lang-wu-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/QMT2gCV2/hui-ji-men-lang-wu-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/8C62dcj1/hui-ji-men-lang-wu-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/cL2q8w1V/hui-ji-men-lang-wu-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/x1hrbMT0/hui-ji-men-lang-wu-yin-zhou.png'
    }
  },
  '宫城/01外朝/内金水桥': {
    name: '内金水桥',
    fullPath: '宫城/01外朝',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/g0ZCyjn8/nei-jin-shui-qiao-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/bJfKmPt5/nei-jin-shui-qiao-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/wM0ZxsbP/nei-jin-shui-qiao-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/SQrwfwNL/nei-jin-shui-qiao-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/ZRPXgQP4/nei-jin-shui-qiao-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/x80BSPgz/nei-jin-shui-qiao-yin-zhou.png'
    }
  },
  '宫城/01外朝/乾元殿': {
    name: '乾元殿',
    fullPath: '宫城/01外朝',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/0ybRQcvy/qian-yuan-dian-ye.png',
      '昼': 'https://i.postimg.cc/3xd5Rnhk/qian-yuan-dian-zhou.png'
    }
  },
  '宫城/01外朝/神武门': {
    name: '神武门',
    fullPath: '宫城/01外朝',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/DzkjTgww/shen-wu-men-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/g0FSWD2h/shen-wu-men-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/rmgQ52Cr/shen-wu-men-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/brJLTV31/shen-wu-men-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/HLwSsyr9/shen-wu-men-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/ZRJw953Y/shen-wu-men-yin-zhou.png'
    }
  },
  '宫城/01外朝/文华殿': {
    name: '文华殿',
    fullPath: '宫城/01外朝',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/2yc9NN1D/wen-hua-dian-ye.png',
      '昼': 'https://i.postimg.cc/h4p5dTpb/wen-hua-dian-zhou.png'
    }
  },
  '宫城/01外朝/文渊阁': {
    name: '文渊阁',
    fullPath: '宫城/01外朝',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/CMmQqkm3/wen-yuan-ge-ye.png',
      '昼': 'https://i.postimg.cc/TY1Hq1sx/wen-yuan-ge-zhou.png'
    }
  },
  '宫城/01外朝/午门城楼': {
    name: '午门城楼',
    fullPath: '宫城/01外朝',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/7YZjsmf9/wu-men-cheng-lou-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/L68GCNJH/wu-men-cheng-lou-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/xdMZJZ4T/wu-men-cheng-lou-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/NMtz1x3x/wu-men-cheng-lou-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/hPZ6HTm9/wu-men-cheng-lou-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/8zq3CGwZ/wu-men-cheng-lou-yin-zhou.png'
    }
  },
  '宫城/01外朝/午门外朝房': {
    name: '午门外朝房',
    fullPath: '宫城/01外朝',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/LXV0v1R8/wu-men-wai-chao-fang-ye.png',
      '昼': 'https://i.postimg.cc/rsFZHwFh/wu-men-wai-chao-fang-zhou.png'
    }
  },
  '宫城/01外朝/武英殿': {
    name: '武英殿',
    fullPath: '宫城/01外朝',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/NfnCNYhL/wu-ying-dian-ye.png',
      '昼': 'https://i.postimg.cc/L8ZCw7Rw/wu-ying-dian-zhou.png'
    }
  },
  '宫城/01外朝/西华门': {
    name: '西华门',
    fullPath: '宫城/01外朝',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/QCtSbY0y/xi-hua-men-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/J02xd322/xi-hua-men-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/rFDQRbdL/xi-hua-men-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/4NYBHMKm/xi-hua-men-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/hv5s38Yt/xi-hua-men-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/mZXmDRg5/xi-hua-men-yin-zhou.png'
    }
  },
  '宫城/02帝后/慈宁宫小佛堂': {
    name: '慈宁宫小佛堂',
    fullPath: '宫城/02帝后',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/HxS9V4dt/ci-ning-gong-xiao-fu-tang-ye.png',
      '昼': 'https://i.postimg.cc/2yVFvbSF/ci-ning-gong-xiao-fu-tang-zhou.png'
    }
  },
  '宫城/02帝后/慈宁宫正殿': {
    name: '慈宁宫正殿',
    fullPath: '宫城/02帝后',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/GtHJY8mf/ci-ning-gong-zheng-dian-ye.png',
      '昼': 'https://i.postimg.cc/4yqv1fKZ/ci-ning-gong-zheng-dian-zhou.png'
    }
  },
  '宫城/02帝后/坤宁宫寝阁': {
    name: '坤宁宫寝阁',
    fullPath: '宫城/02帝后',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/tgj5f4BV/kun-ning-gong-qin-ge-ye.png',
      '昼': 'https://i.postimg.cc/R0LRzxYt/kun-ning-gong-qin-ge-zhou.png'
    }
  },
  '宫城/02帝后/坤宁宫正殿': {
    name: '坤宁宫正殿',
    fullPath: '宫城/02帝后',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/Jh5qWCgw/kun-ning-gong-zheng-dian-ye.png',
      '昼': 'https://i.postimg.cc/509m4kd1/kun-ning-gong-zheng-dian-zhou.png'
    }
  },
  '宫城/02帝后/乾清宫暖阁': {
    name: '乾清宫暖阁',
    fullPath: '宫城/02帝后',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/QxvSQb5d/qian-qing-gong-nuan-ge-ye.png',
      '昼': 'https://i.postimg.cc/tC8D35PW/qian-qing-gong-nuan-ge-zhou.png'
    }
  },
  '宫城/02帝后/乾清宫正殿': {
    name: '乾清宫正殿',
    fullPath: '宫城/02帝后',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/hPNMLrxZ/qian-qing-gong-zheng-dian-ye.png',
      '昼': 'https://i.postimg.cc/T3m0CDq9/qian-qing-gong-zheng-dian-zhou.png'
    }
  },
  '宫城/02帝后/养心殿': {
    name: '养心殿',
    fullPath: '宫城/02帝后',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/K8LfJMDv/yang-xin-dian-ye.png',
      '昼': 'https://i.postimg.cc/CKgNtxch/yang-xin-dian-zhou.png'
    }
  },
  '宫城/02帝后/御书房': {
    name: '御书房',
    fullPath: '宫城/02帝后',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/63HfyLtw/yu-shu-fang-ye.png',
      '昼': 'https://i.postimg.cc/XJ2kpc4G/yu-shu-fang-zhou.png'
    }
  },
  '宫城/03东宫/东宫官属值房': {
    name: '东宫官属值房',
    fullPath: '宫城/03东宫',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/MTGy2MVk/dong-gong-guan-shu-zhi-fang-ye.png',
      '昼': 'https://i.postimg.cc/W34MLFgb/dong-gong-guan-shu-zhi-fang-zhou.png'
    }
  },
  '宫城/03东宫/东宫后苑': {
    name: '东宫后苑',
    fullPath: '宫城/03东宫',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/W1MmMPsv/dong-gong-hou-yuan-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/DwqQqK70/dong-gong-hou-yuan-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/HLzQh4J4/dong-gong-hou-yuan-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/9fbGnt4s/dong-gong-hou-yuan-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/N0B6DP02/dong-gong-hou-yuan-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/Zq48HDqx/dong-gong-hou-yuan-yin-zhou.png'
    }
  },
  '宫城/03东宫/东宫前院': {
    name: '东宫前院',
    fullPath: '宫城/03东宫',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/xTN31z78/dong-gong-qian-yuan-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/gkLH2Z5R/dong-gong-qian-yuan-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/QdLk9MGz/dong-gong-qian-yuan-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/bwQ0QjpM/dong-gong-qian-yuan-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/zXHFGgMF/dong-gong-qian-yuan-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/wjKcyB8Q/dong-gong-qian-yuan-yin-zhou.png'
    }
  },
  '宫城/03东宫/东宫书堂': {
    name: '东宫书堂',
    fullPath: '宫城/03东宫',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/BZVC3ghZ/dong-gong-shu-tang-ye.png',
      '昼': 'https://i.postimg.cc/hPQ1tdwg/dong-gong-shu-tang-zhou.png'
    }
  },
  '宫城/03东宫/端本宫内寝': {
    name: '端本宫内寝',
    fullPath: '宫城/03东宫',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/0QH78k0w/duan-ben-gong-nei-qin-ye.png',
      '昼': 'https://i.postimg.cc/26Xnzk77/duan-ben-gong-nei-qin-zhou.png'
    }
  },
  '宫城/03东宫/端本宫书房': {
    name: '端本宫书房',
    fullPath: '宫城/03东宫',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/4d3zk7Vh/duan-ben-gong-shu-fang-ye.png',
      '昼': 'https://i.postimg.cc/NMPRgskF/duan-ben-gong-shu-fang-zhou.png'
    }
  },
  '宫城/04六宫/宫正司值房': {
    name: '宫正司值房',
    fullPath: '宫城/04六宫',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/Kj6LM0VM/gong-zheng-si-zhi-fang-ye.png',
      '昼': 'https://i.postimg.cc/mZJ7Jrrp/gong-zheng-si-zhi-fang-zhou.png'
    }
  },
  '宫城/04六宫/宁安宫小院': {
    name: '宁安宫小院',
    fullPath: '宫城/04六宫',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/Y9yQprzd/ning-an-gong-xiao-yuan-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/gjX8jCgH/ning-an-gong-xiao-yuan-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/PJpYJg6n/ning-an-gong-xiao-yuan-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/J0fJkpgC/ning-an-gong-xiao-yuan-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/BbLHbrmM/ning-an-gong-xiao-yuan-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/6q2nqkMm/ning-an-gong-xiao-yuan-yin-zhou.png'
    }
  },
  '宫城/04六宫/宁安宫正殿': {
    name: '宁安宫正殿',
    fullPath: '宫城/04六宫',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/Kj6LM0Vv/ning-an-gong-zheng-dian-ye.png',
      '昼': 'https://i.postimg.cc/prw8Fs7m/ning-an-gong-zheng-dian-zhou.png'
    }
  },
  '宫城/04六宫/锁澜宫封殿': {
    name: '锁澜宫封殿',
    fullPath: '宫城/04六宫',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/cLMYvMcv/suo-lan-gong-feng-dian-ye.png',
      '昼': 'https://i.postimg.cc/5t4zLYPj/suo-lan-gong-feng-dian-zhou.png'
    }
  },
  '宫城/04六宫/锁澜宫封院': {
    name: '锁澜宫封院',
    fullPath: '宫城/04六宫',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/q7JKyhmb/suo-lan-gong-feng-yuan-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/d05yBsX6/suo-lan-gong-feng-yuan-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/Ssjzt0bq/suo-lan-gong-feng-yuan-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/QtVWnLZt/suo-lan-gong-feng-yuan-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/1zvqHmT7/suo-lan-gong-feng-yuan-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/cJFnmxjp/suo-lan-gong-feng-yuan-yin-zhou.png'
    }
  },
  '宫城/04六宫/昭华宫前院': {
    name: '昭华宫前院',
    fullPath: '宫城/04六宫',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/xjhLhdCD/zhao-hua-gong-qian-yuan-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/BZk2kv6s/zhao-hua-gong-qian-yuan-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/WbZ0vPFZ/zhao-hua-gong-qian-yuan-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/bwjkYFkQ/zhao-hua-gong-qian-yuan-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/ZY262qR5/zhao-hua-gong-qian-yuan-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/pXjKHthW/zhao-hua-gong-qian-yuan-yin-zhou.png'
    }
  },
  '宫城/04六宫/昭华宫寝阁': {
    name: '昭华宫寝阁',
    fullPath: '宫城/04六宫',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/L8ML40Lv/zhao-hua-gong-qin-ge-ye.png',
      '昼': 'https://i.postimg.cc/L8ML40LC/zhao-hua-gong-qin-ge-zhou.png'
    }
  },
  '宫城/04六宫/昭华宫正殿': {
    name: '昭华宫正殿',
    fullPath: '宫城/04六宫',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/Z5hpYD6z/zhao-hua-gong-zheng-dian-ye.png',
      '昼': 'https://i.postimg.cc/kgF82FvZ/zhao-hua-gong-zheng-dian-zhou.png'
    }
  },
  '宫城/05内官/安乐堂': {
    name: '安乐堂',
    fullPath: '宫城/05内官',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/3JGcWRb4/an-le-tang-ye.png',
      '昼': 'https://i.postimg.cc/pLt1jHgT/an-le-tang-zhou.png'
    }
  },
  '宫城/05内官/百鸟房': {
    name: '百鸟房',
    fullPath: '宫城/05内官',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/ryrJNHGP/bai-niao-fang-ye.png',
      '昼': 'https://i.postimg.cc/G3yQxfJw/bai-niao-fang-zhou.png'
    }
  },
  '宫城/05内官/宝钞司作坊': {
    name: '宝钞司作坊',
    fullPath: '宫城/05内官',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/T3XHb6ZN/bao-chao-si-zuo-fang-ye.png',
      '昼': 'https://i.postimg.cc/P5zVz7j3/bao-chao-si-zuo-fang-zhou.png'
    }
  },
  '宫城/05内官/兵仗局火药作': {
    name: '兵仗局火药作',
    fullPath: '宫城/05内官',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/XJXyDM6F/bing-zhang-ju-huo-yao-zuo-ye.png',
      '昼': 'https://i.postimg.cc/W3KqB9sm/bing-zhang-ju-huo-yao-zuo-zhou.png'
    }
  },
  '宫城/05内官/浣衣房': {
    name: '浣衣房',
    fullPath: '宫城/05内官',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/pT9B7Gwb/huan-yi-fang-ye.png',
      '昼': 'https://i.postimg.cc/qRtGYbPM/huan-yi-fang-zhou.png'
    }
  },
  '宫城/05内官/浣衣局大院': {
    name: '浣衣局大院',
    fullPath: '宫城/05内官',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/HkHBxtyF/huan-yi-ju-da-yuan-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/rwJgttG8/huan-yi-ju-da-yuan-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/ZqscwtDX/huan-yi-ju-da-yuan-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/fL3vF266/huan-yi-ju-da-yuan-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/CKx7CLJL/huan-yi-ju-da-yuan-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/bvVTmcFx/huan-yi-ju-da-yuan-yin-zhou.png'
    }
  },
  '宫城/05内官/混堂': {
    name: '混堂',
    fullPath: '宫城/05内官',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/MThY80wc/hun-tang-ye.png',
      '昼': 'https://i.postimg.cc/76pNy14X/hun-tang-zhou.png'
    }
  },
  '宫城/05内官/经厂': {
    name: '经厂',
    fullPath: '宫城/05内官',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/X76gHgQS/jing-chang-ye.png',
      '昼': 'https://i.postimg.cc/xTG3Wb40/jing-chang-zhou.png'
    }
  },
  '宫城/05内官/猫儿房': {
    name: '猫儿房',
    fullPath: '宫城/05内官',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/GtGx3B3g/mao-er-fang-ye.png',
      '昼': 'https://i.postimg.cc/mZHwyn3F/mao-er-fang-zhou.png'
    }
  },
  '宫城/05内官/内承运库': {
    name: '内承运库',
    fullPath: '宫城/05内官',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/44mMkw6w/nei-cheng-yun-ku-ye.png',
      '昼': 'https://i.postimg.cc/tRwcXPk3/nei-cheng-yun-ku-zhou.png'
    }
  },
  '宫城/05内官/内官监料场': {
    name: '内官监料场',
    fullPath: '宫城/05内官',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/sxhGsp2k/nei-guan-jian-liao-chang-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/gjZLmvJw/nei-guan-jian-liao-chang-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/h4fwWMLh/nei-guan-jian-liao-chang-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/v8cjFXr9/nei-guan-jian-liao-chang-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/JtCDnGDh/nei-guan-jian-liao-chang-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/t7GZTYZD/nei-guan-jian-liao-chang-yin-zhou.png'
    }
  },
  '宫城/05内官/内书堂': {
    name: '内书堂',
    fullPath: '宫城/05内官',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/LX7gcymC/nei-shu-tang-ye.png',
      '昼': 'https://i.postimg.cc/Ss5YBZmw/nei-shu-tang-zhou.png'
    }
  },
  '宫城/05内官/染坊': {
    name: '染坊',
    fullPath: '宫城/05内官',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/sD5TsLvp/ran-fang-ye.png',
      '昼': 'https://i.postimg.cc/T3GCwcD7/ran-fang-zhou.png'
    }
  },
  '宫城/05内官/司礼监值房': {
    name: '司礼监值房',
    fullPath: '宫城/05内官',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/sfqLVSmK/si-li-jian-zhi-fang-ye.png',
      '昼': 'https://i.postimg.cc/2jMtzvGg/si-li-jian-zhi-fang-zhou.png'
    }
  },
  '宫城/05内官/太医院值房': {
    name: '太医院值房',
    fullPath: '宫城/05内官',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/VsphYM4z/tai-yi-yuan-zhi-fang-ye.png',
      '昼': 'https://i.postimg.cc/rF4PzmYV/tai-yi-yuan-zhi-fang-zhou.png'
    }
  },
  '宫城/05内官/文书房': {
    name: '文书房',
    fullPath: '宫城/05内官',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/NG3Nhtfv/wen-shu-fang-ye.png',
      '昼': 'https://i.postimg.cc/65CMtPyX/wen-shu-fang-zhou.png'
    }
  },
  '宫城/05内官/惜薪司炭厂': {
    name: '惜薪司炭厂',
    fullPath: '宫城/05内官',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/9XRxN02S/xi-xin-si-tan-chang-ye.png',
      '昼': 'https://i.postimg.cc/8k2y8GkX/xi-xin-si-tan-chang-zhou.png'
    }
  },
  '宫城/05内官/绣坊': {
    name: '绣坊',
    fullPath: '宫城/05内官',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/sDP4tZNn/xiu-fang-ye.png',
      '昼': 'https://i.postimg.cc/YCpzkq5P/xiu-fang-zhou.png'
    }
  },
  '宫城/05内官/御花房': {
    name: '御花房',
    fullPath: '宫城/05内官',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/s2TnbZ1J/yu-hua-fang-ye.png',
      '昼': 'https://i.postimg.cc/CKcv9fdW/yu-hua-fang-zhou.png'
    }
  },
  '宫城/05内官/御酒房': {
    name: '御酒房',
    fullPath: '宫城/05内官',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/fLF8RncT/yu-jiu-fang-ye.png',
      '昼': 'https://i.postimg.cc/G2NXmwFy/yu-jiu-fang-zhou.png'
    }
  },
  '宫城/05内官/御马监操场': {
    name: '御马监操场',
    fullPath: '宫城/05内官',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/50Gs2dBp/yu-ma-jian-cao-chang-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/kGbfV1sF/yu-ma-jian-cao-chang-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/J7DTd08D/yu-ma-jian-cao-chang-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/dQkWS3Fj/yu-ma-jian-cao-chang-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/vTV31qhq/yu-ma-jian-cao-chang-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/gcXMBjpJ/yu-ma-jian-cao-chang-yin-zhou.png'
    }
  },
  '宫城/05内官/御膳房': {
    name: '御膳房',
    fullPath: '宫城/05内官',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/jjxg8hqw/yu-shan-fang-ye.png',
      '昼': 'https://i.postimg.cc/vmYqPv8r/yu-shan-fang-zhou.png'
    }
  },
  '宫城/05内官/御药房药库': {
    name: '御药房药库',
    fullPath: '宫城/05内官',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/V657wLbT/yu-yao-fang-yao-ku-ye.png',
      '昼': 'https://i.postimg.cc/k4DjCXbD/yu-yao-fang-yao-ku-zhou.png'
    }
  },
  '宫城/05内官/御用监造办房': {
    name: '御用监造办房',
    fullPath: '宫城/05内官',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/3xCfCqTP/yu-yong-jian-zao-ban-fang-ye.png',
      '昼': 'https://i.postimg.cc/6QWjHh6J/yu-yong-jian-zao-ban-fang-zhou.png'
    }
  },
  '宫城/05内官/赃罚库': {
    name: '赃罚库',
    fullPath: '宫城/05内官',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/x1tydVYz/zang-fa-ku-ye.png',
      '昼': 'https://i.postimg.cc/xd8GJpTz/zang-fa-ku-zhou.png'
    }
  },
  '宫城/05内官/钟鼓司戏台': {
    name: '钟鼓司戏台',
    fullPath: '宫城/05内官',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/QMCg9Yxk/zhong-gu-si-xi-tai-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/d03RkNtW/zhong-gu-si-xi-tai-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/bv5xQ0Zw/zhong-gu-si-xi-tai-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/sXZpKBWX/zhong-gu-si-xi-tai-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/LsWtzkn0/zhong-gu-si-xi-tai-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/9fkdGPDh/zhong-gu-si-xi-tai-yin-zhou.png'
    }
  },
  '宫城/06苑囿/堆秀山御景亭': {
    name: '堆秀山御景亭',
    fullPath: '宫城/06苑囿',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/8cRLQqwx/dui-xiu-shan-yu-jing-ting-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/3rmXvv7q/dui-xiu-shan-yu-jing-ting-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/PrM16nC3/dui-xiu-shan-yu-jing-ting-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/fRTmpqd6/dui-xiu-shan-yu-jing-ting-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/yYKFX88B/dui-xiu-shan-yu-jing-ting-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/vHyWLZZ9/dui-xiu-shan-yu-jing-ting-yin-zhou.png'
    }
  },
  '宫城/06苑囿/钦安殿': {
    name: '钦安殿',
    fullPath: '宫城/06苑囿',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/QC3Wbfsg/qin-an-dian-ye.png',
      '昼': 'https://i.postimg.cc/kGmtcT9p/qin-an-dian-zhou.png'
    }
  },
  '宫城/06苑囿/御花园': {
    name: '御花园',
    fullPath: '宫城/06苑囿',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/fR2mN7jd/yu-hua-yuan-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/k528XVfj/yu-hua-yuan-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/7LjzCxRJ/yu-hua-yuan-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/RFfHKkr7/yu-hua-yuan-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/Pq0DLtRR/yu-hua-yuan-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/cJP3KszG/yu-hua-yuan-yin-zhou.png'
    }
  },
  '宫城/07阴面/宫井井亭': {
    name: '宫井井亭',
    fullPath: '宫城/07阴面',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/JnbsGjJG/gong-jing-jing-ting-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/TwrKpnmc/gong-jing-jing-ting-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/90bzBVLB/gong-jing-jing-ting-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/0506vd91/gong-jing-jing-ting-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/qq4zngXD/gong-jing-jing-ting-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/prCyBxsV/gong-jing-jing-ting-yin-zhou.png'
    }
  },
  '宫城/07阴面/宫墙马道': {
    name: '宫墙马道',
    fullPath: '宫城/07阴面',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/RCL3mQvN/gong-qiang-ma-dao-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/28j1Sb5B/gong-qiang-ma-dao-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/FsP7drdv/gong-qiang-ma-dao-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/Vkd5Xxn1/gong-qiang-ma-dao-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/qMBNvh7Z/gong-qiang-ma-dao-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/NfN59syC/gong-qiang-ma-dao-yin-zhou.png'
    }
  },
  '宫城/07阴面/角楼': {
    name: '角楼',
    fullPath: '宫城/07阴面',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/3RCwKY51/jiao-lou-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/vBLmQbFJ/jiao-lou-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/VvKLCgN5/jiao-lou-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/FzTsLpKJ/jiao-lou-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/0jkyjF9R/jiao-lou-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/hvDtv6KP/jiao-lou-yin-zhou.png'
    }
  },
  '宫城/07阴面/冷宫偏院': {
    name: '冷宫偏院',
    fullPath: '宫城/07阴面',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/59Bz0WS4/leng-gong-pian-yuan-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/J4RkHYpk/leng-gong-pian-yuan-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/dVxkXsw6/leng-gong-pian-yuan-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/sXFBjTBr/leng-gong-pian-yuan-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/7YXT31cv/leng-gong-pian-yuan-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/x14J7fn1/leng-gong-pian-yuan-yin-zhou.png'
    }
  },
  '宫城/07阴面/内金水河暗渠口': {
    name: '内金水河暗渠口',
    fullPath: '宫城/07阴面',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/5yVF3sbW/nei-jin-shui-he-an-qu-kou-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/MHSjD9qz/nei-jin-shui-he-an-qu-kou-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/PJQvF15D/nei-jin-shui-he-an-qu-kou-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/1RGFt1cJ/nei-jin-shui-he-an-qu-kou-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/RhLJbwZB/nei-jin-shui-he-an-qu-kou-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/rsNRY5wm/nei-jin-shui-he-an-qu-kou-yin-zhou.png'
    }
  },
  '宫城/07阴面/神武门内夹墙': {
    name: '神武门内夹墙',
    fullPath: '宫城/07阴面',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/GmH9vWG4/shen-wu-men-nei-jia-qiang-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/HkRnz692/shen-wu-men-nei-jia-qiang-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/50M0djG6/shen-wu-men-nei-jia-qiang-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/d1K1PDX6/shen-wu-men-nei-jia-qiang-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/fbdLrY8p/shen-wu-men-nei-jia-qiang-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/q7KR52mR/shen-wu-men-nei-jia-qiang-yin-zhou.png'
    }
  },
  '皇城/01衙署/北镇抚司诏狱': {
    name: '北镇抚司诏狱',
    fullPath: '皇城/01衙署',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/28F8hz16/bei-zhen-fu-si-zhao-yu-ye.png',
      '昼': 'https://i.postimg.cc/dVsQ9zC9/bei-zhen-fu-si-zhao-yu-zhou.png'
    }
  },
  '皇城/01衙署/兵部值房': {
    name: '兵部值房',
    fullPath: '皇城/01衙署',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/3xYNcksC/bing-bu-zhi-fang-ye.png',
      '昼': 'https://i.postimg.cc/NjDFqgtC/bing-bu-zhi-fang-zhou.png'
    }
  },
  '皇城/01衙署/承天门御道': {
    name: '承天门御道',
    fullPath: '皇城/01衙署',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/pTztvZ8m/cheng-tian-men-yu-dao-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/MHwJpQbG/cheng-tian-men-yu-dao-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/3NZ54xnX/cheng-tian-men-yu-dao-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/HntDckBh/cheng-tian-men-yu-dao-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/RhmxZHQf/cheng-tian-men-yu-dao-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/GtRnmyJK/cheng-tian-men-yu-dao-yin-zhou.png'
    }
  },
  '皇城/01衙署/大理寺评案堂': {
    name: '大理寺评案堂',
    fullPath: '皇城/01衙署',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/xjL0V0yv/da-li-si-ping-an-tang-ye.png',
      '昼': 'https://i.postimg.cc/Wp02c26W/da-li-si-ping-an-tang-zhou.png'
    }
  },
  '皇城/01衙署/大雍门': {
    name: '大雍门',
    fullPath: '皇城/01衙署',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/Fsmh92T4/da-yong-men-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/Pr4TN27n/da-yong-men-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/jS3T4CK3/da-yong-men-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/hGJBygt4/da-yong-men-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/9FpCzJkq/da-yong-men-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/JzzmXjwk/da-yong-men-yin-zhou.png'
    }
  },
  '皇城/01衙署/都察院大堂': {
    name: '都察院大堂',
    fullPath: '皇城/01衙署',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/sgLFZ84C/dou-cha-yuan-da-tang-ye.png',
      '昼': 'https://i.postimg.cc/JzFwBg54/dou-cha-yuan-da-tang-zhou.png'
    }
  },
  '皇城/01衙署/端门': {
    name: '端门',
    fullPath: '皇城/01衙署',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/2jdfX0rJ/duan-men-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/vHQdR5Zj/duan-men-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/J4PCRty5/duan-men-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/cLCyCZYm/duan-men-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/Ghc10vp1/duan-men-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/fTwh4YbR/duan-men-yin-zhou.png'
    }
  },
  '皇城/01衙署/工部缮造司': {
    name: '工部缮造司',
    fullPath: '皇城/01衙署',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/0NLqh3z0/gong-bu-shan-zao-si-ye.png',
      '昼': 'https://i.postimg.cc/jjGrB9D9/gong-bu-shan-zao-si-zhou.png'
    }
  },
  '皇城/01衙署/鸿胪寺大堂': {
    name: '鸿胪寺大堂',
    fullPath: '皇城/01衙署',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/tg6cnggd/hong-lu-si-da-tang-ye.png',
      '昼': 'https://i.postimg.cc/SK9PYKK1/hong-lu-si-da-tang-zhou.png'
    }
  },
  '皇城/01衙署/户部账库': {
    name: '户部账库',
    fullPath: '皇城/01衙署',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/pTztvZj7/hu-bu-zhang-ku-ye.png',
      '昼': 'https://i.postimg.cc/63nNK0RB/hu-bu-zhang-ku-zhou.png'
    }
  },
  '皇城/01衙署/金匮石室': {
    name: '金匮石室',
    fullPath: '皇城/01衙署',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/jjnp6XMq/jin-kui-shi-shi-ye.png',
      '昼': 'https://i.postimg.cc/nL9yKk37/jin-kui-shi-shi-zhou.png'
    }
  },
  '皇城/01衙署/锦衣卫大堂': {
    name: '锦衣卫大堂',
    fullPath: '皇城/01衙署',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/rFy7Zchr/jin-yi-wei-da-tang-ye.png',
      '昼': 'https://i.postimg.cc/Pr69Bccv/jin-yi-wei-da-tang-zhou.png'
    }
  },
  '皇城/01衙署/锦衣卫校场': {
    name: '锦衣卫校场',
    fullPath: '皇城/01衙署',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/m2dJ0qqY/jin-yi-wei-xiao-chang-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/pX04g77c/jin-yi-wei-xiao-chang-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/4xqM3cXN/jin-yi-wei-xiao-chang-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/NjSV0XQm/jin-yi-wei-xiao-chang-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/13f2PBhv/jin-yi-wei-xiao-chang-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/4xmqZPRG/jin-yi-wei-xiao-chang-yin-zhou.png'
    }
  },
  '皇城/01衙署/礼部祠祭司': {
    name: '礼部祠祭司',
    fullPath: '皇城/01衙署',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/PJMsp5SH/li-bu-ci-ji-si-ye.png',
      '昼': 'https://i.postimg.cc/66VN1MtL/li-bu-ci-ji-si-zhou.png'
    }
  },
  '皇城/01衙署/吏部值房': {
    name: '吏部值房',
    fullPath: '皇城/01衙署',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/Rh197RVL/li-bu-zhi-fang-ye.png',
      '昼': 'https://i.postimg.cc/sxPyYcgC/li-bu-zhi-fang-zhou.png'
    }
  },
  '皇城/01衙署/千步廊官署街': {
    name: '千步廊官署街',
    fullPath: '皇城/01衙署',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/7ZKHtm1c/qian-bu-lang-guan-shu-jie-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/0Nr8TDcz/qian-bu-lang-guan-shu-jie-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/0Qw9Qxgq/qian-bu-lang-guan-shu-jie-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/gjbmL5dw/qian-bu-lang-guan-shu-jie-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/nL5HprPm/qian-bu-lang-guan-shu-jie-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/GpNcdt5f/qian-bu-lang-guan-shu-jie-yin-zhou.png'
    }
  },
  '皇城/01衙署/钦天监大堂': {
    name: '钦天监大堂',
    fullPath: '皇城/01衙署',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/B6WdmKzh/qin-tian-jian-da-tang-ye.png',
      '昼': 'https://i.postimg.cc/qRf913Yk/qin-tian-jian-da-tang-zhou.png'
    }
  },
  '皇城/01衙署/钦天监卷宗库': {
    name: '钦天监卷宗库',
    fullPath: '皇城/01衙署',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/6Q4kV0Mf/qin-tian-jian-juan-zong-ku-ye.png',
      '昼': 'https://i.postimg.cc/R0Jk1RgP/qin-tian-jian-juan-zong-ku-zhou.png'
    }
  },
  '皇城/01衙署/钦天监漏刻房': {
    name: '钦天监漏刻房',
    fullPath: '皇城/01衙署',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/3rFPZWFV/qin-tian-jian-lou-ke-fang-ye.png',
      '昼': 'https://i.postimg.cc/c41PkZF5/qin-tian-jian-lou-ke-fang-zhou.png'
    }
  },
  '皇城/01衙署/钦天监算房': {
    name: '钦天监算房',
    fullPath: '皇城/01衙署',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/tCR8vyrH/qin-tian-jian-suan-fang-ye.png',
      '昼': 'https://i.postimg.cc/WbpxYj9p/qin-tian-jian-suan-fang-zhou.png'
    }
  },
  '皇城/01衙署/钦天监庭院': {
    name: '钦天监庭院',
    fullPath: '皇城/01衙署',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/d3wgYKw3/qin-tian-jian-ting-yuan-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/kGqLmdqp/qin-tian-jian-ting-yuan-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/bY9KRd9x/qin-tian-jian-ting-yuan-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/sf4tJ14T/qin-tian-jian-ting-yuan-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/wM2ZxbjZ/qin-tian-jian-ting-yuan-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/90bKXNfQ/qin-tian-jian-ting-yuan-yin-zhou.png'
    }
  },
  '皇城/01衙署/太仓库': {
    name: '太仓库',
    fullPath: '皇城/01衙署',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/s2Br6ygB/tai-cang-ku-ye.png',
      '昼': 'https://i.postimg.cc/JhyL6mzQ/tai-cang-ku-zhou.png'
    }
  },
  '皇城/01衙署/通政司收本厅': {
    name: '通政司收本厅',
    fullPath: '皇城/01衙署',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/QdCGCs5n/tong-zheng-si-shou-ben-ting-ye.png',
      '昼': 'https://i.postimg.cc/sgLFZ89L/tong-zheng-si-shou-ben-ting-zhou.png'
    }
  },
  '皇城/01衙署/刑部成案档库': {
    name: '刑部成案档库',
    fullPath: '皇城/01衙署',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/5y89PJpH/xing-bu-cheng-an-dang-ku-ye.png',
      '昼': 'https://i.postimg.cc/05SN5GxK/xing-bu-cheng-an-dang-ku-zhou.png'
    }
  },
  '皇城/01衙署/刑部大牢': {
    name: '刑部大牢',
    fullPath: '皇城/01衙署',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/wBbBM07W/xing-bu-da-lao-ye.png',
      '昼': 'https://i.postimg.cc/gJCkqjyF/xing-bu-da-lao-zhou.png'
    }
  },
  '皇城/01衙署/刑部大堂': {
    name: '刑部大堂',
    fullPath: '皇城/01衙署',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/tggT9LC0/xing-bu-da-tang-ye.png',
      '昼': 'https://i.postimg.cc/W4f4zXhb/xing-bu-da-tang-zhou.png'
    }
  },
  '皇城/01衙署/刑部提牢厅': {
    name: '刑部提牢厅',
    fullPath: '皇城/01衙署',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/yYz8DJYX/xing-bu-ti-lao-ting-ye.png',
      '昼': 'https://i.postimg.cc/4NbNVJm2/xing-bu-ti-lao-ting-zhou.png'
    }
  },
  '皇城/02西苑/虎城': {
    name: '虎城',
    fullPath: '皇城/02西苑',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/DyzYd6ZF/hu-cheng-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/9FfNtbMR/hu-cheng-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/rw0n7p5q/hu-cheng-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/wjCfzdkc/hu-cheng-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/15Y7WFnq/hu-cheng-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/tCmvr6Z8/hu-cheng-yin-zhou.png'
    }
  },
  '皇城/02西苑/琼岛广寒殿': {
    name: '琼岛广寒殿',
    fullPath: '皇城/02西苑',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/sxjHL94k/qiong-dao-guang-han-dian-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/FzTCXdTn/qiong-dao-guang-han-dian-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/sfmNhq3J/qiong-dao-guang-han-dian-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/3r1cvVKh/qiong-dao-guang-han-dian-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/Hn6v1cSg/qiong-dao-guang-han-dian-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/Wz5YcF93/qiong-dao-guang-han-dian-yin-zhou.png'
    }
  },
  '皇城/02西苑/太液池畔': {
    name: '太液池畔',
    fullPath: '皇城/02西苑',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/DZKMrKWB/tai-ye-chi-pan-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/C1VQGVBY/tai-ye-chi-pan-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/zBSPpPKh/tai-ye-chi-pan-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/d3sNfmjy/tai-ye-chi-pan-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/W3PHGPF4/tai-ye-chi-pan-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/qRXZQZyg/tai-ye-chi-pan-yin-zhou.png'
    }
  },
  '皇城/02西苑/西苑醮坛': {
    name: '西苑醮坛',
    fullPath: '皇城/02西苑',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/hG8rqQvK/xi-yuan-jiao-tan-ye.png',
      '昼': 'https://i.postimg.cc/V6YFss0v/xi-yuan-jiao-tan-zhou.png'
    }
  },
  '皇城/02西苑/西苑水榭': {
    name: '西苑水榭',
    fullPath: '皇城/02西苑',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/VNX7LHGQ/xi-yuan-shui-xie-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/LXTNjgFD/xi-yuan-shui-xie-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/13qBJjZm/xi-yuan-shui-xie-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/R01RzJFd/xi-yuan-shui-xie-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/Y0DRsc96/xi-yuan-shui-xie-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/vHD36mqr/xi-yuan-shui-xie-yin-zhou.png'
    }
  },
  '皇城/03苑山/朝天宫三清大殿': {
    name: '朝天宫三清大殿',
    fullPath: '皇城/03苑山',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/Y0vYjvrW/chao-tian-gong-san-qing-da-dian-ye.png',
      '昼': 'https://i.postimg.cc/8cxWvTcd/chao-tian-gong-san-qing-da-dian-zhou.png'
    }
  },
  '皇城/03苑山/朝天宫山门': {
    name: '朝天宫山门',
    fullPath: '皇城/03苑山',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/Vv2MtzvZ/chao-tian-gong-shan-men-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/440pqQPY/chao-tian-gong-shan-men-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/9Fqyhwg6/chao-tian-gong-shan-men-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/rwXxFy7H/chao-tian-gong-shan-men-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/sDZ5rGH5/chao-tian-gong-shan-men-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/bN21hSVm/chao-tian-gong-shan-men-yin-zhou.png'
    }
  },
  '皇城/03苑山/社稷坛': {
    name: '社稷坛',
    fullPath: '皇城/03苑山',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/SxFCNQw4/she-ji-tan-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/6pJn56D9/she-ji-tan-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/zfqhKtzw/she-ji-tan-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/nLTDk4Mp/she-ji-tan-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/sgYSBdrQ/she-ji-tan-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/T3VmyM6q/she-ji-tan-yin-zhou.png'
    }
  },
  '皇城/03苑山/太庙': {
    name: '太庙',
    fullPath: '皇城/03苑山',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/NfW79krG/tai-miao-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/fbsc5WKg/tai-miao-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/KzqtZPy0/tai-miao-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/prmzymW2/tai-miao-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/FKxj6tC9/tai-miao-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/B6Qx9hRB/tai-miao-yin-zhou.png'
    }
  },
  '皇城/03苑山/万岁山': {
    name: '万岁山',
    fullPath: '皇城/03苑山',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/hjp1XFV9/wan-sui-shan-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/x88yHsR2/wan-sui-shan-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/MZ3YxS6f/wan-sui-shan-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/28q7SKyw/wan-sui-shan-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/2ytdx4cy/wan-sui-shan-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/nVS1ZJH5/wan-sui-shan-yin-zhou.png'
    }
  },
  '内城/东城/01商贸/灯市口大街': {
    name: '灯市口大街',
    fullPath: '内城/东城/01商贸',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/L83RYv0f/deng-shi-kou-da-jie-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/VNswjM3F/deng-shi-kou-da-jie-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/fLphnPk1/deng-shi-kou-da-jie-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/0jS18CwK/deng-shi-kou-da-jie-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/R0PBGhmC/deng-shi-kou-da-jie-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/W3hPyVp8/deng-shi-kou-da-jie-yin-zhou.png'
    }
  },
  '内城/东城/01商贸/东四牌楼街': {
    name: '东四牌楼街',
    fullPath: '内城/东城/01商贸',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/qqSSS6DV/dong-si-pai-lou-jie-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/h45kfNDb/dong-si-pai-lou-jie-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/s2s8krmf/dong-si-pai-lou-jie-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/W48KjHY5/dong-si-pai-lou-jie-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/kXRk8wD2/dong-si-pai-lou-jie-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/nh8N17Q0/dong-si-pai-lou-jie-yin-zhou.png'
    }
  },
  '内城/东城/01商贸/隆福寺大殿': {
    name: '隆福寺大殿',
    fullPath: '内城/东城/01商贸',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/zDHrSqP9/long-fu-si-da-dian-ye.png',
      '昼': 'https://i.postimg.cc/rF6Lf7BT/long-fu-si-da-dian-zhou.png'
    }
  },
  '内城/东城/01商贸/隆福寺庙市': {
    name: '隆福寺庙市',
    fullPath: '内城/东城/01商贸',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/gk9Pg1Cw/long-fu-si-miao-shi-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/CLjpXm0N/long-fu-si-miao-shi-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/VkgQLvdk/long-fu-si-miao-shi-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/fbb43s9K/long-fu-si-miao-shi-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/VLjPpDw3/long-fu-si-miao-shi-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/3xYQTmJx/long-fu-si-miao-shi-yin-zhou.png'
    }
  },
  '内城/东城/01商贸/内市': {
    name: '内市',
    fullPath: '内城/东城/01商贸',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/vBmKmtps/nei-shi-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/DZYM4bTs/nei-shi-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/RC2vjWnb/nei-shi-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/J7SR9skG/nei-shi-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/PJpFWrX6/nei-shi-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/Kj6pJS4c/nei-shi-yin-zhou.png'
    }
  },
  '内城/东城/01商贸/望仙楼大堂': {
    name: '望仙楼大堂',
    fullPath: '内城/东城/01商贸',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/xTH9Y9vb/wang-xian-lou-da-tang-ye.png',
      '昼': 'https://i.postimg.cc/SN8mqm61/wang-xian-lou-da-tang-zhou.png'
    }
  },
  '内城/东城/01商贸/望仙楼雅座': {
    name: '望仙楼雅座',
    fullPath: '内城/东城/01商贸',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/bwhpw4gW/wang-xian-lou-ya-zuo-ye.png',
      '昼': 'https://i.postimg.cc/2S7mbTXD/wang-xian-lou-ya-zuo-zhou.png'
    }
  },
  '内城/东城/02文教/贡院号舍巷': {
    name: '贡院号舍巷',
    fullPath: '内城/东城/02文教',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/8k62ft7g/gong-yuan-hao-she-xiang-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/J4C9NZXB/gong-yuan-hao-she-xiang-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/zGJ6MN0L/gong-yuan-hao-she-xiang-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/4xBqR0SP/gong-yuan-hao-she-xiang-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/J43SP03b/gong-yuan-hao-she-xiang-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/P5t9cHKR/gong-yuan-hao-she-xiang-yin-zhou.png'
    }
  },
  '内城/东城/02文教/贡院明远楼': {
    name: '贡院明远楼',
    fullPath: '内城/东城/02文教',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/TPsspDGv/gong-yuan-ming-yuan-lou-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/fbPPJ9ZS/gong-yuan-ming-yuan-lou-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/sxd0JCMj/gong-yuan-ming-yuan-lou-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/C5GrPr8x/gong-yuan-ming-yuan-lou-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/JnB2Jz4Y/gong-yuan-ming-yuan-lou-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/vTFSvwcP/gong-yuan-ming-yuan-lou-yin-zhou.png'
    }
  },
  '内城/东城/02文教/贡院至公堂': {
    name: '贡院至公堂',
    fullPath: '内城/东城/02文教',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/prfcGcj8/gong-yuan-zhi-gong-tang-ye.png',
      '昼': 'https://i.postimg.cc/RCKYZhYm/gong-yuan-zhi-gong-tang-zhou.png'
    }
  },
  '内城/东城/02文教/蒙学堂': {
    name: '蒙学堂',
    fullPath: '内城/东城/02文教',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/Jn9SdBdP/meng-xue-tang-ye.png',
      '昼': 'https://i.postimg.cc/G2Z6Ss5c/meng-xue-tang-zhou.png'
    }
  },
  '内城/东城/02文教/文墨书铺': {
    name: '文墨书铺',
    fullPath: '内城/东城/02文教',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/259shtQt/wen-mo-shu-pu-ye.png',
      '昼': 'https://i.postimg.cc/d0NbrfRk/wen-mo-shu-pu-zhou.png'
    }
  },
  '内城/东城/03仓储/朝阳门': {
    name: '朝阳门',
    fullPath: '内城/东城/03仓储',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/B6Dmb7Mm/chao-yang-men-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/qqTj3cFq/chao-yang-men-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/VL4DJCWv/chao-yang-men-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/13jBH1dw/chao-yang-men-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/qqxQXhfb/chao-yang-men-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/FshTFZcj/chao-yang-men-yin-zhou.png'
    }
  },
  '内城/东城/03仓储/禄米仓廒内': {
    name: '禄米仓廒内',
    fullPath: '内城/东城/03仓储',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/2SVF3X54/lu-mi-cang-ao-nei-ye.png',
      '昼': 'https://i.postimg.cc/4xqvcb7R/lu-mi-cang-ao-nei-zhou.png'
    }
  },
  '内城/东城/03仓储/禄米仓仓院': {
    name: '禄米仓仓院',
    fullPath: '内城/东城/03仓储',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/MGfD3rkN/lu-mi-cang-cang-yuan-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/PxGMgzTL/lu-mi-cang-cang-yuan-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/XNkgPChZ/lu-mi-cang-cang-yuan-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/Kvc5hYhS/lu-mi-cang-cang-yuan-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/HxQtdcL1/lu-mi-cang-cang-yuan-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/XqLcBRFB/lu-mi-cang-cang-yuan-yin-zhou.png'
    }
  },
  '内城/东城/03仓储/太仓廒区': {
    name: '太仓廒区',
    fullPath: '内城/东城/03仓储',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/7Y4WGDvR/tai-cang-ao-qu-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/qMGZ2Y44/tai-cang-ao-qu-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/9fD85Q98/tai-cang-ao-qu-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/Gp6McnJH/tai-cang-ao-qu-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/W1bY8n1h/tai-cang-ao-qu-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/0yWWBwzK/tai-cang-ao-qu-yin-zhou.png'
    }
  },
  '内城/东城/04司法/大兴班房': {
    name: '大兴班房',
    fullPath: '内城/东城/04司法',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/PrF1GzMz/da-xing-ban-fang-ye.png',
      '昼': 'https://i.postimg.cc/L8cf59wm/da-xing-ban-fang-zhou.png'
    }
  },
  '内城/东城/04司法/大兴监房': {
    name: '大兴监房',
    fullPath: '内城/东城/04司法',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/GpvDy0nk/da-xing-jian-fang-ye.png',
      '昼': 'https://i.postimg.cc/85D6dyT2/da-xing-jian-fang-zhou.png'
    }
  },
  '内城/东城/04司法/大兴仵作房': {
    name: '大兴仵作房',
    fullPath: '内城/东城/04司法',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/sxj5zT85/da-xing-wu-zuo-fang-ye.png',
      '昼': 'https://i.postimg.cc/XqsdYwSm/da-xing-wu-zuo-fang-zhou.png'
    }
  },
  '内城/东城/04司法/大兴县衙大堂': {
    name: '大兴县衙大堂',
    fullPath: '内城/东城/04司法',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/05npnqMn/da-xing-xian-ya-da-tang-ye.png',
      '昼': 'https://i.postimg.cc/ZKq6DD6Z/da-xing-xian-ya-da-tang-zhou.png'
    }
  },
  '内城/东城/04司法/东城兵马司': {
    name: '东城兵马司',
    fullPath: '内城/东城/04司法',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/yNRmygc3/dong-cheng-bing-ma-si-ye.png',
      '昼': 'https://i.postimg.cc/qRX2WP1S/dong-cheng-bing-ma-si-zhou.png'
    }
  },
  '内城/东城/05百业/抄报房': {
    name: '抄报房',
    fullPath: '内城/东城/05百业',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/DfpSmfbv/chao-bao-fang-ye.png',
      '昼': 'https://i.postimg.cc/RV3Ntrc3/chao-bao-fang-zhou.png'
    }
  },
  '内城/东城/05百业/成衣铺': {
    name: '成衣铺',
    fullPath: '内城/东城/05百业',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/Y0P0P8wh/cheng-yi-pu-ye.png',
      '昼': 'https://i.postimg.cc/G3g493sn/cheng-yi-pu-zhou.png'
    }
  },
  '内城/东城/05百业/灯铺': {
    name: '灯铺',
    fullPath: '内城/东城/05百业',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/L6Z8Xtp5/deng-pu-ye.png',
      '昼': 'https://i.postimg.cc/nhbcQXFm/deng-pu-zhou.png'
    }
  },
  '内城/东城/05百业/丰裕米行': {
    name: '丰裕米行',
    fullPath: '内城/东城/05百业',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/7hZJdfGf/feng-yu-mi-xing-ye.png',
      '昼': 'https://i.postimg.cc/zv2Hr8K0/feng-yu-mi-xing-zhou.png'
    }
  },
  '内城/东城/05百业/果子铺': {
    name: '果子铺',
    fullPath: '内城/东城/05百业',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/PqHx0P0Y/guo-zi-pu-ye.png',
      '昼': 'https://i.postimg.cc/1zKtSyZJ/guo-zi-pu-zhou.png'
    }
  },
  '内城/东城/05百业/花想容胭脂铺': {
    name: '花想容胭脂铺',
    fullPath: '内城/东城/05百业',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/PxxtkZy1/hua-xiang-rong-yan-zhi-pu-ye.png',
      '昼': 'https://i.postimg.cc/0QB95QX7/hua-xiang-rong-yan-zhi-pu-zhou.png'
    }
  },
  '内城/东城/05百业/集雅斋古玩铺': {
    name: '集雅斋古玩铺',
    fullPath: '内城/东城/05百业',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/7Y7Jc8bn/ji-ya-zhai-gu-wan-pu-ye.png',
      '昼': 'https://i.postimg.cc/xTHN7Dqh/ji-ya-zhai-gu-wan-pu-zhou.png'
    }
  },
  '内城/东城/05百业/济生堂后坊': {
    name: '济生堂后坊',
    fullPath: '内城/东城/05百业',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/VvJLXM03/ji-sheng-tang-hou-fang-ye.png',
      '昼': 'https://i.postimg.cc/Gt63K2kR/ji-sheng-tang-hou-fang-zhou.png'
    }
  },
  '内城/东城/05百业/济生堂药铺': {
    name: '济生堂药铺',
    fullPath: '内城/东城/05百业',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/Gt63K2kY/ji-sheng-tang-yao-pu-ye.png',
      '昼': 'https://i.postimg.cc/BZzv4hRr/ji-sheng-tang-yao-pu-zhou.png'
    }
  },
  '内城/东城/05百业/街角茶铺': {
    name: '街角茶铺',
    fullPath: '内城/东城/05百业',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/sxGsMrty/jie-jiao-cha-pu-ye.png',
      '昼': 'https://i.postimg.cc/9z3VTkhB/jie-jiao-cha-pu-zhou.png'
    }
  },
  '内城/东城/05百业/锦华裱画铺': {
    name: '锦华裱画铺',
    fullPath: '内城/东城/05百业',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/v8C63H8f/jin-hua-biao-hua-pu-ye.png',
      '昼': 'https://i.postimg.cc/tR8V2CRB/jin-hua-biao-hua-pu-zhou.png'
    }
  },
  '内城/东城/05百业/老酱园': {
    name: '老酱园',
    fullPath: '内城/东城/05百业',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/hGMSwMLD/lao-jiang-yuan-ye.png',
      '昼': 'https://i.postimg.cc/XJJV0FLV/lao-jiang-yuan-zhou.png'
    }
  },
  '内城/东城/05百业/南货铺': {
    name: '南货铺',
    fullPath: '内城/东城/05百业',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/59sCvqTg/nan-huo-pu-ye.png',
      '昼': 'https://i.postimg.cc/154NKVZ3/nan-huo-pu-zhou.png'
    }
  },
  '内城/东城/05百业/荣文堂书坊': {
    name: '荣文堂书坊',
    fullPath: '内城/东城/05百业',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/1tjyRt7d/rong-wen-tang-shu-fang-ye.png',
      '昼': 'https://i.postimg.cc/zvH8yr42/rong-wen-tang-shu-fang-zhou.png'
    }
  },
  '内城/东城/05百业/瑞云斋靴帽铺': {
    name: '瑞云斋靴帽铺',
    fullPath: '内城/东城/05百业',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/HkwW0TjD/rui-yun-zhai-xue-mao-pu-ye.png',
      '昼': 'https://i.postimg.cc/43XfBjhf/rui-yun-zhai-xue-mao-pu-zhou.png'
    }
  },
  '内城/东城/05百业/寿材铺': {
    name: '寿材铺',
    fullPath: '内城/东城/05百业',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/50n6Bb75/shou-cai-pu-ye.png',
      '昼': 'https://i.postimg.cc/x8Z8ZgVx/shou-cai-pu-zhou.png'
    }
  },
  '内城/东城/05百业/四时花铺': {
    name: '四时花铺',
    fullPath: '内城/东城/05百业',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/6pv2ks3V/si-shi-hua-pu-ye.png',
      '昼': 'https://i.postimg.cc/zfYb5db9/si-shi-hua-pu-zhou.png'
    }
  },
  '内城/东城/05百业/松烟斋笔墨铺': {
    name: '松烟斋笔墨铺',
    fullPath: '内城/东城/05百业',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/9FvztxpB/song-yan-zhai-bi-mo-pu-ye.png',
      '昼': 'https://i.postimg.cc/fRmyHxqR/song-yan-zhai-bi-mo-pu-zhou.png'
    }
  },
  '内城/东城/05百业/天成号绸缎庄': {
    name: '天成号绸缎庄',
    fullPath: '内城/东城/05百业',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/CKCZKjbP/tian-cheng-hao-chou-duan-zhuang-ye.png',
      '昼': 'https://i.postimg.cc/Jn1sHGqL/tian-cheng-hao-chou-duan-zhuang-zhou.png'
    }
  },
  '内城/东城/05百业/通济当铺': {
    name: '通济当铺',
    fullPath: '内城/东城/05百业',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/sfMhYZrN/tong-ji-dang-pu-ye.png',
      '昼': 'https://i.postimg.cc/RCWH7nmx/tong-ji-dang-pu-zhou.png'
    }
  },
  '内城/东城/05百业/鲜鱼行': {
    name: '鲜鱼行',
    fullPath: '内城/东城/05百业',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/6pX4xjGg/xian-yu-xing-ye.png',
      '昼': 'https://i.postimg.cc/8zSfgK6z/xian-yu-xing-zhou.png'
    }
  },
  '内城/东城/05百业/银楼': {
    name: '银楼',
    fullPath: '内城/东城/05百业',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/2j1ZQBYS/yin-lou-ye.png',
      '昼': 'https://i.postimg.cc/Pf082rfr/yin-lou-zhou.png'
    }
  },
  '内城/东城/05百业/油盐店': {
    name: '油盐店',
    fullPath: '内城/东城/05百业',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/ZRKqKXTQ/you-yan-dian-ye.png',
      '昼': 'https://i.postimg.cc/DZjwW50b/you-yan-dian-zhou.png'
    }
  },
  '内城/东城/05百业/纸马铺': {
    name: '纸马铺',
    fullPath: '内城/东城/05百业',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/BvJSMR1D/zhi-ma-pu-ye.png',
      '昼': 'https://i.postimg.cc/GpzcNzkS/zhi-ma-pu-zhou.png'
    }
  },
  '内城/东城/05百业/猪肉铺': {
    name: '猪肉铺',
    fullPath: '内城/东城/05百业',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/bwcN2Zy6/zhu-rou-pu-ye.png',
      '昼': 'https://i.postimg.cc/CxTLfRMp/zhu-rou-pu-zhou.png'
    }
  },
  '内城/中城/01署馆/东江米巷官署街': {
    name: '东江米巷官署街',
    fullPath: '内城/中城/01署馆',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/Nj2yThvp/dong-jiang-mi-xiang-guan-shu-jie-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/N015J1Mt/dong-jiang-mi-xiang-guan-shu-jie-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/PxyNhT1s/dong-jiang-mi-xiang-guan-shu-jie-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/3R1W7Y20/dong-jiang-mi-xiang-guan-shu-jie-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/xdKcxKC5/dong-jiang-mi-xiang-guan-shu-jie-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/j5tCGLw1/dong-jiang-mi-xiang-guan-shu-jie-yin-zhou.png'
    }
  },
  '内城/中城/01署馆/翰林院藏书楼': {
    name: '翰林院藏书楼',
    fullPath: '内城/中城/01署馆',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/RFgCyGzB/han-lin-yuan-cang-shu-lou-ye.png',
      '昼': 'https://i.postimg.cc/hj246Mqz/han-lin-yuan-cang-shu-lou-zhou.png'
    }
  },
  '内城/中城/01署馆/翰林院大堂': {
    name: '翰林院大堂',
    fullPath: '内城/中城/01署馆',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/HL4k4dZS/han-lin-yuan-da-tang-ye.png',
      '昼': 'https://i.postimg.cc/XJj7smmz/han-lin-yuan-da-tang-zhou.png'
    }
  },
  '内城/中城/01署馆/会同馆客堂': {
    name: '会同馆客堂',
    fullPath: '内城/中城/01署馆',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/x8d81hPF/hui-tong-guan-ke-tang-ye.png',
      '昼': 'https://i.postimg.cc/xjsq4j0G/hui-tong-guan-ke-tang-zhou.png'
    }
  },
  '内城/中城/01署馆/会同馆驿庭': {
    name: '会同馆驿庭',
    fullPath: '内城/中城/01署馆',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/Dy8mkV0v/hui-tong-guan-yi-ting-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/rF3sqhRr/hui-tong-guan-yi-ting-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/nLtLDCkx/hui-tong-guan-yi-ting-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/25FSFrcq/hui-tong-guan-yi-ting-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/6pZ3qdCC/hui-tong-guan-yi-ting-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/dVC138Gg/hui-tong-guan-yi-ting-yin-zhou.png'
    }
  },
  '内城/中城/02十王邸/晋王邸后园': {
    name: '晋王邸后园',
    fullPath: '内城/中城/02十王邸',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/Y0J7BsDH/jin-wang-di-hou-yuan-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/h4wcmXDs/jin-wang-di-hou-yuan-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/t4Gbr8V6/jin-wang-di-hou-yuan-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/x1VQsBbW/jin-wang-di-hou-yuan-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/Y2VMFv2B/jin-wang-di-hou-yuan-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/vHVMtGD4/jin-wang-di-hou-yuan-yin-zhou.png'
    }
  },
  '内城/中城/02十王邸/晋王邸花厅': {
    name: '晋王邸花厅',
    fullPath: '内城/中城/02十王邸',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/fbBhRLq7/jin-wang-di-hua-ting-ye.png',
      '昼': 'https://i.postimg.cc/pdqtLT1x/jin-wang-di-hua-ting-zhou.png'
    }
  },
  '内城/中城/02十王邸/晋王邸前庭': {
    name: '晋王邸前庭',
    fullPath: '内城/中城/02十王邸',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/VkXfmz8z/jin-wang-di-qian-ting-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/HL2T83nr/jin-wang-di-qian-ting-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/vB2M3BWT/jin-wang-di-qian-ting-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/tJ1bfj5r/jin-wang-di-qian-ting-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/LsTmgv5c/jin-wang-di-qian-ting-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/9MQCdTq2/jin-wang-di-qian-ting-yin-zhou.png'
    }
  },
  '内城/中城/02十王邸/晋王邸正堂': {
    name: '晋王邸正堂',
    fullPath: '内城/中城/02十王邸',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/Hk0gF3wk/jin-wang-di-zheng-tang-ye.png',
      '昼': 'https://i.postimg.cc/R0MBmfd3/jin-wang-di-zheng-tang-zhou.png'
    }
  },
  '内城/中城/02十王邸/十王邸街': {
    name: '十王邸街',
    fullPath: '内城/中城/02十王邸',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/cC61SYsv/shi-wang-di-jie-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/Zn0YS3Ts/shi-wang-di-jie-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/hPz4Z9Zc/shi-wang-di-jie-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/8PJkXhXr/shi-wang-di-jie-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/nr5FczzN/shi-wang-di-jie-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/KjVGvzj4/shi-wang-di-jie-yin-zhou.png'
    }
  },
  '内城/中城/03教坊/教坊司值房': {
    name: '教坊司值房',
    fullPath: '内城/中城/03教坊',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/gr9CT6rr/jiao-fang-si-zhi-fang-ye.png',
      '昼': 'https://i.postimg.cc/sfB1bd1t/jiao-fang-si-zhi-fang-zhou.png'
    }
  },
  '内城/中城/03教坊/教坊演乐厅': {
    name: '教坊演乐厅',
    fullPath: '内城/中城/03教坊',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/7PCbj8fH/jiao-fang-yan-le-ting-ye.png',
      '昼': 'https://i.postimg.cc/xjWq2xzk/jiao-fang-yan-le-ting-zhou.png'
    }
  },
  '内城/中城/03教坊/乐户后巷': {
    name: '乐户后巷',
    fullPath: '内城/中城/03教坊',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/zBvYbr98/le-hu-hou-xiang-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/qRqHhT9z/le-hu-hou-xiang-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/br2XgRYh/le-hu-hou-xiang-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/WtRBHJtP/le-hu-hou-xiang-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/sXLd5Lr1/le-hu-hou-xiang-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/D0bV6cvg/le-hu-hou-xiang-yin-zhou.png'
    }
  },
  '内城/中城/04玉河/上林苑监值房': {
    name: '上林苑监值房',
    fullPath: '内城/中城/04玉河',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/xTM8TvvL/shang-lin-yuan-jian-zhi-fang-ye.png',
      '昼': 'https://i.postimg.cc/15wX5G0x/shang-lin-yuan-jian-zhi-fang-zhou.png'
    }
  },
  '内城/中城/04玉河/台基厂': {
    name: '台基厂',
    fullPath: '内城/中城/04玉河',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/Njx0RQP0/tai-ji-chang-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/cLcJfd59/tai-ji-chang-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/Gp7hSqRm/tai-ji-chang-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/Zq7KDVmB/tai-ji-chang-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/BvQngRdh/tai-ji-chang-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/SKTNtDhw/tai-ji-chang-yin-zhou.png'
    }
  },
  '内城/中城/04玉河/银街': {
    name: '银街',
    fullPath: '内城/中城/04玉河',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/1zty6wqT/yin-jie-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/DzMnc0Qm/yin-jie-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/brXPK5F7/yin-jie-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/yxqKwGbD/yin-jie-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/k4R9YCwx/yin-jie-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/yd3BpKnw/yin-jie-yin-zhou.png'
    }
  },
  '内城/中城/04玉河/玉河柳岸': {
    name: '玉河柳岸',
    fullPath: '内城/中城/04玉河',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/0Qz2gD5F/yu-he-liu-an-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/XJtNnqp0/yu-he-liu-an-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/xjbTtvFZ/yu-he-liu-an-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/59FNnBRx/yu-he-liu-an-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/5yv4yJCt/yu-he-liu-an-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/MHR6HwQf/yu-he-liu-an-yin-zhou.png'
    }
  },
  '内城/中城/04玉河/玉河桥': {
    name: '玉河桥',
    fullPath: '内城/中城/04玉河',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/9F5XSD64/yu-he-qiao-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/28QjfzY7/yu-he-qiao-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/4xXffrN7/yu-he-qiao-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/dVnqL4LX/yu-he-qiao-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/GhF31crr/yu-he-qiao-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/Qdj88Rx8/yu-he-qiao-yin-zhou.png'
    }
  },
  '内城/中城/05泡子河/观象台台顶': {
    name: '观象台台顶',
    fullPath: '内城/中城/05泡子河',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/26hMBS2g/guan-xiang-tai-tai-ding-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/hvnw8RY4/guan-xiang-tai-tai-ding-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/fW71zk3d/guan-xiang-tai-tai-ding-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/RVMyN9fg/guan-xiang-tai-tai-ding-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/vTvK3SR7/guan-xiang-tai-tai-ding-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/3NZqnbMz/guan-xiang-tai-tai-ding-yin-zhou.png'
    }
  },
  '内城/中城/05泡子河/观象台台下院': {
    name: '观象台台下院',
    fullPath: '内城/中城/05泡子河',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/MK5kDXq6/guan-xiang-tai-tai-xia-yuan-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/Qdd2nsdg/guan-xiang-tai-tai-xia-yuan-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/8Cqx56Bh/guan-xiang-tai-tai-xia-yuan-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/Zq1XRdF2/guan-xiang-tai-tai-xia-yuan-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/CxrW3tR6/guan-xiang-tai-tai-xia-yuan-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/43Krs5tJ/guan-xiang-tai-tai-xia-yuan-yin-zhou.png'
    }
  },
  '内城/中城/05泡子河/观象台值庐': {
    name: '观象台值庐',
    fullPath: '内城/中城/05泡子河',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/wTg8LDKV/guan-xiang-tai-zhi-lu-ye.png',
      '昼': 'https://i.postimg.cc/3JY5m2MP/guan-xiang-tai-zhi-lu-zhou.png'
    }
  },
  '内城/中城/05泡子河/泡子河岸': {
    name: '泡子河岸',
    fullPath: '内城/中城/05泡子河',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/HnQmHtqV/pao-zi-he-an-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/HnQmHtqB/pao-zi-he-an-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/5NV1gZz3/pao-zi-he-an-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/7YkD9pzp/pao-zi-he-an-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/PfZTmtCp/pao-zi-he-an-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/15QPBLFN/pao-zi-he-an-yin-zhou.png'
    }
  },
  '内城/中城/05泡子河/玩家宅书房': {
    name: '玩家宅书房',
    fullPath: '内城/中城/05泡子河',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/Hs9mhB4d/wan-jia-zhai-shu-fang-ye.png',
      '昼': 'https://i.postimg.cc/wjxz8L0q/wan-jia-zhai-shu-fang-zhou.png'
    }
  },
  '内城/中城/05泡子河/玩家宅堂屋': {
    name: '玩家宅堂屋',
    fullPath: '内城/中城/05泡子河',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/pLVvbzqj/wan-jia-zhai-tang-wu-ye.png',
      '昼': 'https://i.postimg.cc/DwCT20Md/wan-jia-zhai-tang-wu-zhou.png'
    }
  },
  '内城/中城/05泡子河/玩家宅庭院': {
    name: '玩家宅庭院',
    fullPath: '内城/中城/05泡子河',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/N05wLYhY/wan-jia-zhai-ting-yuan-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/BvkfKys6/wan-jia-zhai-ting-yuan-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/J03fSzXB/wan-jia-zhai-ting-yuan-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/BZxfjMzK/wan-jia-zhai-ting-yuan-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/k4S3FcXH/wan-jia-zhai-ting-yuan-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/zv1mdgy8/wan-jia-zhai-ting-yuan-yin-zhou.png'
    }
  },
  '内城/北城/01钟鼓/德胜门': {
    name: '德胜门',
    fullPath: '内城/北城/01钟鼓',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/W4XL5Cs2/de-sheng-men-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/4dyCqP3z/de-sheng-men-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/bJ5XhnDY/de-sheng-men-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/L5gc6sL8/de-sheng-men-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/cHCq2hJb/de-sheng-men-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/j51VbfW1/de-sheng-men-yin-zhou.png'
    }
  },
  '内城/北城/01钟鼓/鼓楼': {
    name: '鼓楼',
    fullPath: '内城/北城/01钟鼓',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/zXKfxz63/gu-lou-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/FHvH8tXG/gu-lou-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/VNGsJd08/gu-lou-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/Kz1GBxtm/gu-lou-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/dV9VKWqw/gu-lou-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/yNQ6Dkgf/gu-lou-yin-zhou.png'
    }
  },
  '内城/北城/01钟鼓/鼓楼前大街': {
    name: '鼓楼前大街',
    fullPath: '内城/北城/01钟鼓',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/26gzxMxd/gu-lou-qian-da-jie-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/pr8PcC0c/gu-lou-qian-da-jie-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/RCnC0CMk/gu-lou-qian-da-jie-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/ncbF98z6/gu-lou-qian-da-jie-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/yx97pjQH/gu-lou-qian-da-jie-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/dQTQ0QqB/gu-lou-qian-da-jie-yin-zhou.png'
    }
  },
  '内城/北城/01钟鼓/钟楼': {
    name: '钟楼',
    fullPath: '内城/北城/01钟鼓',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/kGR0X5Kc/zhong-lou-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/7bvpCynp/zhong-lou-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/QNRtg960/zhong-lou-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/v8pB7gqQ/zhong-lou-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/7PChTMNJ/zhong-lou-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/gcwj6qKK/zhong-lou-yin-zhou.png'
    }
  },
  '内城/北城/02什刹海/地安门': {
    name: '地安门',
    fullPath: '内城/北城/02什刹海',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/FzjQVRzN/de-an-men-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/ryWckhJG/de-an-men-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/GhxCBH64/de-an-men-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/4NQgKmjM/de-an-men-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/h4xgBCsW/de-an-men-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/GhCRhkgm/de-an-men-yin-zhou.png'
    }
  },
  '内城/北城/02什刹海/湖畔斜街': {
    name: '湖畔斜街',
    fullPath: '内城/北城/02什刹海',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/1X1kXQBZ/hu-pan-xie-jie-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/br0K2BVJ/hu-pan-xie-jie-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/yYPM12SR/hu-pan-xie-jie-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/XYYTpxf7/hu-pan-xie-jie-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/FFjtqYrq/hu-pan-xie-jie-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/y6Fq5D6Y/hu-pan-xie-jie-yin-zhou.png'
    }
  },
  '内城/北城/02什刹海/湖上画舫': {
    name: '湖上画舫',
    fullPath: '内城/北城/02什刹海',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/Z5Yh6JST/hu-shang-hua-fang-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/Qd6Zbv81/hu-shang-hua-fang-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/50zcf0wx/hu-shang-hua-fang-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/DZGV7Zq5/hu-shang-hua-fang-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/7Lf8QXht/hu-shang-hua-fang-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/Pq9sGZ8s/hu-shang-hua-fang-yin-zhou.png'
    }
  },
  '内城/北城/02什刹海/积水潭西海': {
    name: '积水潭西海',
    fullPath: '内城/北城/02什刹海',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/90BnfqzX/ji-shui-tan-xi-hai-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/qBcYwWwW/ji-shui-tan-xi-hai-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/15Jdh6k1/ji-shui-tan-xi-hai-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/jS1kCTqv/ji-shui-tan-xi-hai-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/Kc7VfCQM/ji-shui-tan-xi-hai-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/CLF2QJ6v/ji-shui-tan-xi-hai-yin-zhou.png'
    }
  },
  '内城/北城/02什刹海/什刹前海': {
    name: '什刹前海',
    fullPath: '内城/北城/02什刹海',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/cJH0G09v/shen-sha-qian-hai-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/CK1SpSPt/shen-sha-qian-hai-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/G2TR9z1s/shen-sha-qian-hai-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/5ycVzvx3/shen-sha-qian-hai-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/SKvqy3Hp/shen-sha-qian-hai-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/JnH8tKWM/shen-sha-qian-hai-yin-zhou.png'
    }
  },
  '内城/北城/02什刹海/万宁桥': {
    name: '万宁桥',
    fullPath: '内城/北城/02什刹海',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/qMVJ6fq4/wan-ning-qiao-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/TYVRrk5R/wan-ning-qiao-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/8zTTwhLX/wan-ning-qiao-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/wjFgr7VM/wan-ning-qiao-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/X7fVw2Bw/wan-ning-qiao-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/kXQnxjRT/wan-ning-qiao-yin-zhou.png'
    }
  },
  '内城/北城/02什刹海/烟波楼大堂': {
    name: '烟波楼大堂',
    fullPath: '内城/北城/02什刹海',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/q7tSGRDX/yan-bo-lou-da-tang-ye.png',
      '昼': 'https://i.postimg.cc/QMRPY3Rt/yan-bo-lou-da-tang-zhou.png'
    }
  },
  '内城/北城/02什刹海/烟波楼湖景雅座': {
    name: '烟波楼湖景雅座',
    fullPath: '内城/北城/02什刹海',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/ydcGwGHT/yan-bo-lou-hu-jing-ya-zuo-ye.png',
      '昼': 'https://i.postimg.cc/vTyKMvYK/yan-bo-lou-hu-jing-ya-zuo-zhou.png'
    }
  },
  '内城/北城/02什刹海/银锭桥': {
    name: '银锭桥',
    fullPath: '内城/北城/02什刹海',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/d0TNyfLP/yin-ding-qiao-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/TwM7qcDL/yin-ding-qiao-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/PJKSHsFf/yin-ding-qiao-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/kGwTC3hx/yin-ding-qiao-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/50BPPFBz/yin-ding-qiao-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/MT7ssj7N/yin-ding-qiao-yin-zhou.png'
    }
  },
  '内城/北城/03水岸/汇通祠': {
    name: '汇通祠',
    fullPath: '内城/北城/03水岸',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/Pxjy8rg6/hui-tong-ci-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/63f0VxKj/hui-tong-ci-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/zvdFMwVP/hui-tong-ci-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/xTCRmZ4H/hui-tong-ci-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/1trH01PR/hui-tong-ci-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/90XBJgF9/hui-tong-ci-yin-zhou.png'
    }
  },
  '内城/北城/03水岸/火神庙大殿': {
    name: '火神庙大殿',
    fullPath: '内城/北城/03水岸',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/bNJTn5Bm/huo-shen-miao-da-dian-ye.png',
      '昼': 'https://i.postimg.cc/J4nqXFFm/huo-shen-miao-da-dian-zhou.png'
    }
  },
  '内城/北城/03水岸/火神庙山门': {
    name: '火神庙山门',
    fullPath: '内城/北城/03水岸',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/SNvGfr0x/huo-shen-miao-shan-men-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/bwS9Ct8m/huo-shen-miao-shan-men-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/KYnrFh1v/huo-shen-miao-shan-men-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/76w1Ztz2/huo-shen-miao-shan-men-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/mrxN0g2V/huo-shen-miao-shan-men-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/tg0tL44Q/huo-shen-miao-shan-men-yin-zhou.png'
    }
  },
  '内城/北城/03水岸/净业寺': {
    name: '净业寺',
    fullPath: '内城/北城/03水岸',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/v8vqffHg/jing-ye-si-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/CLPc60qQ/jing-ye-si-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/3xznYZ9f/jing-ye-si-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/rpWgmtPF/jing-ye-si-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/tCSBmb6J/jing-ye-si-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/3xknsqjG/jing-ye-si-yin-zhou.png'
    }
  },
  '内城/北城/03水岸/西水关': {
    name: '西水关',
    fullPath: '内城/北城/03水岸',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/nzpKhSmd/xi-shui-guan-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/zB7CbwSm/xi-shui-guan-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/wMbDF6G4/xi-shui-guan-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/fWH7MKRb/xi-shui-guan-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/brvQQG3z/xi-shui-guan-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/8cChhFtH/xi-shui-guan-yin-zhou.png'
    }
  },
  '内城/北城/04文教/成贤街': {
    name: '成贤街',
    fullPath: '内城/北城/04文教',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/Vv5CJxkq/cheng-xian-jie-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/7hcT0KCr/cheng-xian-jie-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/Gh8Ddnff/cheng-xian-jie-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/hPzmcRwG/cheng-xian-jie-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/pV1jwLsj/cheng-xian-jie-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/RCbtkZgP/cheng-xian-jie-yin-zhou.png'
    }
  },
  '内城/北城/04文教/国子监号舍': {
    name: '国子监号舍',
    fullPath: '内城/北城/04文教',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/dQWRJBVW/guo-zi-jian-hao-she-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/hPfLvdX2/guo-zi-jian-hao-she-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/JzXjcCcD/guo-zi-jian-hao-she-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/LsMLxQNC/guo-zi-jian-hao-she-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/KvRPjMKx/guo-zi-jian-hao-she-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/Fs8jLHcQ/guo-zi-jian-hao-she-yin-zhou.png'
    }
  },
  '内城/北城/04文教/国子监绳愆厅': {
    name: '国子监绳愆厅',
    fullPath: '内城/北城/04文教',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/gJzRWX9R/guo-zi-jian-sheng-qian-ting-ye.png',
      '昼': 'https://i.postimg.cc/V6fM8ryZ/guo-zi-jian-sheng-qian-ting-zhou.png'
    }
  },
  '内城/北城/04文教/国子监彝伦堂': {
    name: '国子监彝伦堂',
    fullPath: '内城/北城/04文教',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/zf1Kx2xJ/guo-zi-jian-yi-lun-tang-ye.png',
      '昼': 'https://i.postimg.cc/HL45R0N8/guo-zi-jian-yi-lun-tang-zhou.png'
    }
  },
  '内城/北城/04文教/孔庙大成殿': {
    name: '孔庙大成殿',
    fullPath: '内城/北城/04文教',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/Twdm6LM6/kong-miao-da-cheng-dian-ye.png',
      '昼': 'https://i.postimg.cc/xC6mTfnz/kong-miao-da-cheng-dian-zhou.png'
    }
  },
  '内城/北城/04文教/顺天府学': {
    name: '顺天府学',
    fullPath: '内城/北城/04文教',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/pXwFd1bh/shun-tian-fu-xue-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/SxczY7k7/shun-tian-fu-xue-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/0NfMck6m/shun-tian-fu-xue-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/Tw3yszmC/shun-tian-fu-xue-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/528FQqfd/shun-tian-fu-xue-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/pdx5fhdy/shun-tian-fu-xue-yin-zhou.png'
    }
  },
  '内城/北城/05府衙/顺天府大堂': {
    name: '顺天府大堂',
    fullPath: '内城/北城/05府衙',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/bJwG57kP/shun-tian-fu-da-tang-ye.png',
      '昼': 'https://i.postimg.cc/63b7xMfR/shun-tian-fu-da-tang-zhou.png'
    }
  },
  '内城/北城/06冰窖/官冰窖': {
    name: '官冰窖',
    fullPath: '内城/北城/06冰窖',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/gjwxz3gv/guan-bing-jiao-ye.png',
      '昼': 'https://i.postimg.cc/PJBPPN76/guan-bing-jiao-zhou.png'
    }
  },
  '内城/北城/07肃王府/肃王府承运殿': {
    name: '肃王府承运殿',
    fullPath: '内城/北城/07肃王府',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/hjQJg9yp/su-wang-fu-cheng-yun-dian-ye.png',
      '昼': 'https://i.postimg.cc/MHknGvNN/su-wang-fu-cheng-yun-dian-zhou.png'
    }
  },
  '内城/北城/07肃王府/肃王府存心殿': {
    name: '肃王府存心殿',
    fullPath: '内城/北城/07肃王府',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/cJ9Yd1sn/su-wang-fu-cun-xin-dian-ye.png',
      '昼': 'https://i.postimg.cc/C19qfvnF/su-wang-fu-cun-xin-dian-zhou.png'
    }
  },
  '内城/北城/07肃王府/肃王府大门前庭': {
    name: '肃王府大门前庭',
    fullPath: '内城/北城/07肃王府',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/NGVyNP0n/su-wang-fu-da-men-qian-ting-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/htRXnzTb/su-wang-fu-da-men-qian-ting-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/ZY189q6m/su-wang-fu-da-men-qian-ting-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/zGNTjPtv/su-wang-fu-da-men-qian-ting-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/zf0vTxMd/su-wang-fu-da-men-qian-ting-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/Znyqt4Rt/su-wang-fu-da-men-qian-ting-yin-zhou.png'
    }
  },
  '内城/北城/07肃王府/肃王府寝院': {
    name: '肃王府寝院',
    fullPath: '内城/北城/07肃王府',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/kMt8ddL2/su-wang-fu-qin-yuan-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/8PR6jm1q/su-wang-fu-qin-yuan-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/HLxcvGQW/su-wang-fu-qin-yuan-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/XJBZ3wHr/su-wang-fu-qin-yuan-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/K8Q35c3D/su-wang-fu-qin-yuan-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/nLzjS8qw/su-wang-fu-qin-yuan-yin-zhou.png'
    }
  },
  '内城/北城/07肃王府/肃王府演武园': {
    name: '肃王府演武园',
    fullPath: '内城/北城/07肃王府',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/XqMrvptp/su-wang-fu-yan-wu-yuan-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/gcRwTH6m/su-wang-fu-yan-wu-yuan-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/5tT0PX4q/su-wang-fu-yan-wu-yuan-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/vTdmsC6Y/su-wang-fu-yan-wu-yuan-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/kXv2nMsC/su-wang-fu-yan-wu-yuan-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/dVWDyWg4/su-wang-fu-yan-wu-yuan-yin-zhou.png'
    }
  },
  '内城/北城/08舅父宅/舅父宅大门前庭': {
    name: '舅父宅大门前庭',
    fullPath: '内城/北城/08舅父宅',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/XJ6WGdNd/jiu-fu-zhai-da-men-qian-ting-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/hj8B9vh6/jiu-fu-zhai-da-men-qian-ting-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/3JfHjPJd/jiu-fu-zhai-da-men-qian-ting-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/7Zp8d0zv/jiu-fu-zhai-da-men-qian-ting-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/J01WK8kH/jiu-fu-zhai-da-men-qian-ting-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/9Xp20D6G/jiu-fu-zhai-da-men-qian-ting-yin-zhou.png'
    }
  },
  '内城/北城/08舅父宅/舅父宅后院': {
    name: '舅父宅后院',
    fullPath: '内城/北城/08舅父宅',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/CKBMfwGg/jiu-fu-zhai-hou-yuan-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/4dpJBwFg/jiu-fu-zhai-hou-yuan-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/13TsSbL2/jiu-fu-zhai-hou-yuan-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/R0H9ZXmq/jiu-fu-zhai-hou-yuan-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/hvrKqvBH/jiu-fu-zhai-hou-yuan-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/7YKqs5Xv/jiu-fu-zhai-hou-yuan-yin-zhou.png'
    }
  },
  '内城/北城/08舅父宅/舅父宅书房': {
    name: '舅父宅书房',
    fullPath: '内城/北城/08舅父宅',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/66d306Dq/jiu-fu-zhai-shu-fang-ye.png',
      '昼': 'https://i.postimg.cc/Nj0jB6Lf/jiu-fu-zhai-shu-fang-zhou.png'
    }
  },
  '内城/北城/08舅父宅/舅父宅正堂': {
    name: '舅父宅正堂',
    fullPath: '内城/北城/08舅父宅',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/cHWq4WTm/jiu-fu-zhai-zheng-tang-ye.png',
      '昼': 'https://i.postimg.cc/Gt3ZGjWt/jiu-fu-zhai-zheng-tang-zhou.png'
    }
  },
  '内城/北城/09兵部府/兵部府花厅': {
    name: '兵部府花厅',
    fullPath: '内城/北城/09兵部府',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/5t3gLMbw/bing-bu-fu-hua-ting-ye.png',
      '昼': 'https://i.postimg.cc/nzhk1wLJ/bing-bu-fu-hua-ting-zhou.png'
    }
  },
  '内城/北城/09兵部府/兵部府演武院': {
    name: '兵部府演武院',
    fullPath: '内城/北城/09兵部府',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/5yjsfkcp/bing-bu-fu-yan-wu-yuan-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/BZwhmsDM/bing-bu-fu-yan-wu-yuan-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/t4F2Rxcf/bing-bu-fu-yan-wu-yuan-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/JhmKshVt/bing-bu-fu-yan-wu-yuan-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/wTywPPQ3/bing-bu-fu-yan-wu-yuan-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/WbB5Pn5S/bing-bu-fu-yan-wu-yuan-yin-zhou.png'
    }
  },
  '内城/北城/09兵部府/兵部府正堂': {
    name: '兵部府正堂',
    fullPath: '内城/北城/09兵部府',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/pdtcKZ8f/bing-bu-fu-zheng-tang-ye.png',
      '昼': 'https://i.postimg.cc/KzG9H808/bing-bu-fu-zheng-tang-zhou.png'
    }
  },
  '内城/北城/09兵部府/兵部尚书府大门': {
    name: '兵部尚书府大门',
    fullPath: '内城/北城/09兵部府',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/2yHgwZmr/bing-bu-shang-shu-fu-da-men-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/tg0w2y09/bing-bu-shang-shu-fu-da-men-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/9Xxksy3v/bing-bu-shang-shu-fu-da-men-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/rw4YdbDn/bing-bu-shang-shu-fu-da-men-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/3RY6QBJf/bing-bu-shang-shu-fu-da-men-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/VvNVdkt0/bing-bu-shang-shu-fu-da-men-yin-zhou.png'
    }
  },
  '内城/北城/09兵部府/小将军绣楼': {
    name: '小将军绣楼',
    fullPath: '内城/北城/09兵部府',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/G2gjgJB7/xiao-jiang-jun-xiu-lou-ye.png',
      '昼': 'https://i.postimg.cc/hvH1cD1B/xiao-jiang-jun-xiu-lou-zhou.png'
    }
  },
  '内城/北城/10门厂/安定门': {
    name: '安定门',
    fullPath: '内城/北城/10门厂',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/xj7RK5V9/an-ding-men-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/cLGBzJJX/an-ding-men-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/gJ7vHz5K/an-ding-men-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/0jJ7Wg1b/an-ding-men-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/525SWMYC/an-ding-men-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/W4Xmt67T/an-ding-men-yin-zhou.png'
    }
  },
  '内城/北城/10门厂/铸钟厂': {
    name: '铸钟厂',
    fullPath: '内城/北城/10门厂',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/G3BNwHc2/zhu-zhong-chang-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/rFxPs30H/zhu-zhong-chang-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/765BkWrB/zhu-zhong-chang-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/GtYqBT2Q/zhu-zhong-chang-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/NjxC7Xx2/zhu-zhong-chang-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/YSqnXSnK/zhu-zhong-chang-yin-zhou.png'
    }
  },
  '内城/南城/01门关/崇文门城楼': {
    name: '崇文门城楼',
    fullPath: '内城/南城/01门关',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/KcdhzCQS/chong-wen-men-cheng-lou-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/8kqg5xwc/chong-wen-men-cheng-lou-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/4xGCvtrL/chong-wen-men-cheng-lou-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/fRs47XGn/chong-wen-men-cheng-lou-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/J4ZVBKd4/chong-wen-men-cheng-lou-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/52Jc5vZS/chong-wen-men-cheng-lou-yin-zhou.png'
    }
  },
  '内城/南城/01门关/崇文门税关衙署': {
    name: '崇文门税关衙署',
    fullPath: '内城/南城/01门关',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/YC7cNg5M/chong-wen-men-shui-guan-ya-shu-ye.png',
      '昼': 'https://i.postimg.cc/zGFsxvN1/chong-wen-men-shui-guan-ya-shu-zhou.png'
    }
  },
  '内城/南城/01门关/崇文门验货场': {
    name: '崇文门验货场',
    fullPath: '内城/南城/01门关',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/jjqGmTqW/chong-wen-men-yan-huo-chang-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/GpMZ1f96/chong-wen-men-yan-huo-chang-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/XJptNgC0/chong-wen-men-yan-huo-chang-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/RFN2CTH0/chong-wen-men-yan-huo-chang-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/0NtLq4bs/chong-wen-men-yan-huo-chang-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/GpMZ1fHm/chong-wen-men-yan-huo-chang-yin-zhou.png'
    }
  },
  '内城/南城/01门关/正阳门城楼': {
    name: '正阳门城楼',
    fullPath: '内城/南城/01门关',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/1t228NGp/zheng-yang-men-cheng-lou-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/0QFFzJGg/zheng-yang-men-cheng-lou-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/65sFwn5p/zheng-yang-men-cheng-lou-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/7YgdLhfX/zheng-yang-men-cheng-lou-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/Kc3CdJbn/zheng-yang-men-cheng-lou-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/05KhLcxx/zheng-yang-men-cheng-lou-yin-zhou.png'
    }
  },
  '内城/南城/01门关/正阳门瓮城市': {
    name: '正阳门瓮城市',
    fullPath: '内城/南城/01门关',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/y8s53KZG/zheng-yang-men-weng-cheng-shi-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/t4pfnb6X/zheng-yang-men-weng-cheng-shi-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/LssbvVvf/zheng-yang-men-weng-cheng-shi-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/YSSs8x8b/zheng-yang-men-weng-cheng-shi-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/L827gSPs/zheng-yang-men-weng-cheng-shi-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/Cx72j2Cb/zheng-yang-men-weng-cheng-shi-yin-zhou.png'
    }
  },
  '内城/南城/02商栈/宝源局铸炉房': {
    name: '宝源局铸炉房',
    fullPath: '内城/南城/02商栈',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/d3GHDNtq/bao-yuan-ju-zhu-lu-fang-ye.png',
      '昼': 'https://i.postimg.cc/RCtbPh1X/bao-yuan-ju-zhu-lu-fang-zhou.png'
    }
  },
  '内城/南城/02商栈/官店客栈大院': {
    name: '官店客栈大院',
    fullPath: '内城/南城/02商栈',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/5ttRpmpk/guan-dian-ke-zhan-da-yuan-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/LssbvVNd/guan-dian-ke-zhan-da-yuan-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/V6rHPLxS/guan-dian-ke-zhan-da-yuan-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/B6LwfQrh/guan-dian-ke-zhan-da-yuan-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/pd11Sn16/guan-dian-ke-zhan-da-yuan-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/N0PPnrz0/guan-dian-ke-zhan-da-yuan-yin-zhou.png'
    }
  },
  '内城/南城/02商栈/官店客栈客房': {
    name: '官店客栈客房',
    fullPath: '内城/南城/02商栈',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/XJR1j6W8/guan-dian-ke-zhan-ke-fang-ye.png',
      '昼': 'https://i.postimg.cc/63kbWxKb/guan-dian-ke-zhan-ke-fang-zhou.png'
    }
  },
  '内城/南城/02商栈/货栈仓库': {
    name: '货栈仓库',
    fullPath: '内城/南城/02商栈',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/SN71hPvw/huo-zhan-cang-ku-ye.png',
      '昼': 'https://i.postimg.cc/P5X3rMgF/huo-zhan-cang-ku-zhou.png'
    }
  },
  '内城/南城/02商栈/棋盘街': {
    name: '棋盘街',
    fullPath: '内城/南城/02商栈',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/VstH7vBY/qi-pan-jie-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/CLVr90mh/qi-pan-jie-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/pXYcHS6Y/qi-pan-jie-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/9Ftghknk/qi-pan-jie-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/VLcZ2wDb/qi-pan-jie-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/Gh1g6RqP/qi-pan-jie-yin-zhou.png'
    }
  },
  '内城/南城/03百业/民间澡堂': {
    name: '民间澡堂',
    fullPath: '内城/南城/03百业',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/MG4d5JnB/min-jian-zao-tang-ye.png',
      '昼': 'https://i.postimg.cc/26ZTX9WV/min-jian-zao-tang-zhou.png'
    }
  },
  '内城/南城/03百业/民染坊': {
    name: '民染坊',
    fullPath: '内城/南城/03百业',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/5tGngWXV/min-ran-fang-ye.png',
      '昼': 'https://i.postimg.cc/SK5DdbnK/min-ran-fang-zhou.png'
    }
  },
  '内城/南城/03百业/木器铺': {
    name: '木器铺',
    fullPath: '内城/南城/03百业',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/TPhtn3Y9/mu-qi-pu-ye.png',
      '昼': 'https://i.postimg.cc/FK1T0HHm/mu-qi-pu-zhou.png'
    }
  },
  '内城/南城/03百业/皮货铺': {
    name: '皮货铺',
    fullPath: '内城/南城/03百业',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/0QwZHXS4/pi-huo-pu-ye.png',
      '昼': 'https://i.postimg.cc/PJnKGbzT/pi-huo-pu-zhou.png'
    }
  },
  '内城/南城/03百业/烧锅酒坊': {
    name: '烧锅酒坊',
    fullPath: '内城/南城/03百业',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/hjdM3Zmd/shao-guo-jiu-fang-ye.png',
      '昼': 'https://i.postimg.cc/LX1v0QPj/shao-guo-jiu-fang-zhou.png'
    }
  },
  '内城/南城/03百业/石磨坊': {
    name: '石磨坊',
    fullPath: '内城/南城/03百业',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/x8G59ktX/shi-mo-fang-ye.png',
      '昼': 'https://i.postimg.cc/T1j0TyCW/shi-mo-fang-zhou.png'
    }
  },
  '内城/南城/03百业/寿衣铺': {
    name: '寿衣铺',
    fullPath: '内城/南城/03百业',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/qv1mt30n/shou-yi-pu-ye.png',
      '昼': 'https://i.postimg.cc/3xtLyv7B/shou-yi-pu-zhou.png'
    }
  },
  '内城/南城/03百业/铁匠铺': {
    name: '铁匠铺',
    fullPath: '内城/南城/03百业',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/tCyD254q/tie-jiang-pu-ye.png',
      '昼': 'https://i.postimg.cc/Pr4ycwCc/tie-jiang-pu-zhou.png'
    }
  },
  '内城/南城/03百业/铜锡铺': {
    name: '铜锡铺',
    fullPath: '内城/南城/03百业',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/YCCRwCgS/tong-xi-pu-ye.png',
      '昼': 'https://i.postimg.cc/g2tDcbqj/tong-xi-pu-zhou.png'
    }
  },
  '内城/南城/03百业/万通牙行': {
    name: '万通牙行',
    fullPath: '内城/南城/03百业',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/6pWj50sT/wan-tong-ya-xing-ye.png',
      '昼': 'https://i.postimg.cc/L89C6Tdg/wan-tong-ya-xing-zhou.png'
    }
  },
  '内城/南城/03百业/盐栈': {
    name: '盐栈',
    fullPath: '内城/南城/03百业',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/PJbydL2k/yan-zhan-ye.png',
      '昼': 'https://i.postimg.cc/Y0NRt4bp/yan-zhan-zhou.png'
    }
  },
  '内城/南城/03百业/裕丰钱铺': {
    name: '裕丰钱铺',
    fullPath: '内城/南城/03百业',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/PJbydL2z/yu-feng-qian-pu-ye.png',
      '昼': 'https://i.postimg.cc/057cY3P2/yu-feng-qian-pu-zhou.png'
    }
  },
  '内城/西城/01城隍庙/城隍庙庙市': {
    name: '城隍庙庙市',
    fullPath: '内城/西城/01城隍庙',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/htDx7ZtF/cheng-huang-miao-miao-shi-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/Mp9B00nw/cheng-huang-miao-miao-shi-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/wB3mwtNX/cheng-huang-miao-miao-shi-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/W4tk5DZ5/cheng-huang-miao-miao-shi-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/0yVSGGzy/cheng-huang-miao-miao-shi-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/JzpX33sD/cheng-huang-miao-miao-shi-yin-zhou.png'
    }
  },
  '内城/西城/01城隍庙/城隍庙配殿': {
    name: '城隍庙配殿',
    fullPath: '内城/西城/01城隍庙',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/6QSGg9Vc/cheng-huang-miao-pei-dian-ye.png',
      '昼': 'https://i.postimg.cc/zfMR6Jws/cheng-huang-miao-pei-dian-zhou.png'
    }
  },
  '内城/西城/01城隍庙/都城隍庙大殿': {
    name: '都城隍庙大殿',
    fullPath: '内城/西城/01城隍庙',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/j2YnqZF9/dou-cheng-huang-miao-da-dian-ye.png',
      '昼': 'https://i.postimg.cc/C5CBRk3W/dou-cheng-huang-miao-da-dian-zhou.png'
    }
  },
  '内城/西城/01城隍庙/庙市书肆': {
    name: '庙市书肆',
    fullPath: '内城/西城/01城隍庙',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/vmj6kQLQ/miao-shi-shu-si-ye.png',
      '昼': 'https://i.postimg.cc/DZXbKt59/miao-shi-shu-si-zhou.png'
    }
  },
  '内城/西城/01城隍庙/庙祝值房': {
    name: '庙祝值房',
    fullPath: '内城/西城/01城隍庙',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/Hxy7CfBH/miao-zhu-zhi-fang-ye.png',
      '昼': 'https://i.postimg.cc/PJnvf2RL/miao-zhu-zhi-fang-zhou.png'
    }
  },
  '内城/西城/02双寺/白塔寺大殿': {
    name: '白塔寺大殿',
    fullPath: '内城/西城/02双寺',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/Qdd9MB0S/bai-ta-si-da-dian-ye.png',
      '昼': 'https://i.postimg.cc/vZZgm13p/bai-ta-si-da-dian-zhou.png'
    }
  },
  '内城/西城/02双寺/白塔寺山门': {
    name: '白塔寺山门',
    fullPath: '内城/西城/02双寺',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/NjCy2gnv/bai-ta-si-shan-men-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/52KHQxrj/bai-ta-si-shan-men-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/cJKvQpqD/bai-ta-si-shan-men-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/KYK1n6X6/bai-ta-si-shan-men-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/XY1ZBVPc/bai-ta-si-shan-men-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/8CF7h28h/bai-ta-si-shan-men-yin-zhou.png'
    }
  },
  '内城/西城/02双寺/护国寺大殿': {
    name: '护国寺大殿',
    fullPath: '内城/西城/02双寺',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/Vv9rJXyY/hu-guo-si-da-dian-ye.png',
      '昼': 'https://i.postimg.cc/VsXbZPJg/hu-guo-si-da-dian-zhou.png'
    }
  },
  '内城/西城/02双寺/护国寺庙市': {
    name: '护国寺庙市',
    fullPath: '内城/西城/02双寺',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/Kctgph1V/hu-guo-si-miao-shi-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/tRFVvG1H/hu-guo-si-miao-shi-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/GhQTrPJm/hu-guo-si-miao-shi-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/6504wVLc/hu-guo-si-miao-shi-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/CLYnWrDY/hu-guo-si-miao-shi-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/VL103ZMd/hu-guo-si-miao-shi-yin-zhou.png'
    }
  },
  '内城/西城/03西四/火药局厂区': {
    name: '火药局厂区',
    fullPath: '内城/西城/03西四',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/rpvKgfMX/huo-yao-ju-chang-qu-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/rmxzH5wF/huo-yao-ju-chang-qu-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/5yJjWjX3/huo-yao-ju-chang-qu-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/yxKWCWDr/huo-yao-ju-chang-qu-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/pTzySKLn/huo-yao-ju-chang-qu-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/qRygF2vw/huo-yao-ju-chang-qu-yin-zhou.png'
    }
  },
  '内城/西城/03西四/火药局碾药房': {
    name: '火药局碾药房',
    fullPath: '内城/西城/03西四',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/T1xhvhyX/huo-yao-ju-nian-yao-fang-ye.png',
      '昼': 'https://i.postimg.cc/nr1rFZ7f/huo-yao-ju-nian-yao-fang-zhou.png'
    }
  },
  '内城/西城/03西四/西市法场': {
    name: '西市法场',
    fullPath: '内城/西城/03西四',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/RZhhBk0z/xi-shi-fa-chang-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/K8Wzv0KZ/xi-shi-fa-chang-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/MGjGc1Vk/xi-shi-fa-chang-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/0QRy7r0q/xi-shi-fa-chang-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/8zY5PZFB/xi-shi-fa-chang-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/DzbzW1sc/xi-shi-fa-chang-yin-zhou.png'
    }
  },
  '内城/西城/03西四/西四牌楼街': {
    name: '西四牌楼街',
    fullPath: '内城/西城/03西四',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/QCqC8s5h/xi-si-pai-lou-jie-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/cCcCxZYK/xi-si-pai-lou-jie-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/c17rM7jx/xi-si-pai-lou-jie-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/Fs91Pd54/xi-si-pai-lou-jie-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/PfbPzb73/xi-si-pai-lou-jie-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/G3PHJPfZ/xi-si-pai-lou-jie-yin-zhou.png'
    }
  },
  '内城/西城/03西四/西域香货铺': {
    name: '西域香货铺',
    fullPath: '内城/西城/03西四',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/MKWXsM2b/xi-yu-xiang-huo-pu-ye.png',
      '昼': 'https://i.postimg.cc/qMjqWJ4Y/xi-yu-xiang-huo-pu-zhou.png'
    }
  },
  '内城/西城/03西四/象房': {
    name: '象房',
    fullPath: '内城/西城/03西四',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/tT3CkyB4/xiang-fang-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/ZR8KHZwj/xiang-fang-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/brLYXgc0/xiang-fang-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/FFxHJrdN/xiang-fang-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/x89jF7Z4/xiang-fang-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/d3nQM6Pq/xiang-fang-yin-zhou.png'
    }
  },
  '内城/西城/04勋贵/庆王府承运殿': {
    name: '庆王府承运殿',
    fullPath: '内城/西城/04勋贵',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/sDqdMqcM/qing-wang-fu-cheng-yun-dian-ye.png',
      '昼': 'https://i.postimg.cc/02FRzFfK/qing-wang-fu-cheng-yun-dian-zhou.png'
    }
  },
  '内城/西城/04勋贵/庆王府存心殿': {
    name: '庆王府存心殿',
    fullPath: '内城/西城/04勋贵',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/BZhG0XPs/qing-wang-fu-cun-xin-dian-ye.png',
      '昼': 'https://i.postimg.cc/66HNXy4Q/qing-wang-fu-cun-xin-dian-zhou.png'
    }
  },
  '内城/西城/04勋贵/庆王府大门前庭': {
    name: '庆王府大门前庭',
    fullPath: '内城/西城/04勋贵',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/hjcqSm0T/qing-wang-fu-da-men-qian-ting-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/PxTktDM6/qing-wang-fu-da-men-qian-ting-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/zvfZh16g/qing-wang-fu-da-men-qian-ting-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/D0YVdM3s/qing-wang-fu-da-men-qian-ting-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/k4sPD51d/qing-wang-fu-da-men-qian-ting-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/prdbjt4r/qing-wang-fu-da-men-qian-ting-yin-zhou.png'
    }
  },
  '内城/西城/04勋贵/庆王府后园': {
    name: '庆王府后园',
    fullPath: '内城/西城/04勋贵',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/X7z3wpn2/qing-wang-fu-hou-yuan-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/sgGzKsX3/qing-wang-fu-hou-yuan-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/1zxQj2Vx/qing-wang-fu-hou-yuan-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/zB81Jhkq/qing-wang-fu-hou-yuan-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/52QJpb0N/qing-wang-fu-hou-yuan-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/Cxn0JS1j/qing-wang-fu-hou-yuan-yin-zhou.png'
    }
  },
  '内城/西城/04勋贵/庆王府寝院': {
    name: '庆王府寝院',
    fullPath: '内城/西城/04勋贵',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/jdLYdtyn/qing-wang-fu-qin-yuan-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/QxHZxhcp/qing-wang-fu-qin-yuan-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/RVy5WyTp/qing-wang-fu-qin-yuan-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/hP6WX6rW/qing-wang-fu-qin-yuan-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/VLdPLmXV/qing-wang-fu-qin-yuan-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/jdLYdtzV/qing-wang-fu-qin-yuan-yin-zhou.png'
    }
  },
  '内城/西城/04勋贵/尚书府后院': {
    name: '尚书府后院',
    fullPath: '内城/西城/04勋贵',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/mrMbZBWs/shang-shu-fu-hou-yuan-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/26DCVMCy/shang-shu-fu-hou-yuan-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/bJ9pbgv5/shang-shu-fu-hou-yuan-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/FzFmxSfq/shang-shu-fu-hou-yuan-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/sX4sSm2Z/shang-shu-fu-hou-yuan-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/gJHmRs0H/shang-shu-fu-hou-yuan-yin-zhou.png'
    }
  },
  '内城/西城/04勋贵/尚书府花厅': {
    name: '尚书府花厅',
    fullPath: '内城/西城/04勋贵',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/286rb4N7/shang-shu-fu-hua-ting-ye.png',
      '昼': 'https://i.postimg.cc/Wb3TFMcS/shang-shu-fu-hua-ting-zhou.png'
    }
  },
  '内城/西城/04勋贵/尚书府绣楼': {
    name: '尚书府绣楼',
    fullPath: '内城/西城/04勋贵',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/KcQm80wR/shang-shu-fu-xiu-lou-ye.png',
      '昼': 'https://i.postimg.cc/fTLDtxQ3/shang-shu-fu-xiu-lou-zhou.png'
    }
  },
  '内城/西城/04勋贵/尚书府正堂': {
    name: '尚书府正堂',
    fullPath: '内城/西城/04勋贵',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/Kj9bpYBv/shang-shu-fu-zheng-tang-ye.png',
      '昼': 'https://i.postimg.cc/kGjCY5Kf/shang-shu-fu-zheng-tang-zhou.png'
    }
  },
  '内城/西城/04勋贵/刑部尚书府大门': {
    name: '刑部尚书府大门',
    fullPath: '内城/西城/04勋贵',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/zXXXCsKf/xing-bu-shang-shu-fu-da-men-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/WbbbGBgm/xing-bu-shang-shu-fu-da-men-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/W1dNK09c/xing-bu-shang-shu-fu-da-men-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/7Z5HcSBf/xing-bu-shang-shu-fu-da-men-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/5N79nsSm/xing-bu-shang-shu-fu-da-men-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/c491XFc0/xing-bu-shang-shu-fu-da-men-yin-zhou.png'
    }
  },
  '内城/西城/04勋贵/勋贵坊街': {
    name: '勋贵坊街',
    fullPath: '内城/西城/04勋贵',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/fRVzFYH9/xun-gui-fang-jie-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/kgLJdDZ4/xun-gui-fang-jie-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/rpW8yMXj/xun-gui-fang-jie-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/q7nkB4VS/xun-gui-fang-jie-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/qvWJdgYK/xun-gui-fang-jie-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/kgLJdDZF/xun-gui-fang-jie-yin-zhou.png'
    }
  },
  '内城/西城/04勋贵/英国公府大门': {
    name: '英国公府大门',
    fullPath: '内城/西城/04勋贵',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/T3b8g07p/ying-guo-gong-fu-da-men-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/L8PdLDCt/ying-guo-gong-fu-da-men-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/6QVD13xF/ying-guo-gong-fu-da-men-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/3wjPbRHH/ying-guo-gong-fu-da-men-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/wBYCVNZX/ying-guo-gong-fu-da-men-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/hGRkrm6N/ying-guo-gong-fu-da-men-yin-zhou.png'
    }
  },
  '内城/西城/04勋贵/英国公府演武场': {
    name: '英国公府演武场',
    fullPath: '内城/西城/04勋贵',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/j5sGVbsD/ying-guo-gong-fu-yan-wu-chang-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/851q8S1M/ying-guo-gong-fu-yan-wu-chang-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/C1m9SQ1J/ying-guo-gong-fu-yan-wu-chang-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/xCtBn4CZ/ying-guo-gong-fu-yan-wu-chang-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/qRk9fTkZ/ying-guo-gong-fu-yan-wu-chang-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/KzZdX2ZV/ying-guo-gong-fu-yan-wu-chang-yin-zhou.png'
    }
  },
  '内城/西城/04勋贵/英国公府正堂': {
    name: '英国公府正堂',
    fullPath: '内城/西城/04勋贵',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/zfw9PB1X/ying-guo-gong-fu-zheng-tang-ye.png',
      '昼': 'https://i.postimg.cc/25dPX6fq/ying-guo-gong-fu-zheng-tang-zhou.png'
    }
  },
  '内城/西城/05紫虚观/丹房静室': {
    name: '丹房静室',
    fullPath: '内城/西城/05紫虚观',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/4yyqdQHd/dan-fang-jing-shi-ye.png',
      '昼': 'https://i.postimg.cc/WzzC3wqk/dan-fang-jing-shi-zhou.png'
    }
  },
  '内城/西城/05紫虚观/观后小院': {
    name: '观后小院',
    fullPath: '内城/西城/05紫虚观',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/4NKjRwT1/guan-hou-xiao-yuan-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/TYyBvQXs/guan-hou-xiao-yuan-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/52LG60yG/guan-hou-xiao-yuan-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/XvWPFbyq/guan-hou-xiao-yuan-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/rFv3VWVX/guan-hou-xiao-yuan-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/dVrXL13Z/guan-hou-xiao-yuan-yin-zhou.png'
    }
  },
  '内城/西城/05紫虚观/三清殿': {
    name: '三清殿',
    fullPath: '内城/西城/05紫虚观',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/Y9bTMs0c/san-qing-dian-ye.png',
      '昼': 'https://i.postimg.cc/d14gwx30/san-qing-dian-zhou.png'
    }
  },
  '内城/西城/05紫虚观/紫虚观山门': {
    name: '紫虚观山门',
    fullPath: '内城/西城/05紫虚观',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/hvv6j1Q8/zi-xu-guan-shan-men-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/ZnQgyv6B/zi-xu-guan-shan-men-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/y6p2Gt2J/zi-xu-guan-shan-men-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/7PtjRdjX/zi-xu-guan-shan-men-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/kMHhs8tp/zi-xu-guan-shan-men-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/hP7Z5j9w/zi-xu-guan-shan-men-yin-zhou.png'
    }
  },
  '内城/西城/06宛平/宛平仵作房': {
    name: '宛平仵作房',
    fullPath: '内城/西城/06宛平',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/HLth9hQw/wan-ping-wu-zuo-fang-ye.png',
      '昼': 'https://i.postimg.cc/XJ7DHk8H/wan-ping-wu-zuo-fang-zhou.png'
    }
  },
  '内城/西城/06宛平/宛平县衙大堂': {
    name: '宛平县衙大堂',
    fullPath: '内城/西城/06宛平',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/XJH1TB10/wan-ping-xian-ya-da-tang-ye.png',
      '昼': 'https://i.postimg.cc/PJCVhf0X/wan-ping-xian-ya-da-tang-zhou.png'
    }
  },
  '外城/01前门/大栅栏街': {
    name: '大栅栏街',
    fullPath: '外城/01前门',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/G3NTp3ZT/da-zha-lan-jie-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/X7CGBSbH/da-zha-lan-jie-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/XvVpPry8/da-zha-lan-jie-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/YSbhBt1P/da-zha-lan-jie-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/fRQ3x2zq/da-zha-lan-jie-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/0yGzZYr8/da-zha-lan-jie-yin-zhou.png'
    }
  },
  '外城/01前门/前门大街': {
    name: '前门大街',
    fullPath: '外城/01前门',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/9fpqXdhm/qian-men-da-jie-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/cHLtvvxt/qian-men-da-jie-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/qq9NDQ8g/qian-men-da-jie-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/GtZ4gzkX/qian-men-da-jie-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/DZpJL70N/qian-men-da-jie-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/VvSSF2bP/qian-men-da-jie-yin-zhou.png'
    }
  },
  '外城/01前门/戏装铺': {
    name: '戏装铺',
    fullPath: '外城/01前门',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/8CtjgTRC/xi-zhuang-pu-ye.png',
      '昼': 'https://i.postimg.cc/cHC6sPh8/xi-zhuang-pu-zhou.png'
    }
  },
  '外城/01前门/鲜鱼口': {
    name: '鲜鱼口',
    fullPath: '外城/01前门',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/59Z5Rm9p/xian-yu-kou-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/28hdRB3H/xian-yu-kou-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/9Q2dWF7d/xian-yu-kou-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/Njx1Lq6S/xian-yu-kou-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/c4w7y8rZ/xian-yu-kou-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/2SYQz8Zk/xian-yu-kou-yin-zhou.png'
    }
  },
  '外城/01前门/醉仙楼大堂戏台': {
    name: '醉仙楼大堂戏台',
    fullPath: '外城/01前门',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/cHzC6TkT/zui-xian-lou-da-tang-xi-tai-ye.png',
      '昼': 'https://i.postimg.cc/MHjTBRhn/zui-xian-lou-da-tang-xi-tai-zhou.png'
    }
  },
  '外城/01前门/醉仙楼雅座': {
    name: '醉仙楼雅座',
    fullPath: '外城/01前门',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/XXSvkqbg/zui-xian-lou-ya-zuo-ye.png',
      '昼': 'https://i.postimg.cc/h4JbsYnV/zui-xian-lou-ya-zuo-zhou.png'
    }
  },
  '外城/02老槐茶楼/老槐茶楼大堂书场': {
    name: '老槐茶楼大堂书场',
    fullPath: '外城/02老槐茶楼',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/XvHdcfDh/lao-huai-cha-lou-da-tang-shu-chang-ye.png',
      '昼': 'https://i.postimg.cc/Ssn8ZnBh/lao-huai-cha-lou-da-tang-shu-chang-zhou.png'
    }
  },
  '外城/02老槐茶楼/老槐茶楼后堂': {
    name: '老槐茶楼后堂',
    fullPath: '外城/02老槐茶楼',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/Pqr1w3Kh/lao-huai-cha-lou-hou-tang-ye.png',
      '昼': 'https://i.postimg.cc/HLsbyZ37/lao-huai-cha-lou-hou-tang-zhou.png'
    }
  },
  '外城/02老槐茶楼/老槐茶楼雅间': {
    name: '老槐茶楼雅间',
    fullPath: '外城/02老槐茶楼',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/xCBmB0Q2/lao-huai-cha-lou-ya-jian-ye.png',
      '昼': 'https://i.postimg.cc/k4LSLnCB/lao-huai-cha-lou-ya-jian-zhou.png'
    }
  },
  '外城/03会馆/大车店': {
    name: '大车店',
    fullPath: '外城/03会馆',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/wvRyXSNp/da-che-dian-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/nr8s00KH/da-che-dian-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/BZDPXfsH/da-che-dian-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/VsM0dP14/da-che-dian-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/mkxc883M/da-che-dian-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/x8KX7Mgg/da-che-dian-yin-zhou.png'
    }
  },
  '外城/03会馆/会馆街': {
    name: '会馆街',
    fullPath: '外城/03会馆',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/13Mqs0Sb/hui-guan-jie-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/YS9m94qw/hui-guan-jie-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/43SHhJmQ/hui-guan-jie-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/FKBkJ972/hui-guan-jie-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/0NQJQ62J/hui-guan-jie-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/LsXZXq63/hui-guan-jie-yin-zhou.png'
    }
  },
  '外城/03会馆/云州会馆客房': {
    name: '云州会馆客房',
    fullPath: '外城/03会馆',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/VvMt83sg/yun-zhou-hui-guan-ke-fang-ye.png',
      '昼': 'https://i.postimg.cc/dQTrrTR3/yun-zhou-hui-guan-ke-fang-zhou.png'
    }
  },
  '外城/03会馆/云州会馆门庭': {
    name: '云州会馆门庭',
    fullPath: '外城/03会馆',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/xTDHRTgL/yun-zhou-hui-guan-men-ting-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/hPWxrPMM/yun-zhou-hui-guan-men-ting-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/sg3hk6k9/yun-zhou-hui-guan-men-ting-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/Z5jd4PmL/yun-zhou-hui-guan-men-ting-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/PrWDFsFB/yun-zhou-hui-guan-men-ting-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/dt2CSPxd/yun-zhou-hui-guan-men-ting-yin-zhou.png'
    }
  },
  '外城/04宣南/菜市': {
    name: '菜市',
    fullPath: '外城/04宣南',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/qRKqh2f2/cai-shi-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/0jqQprx0/cai-shi-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/pVDyPQJH/cai-shi-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/xTn88k68/cai-shi-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/d3m0nvt9/cai-shi-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/h49hK8b7/cai-shi-yin-zhou.png'
    }
  },
  '外城/04宣南/慈仁寺': {
    name: '慈仁寺',
    fullPath: '外城/04宣南',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/3rp0dQ7z/ci-ren-si-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/PrjpDVrB/ci-ren-si-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/529X7Hzv/ci-ren-si-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/BnZjY8Fh/ci-ren-si-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/m2ycy3P4/ci-ren-si-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/Yqz4zNvg/ci-ren-si-yin-zhou.png'
    }
  },
  '外城/04宣南/慈仁寺书市': {
    name: '慈仁寺书市',
    fullPath: '外城/04宣南',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/529X7HvM/ci-ren-si-shu-shi-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/K89RdZrc/ci-ren-si-shu-shi-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/zBhvbKs4/ci-ren-si-shu-shi-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/0QSjM7gP/ci-ren-si-shu-shi-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/XvppWTQg/ci-ren-si-shu-shi-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/TPFh3C4F/ci-ren-si-shu-shi-yin-zhou.png'
    }
  },
  '外城/04宣南/骡马市': {
    name: '骡马市',
    fullPath: '外城/04宣南',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/tCkTxXcV/luo-ma-shi-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/8P4561Yw/luo-ma-shi-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/pL1LssRP/luo-ma-shi-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/Pqpr915m/luo-ma-shi-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/2S55dspH/luo-ma-shi-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/XYvvKRSb/luo-ma-shi-yin-zhou.png'
    }
  },
  '外城/05洼地/金鱼池': {
    name: '金鱼池',
    fullPath: '外城/05洼地',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/fT8zb83X/jin-yu-chi-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/dVDqZGdn/jin-yu-chi-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/52GfBjSS/jin-yu-chi-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/wBmg0Hw4/jin-yu-chi-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/YCjpLQYH/jin-yu-chi-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/VkTzq5Wm/jin-yu-chi-yin-zhou.png'
    }
  },
  '外城/05洼地/琉璃窑厂': {
    name: '琉璃窑厂',
    fullPath: '外城/05洼地',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/R0kVBqWR/liu-li-yao-chang-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/fbGTNkV6/liu-li-yao-chang-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/1XPm8TcN/liu-li-yao-chang-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/D0FvSDd6/liu-li-yao-chang-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/wBCTp3t6/liu-li-yao-chang-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/HxbWsH5k/liu-li-yao-chang-yin-zhou.png'
    }
  },
  '外城/05洼地/芦棚窝区': {
    name: '芦棚窝区',
    fullPath: '外城/05洼地',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/PJ4tY423/lu-peng-wo-qu-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/44b4DfsW/lu-peng-wo-qu-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/ncFVZyLr/lu-peng-wo-qu-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/L694RcsL/lu-peng-wo-qu-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/2jFjskCf/lu-peng-wo-qu-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/CLhMY3x3/lu-peng-wo-qu-yin-zhou.png'
    }
  },
  '外城/06坛台/大享殿': {
    name: '大享殿',
    fullPath: '外城/06坛台',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/K8dyKwmR/da-xiang-dian-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/7ZpyCdq1/da-xiang-dian-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/LXSKDPqc/da-xiang-dian-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/pTvbCjhf/da-xiang-dian-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/YCJw4Ztd/da-xiang-dian-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/hGTRVsGZ/da-xiang-dian-yin-zhou.png'
    }
  },
  '外城/06坛台/观耕台': {
    name: '观耕台',
    fullPath: '外城/06坛台',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/28KsJML8/guan-geng-tai-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/hGFH4m0k/guan-geng-tai-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/Vs7prpRf/guan-geng-tai-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/9FKk19Kx/guan-geng-tai-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/zB86K16R/guan-geng-tai-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/ZnqQsxTC/guan-geng-tai-yin-zhou.png'
    }
  },
  '外城/06坛台/圜丘坛': {
    name: '圜丘坛',
    fullPath: '外城/06坛台',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/9XpVxLB2/huan-qiu-tan-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/HskmFbSx/huan-qiu-tan-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/8PXGGs9g/huan-qiu-tan-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/JzyLzMC8/huan-qiu-tan-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/Wb1Vx09n/huan-qiu-tan-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/QxYDDVPk/huan-qiu-tan-yin-zhou.png'
    }
  },
  '外城/06坛台/天坛斋宫': {
    name: '天坛斋宫',
    fullPath: '外城/06坛台',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/xCPr4dMG/tian-tan-zhai-gong-ye.png',
      '昼': 'https://i.postimg.cc/Y9xcsSYZ/tian-tan-zhai-gong-zhou.png'
    }
  },
  '外城/06坛台/先农坛': {
    name: '先农坛',
    fullPath: '外城/06坛台',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/qRH0FYYr/xian-nong-tan-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/C1CYp7Tq/xian-nong-tan-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/MHdSvGGw/xian-nong-tan-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/90JhrffG/xian-nong-tan-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/pr2vWjRf/xian-nong-tan-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/zvJNzh84/xian-nong-tan-yin-zhou.png'
    }
  },
  '外城/06坛台/永定门': {
    name: '永定门',
    fullPath: '外城/06坛台',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/7hYv8yND/yong-ding-men-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/sxnk30nz/yong-ding-men-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/MKHk9qTy/yong-ding-men-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/gkTC5QX4/yong-ding-men-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/ZnfGJDfB/yong-ding-men-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/QN0GgHXC/yong-ding-men-yin-zhou.png'
    }
  },
  '关厢村野/村野/01关厢/朝外关厢街': {
    name: '朝外关厢街',
    fullPath: '关厢村野/村野/01关厢',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/hGpwgmzP/chao-wai-guan-xiang-jie-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/G2tfppGT/chao-wai-guan-xiang-jie-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/1tdjVZK9/chao-wai-guan-xiang-jie-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/QCWnpn68/chao-wai-guan-xiang-jie-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/zBvQffKc/chao-wai-guan-xiang-jie-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/Px7RvkQF/chao-wai-guan-xiang-jie-yin-zhou.png'
    }
  },
  '关厢村野/村野/01关厢/东岳庙大殿': {
    name: '东岳庙大殿',
    fullPath: '关厢村野/村野/01关厢',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/wTmSJ3Pn/dong-yue-miao-da-dian-ye.png',
      '昼': 'https://i.postimg.cc/cLGPc0yV/dong-yue-miao-da-dian-zhou.png'
    }
  },
  '关厢村野/村野/01关厢/东岳庙七十二司': {
    name: '东岳庙七十二司',
    fullPath: '关厢村野/村野/01关厢',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/d3zppK7H/dong-yue-miao-qi-shi-er-si-ye.png',
      '昼': 'https://i.postimg.cc/gc5Cn3Mh/dong-yue-miao-qi-shi-er-si-zhou.png'
    }
  },
  '关厢村野/村野/01关厢/东岳庙山门': {
    name: '东岳庙山门',
    fullPath: '关厢村野/村野/01关厢',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/x1VBPnVT/dong-yue-miao-shan-men-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/sgPq6q3x/dong-yue-miao-shan-men-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/fbwF6CbP/dong-yue-miao-shan-men-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/hGSwHsj4/dong-yue-miao-shan-men-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/525T7Tf5/dong-yue-miao-shan-men-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/Bn5kYkJz/dong-yue-miao-shan-men-yin-zhou.png'
    }
  },
  '关厢村野/村野/02坟园/城南义庄停灵房': {
    name: '城南义庄停灵房',
    fullPath: '关厢村野/村野/02坟园',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/fTYMsHww/cheng-nan-yi-zhuang-ting-ling-fang-ye.png',
      '昼': 'https://i.postimg.cc/sD53znVM/cheng-nan-yi-zhuang-ting-ling-fang-zhou.png'
    }
  },
  '关厢村野/村野/02坟园/漏泽园': {
    name: '漏泽园',
    fullPath: '关厢村野/村野/02坟园',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/MpxqpyTn/lou-ze-yuan-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/8zDNzh5v/lou-ze-yuan-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/t45yZYZL/lou-ze-yuan-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/Hk2HcV8H/lou-ze-yuan-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/DwFnwqZB/lou-ze-yuan-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/cLmZgrgX/lou-ze-yuan-yin-zhou.png'
    }
  },
  '关厢村野/村野/02坟园/乱葬岗': {
    name: '乱葬岗',
    fullPath: '关厢村野/村野/02坟园',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/G38c7LVF/luan-zang-gang-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/7PGxsHdQ/luan-zang-gang-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/T2zTZ8XT/luan-zang-gang-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/ncqnxdHf/luan-zang-gang-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/v8JGpRwh/luan-zang-gang-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/CM3wWyVy/luan-zang-gang-yin-zhou.png'
    }
  },
  '关厢村野/村野/02坟园/义庄院': {
    name: '义庄院',
    fullPath: '关厢村野/村野/02坟园',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/RhnbcbP6/yi-zhuang-yuan-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/VvbHjH7R/yi-zhuang-yuan-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/Dmkp5dH3/yi-zhuang-yuan-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/Pfpt3X9L/yi-zhuang-yuan-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/dDPNnmXr/yi-zhuang-yuan-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/bdcVLHMC/yi-zhuang-yuan-yin-zhou.png'
    }
  },
  '关厢村野/村野/03官道/京西官道': {
    name: '京西官道',
    fullPath: '关厢村野/村野/03官道',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/Nj4Y9520/jing-xi-guan-dao-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/tg4bhpFC/jing-xi-guan-dao-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/xCWSDmh5/jing-xi-guan-dao-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/NFmvgMwQ/jing-xi-guan-dao-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/g02pvm33/jing-xi-guan-dao-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/j5WrFcgT/jing-xi-guan-dao-yin-zhou.png'
    }
  },
  '关厢村野/村野/03官道/十里长亭': {
    name: '十里长亭',
    fullPath: '关厢村野/村野/03官道',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/G3yCPMTg/shi-li-zhang-ting-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/fTQh8xY6/shi-li-zhang-ting-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/9QWHhC8B/shi-li-zhang-ting-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/jSZ0qmBW/shi-li-zhang-ting-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/Dy3KxqqK/shi-li-zhang-ting-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/02G1Fbfk/shi-li-zhang-ting-yin-zhou.png'
    }
  },
  '关厢村野/村野/03官道/驿馆客房': {
    name: '驿馆客房',
    fullPath: '关厢村野/村野/03官道',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/k5p0K8n1/yi-guan-ke-fang-ye.png',
      '昼': 'https://i.postimg.cc/yd3wPdx1/yi-guan-ke-fang-zhou.png'
    }
  },
  '关厢村野/村野/03官道/驿馆门庭': {
    name: '驿馆门庭',
    fullPath: '关厢村野/村野/03官道',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/1XxbYQVF/yi-guan-men-ting-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/gjvQCT3f/yi-guan-men-ting-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/PrQ0K0XZ/yi-guan-men-ting-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/FHF86GzP/yi-guan-men-ting-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/pV8w5p3B/yi-guan-men-ting-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/YqHJ6tHH/yi-guan-men-ting-yin-zhou.png'
    }
  },
  '关厢村野/村野/04槐荫村/村口古槐': {
    name: '村口古槐',
    fullPath: '关厢村野/村野/04槐荫村',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/QM94LzDr/cun-kou-gu-huai-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/MGCszYZS/cun-kou-gu-huai-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/C1bc5fd8/cun-kou-gu-huai-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/90VJ7Fqb/cun-kou-gu-huai-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/g0CMGKcY/cun-kou-gu-huai-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/LscymV4Z/cun-kou-gu-huai-yin-zhou.png'
    }
  },
  '关厢村野/村野/04槐荫村/村土地庙': {
    name: '村土地庙',
    fullPath: '关厢村野/村野/04槐荫村',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/3N7nvJvx/cun-tu-de-miao-ye.png',
      '昼': 'https://i.postimg.cc/Y038fK6G/cun-tu-de-miao-zhou.png'
    }
  },
  '关厢村野/村野/04槐荫村/村中街巷': {
    name: '村中街巷',
    fullPath: '关厢村野/村野/04槐荫村',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/J7bF4SkM/cun-zhong-jie-xiang-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/CLSQZJGq/cun-zhong-jie-xiang-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/jjwgV1by/cun-zhong-jie-xiang-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/JhD6wFLF/cun-zhong-jie-xiang-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/SNdtc8VF/cun-zhong-jie-xiang-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/P5F3RjBx/cun-zhong-jie-xiang-yin-zhou.png'
    }
  },
  '关厢村野/村野/04槐荫村/打谷场': {
    name: '打谷场',
    fullPath: '关厢村野/村野/04槐荫村',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/pL04M8ny/da-gu-chang-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/nLC5FzvR/da-gu-chang-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/7hyQnnp4/da-gu-chang-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/PJzV38jv/da-gu-chang-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/LswWnpDm/da-gu-chang-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/V6tVtVZq/da-gu-chang-yin-zhou.png'
    }
  },
  '远征/01西山/狐仙洞府': {
    name: '狐仙洞府',
    fullPath: '远征/01西山',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/hvx25yHH/hu-xian-dong-fu-ye.png',
      '昼': 'https://i.postimg.cc/6qRMmjkq/hu-xian-dong-fu-zhou.png'
    }
  },
  '远征/01西山/戒台寺戒坛': {
    name: '戒台寺戒坛',
    fullPath: '远征/01西山',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/rpnZ0t19/jie-tai-si-jie-tan-ye.png',
      '昼': 'https://i.postimg.cc/9f8gRqdN/jie-tai-si-jie-tan-zhou.png'
    }
  },
  '远征/01西山/青丘峪口': {
    name: '青丘峪口',
    fullPath: '远征/01西山',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/TYM7Dxbb/qing-qiu-yu-kou-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/rF1hGHG0/qing-qiu-yu-kou-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/fRM88vBz/qing-qiu-yu-kou-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/RZGXynD0/qing-qiu-yu-kou-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/BQTh5z5B/qing-qiu-yu-kou-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/zGqxxkpQ/qing-qiu-yu-kou-yin-zhou.png'
    }
  },
  '远征/01西山/潭柘寺大殿': {
    name: '潭柘寺大殿',
    fullPath: '远征/01西山',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/DzjpJbrt/tan-zhe-si-da-dian-ye.png',
      '昼': 'https://i.postimg.cc/VNGZrb91/tan-zhe-si-da-dian-zhou.png'
    }
  },
  '远征/01西山/潭柘寺山门': {
    name: '潭柘寺山门',
    fullPath: '远征/01西山',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/765sgYX4/tan-zhe-si-shan-men-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/pTmGDXkj/tan-zhe-si-shan-men-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/G26MzwSk/tan-zhe-si-shan-men-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/XJt2xSDs/tan-zhe-si-shan-men-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/TwK7rYQr/tan-zhe-si-shan-men-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/B6RhN9wK/tan-zhe-si-shan-men-yin-zhou.png'
    }
  },
  '远征/01西山/西山山道': {
    name: '西山山道',
    fullPath: '远征/01西山',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/bY2Vrrsx/xi-shan-shan-dao-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/zDR2vvVp/xi-shan-shan-dao-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/9F58729W/xi-shan-shan-dao-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/SNFTM49X/xi-shan-shan-dao-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/J7BY00GS/xi-shan-shan-dao-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/pXbGFvjb/xi-shan-shan-dao-yin-zhou.png'
    }
  },
  '远征/01西山/峪中泉林': {
    name: '峪中泉林',
    fullPath: '远征/01西山',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/kgypCHDH/yu-zhong-quan-lin-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/HkthmNVm/yu-zhong-quan-lin-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/rpFYw9rW/yu-zhong-quan-lin-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/rpFYw9rN/yu-zhong-quan-lin-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/FHxBv67H/yu-zhong-quan-lin-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/GphSmjy9/yu-zhong-quan-lin-yin-zhou.png'
    }
  },
  '远征/02皇陵/皇陵神道': {
    name: '皇陵神道',
    fullPath: '远征/02皇陵',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/c1YTZzzW/huang-ling-shen-dao-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/sfSKyLLD/huang-ling-shen-dao-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/L84Vt867/huang-ling-shen-dao-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/HkWtwkkd/huang-ling-shen-dao-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/sDrm2cFV/huang-ling-shen-dao-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/CLsNnqYm/huang-ling-shen-dao-yin-zhou.png'
    }
  },
  '远征/02皇陵/陵门': {
    name: '陵门',
    fullPath: '远征/02皇陵',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/HkS9B1r0/ling-men-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/x1s3tVXg/ling-men-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/d0pmcRm3/ling-men-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/RFt1S3XJ/ling-men-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/CKzH2r84/ling-men-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/QMwkZggy/ling-men-yin-zhou.png'
    }
  },
  '远征/02皇陵/陵卫值房': {
    name: '陵卫值房',
    fullPath: '远征/02皇陵',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/CxM4Gxxz/ling-wei-zhi-fang-ye.png',
      '昼': 'https://i.postimg.cc/kgjvfP22/ling-wei-zhi-fang-zhou.png'
    }
  },
  '远征/02皇陵/享殿': {
    name: '享殿',
    fullPath: '远征/02皇陵',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/fR5Bp0r3/xiang-dian-ye.png',
      '昼': 'https://i.postimg.cc/JzKPvB23/xiang-dian-zhou.png'
    }
  },
  '远征/02皇陵/玄宫封门': {
    name: '玄宫封门',
    fullPath: '远征/02皇陵',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/nLz0Jcyd/xuan-gong-feng-men-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/QMySxZsj/xuan-gong-feng-men-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/sxpJcBht/xuan-gong-feng-men-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/gjvKDwhL/xuan-gong-feng-men-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/85f47XPb/xuan-gong-feng-men-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/brXTk0s6/xuan-gong-feng-men-yin-zhou.png'
    }
  },
  '远征/03通州/漕船甲板': {
    name: '漕船甲板',
    fullPath: '远征/03通州',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/Y21NTW4t/cao-chuan-jia-ban-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/wTg5zjJB/cao-chuan-jia-ban-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/XYvwZ1QR/cao-chuan-jia-ban-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/qvZ22cFR/cao-chuan-jia-ban-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/ZK4Pm53w/cao-chuan-jia-ban-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/hPsLtRb3/cao-chuan-jia-ban-yin-zhou.png'
    }
  },
  '远征/03通州/通州漕仓': {
    name: '通州漕仓',
    fullPath: '远征/03通州',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/FKd3pdtT/tong-zhou-cao-cang-ye.png',
      '昼': 'https://i.postimg.cc/1znwBnhZ/tong-zhou-cao-cang-zhou.png'
    }
  },
  '远征/03通州/通州码头': {
    name: '通州码头',
    fullPath: '远征/03通州',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/q7Pn5J44/tong-zhou-ma-tou-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/25svKkr5/tong-zhou-ma-tou-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/JnjJwfzQ/tong-zhou-ma-tou-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/bJ1bX7wF/tong-zhou-ma-tou-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/43DtSfsH/tong-zhou-ma-tou-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/yd09qM8g/tong-zhou-ma-tou-yin-zhou.png'
    }
  },
  '远征/03通州/张家湾古街': {
    name: '张家湾古街',
    fullPath: '远征/03通州',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/PxDbXL2W/zhang-jia-wan-gu-jie-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/DZGQvWBg/zhang-jia-wan-gu-jie-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/C5Hj83yy/zhang-jia-wan-gu-jie-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/2yF4Wsph/zhang-jia-wan-gu-jie-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/XJ5KjZQD/zhang-jia-wan-gu-jie-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/8cVRj10Y/zhang-jia-wan-gu-jie-yin-zhou.png'
    }
  },
  '远征/04南苑/南苑苑门': {
    name: '南苑苑门',
    fullPath: '远征/04南苑',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/NFYXQdKJ/nan-yuan-yuan-men-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/L5RPmxqR/nan-yuan-yuan-men-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/c1MYFGjN/nan-yuan-yuan-men-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/pVY8sM7n/nan-yuan-yuan-men-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/1XHqXD6q/nan-yuan-yuan-men-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/8cH6cLWm/nan-yuan-yuan-men-yin-zhou.png'
    }
  },
  '远征/04南苑/围场': {
    name: '围场',
    fullPath: '远征/04南苑',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/jdxf9k0C/wei-chang-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/ncFm5wbG/wei-chang-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/c4F3NMdL/wei-chang-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/fRk9WtbM/wei-chang-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/15mFTYhT/wei-chang-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/MK9B8bq4/wei-chang-yin-zhou.png'
    }
  },
  '远征/04南苑/行宫': {
    name: '行宫',
    fullPath: '远征/04南苑',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/nhMDVjLX/xing-gong-ye.png',
      '昼': 'https://i.postimg.cc/SxjMQ2KL/xing-gong-zhou.png'
    }
  },
  '远征/05卢沟/卢沟桥': {
    name: '卢沟桥',
    fullPath: '远征/05卢沟',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/wjPs1qts/lu-gou-qiao-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/4xMhYfK0/lu-gou-qiao-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/d0yZdbrQ/lu-gou-qiao-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/MTJMY9m6/lu-gou-qiao-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/7L2J7F7Q/lu-gou-qiao-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/1zqV6kw1/lu-gou-qiao-yin-zhou.png'
    }
  },
  '远征/05卢沟/桥头野店': {
    name: '桥头野店',
    fullPath: '远征/05卢沟',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/d1ck95jj/qiao-tou-ye-dian-ye.png',
      '昼': 'https://i.postimg.cc/fL73qY86/qiao-tou-ye-dian-zhou.png'
    }
  },
  '远征/06边关/居庸关关城': {
    name: '居庸关关城',
    fullPath: '远征/06边关',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/RhMWkq8Z/ju-yong-guan-guan-cheng-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/J01sftgH/ju-yong-guan-guan-cheng-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/Pf4pmzpv/ju-yong-guan-guan-cheng-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/DfgJqdJP/ju-yong-guan-guan-cheng-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/1XJ8sshg/ju-yong-guan-guan-cheng-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/kMc6xF6M/ju-yong-guan-guan-cheng-yin-zhou.png'
    }
  },
  '内城/北城/11诸王邸/安定郡王府大门前庭': {
    name: '安定郡王府大门前庭',
    fullPath: '内城/北城/11诸王邸',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/vZD0RmF1/an-ding-jun-wang-fu-da-men-qian-ting-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/t47B0gQf/an-ding-jun-wang-fu-da-men-qian-ting-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/MGQtTrGv/an-ding-jun-wang-fu-da-men-qian-ting-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/pdFkT1df/an-ding-jun-wang-fu-da-men-qian-ting-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/mgq8TGB0/an-ding-jun-wang-fu-da-men-qian-ting-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/nh50ntnV/an-ding-jun-wang-fu-da-men-qian-ting-yin-zhou.png'
    }
  },
  '内城/北城/11诸王邸/安定郡王府后园': {
    name: '安定郡王府后园',
    fullPath: '内城/北城/11诸王邸',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/0jfVvMyX/an-ding-jun-wang-fu-hou-yuan-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/66LjnSf4/an-ding-jun-wang-fu-hou-yuan-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/m2Ldwwds/an-ding-jun-wang-fu-hou-yuan-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/65MM1vS3/an-ding-jun-wang-fu-hou-yuan-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/DfdjLDP5/an-ding-jun-wang-fu-hou-yuan-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/GhLMQQX7/an-ding-jun-wang-fu-hou-yuan-yin-zhou.png'
    }
  },
  '内城/北城/11诸王邸/安定郡王府寝院': {
    name: '安定郡王府寝院',
    fullPath: '内城/北城/11诸王邸',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/nzf2QYsd/an-ding-jun-wang-fu-qin-yuan-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/Hx020cXT/an-ding-jun-wang-fu-qin-yuan-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/x8t37w6R/an-ding-jun-wang-fu-qin-yuan-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/L4TDnPmt/an-ding-jun-wang-fu-qin-yuan-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/Fz9xTrVF/an-ding-jun-wang-fu-qin-yuan-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/zvJkxzFy/an-ding-jun-wang-fu-qin-yuan-yin-zhou.png'
    }
  },
  '内城/北城/11诸王邸/安定郡王府正堂': {
    name: '安定郡王府正堂',
    fullPath: '内城/北城/11诸王邸',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/L4TDnPmw/an-ding-jun-wang-fu-zheng-tang-ye.png',
      '昼': 'https://i.postimg.cc/pXLZ8dTN/an-ding-jun-wang-fu-zheng-tang-zhou.png'
    }
  },
  '皇城/01衙署/秉笔宅家庙': {
    name: '秉笔宅家庙',
    fullPath: '皇城/01衙署',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/sgF4L4mR/bing-bi-zhai-jia-miao-ye.png',
      '昼': 'https://i.postimg.cc/kgrvHvsJ/bing-bi-zhai-jia-miao-zhou.png'
    }
  },
  '皇城/01衙署/秉笔宅门庭': {
    name: '秉笔宅门庭',
    fullPath: '皇城/01衙署',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/Jhx3GVL8/bing-bi-zhai-men-ting-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/tgkdYQjP/bing-bi-zhai-men-ting-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/bJFQ9xrm/bing-bi-zhai-men-ting-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/pT1DJfyv/bing-bi-zhai-men-ting-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/nzL4mRFq/bing-bi-zhai-men-ting-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/V6NqtGf7/bing-bi-zhai-men-ting-yin-zhou.png'
    }
  },
  '皇城/01衙署/秉笔宅密室': {
    name: '秉笔宅密室',
    fullPath: '皇城/01衙署',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/pLNJSJCh/bing-bi-zhai-mi-shi-ye.png',
      '昼': 'https://i.postimg.cc/rwSN2RZj/bing-bi-zhai-mi-shi-zhou.png'
    }
  },
  '皇城/01衙署/秉笔宅正堂': {
    name: '秉笔宅正堂',
    fullPath: '皇城/01衙署',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/5tbq49Dn/bing-bi-zhai-zheng-tang-ye.png',
      '昼': 'https://i.postimg.cc/HLz0VDCF/bing-bi-zhai-zheng-tang-zhou.png'
    }
  },
  '外城/02商栈/茶食铺宅后院': {
    name: '茶食铺宅后院',
    fullPath: '外城/02商栈',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/JzW29kcT/cha-shi-pu-zhai-hou-yuan-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/bwjBKt9X/cha-shi-pu-zhai-hou-yuan-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/7LHQLrR3/cha-shi-pu-zhai-hou-yuan-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/JhrdhCgV/cha-shi-pu-zhai-hou-yuan-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/nhtP6DGV/cha-shi-pu-zhai-hou-yuan-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/6pLmwpMW/cha-shi-pu-zhai-hou-yuan-yin-zhou.png'
    }
  },
  '外城/02商栈/茶食铺宅前铺': {
    name: '茶食铺宅前铺',
    fullPath: '外城/02商栈',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/dtCfHBdr/cha-shi-pu-zhai-qian-pu-ye.png',
      '昼': 'https://i.postimg.cc/c43z9mYX/cha-shi-pu-zhai-qian-pu-zhou.png'
    }
  },
  '内城/中城/01署馆/朝议第门庭': {
    name: '朝议第门庭',
    fullPath: '内城/中城/01署馆',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/8CfDCDWj/chao-yi-di-men-ting-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/W4qj4jrn/chao-yi-di-men-ting-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/SsWhWrgk/chao-yi-di-men-ting-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/cHQSQmFw/chao-yi-di-men-ting-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/xCrQJ7yF/chao-yi-di-men-ting-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/xCrQJ730/chao-yi-di-men-ting-yin-zhou.png'
    }
  },
  '内城/中城/01署馆/朝议第庭院': {
    name: '朝议第庭院',
    fullPath: '内城/中城/01署馆',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/TYTRJzMR/chao-yi-di-ting-yuan-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/ZKJTxGtn/chao-yi-di-ting-yuan-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/c4Td9F0h/chao-yi-di-ting-yuan-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/520bZ82Z/chao-yi-di-ting-yuan-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/8PwTKZNz/chao-yi-di-ting-yuan-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/5Npf7sbL/chao-yi-di-ting-yuan-yin-zhou.png'
    }
  },
  '内城/中城/01署馆/朝议第正房': {
    name: '朝议第正房',
    fullPath: '内城/中城/01署馆',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/YCsMkjvJ/chao-yi-di-zheng-fang-ye.png',
      '昼': 'https://i.postimg.cc/6pmtwT7W/chao-yi-di-zheng-fang-zhou.png'
    }
  },
  '外城/02商栈/绸缎巨宅后院': {
    name: '绸缎巨宅后院',
    fullPath: '外城/02商栈',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/Y0GQnvmj/chou-duan-ju-zhai-hou-yuan-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/vTJfpGWS/chou-duan-ju-zhai-hou-yuan-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/qvd2wMBT/chou-duan-ju-zhai-hou-yuan-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/2SfnG8j5/chou-duan-ju-zhai-hou-yuan-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/XNmfZkTk/chou-duan-ju-zhai-hou-yuan-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/gkhv36W7/chou-duan-ju-zhai-hou-yuan-yin-zhou.png'
    }
  },
  '外城/02商栈/绸缎巨宅门庭': {
    name: '绸缎巨宅门庭',
    fullPath: '外城/02商栈',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/YSrYcnWC/chou-duan-ju-zhai-men-ting-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/GpXYbFFr/chou-duan-ju-zhai-men-ting-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/Y9jF0v8K/chou-duan-ju-zhai-men-ting-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/ZRgddJDb/chou-duan-ju-zhai-men-ting-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/yNL97mmc/chou-duan-ju-zhai-men-ting-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/FKTchyyx/chou-duan-ju-zhai-men-ting-yin-zhou.png'
    }
  },
  '外城/02商栈/绸缎巨宅账房': {
    name: '绸缎巨宅账房',
    fullPath: '外城/02商栈',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/htbT5WhY/chou-duan-ju-zhai-zhang-fang-ye.png',
      '昼': 'https://i.postimg.cc/pdWzNGnc/chou-duan-ju-zhai-zhang-fang-zhou.png'
    }
  },
  '外城/02商栈/绸缎巨宅正堂': {
    name: '绸缎巨宅正堂',
    fullPath: '外城/02商栈',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/y8z0jY6c/chou-duan-ju-zhai-zheng-tang-ye.png',
      '昼': 'https://i.postimg.cc/MpbVF2X7/chou-duan-ju-zhai-zheng-tang-zhou.png'
    }
  },
  '外城/02商栈/绸缎铺宅后院': {
    name: '绸缎铺宅后院',
    fullPath: '外城/02商栈',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/qq3CcW9c/chou-duan-pu-zhai-hou-yuan-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/vDwx03sL/chou-duan-pu-zhai-hou-yuan-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/sfq848B1/chou-duan-pu-zhai-hou-yuan-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/bYWM9MG1/chou-duan-pu-zhai-hou-yuan-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/SjbYgD40/chou-duan-pu-zhai-hou-yuan-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/44mqtZ3J/chou-duan-pu-zhai-hou-yuan-yin-zhou.png'
    }
  },
  '外城/02商栈/绸缎铺宅前铺': {
    name: '绸缎铺宅前铺',
    fullPath: '外城/02商栈',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/wvPmm9b3/chou-duan-pu-zhai-qian-pu-ye.png',
      '昼': 'https://i.postimg.cc/SRMzLHwn/chou-duan-pu-zhai-qian-pu-zhou.png'
    }
  },
  '内城/中城/01署馆/大宗伯府大门前庭': {
    name: '大宗伯府大门前庭',
    fullPath: '内城/中城/01署馆',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/cH3zpL3b/da-zong-bo-fu-da-men-qian-ting-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/FzQ6NXgt/da-zong-bo-fu-da-men-qian-ting-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/dQ8XnDwv/da-zong-bo-fu-da-men-qian-ting-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/v8WjXDb4/da-zong-bo-fu-da-men-qian-ting-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/zv1Q8YSV/da-zong-bo-fu-da-men-qian-ting-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/2yFK592n/da-zong-bo-fu-da-men-qian-ting-yin-zhou.png'
    }
  },
  '内城/中城/01署馆/大宗伯府后院': {
    name: '大宗伯府后院',
    fullPath: '内城/中城/01署馆',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/T32ZKG8j/da-zong-bo-fu-hou-yuan-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/6pHFRSw0/da-zong-bo-fu-hou-yuan-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/R0y8pHWW/da-zong-bo-fu-hou-yuan-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/9fKSg7Dt/da-zong-bo-fu-hou-yuan-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/2SHgvJmJ/da-zong-bo-fu-hou-yuan-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/N05Sx4jv/da-zong-bo-fu-hou-yuan-yin-zhou.png'
    }
  },
  '内城/中城/01署馆/大宗伯府书房': {
    name: '大宗伯府书房',
    fullPath: '内城/中城/01署馆',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/4NQD4y0y/da-zong-bo-fu-shu-fang-ye.png',
      '昼': 'https://i.postimg.cc/L84rJRd5/da-zong-bo-fu-shu-fang-zhou.png'
    }
  },
  '内城/中城/01署馆/大宗伯府正堂': {
    name: '大宗伯府正堂',
    fullPath: '内城/中城/01署馆',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/SQW5Vjkr/da-zong-bo-fu-zheng-tang-ye.png',
      '昼': 'https://i.postimg.cc/28rttmSF/da-zong-bo-fu-zheng-tang-zhou.png'
    }
  },
  '内城/中城/01署馆/迪功第门庭': {
    name: '迪功第门庭',
    fullPath: '内城/中城/01署馆',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/V6jSZ2YH/di-gong-di-men-ting-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/4ysYDwyZ/di-gong-di-men-ting-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/CMsBGyr2/di-gong-di-men-ting-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/Yq248XTZ/di-gong-di-men-ting-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/x85XnHNp/di-gong-di-men-ting-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/nVGj48SB/di-gong-di-men-ting-yin-zhou.png'
    }
  },
  '内城/中城/01署馆/迪功第堂屋': {
    name: '迪功第堂屋',
    fullPath: '内城/中城/01署馆',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/KY33BRCg/di-gong-di-tang-wu-ye.png',
      '昼': 'https://i.postimg.cc/4dC75XTQ/di-gong-di-tang-wu-zhou.png'
    }
  },
  '内城/西城/04勋贵/定远侯府大门前庭': {
    name: '定远侯府大门前庭',
    fullPath: '内城/西城/04勋贵',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/MGVbxMsb/ding-yuan-hou-fu-da-men-qian-ting-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/PqYzhp6F/ding-yuan-hou-fu-da-men-qian-ting-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/cHcRtqGJ/ding-yuan-hou-fu-da-men-qian-ting-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/mk2QQdTX/ding-yuan-hou-fu-da-men-qian-ting-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/LXSks97W/ding-yuan-hou-fu-da-men-qian-ting-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/qRGs6fV9/ding-yuan-hou-fu-da-men-qian-ting-yin-zhou.png'
    }
  },
  '内城/西城/04勋贵/定远侯府后院': {
    name: '定远侯府后院',
    fullPath: '内城/西城/04勋贵',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/7YtNNyGb/ding-yuan-hou-fu-hou-yuan-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/W1DwWfgk/ding-yuan-hou-fu-hou-yuan-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/Vk3B3BFm/ding-yuan-hou-fu-hou-yuan-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/q7yX0hmq/ding-yuan-hou-fu-hou-yuan-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/L8q3C0Lv/ding-yuan-hou-fu-hou-yuan-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/zGLFtPTZ/ding-yuan-hou-fu-hou-yuan-yin-zhou.png'
    }
  },
  '内城/西城/04勋贵/定远侯府花厅': {
    name: '定远侯府花厅',
    fullPath: '内城/西城/04勋贵',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/QxCQCn4j/ding-yuan-hou-fu-hua-ting-ye.png',
      '昼': 'https://i.postimg.cc/4N0z9bqN/ding-yuan-hou-fu-hua-ting-zhou.png'
    }
  },
  '内城/西城/04勋贵/定远侯府正堂': {
    name: '定远侯府正堂',
    fullPath: '内城/西城/04勋贵',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/Zn76jrqX/ding-yuan-hou-fu-zheng-tang-ye.png',
      '昼': 'https://i.postimg.cc/KcJ7Zy5C/ding-yuan-hou-fu-zheng-tang-zhou.png'
    }
  },
  '内城/中城/01署馆/都宪府大门前庭': {
    name: '都宪府大门前庭',
    fullPath: '内城/中城/01署馆',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/hPGjVXdv/dou-xian-fu-da-men-qian-ting-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/13n3YbMQ/dou-xian-fu-da-men-qian-ting-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/85Hp6Gkd/dou-xian-fu-da-men-qian-ting-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/FzH9b61C/dou-xian-fu-da-men-qian-ting-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/SsqQRRhv/dou-xian-fu-da-men-qian-ting-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/B6sZbb3Q/dou-xian-fu-da-men-qian-ting-yin-zhou.png'
    }
  },
  '内城/中城/01署馆/都宪府后院': {
    name: '都宪府后院',
    fullPath: '内城/中城/01署馆',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/sDnMLYr4/dou-xian-fu-hou-yuan-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/7Zf5r5HV/dou-xian-fu-hou-yuan-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/KzrzDLfb/dou-xian-fu-hou-yuan-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/66cq7rTr/dou-xian-fu-hou-yuan-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/y8tk17Wq/dou-xian-fu-hou-yuan-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/1zF44bNn/dou-xian-fu-hou-yuan-yin-zhou.png'
    }
  },
  '内城/中城/01署馆/都宪府书房': {
    name: '都宪府书房',
    fullPath: '内城/中城/01署馆',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/ncdXW4JV/dou-xian-fu-shu-fang-ye.png',
      '昼': 'https://i.postimg.cc/jd8D1Hbn/dou-xian-fu-shu-fang-zhou.png'
    }
  },
  '内城/中城/01署馆/都宪府正堂': {
    name: '都宪府正堂',
    fullPath: '内城/中城/01署馆',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/Kjpm05MG/dou-xian-fu-zheng-tang-ye.png',
      '昼': 'https://i.postimg.cc/yYW1k2Mg/dou-xian-fu-zheng-tang-zhou.png'
    }
  },
  '内城/中城/01署馆/奉政第门庭': {
    name: '奉政第门庭',
    fullPath: '内城/中城/01署馆',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/FKMWVX6y/feng-zheng-di-men-ting-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/zfstFYQ7/feng-zheng-di-men-ting-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/ZnZwXF4W/feng-zheng-di-men-ting-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/L5TxSY8z/feng-zheng-di-men-ting-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/q7PbxHFF/feng-zheng-di-men-ting-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/85LyynQS/feng-zheng-di-men-ting-yin-zhou.png'
    }
  },
  '内城/中城/01署馆/奉政第庭院': {
    name: '奉政第庭院',
    fullPath: '内城/中城/01署馆',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/jdt11KS8/feng-zheng-di-ting-yuan-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/TY0sMSKN/feng-zheng-di-ting-yuan-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/kg5pnc8v/feng-zheng-di-ting-yuan-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/x1FFqz32/feng-zheng-di-ting-yuan-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/nc2Wb5s8/feng-zheng-di-ting-yuan-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/rFjHXbdR/feng-zheng-di-ting-yuan-yin-zhou.png'
    }
  },
  '内城/中城/01署馆/奉政第正房': {
    name: '奉政第正房',
    fullPath: '内城/中城/01署馆',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/7LGtzZKx/feng-zheng-di-zheng-fang-ye.png',
      '昼': 'https://i.postimg.cc/SK219xg9/feng-zheng-di-zheng-fang-zhou.png'
    }
  },
  '内城/西城/04勋贵/辅国公府大门前庭': {
    name: '辅国公府大门前庭',
    fullPath: '内城/西城/04勋贵',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/Hsm0m4Rq/fu-guo-gong-fu-da-men-qian-ting-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/Wb7G1qPd/fu-guo-gong-fu-da-men-qian-ting-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/13CDpxtY/fu-guo-gong-fu-da-men-qian-ting-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/2Scn4pyR/fu-guo-gong-fu-da-men-qian-ting-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/jSdzwqs7/fu-guo-gong-fu-da-men-qian-ting-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/NjJR1hMk/fu-guo-gong-fu-da-men-qian-ting-yin-zhou.png'
    }
  },
  '内城/西城/04勋贵/辅国公府花厅': {
    name: '辅国公府花厅',
    fullPath: '内城/西城/04勋贵',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/NjMHGN47/fu-guo-gong-fu-hua-ting-ye.png',
      '昼': 'https://i.postimg.cc/x14bXKx4/fu-guo-gong-fu-hua-ting-zhou.png'
    }
  },
  '内城/西城/04勋贵/辅国公府寝院': {
    name: '辅国公府寝院',
    fullPath: '内城/西城/04勋贵',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/251hGHLr/fu-guo-gong-fu-qin-yuan-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/k52KsjR2/fu-guo-gong-fu-qin-yuan-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/L5315wwJ/fu-guo-gong-fu-qin-yuan-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/5ySCyTTs/fu-guo-gong-fu-qin-yuan-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/k5L8pxWj/fu-guo-gong-fu-qin-yuan-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/5yVzxb7b/fu-guo-gong-fu-qin-yuan-yin-zhou.png'
    }
  },
  '内城/西城/04勋贵/辅国公府演武园': {
    name: '辅国公府演武园',
    fullPath: '内城/西城/04勋贵',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/L4tfxg5L/fu-guo-gong-fu-yan-wu-yuan-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/wT9NZxRV/fu-guo-gong-fu-yan-wu-yuan-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/jdvfbVzx/fu-guo-gong-fu-yan-wu-yuan-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/yYnRHqFR/fu-guo-gong-fu-yan-wu-yuan-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/FshS8Fk8/fu-guo-gong-fu-yan-wu-yuan-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/VLztpsbw/fu-guo-gong-fu-yan-wu-yuan-yin-zhou.png'
    }
  },
  '内城/西城/04勋贵/辅国公府正堂': {
    name: '辅国公府正堂',
    fullPath: '内城/西城/04勋贵',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/FzVLz88M/fu-guo-gong-fu-zheng-tang-ye.png',
      '昼': 'https://i.postimg.cc/G3FYXTt9/fu-guo-gong-fu-zheng-tang-zhou.png'
    }
  },
  '内城/中城/01署馆/阁老府大门前庭': {
    name: '阁老府大门前庭',
    fullPath: '内城/中城/01署馆',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/c4NqN2dk/ge-lao-fu-da-men-qian-ting-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/65Vk6c3w/ge-lao-fu-da-men-qian-ting-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/jSsGDfwv/ge-lao-fu-da-men-qian-ting-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/13Jbwzwj/ge-lao-fu-da-men-qian-ting-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/T3RZKbLw/ge-lao-fu-da-men-qian-ting-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/4xJrYc7z/ge-lao-fu-da-men-qian-ting-yin-zhou.png'
    }
  },
  '内城/中城/01署馆/阁老府后院': {
    name: '阁老府后院',
    fullPath: '内城/中城/01署馆',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/k46rndVp/ge-lao-fu-hou-yuan-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/ydwMxrcC/ge-lao-fu-hou-yuan-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/DfGVHn30/ge-lao-fu-hou-yuan-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/mZ9xJBWy/ge-lao-fu-hou-yuan-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/Jn9f0dZB/ge-lao-fu-hou-yuan-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/przgFYJQ/ge-lao-fu-hou-yuan-yin-zhou.png'
    }
  },
  '内城/中城/01署馆/阁老府书房': {
    name: '阁老府书房',
    fullPath: '内城/中城/01署馆',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/R005Dtv9/ge-lao-fu-shu-fang-ye.png',
      '昼': 'https://i.postimg.cc/43Fkk33p/ge-lao-fu-shu-fang-zhou.png'
    }
  },
  '内城/中城/01署馆/阁老府正堂': {
    name: '阁老府正堂',
    fullPath: '内城/中城/01署馆',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/PqJ94kMq/ge-lao-fu-zheng-tang-ye.png',
      '昼': 'https://i.postimg.cc/1zX2HZKc/ge-lao-fu-zheng-tang-zhou.png'
    }
  },
  '外城/02商栈/广源号宅后院': {
    name: '广源号宅后院',
    fullPath: '外城/02商栈',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/MGqXMn6L/guang-yuan-hao-zhai-hou-yuan-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/fbCyxMy6/guang-yuan-hao-zhai-hou-yuan-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/d3bVq1Nk/guang-yuan-hao-zhai-hou-yuan-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/RCyF1sC9/guang-yuan-hao-zhai-hou-yuan-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/gjX0FRs9/guang-yuan-hao-zhai-hou-yuan-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/L5YsKfD5/guang-yuan-hao-zhai-hou-yuan-yin-zhou.png'
    }
  },
  '外城/02商栈/广源号宅门庭': {
    name: '广源号宅门庭',
    fullPath: '外城/02商栈',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/RZQZBv77/guang-yuan-hao-zhai-men-ting-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/TwhdgmZ2/guang-yuan-hao-zhai-men-ting-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/tTfX5JbQ/guang-yuan-hao-zhai-men-ting-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/7h2qQ4P8/guang-yuan-hao-zhai-men-ting-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/j5CxPNGX/guang-yuan-hao-zhai-men-ting-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/C1tFN5g7/guang-yuan-hao-zhai-men-ting-yin-zhou.png'
    }
  },
  '外城/02商栈/广源号宅账房': {
    name: '广源号宅账房',
    fullPath: '外城/02商栈',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/nhthgXDn/guang-yuan-hao-zhai-zhang-fang-ye.png',
      '昼': 'https://i.postimg.cc/dVmVYJ2V/guang-yuan-hao-zhai-zhang-fang-zhou.png'
    }
  },
  '外城/02商栈/广源号宅正堂': {
    name: '广源号宅正堂',
    fullPath: '外城/02商栈',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/QNwtg4N5/guang-yuan-hao-zhai-zheng-tang-ye.png',
      '昼': 'https://i.postimg.cc/pLtL4mns/guang-yuan-hao-zhai-zheng-tang-zhou.png'
    }
  },
  '外城/02商栈/恒昌号宅后院': {
    name: '恒昌号宅后院',
    fullPath: '外城/02商栈',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/7h0fJ02f/heng-chang-hao-zhai-hou-yuan-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/SRCJYCMw/heng-chang-hao-zhai-hou-yuan-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/QdXHVBxt/heng-chang-hao-zhai-hou-yuan-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/6p9yT75L/heng-chang-hao-zhai-hou-yuan-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/9X74k5n1/heng-chang-hao-zhai-hou-yuan-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/c47vs7ZG/heng-chang-hao-zhai-hou-yuan-yin-zhou.png'
    }
  },
  '外城/02商栈/恒昌号宅门庭': {
    name: '恒昌号宅门庭',
    fullPath: '外城/02商栈',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/tgcTr2d1/heng-chang-hao-zhai-men-ting-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/zfQBd0ww/heng-chang-hao-zhai-men-ting-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/brcvPrBZ/heng-chang-hao-zhai-men-ting-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/2yQSSYsx/heng-chang-hao-zhai-men-ting-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/d0f1W4Rb/heng-chang-hao-zhai-men-ting-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/W3J4xgXL/heng-chang-hao-zhai-men-ting-yin-zhou.png'
    }
  },
  '外城/02商栈/恒昌号宅账房': {
    name: '恒昌号宅账房',
    fullPath: '外城/02商栈',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/vZ3DnQ4H/heng-chang-hao-zhai-zhang-fang-ye.png',
      '昼': 'https://i.postimg.cc/0NjjdLSz/heng-chang-hao-zhai-zhang-fang-zhou.png'
    }
  },
  '外城/02商栈/恒昌号宅正堂': {
    name: '恒昌号宅正堂',
    fullPath: '外城/02商栈',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/SxDj9yJd/heng-chang-hao-zhai-zheng-tang-ye.png',
      '昼': 'https://i.postimg.cc/DwBmG28t/heng-chang-hao-zhai-zheng-tang-zhou.png'
    }
  },
  '内城/北城/11诸王邸/荆王府承运殿': {
    name: '荆王府承运殿',
    fullPath: '内城/北城/11诸王邸',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/GmQqVSpq/jing-wang-fu-cheng-yun-dian-ye.png',
      '昼': 'https://i.postimg.cc/s2gwr9Bn/jing-wang-fu-cheng-yun-dian-zhou.png'
    }
  },
  '内城/北城/11诸王邸/荆王府存心殿': {
    name: '荆王府存心殿',
    fullPath: '内城/北城/11诸王邸',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/G38gtQMC/jing-wang-fu-cun-xin-dian-ye.png',
      '昼': 'https://i.postimg.cc/sfQHxcn1/jing-wang-fu-cun-xin-dian-zhou.png'
    }
  },
  '内城/北城/11诸王邸/荆王府大门前庭': {
    name: '荆王府大门前庭',
    fullPath: '内城/北城/11诸王邸',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/26JHTbSX/jing-wang-fu-da-men-qian-ting-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/xC7sgJdD/jing-wang-fu-da-men-qian-ting-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/rsrfHVdR/jing-wang-fu-da-men-qian-ting-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/xjJp8R6g/jing-wang-fu-da-men-qian-ting-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/T1DtsdKB/jing-wang-fu-da-men-qian-ting-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/j27M1xWs/jing-wang-fu-da-men-qian-ting-yin-zhou.png'
    }
  },
  '内城/北城/11诸王邸/荆王府后园': {
    name: '荆王府后园',
    fullPath: '内城/北城/11诸王邸',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/3wtf4b55/jing-wang-fu-hou-yuan-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/s2THQ0dD/jing-wang-fu-hou-yuan-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/85sKhBNt/jing-wang-fu-hou-yuan-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/mDqdVzgj/jing-wang-fu-hou-yuan-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/85sKhBNz/jing-wang-fu-hou-yuan-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/V65GjBmq/jing-wang-fu-hou-yuan-yin-zhou.png'
    }
  },
  '内城/北城/11诸王邸/荆王府寝院': {
    name: '荆王府寝院',
    fullPath: '内城/北城/11诸王邸',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/3rsSvv6N/jing-wang-fu-qin-yuan-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/G3W7yyNY/jing-wang-fu-qin-yuan-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/qv01mdpC/jing-wang-fu-qin-yuan-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/Qdb0wnMg/jing-wang-fu-qin-yuan-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/bN16Hvcg/jing-wang-fu-qin-yuan-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/NjYdNwBP/jing-wang-fu-qin-yuan-yin-zhou.png'
    }
  },
  '内城/北城/11诸王邸/乐安郡王府大门前庭': {
    name: '乐安郡王府大门前庭',
    fullPath: '内城/北城/11诸王邸',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/L6kpqNJR/le-an-jun-wang-fu-da-men-qian-ting-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/BnqG2HFG/le-an-jun-wang-fu-da-men-qian-ting-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/3xnQ1Njv/le-an-jun-wang-fu-da-men-qian-ting-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/Qd0ZmCgS/le-an-jun-wang-fu-da-men-qian-ting-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/HkpCbXMk/le-an-jun-wang-fu-da-men-qian-ting-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/FH9Q03Sc/le-an-jun-wang-fu-da-men-qian-ting-yin-zhou.png'
    }
  },
  '内城/北城/11诸王邸/乐安郡王府后园': {
    name: '乐安郡王府后园',
    fullPath: '内城/北城/11诸王邸',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/pXMvXgXL/le-an-jun-wang-fu-hou-yuan-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/4NRGNrNh/le-an-jun-wang-fu-hou-yuan-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/9FPh4Jr1/le-an-jun-wang-fu-hou-yuan-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/3JjTynkM/le-an-jun-wang-fu-hou-yuan-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/BQf3QdQg/le-an-jun-wang-fu-hou-yuan-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/YqNH4bhQ/le-an-jun-wang-fu-hou-yuan-yin-zhou.png'
    }
  },
  '内城/北城/11诸王邸/乐安郡王府寝院': {
    name: '乐安郡王府寝院',
    fullPath: '内城/北城/11诸王邸',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/vZ3whT7j/le-an-jun-wang-fu-qin-yuan-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/vmTFNyXP/le-an-jun-wang-fu-qin-yuan-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/Gpfw0f5m/le-an-jun-wang-fu-qin-yuan-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/W4yLRyHm/le-an-jun-wang-fu-qin-yuan-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/yNx4bKn2/le-an-jun-wang-fu-qin-yuan-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/Bvb9V3M0/le-an-jun-wang-fu-qin-yuan-yin-zhou.png'
    }
  },
  '内城/北城/11诸王邸/乐安郡王府正堂': {
    name: '乐安郡王府正堂',
    fullPath: '内城/北城/11诸王邸',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/rmt6q9BC/le-an-jun-wang-fu-zheng-tang-ye.png',
      '昼': 'https://i.postimg.cc/1tNxyKkb/le-an-jun-wang-fu-zheng-tang-zhou.png'
    }
  },
  '外城/05洼地/临街杂院厢房': {
    name: '临街杂院厢房',
    fullPath: '外城/05洼地',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/wvtz7zmR/lin-jie-za-yuan-xiang-fang-ye.png',
      '昼': 'https://i.postimg.cc/FRfv7vLy/lin-jie-za-yuan-xiang-fang-zhou.png'
    }
  },
  '外城/05洼地/临街杂院院场': {
    name: '临街杂院院场',
    fullPath: '外城/05洼地',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/4dKGmG9S/lin-jie-za-yuan-yuan-chang-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/FR24S6yD/lin-jie-za-yuan-yuan-chang-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/D0LKPc5P/lin-jie-za-yuan-yuan-chang-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/ZYdZmTZb/lin-jie-za-yuan-yuan-chang-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/85qSvYdT/lin-jie-za-yuan-yuan-chang-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/vTfdtvXQ/lin-jie-za-yuan-yuan-chang-yin-zhou.png'
    }
  },
  '外城/05洼地/陋巷寒宅柴门': {
    name: '陋巷寒宅柴门',
    fullPath: '外城/05洼地',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/xdZ7pFxD/lou-xiang-han-zhai-chai-men-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/mDFnvNJ2/lou-xiang-han-zhai-chai-men-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/MZV4t51X/lou-xiang-han-zhai-chai-men-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/KvbWWTNx/lou-xiang-han-zhai-chai-men-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/6qJPt4xR/lou-xiang-han-zhai-chai-men-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/XqSP4B62/lou-xiang-han-zhai-chai-men-yin-zhou.png'
    }
  },
  '外城/05洼地/陋巷寒宅陋室': {
    name: '陋巷寒宅陋室',
    fullPath: '外城/05洼地',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/MpKF68N5/lou-xiang-han-zhai-lou-shi-ye.png',
      '昼': 'https://i.postimg.cc/9Q8NznjC/lou-xiang-han-zhai-lou-shi-zhou.png'
    }
  },
  '内城/北城/11诸王邸/岷王府承运殿': {
    name: '岷王府承运殿',
    fullPath: '内城/北城/11诸王邸',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/DZfWD8HR/min-wang-fu-cheng-yun-dian-ye.png',
      '昼': 'https://i.postimg.cc/PxfLcP0f/min-wang-fu-cheng-yun-dian-zhou.png'
    }
  },
  '内城/北城/11诸王邸/岷王府存心殿': {
    name: '岷王府存心殿',
    fullPath: '内城/北城/11诸王邸',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/rsPt5MnD/min-wang-fu-cun-xin-dian-ye.png',
      '昼': 'https://i.postimg.cc/8kKv2m1w/min-wang-fu-cun-xin-dian-zhou.png'
    }
  },
  '内城/北城/11诸王邸/岷王府大门前庭': {
    name: '岷王府大门前庭',
    fullPath: '内城/北城/11诸王邸',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/bvxb4XJk/min-wang-fu-da-men-qian-ting-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/RFvfBP6p/min-wang-fu-da-men-qian-ting-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/Vv6CSdFK/min-wang-fu-da-men-qian-ting-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/4yShps8F/min-wang-fu-da-men-qian-ting-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/XJnFb2Bv/min-wang-fu-da-men-qian-ting-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/QtS7xpcW/min-wang-fu-da-men-qian-ting-yin-zhou.png'
    }
  },
  '内城/北城/11诸王邸/岷王府后园': {
    name: '岷王府后园',
    fullPath: '内城/北城/11诸王邸',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/rFHSrC3x/min-wang-fu-hou-yuan-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/qMF83XSb/min-wang-fu-hou-yuan-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/DzkLCf2v/min-wang-fu-hou-yuan-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/43kV84Jh/min-wang-fu-hou-yuan-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/Mpj1bfJr/min-wang-fu-hou-yuan-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/Dwb1d4Kf/min-wang-fu-hou-yuan-yin-zhou.png'
    }
  },
  '内城/北城/11诸王邸/岷王府寝院': {
    name: '岷王府寝院',
    fullPath: '内城/北城/11诸王邸',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/HWZMq9Yp/min-wang-fu-qin-yuan-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/TYKbf51V/min-wang-fu-qin-yuan-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/Bv0PThgD/min-wang-fu-qin-yuan-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/7LnGmgsj/min-wang-fu-qin-yuan-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/9Fs7MXwN/min-wang-fu-qin-yuan-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/0ymJJgpz/min-wang-fu-qin-yuan-yin-zhou.png'
    }
  },
  '内城/西城/04勋贵/平江伯府门庭': {
    name: '平江伯府门庭',
    fullPath: '内城/西城/04勋贵',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/3Ndk8zKf/ping-jiang-bo-fu-men-ting-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/C5zRh9hg/ping-jiang-bo-fu-men-ting-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/sxqvvKx7/ping-jiang-bo-fu-men-ting-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/xj4kxjR7/ping-jiang-bo-fu-men-ting-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/4yqmmwyG/ping-jiang-bo-fu-men-ting-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/Vvpdd4vN/ping-jiang-bo-fu-men-ting-yin-zhou.png'
    }
  },
  '内城/西城/04勋贵/平江伯府院落': {
    name: '平江伯府院落',
    fullPath: '内城/西城/04勋贵',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/xj4kxj50/ping-jiang-bo-fu-yuan-luo-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/GhT4Z0gh/ping-jiang-bo-fu-yuan-luo-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/Gpd984Lp/ping-jiang-bo-fu-yuan-luo-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/hGchzXDL/ping-jiang-bo-fu-yuan-luo-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/K8X1b9C0/ping-jiang-bo-fu-yuan-luo-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/fRxJRcNw/ping-jiang-bo-fu-yuan-luo-yin-zhou.png'
    }
  },
  '内城/西城/04勋贵/平江伯府正堂': {
    name: '平江伯府正堂',
    fullPath: '内城/西城/04勋贵',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/Kz9KymyL/ping-jiang-bo-fu-zheng-tang-ye.png',
      '昼': 'https://i.postimg.cc/RhNWS2MQ/ping-jiang-bo-fu-zheng-tang-zhou.png'
    }
  },
  '外城/05洼地/青砖民院门庭': {
    name: '青砖民院门庭',
    fullPath: '外城/05洼地',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/XJF2HNBW/qing-zhuan-min-yuan-men-ting-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/Kj20dXtf/qing-zhuan-min-yuan-men-ting-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/Jznpw5Hq/qing-zhuan-min-yuan-men-ting-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/2SK2CL4D/qing-zhuan-min-yuan-men-ting-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/MZ7P1T8s/qing-zhuan-min-yuan-men-ting-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/Wbs98vND/qing-zhuan-min-yuan-men-ting-yin-zhou.png'
    }
  },
  '外城/05洼地/青砖民院正房': {
    name: '青砖民院正房',
    fullPath: '外城/05洼地',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/QMFY7JX5/qing-zhuan-min-yuan-zheng-fang-ye.png',
      '昼': 'https://i.postimg.cc/Gp67xT2M/qing-zhuan-min-yuan-zheng-fang-zhou.png'
    }
  },
  '内城/西城/04勋贵/清平伯府门庭': {
    name: '清平伯府门庭',
    fullPath: '内城/西城/04勋贵',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/PxM7XF6V/qing-ping-bo-fu-men-ting-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/Gth5HJNS/qing-ping-bo-fu-men-ting-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/5NyrJg88/qing-ping-bo-fu-men-ting-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/Qxzyd7qJ/qing-ping-bo-fu-men-ting-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/WzWfrqcb/qing-ping-bo-fu-men-ting-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/tR2c8wnp/qing-ping-bo-fu-men-ting-yin-zhou.png'
    }
  },
  '内城/西城/04勋贵/清平伯府院落': {
    name: '清平伯府院落',
    fullPath: '内城/西城/04勋贵',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/y8SrgNQ8/qing-ping-bo-fu-yuan-luo-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/nL4R2Pf1/qing-ping-bo-fu-yuan-luo-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/RhDXqrw0/qing-ping-bo-fu-yuan-luo-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/RCsPgt2C/qing-ping-bo-fu-yuan-luo-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/Pxd6RQtP/qing-ping-bo-fu-yuan-luo-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/PxK6svx0/qing-ping-bo-fu-yuan-luo-yin-zhou.png'
    }
  },
  '内城/西城/04勋贵/清平伯府正堂': {
    name: '清平伯府正堂',
    fullPath: '内城/西城/04勋贵',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/V6wTccF8/qing-ping-bo-fu-zheng-tang-ye.png',
      '昼': 'https://i.postimg.cc/RFm8zzTn/qing-ping-bo-fu-zheng-tang-zhou.png'
    }
  },
  '内城/西城/04勋贵/泰宁侯府大门前庭': {
    name: '泰宁侯府大门前庭',
    fullPath: '内城/西城/04勋贵',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/RVZkF4xv/tai-ning-hou-fu-da-men-qian-ting-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/TY3zwfvp/tai-ning-hou-fu-da-men-qian-ting-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/vH2pxkGN/tai-ning-hou-fu-da-men-qian-ting-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/dV7g261Q/tai-ning-hou-fu-da-men-qian-ting-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/tC4KTpG3/tai-ning-hou-fu-da-men-qian-ting-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/8PXqf9TL/tai-ning-hou-fu-da-men-qian-ting-yin-zhou.png'
    }
  },
  '内城/西城/04勋贵/泰宁侯府后院': {
    name: '泰宁侯府后院',
    fullPath: '内城/西城/04勋贵',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/wv5CtBBQ/tai-ning-hou-fu-hou-yuan-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/MHWh18cm/tai-ning-hou-fu-hou-yuan-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/ZnVXcDpR/tai-ning-hou-fu-hou-yuan-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/sfmFs18q/tai-ning-hou-fu-hou-yuan-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/5yxZ8MYJ/tai-ning-hou-fu-hou-yuan-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/7hmjVQ0y/tai-ning-hou-fu-hou-yuan-yin-zhou.png'
    }
  },
  '内城/西城/04勋贵/泰宁侯府花厅': {
    name: '泰宁侯府花厅',
    fullPath: '内城/西城/04勋贵',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/BvHyyvHg/tai-ning-hou-fu-hua-ting-ye.png',
      '昼': 'https://i.postimg.cc/9fZSSfZ6/tai-ning-hou-fu-hua-ting-zhou.png'
    }
  },
  '内城/西城/04勋贵/泰宁侯府正堂': {
    name: '泰宁侯府正堂',
    fullPath: '内城/西城/04勋贵',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/DwtHBGJv/tai-ning-hou-fu-zheng-tang-ye.png',
      '昼': 'https://i.postimg.cc/kgkzfS6x/tai-ning-hou-fu-zheng-tang-zhou.png'
    }
  },
  '内城/中城/01署馆/文林第门庭': {
    name: '文林第门庭',
    fullPath: '内城/中城/01署馆',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/vTtGdzn3/wen-lin-di-men-ting-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/Xqkn085P/wen-lin-di-men-ting-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/h4LDxSwF/wen-lin-di-men-ting-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/BQJqBrWV/wen-lin-di-men-ting-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/SQ6S8yPz/wen-lin-di-men-ting-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/bYxybz5m/wen-lin-di-men-ting-yin-zhou.png'
    }
  },
  '内城/中城/01署馆/文林第堂屋': {
    name: '文林第堂屋',
    fullPath: '内城/中城/01署馆',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/L5pm77J3/wen-lin-di-tang-wu-ye.png',
      '昼': 'https://i.postimg.cc/Y0ztw3Fx/wen-lin-di-tang-wu-zhou.png'
    }
  },
  '内城/西城/04勋贵/武安侯府大门前庭': {
    name: '武安侯府大门前庭',
    fullPath: '内城/西城/04勋贵',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/MKZSQ1Rh/wu-an-hou-fu-da-men-qian-ting-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/28HfF375/wu-an-hou-fu-da-men-qian-ting-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/2SMRMJJS/wu-an-hou-fu-da-men-qian-ting-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/26fp8WrX/wu-an-hou-fu-da-men-qian-ting-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/wTWdc3Qb/wu-an-hou-fu-da-men-qian-ting-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/x1cVsY6F/wu-an-hou-fu-da-men-qian-ting-yin-zhou.png'
    }
  },
  '内城/西城/04勋贵/武安侯府后院': {
    name: '武安侯府后院',
    fullPath: '内城/西城/04勋贵',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/j2trv71z/wu-an-hou-fu-hou-yuan-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/HndC3yN3/wu-an-hou-fu-hou-yuan-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/cChGzJy4/wu-an-hou-fu-hou-yuan-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/SQf4RgXt/wu-an-hou-fu-hou-yuan-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/90bHkf3J/wu-an-hou-fu-hou-yuan-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/5ygWrtdc/wu-an-hou-fu-hou-yuan-yin-zhou.png'
    }
  },
  '内城/西城/04勋贵/武安侯府花厅': {
    name: '武安侯府花厅',
    fullPath: '内城/西城/04勋贵',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/d1Rb700h/wu-an-hou-fu-hua-ting-ye.png',
      '昼': 'https://i.postimg.cc/761FCLL7/wu-an-hou-fu-hua-ting-zhou.png'
    }
  },
  '内城/西城/04勋贵/武安侯府正堂': {
    name: '武安侯府正堂',
    fullPath: '内城/西城/04勋贵',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/XJ0M75nX/wu-an-hou-fu-zheng-tang-ye.png',
      '昼': 'https://i.postimg.cc/85d2FCCs/wu-an-hou-fu-zheng-tang-zhou.png'
    }
  },
  '内城/北城/11诸王邸/襄王府承运殿': {
    name: '襄王府承运殿',
    fullPath: '内城/北城/11诸王邸',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/MZV0grP0/xiang-wang-fu-cheng-yun-dian-ye.png',
      '昼': 'https://i.postimg.cc/8PGdGB9R/xiang-wang-fu-cheng-yun-dian-zhou.png'
    }
  },
  '内城/北城/11诸王邸/襄王府存心殿': {
    name: '襄王府存心殿',
    fullPath: '内城/北城/11诸王邸',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/wj6kXckv/xiang-wang-fu-cun-xin-dian-ye.png',
      '昼': 'https://i.postimg.cc/CxmsmBvD/xiang-wang-fu-cun-xin-dian-zhou.png'
    }
  },
  '内城/北城/11诸王邸/襄王府大门前庭': {
    name: '襄王府大门前庭',
    fullPath: '内城/北城/11诸王邸',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/Y0Yx3dVH/xiang-wang-fu-da-men-qian-ting-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/fymvK8FJ/xiang-wang-fu-da-men-qian-ting-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/7Yr96yGC/xiang-wang-fu-da-men-qian-ting-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/VL9R0HXQ/xiang-wang-fu-da-men-qian-ting-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/SRCGrg5r/xiang-wang-fu-da-men-qian-ting-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/sfhKs2Xz/xiang-wang-fu-da-men-qian-ting-yin-zhou.png'
    }
  },
  '内城/北城/11诸王邸/襄王府后园': {
    name: '襄王府后园',
    fullPath: '内城/北城/11诸王邸',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/VNkD8Brs/xiang-wang-fu-hou-yuan-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/PqVKrpYN/xiang-wang-fu-hou-yuan-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/LXrTLcxx/xiang-wang-fu-hou-yuan-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/63D0nkHN/xiang-wang-fu-hou-yuan-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/QMYSx911/xiang-wang-fu-hou-yuan-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/0Q6n6k0n/xiang-wang-fu-hou-yuan-yin-zhou.png'
    }
  },
  '内城/北城/11诸王邸/襄王府寝院': {
    name: '襄王府寝院',
    fullPath: '内城/北城/11诸王邸',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/PqJzcX9j/xiang-wang-fu-qin-yuan-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/6QPLNsxh/xiang-wang-fu-qin-yuan-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/gjVvRnXN/xiang-wang-fu-qin-yuan-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/NGm8ZPJj/xiang-wang-fu-qin-yuan-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/Px8bX6dV/xiang-wang-fu-qin-yuan-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/1XhGfpt1/xiang-wang-fu-qin-yuan-yin-zhou.png'
    }
  },
  '内城/中城/01署馆/修职第门庭': {
    name: '修职第门庭',
    fullPath: '内城/中城/01署馆',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/sxFkxhyf/xiu-zhi-di-men-ting-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/j2zG7Sdw/xiu-zhi-di-men-ting-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/FsvtQ3DJ/xiu-zhi-di-men-ting-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/15rkRXdx/xiu-zhi-di-men-ting-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/Vvj3CkLg/xiu-zhi-di-men-ting-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/KcBXVJr4/xiu-zhi-di-men-ting-yin-zhou.png'
    }
  },
  '内城/中城/01署馆/修职第堂屋': {
    name: '修职第堂屋',
    fullPath: '内城/中城/01署馆',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/sxFkxhz6/xiu-zhi-di-tang-wu-ye.png',
      '昼': 'https://i.postimg.cc/1XxkXqPx/xiu-zhi-di-tang-wu-zhou.png'
    }
  },
  '外城/02商栈/盐商巨宅后院': {
    name: '盐商巨宅后院',
    fullPath: '外城/02商栈',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/DySxHZKr/yan-shang-ju-zhai-hou-yuan-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/Wbx5vv2W/yan-shang-ju-zhai-hou-yuan-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/6QXz8f4H/yan-shang-ju-zhai-hou-yuan-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/pdJCz5K3/yan-shang-ju-zhai-hou-yuan-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/mgM8Z5kG/yan-shang-ju-zhai-hou-yuan-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/52vn9Ryv/yan-shang-ju-zhai-hou-yuan-yin-zhou.png'
    }
  },
  '外城/02商栈/盐商巨宅门庭': {
    name: '盐商巨宅门庭',
    fullPath: '外城/02商栈',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/BZVgT010/yan-shang-ju-zhai-men-ting-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/XNz8fbyJ/yan-shang-ju-zhai-men-ting-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/m21SV5Qd/yan-shang-ju-zhai-men-ting-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/L6gVvbtp/yan-shang-ju-zhai-men-ting-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/mZ5wYsFM/yan-shang-ju-zhai-men-ting-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/J4HQK2b3/yan-shang-ju-zhai-men-ting-yin-zhou.png'
    }
  },
  '外城/02商栈/盐商巨宅账房': {
    name: '盐商巨宅账房',
    fullPath: '外城/02商栈',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/HnV9qSRf/yan-shang-ju-zhai-zhang-fang-ye.png',
      '昼': 'https://i.postimg.cc/d3pjw2KB/yan-shang-ju-zhai-zhang-fang-zhou.png'
    }
  },
  '外城/02商栈/盐商巨宅正堂': {
    name: '盐商巨宅正堂',
    fullPath: '外城/02商栈',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/nzVkkVk9/yan-shang-ju-zhai-zheng-tang-ye.png',
      '昼': 'https://i.postimg.cc/gJMKB9Ss/yan-shang-ju-zhai-zheng-tang-zhou.png'
    }
  },
  '内城/西城/04勋贵/长兴侯府大门前庭': {
    name: '长兴侯府大门前庭',
    fullPath: '内城/西城/04勋贵',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/8zSTtsFp/zhang-xing-hou-fu-da-men-qian-ting-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/13rsTP6b/zhang-xing-hou-fu-da-men-qian-ting-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/05Kxv7Dy/zhang-xing-hou-fu-da-men-qian-ting-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/pXNvLyJQ/zhang-xing-hou-fu-da-men-qian-ting-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/s2nyjcTK/zhang-xing-hou-fu-da-men-qian-ting-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/ZR2S3qtt/zhang-xing-hou-fu-da-men-qian-ting-yin-zhou.png'
    }
  },
  '内城/西城/04勋贵/长兴侯府后院': {
    name: '长兴侯府后院',
    fullPath: '内城/西城/04勋贵',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/TwHsSNCc/zhang-xing-hou-fu-hou-yuan-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/hvzYq8YD/zhang-xing-hou-fu-hou-yuan-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/L4G9gx2X/zhang-xing-hou-fu-hou-yuan-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/L6fHtj8N/zhang-xing-hou-fu-hou-yuan-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/HnqhWcGk/zhang-xing-hou-fu-hou-yuan-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/jqDqjpV9/zhang-xing-hou-fu-hou-yuan-yin-zhou.png'
    }
  },
  '内城/西城/04勋贵/长兴侯府花厅': {
    name: '长兴侯府花厅',
    fullPath: '内城/西城/04勋贵',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/W1TP0KK9/zhang-xing-hou-fu-hua-ting-ye.png',
      '昼': 'https://i.postimg.cc/pLCMCCbS/zhang-xing-hou-fu-hua-ting-zhou.png'
    }
  },
  '内城/西城/04勋贵/长兴侯府正堂': {
    name: '长兴侯府正堂',
    fullPath: '内城/西城/04勋贵',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/7YgkGDBy/zhang-xing-hou-fu-zheng-tang-ye.png',
      '昼': 'https://i.postimg.cc/dVwKGXX1/zhang-xing-hou-fu-zheng-tang-zhou.png'
    }
  },
  '皇城/01衙署/掌印宅家庙': {
    name: '掌印宅家庙',
    fullPath: '皇城/01衙署',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/x8v11Qww/zhang-yin-zhai-jia-miao-ye.png',
      '昼': 'https://i.postimg.cc/h4Tjr8Xv/zhang-yin-zhai-jia-miao-zhou.png'
    }
  },
  '皇城/01衙署/掌印宅门庭': {
    name: '掌印宅门庭',
    fullPath: '皇城/01衙署',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/rwFwMvQC/zhang-yin-zhai-men-ting-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/bwCNJ3B6/zhang-yin-zhai-men-ting-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/pd3WQyx4/zhang-yin-zhai-men-ting-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/50vxs12M/zhang-yin-zhai-men-ting-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/FHWsRD61/zhang-yin-zhai-men-ting-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/vm4865R9/zhang-yin-zhai-men-ting-yin-zhou.png'
    }
  },
  '皇城/01衙署/掌印宅密室': {
    name: '掌印宅密室',
    fullPath: '皇城/01衙署',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/qByRLcNQ/zhang-yin-zhai-mi-shi-ye.png',
      '昼': 'https://i.postimg.cc/mZCDw3Pn/zhang-yin-zhai-mi-shi-zhou.png'
    }
  },
  '皇城/01衙署/掌印宅正堂': {
    name: '掌印宅正堂',
    fullPath: '皇城/01衙署',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/rFTpYdWy/zhang-yin-zhai-zheng-tang-ye.png',
      '昼': 'https://i.postimg.cc/7YNLvxM0/zhang-yin-zhai-zheng-tang-zhou.png'
    }
  },
  '内城/西城/04勋贵/镇国公府大门前庭': {
    name: '镇国公府大门前庭',
    fullPath: '内城/西城/04勋贵',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/dVyJ9rQb/zhen-guo-gong-fu-da-men-qian-ting-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/R0x4phNK/zhen-guo-gong-fu-da-men-qian-ting-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/900hwqNp/zhen-guo-gong-fu-da-men-qian-ting-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/8kXDQtjw/zhen-guo-gong-fu-da-men-qian-ting-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/SKLqB490/zhen-guo-gong-fu-da-men-qian-ting-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/hjpnG0MG/zhen-guo-gong-fu-da-men-qian-ting-yin-zhou.png'
    }
  },
  '内城/西城/04勋贵/镇国公府花厅': {
    name: '镇国公府花厅',
    fullPath: '内城/西城/04勋贵',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/CK7XCxDS/zhen-guo-gong-fu-hua-ting-ye.png',
      '昼': 'https://i.postimg.cc/SsK5gb79/zhen-guo-gong-fu-hua-ting-zhou.png'
    }
  },
  '内城/西城/04勋贵/镇国公府寝院': {
    name: '镇国公府寝院',
    fullPath: '内城/西城/04勋贵',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/SQ1qFDns/zhen-guo-gong-fu-qin-yuan-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/ZK1S0nPd/zhen-guo-gong-fu-qin-yuan-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/pdvMYS6q/zhen-guo-gong-fu-qin-yuan-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/9M832QFM/zhen-guo-gong-fu-qin-yuan-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/SxCp94Vt/zhen-guo-gong-fu-qin-yuan-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/NjmwXtps/zhen-guo-gong-fu-qin-yuan-yin-zhou.png'
    }
  },
  '内城/西城/04勋贵/镇国公府演武园': {
    name: '镇国公府演武园',
    fullPath: '内城/西城/04勋贵',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/HWNGPnN1/zhen-guo-gong-fu-yan-wu-yuan-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/WbJRRjRZ/zhen-guo-gong-fu-yan-wu-yuan-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/Bnxd6gnS/zhen-guo-gong-fu-yan-wu-yuan-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/25rgBZ1Z/zhen-guo-gong-fu-yan-wu-yuan-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/kgr0qZ9Q/zhen-guo-gong-fu-yan-wu-yuan-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/Gm0WdNdn/zhen-guo-gong-fu-yan-wu-yuan-yin-zhou.png'
    }
  },
  '内城/西城/04勋贵/镇国公府正堂': {
    name: '镇国公府正堂',
    fullPath: '内城/西城/04勋贵',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/hvfktRfM/zhen-guo-gong-fu-zheng-tang-ye.png',
      '昼': 'https://i.postimg.cc/3NdsxQkr/zhen-guo-gong-fu-zheng-tang-zhou.png'
    }
  },
  '内城/中城/01署馆/中宪第门庭': {
    name: '中宪第门庭',
    fullPath: '内城/中城/01署馆',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/SxqmVHB2/zhong-xian-di-men-ting-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/13HsdJS6/zhong-xian-di-men-ting-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/HLvHYnVn/zhong-xian-di-men-ting-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/RF3mNmHF/zhong-xian-di-men-ting-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/HLkd1XW4/zhong-xian-di-men-ting-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/CKxSpkL0/zhong-xian-di-men-ting-yin-zhou.png'
    }
  },
  '内城/中城/01署馆/中宪第庭院': {
    name: '中宪第庭院',
    fullPath: '内城/中城/01署馆',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/FFMrkYGH/zhong-xian-di-ting-yuan-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/h4kDQXMT/zhong-xian-di-ting-yuan-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/dtGq2JSS/zhong-xian-di-ting-yuan-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/DwF75Rtp/zhong-xian-di-ting-yuan-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/YqQp6tyG/zhong-xian-di-ting-yuan-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/MK1W7zr1/zhong-xian-di-ting-yuan-yin-zhou.png'
    }
  },
  '内城/中城/01署馆/中宪第正房': {
    name: '中宪第正房',
    fullPath: '内城/中城/01署馆',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/521fpDZh/zhong-xian-di-zheng-fang-ye.png',
      '昼': 'https://i.postimg.cc/kg97wL0q/zhong-xian-di-zheng-fang-zhou.png'
    }
  },
  '内城/西城/04勋贵/忠勇伯府门庭': {
    name: '忠勇伯府门庭',
    fullPath: '内城/西城/04勋贵',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/pVwjVXF8/zhong-yong-bo-fu-men-ting-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/XNR5N7Cs/zhong-yong-bo-fu-men-ting-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/bw82bCLk/zhong-yong-bo-fu-men-ting-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/mgw1SY6V/zhong-yong-bo-fu-men-ting-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/Ghvy4wFg/zhong-yong-bo-fu-men-ting-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/9QVqT81V/zhong-yong-bo-fu-men-ting-yin-zhou.png'
    }
  },
  '内城/西城/04勋贵/忠勇伯府院落': {
    name: '忠勇伯府院落',
    fullPath: '内城/西城/04勋贵',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/pdLhcmg6/zhong-yong-bo-fu-yuan-luo-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/xd1JpXw1/zhong-yong-bo-fu-yuan-luo-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/9MvDfJr5/zhong-yong-bo-fu-yuan-luo-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/vBp4m3cc/zhong-yong-bo-fu-yuan-luo-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/yNpJMVKm/zhong-yong-bo-fu-yuan-luo-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/1tggPLRY/zhong-yong-bo-fu-yuan-luo-yin-zhou.png'
    }
  },
  '内城/西城/04勋贵/忠勇伯府正堂': {
    name: '忠勇伯府正堂',
    fullPath: '内城/西城/04勋贵',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/grbmC7ry/zhong-yong-bo-fu-zheng-tang-ye.png',
      '昼': 'https://i.postimg.cc/dQkdKTL1/zhong-yong-bo-fu-zheng-tang-zhou.png'
    }
  },
  '宫城/04六宫/宝月宫前院': {
    name: '宝月宫前院',
    fullPath: '宫城/04六宫',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/W4Qwrmy6/bao-yue-gong-qian-yuan-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/xCMyPJrG/bao-yue-gong-qian-yuan-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/ZnmPsbZX/bao-yue-gong-qian-yuan-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/x8QGpfn0/bao-yue-gong-qian-yuan-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/9MZtBR3S/bao-yue-gong-qian-yuan-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/PJHbVXhV/bao-yue-gong-qian-yuan-yin-zhou.png'
    }
  },
  '宫城/04六宫/宝月宫寝阁': {
    name: '宝月宫寝阁',
    fullPath: '宫城/04六宫',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/fys7qzDV/bao-yue-gong-qin-ge-ye.png',
      '昼': 'https://i.postimg.cc/XqgfTRYq/bao-yue-gong-qin-ge-zhou.png'
    }
  },
  '宫城/04六宫/宝月宫正殿': {
    name: '宝月宫正殿',
    fullPath: '宫城/04六宫',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/x8PvWw1L/bao-yue-gong-zheng-dian-ye.png',
      '昼': 'https://i.postimg.cc/3NZXPsxB/bao-yue-gong-zheng-dian-zhou.png'
    }
  },
  '宫城/04六宫/澄心宫前院': {
    name: '澄心宫前院',
    fullPath: '宫城/04六宫',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/7P1nG2n4/cheng-xin-gong-qian-yuan-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/3rjF4vFk/cheng-xin-gong-qian-yuan-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/Nfg71jdV/cheng-xin-gong-qian-yuan-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/wT05FYr4/cheng-xin-gong-qian-yuan-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/KvZrn804/cheng-xin-gong-qian-yuan-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/wT6chjwh/cheng-xin-gong-qian-yuan-yin-zhou.png'
    }
  },
  '宫城/04六宫/澄心宫寝阁': {
    name: '澄心宫寝阁',
    fullPath: '宫城/04六宫',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/GhqPznf6/cheng-xin-gong-qin-ge-ye.png',
      '昼': 'https://i.postimg.cc/nc0KTf5J/cheng-xin-gong-qin-ge-zhou.png'
    }
  },
  '宫城/04六宫/澄心宫正殿': {
    name: '澄心宫正殿',
    fullPath: '宫城/04六宫',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/DyBQ53Dz/cheng-xin-gong-zheng-dian-ye.png',
      '昼': 'https://i.postimg.cc/52yBRkdY/cheng-xin-gong-zheng-dian-zhou.png'
    }
  },
  '宫城/04六宫/青芜宫前院': {
    name: '青芜宫前院',
    fullPath: '宫城/04六宫',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/P57WszTw/qing-wu-gong-qian-yuan-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/FH6y5gNx/qing-wu-gong-qian-yuan-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/MT21X6cs/qing-wu-gong-qian-yuan-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/HxwXyq53/qing-wu-gong-qian-yuan-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/NMqRLsyj/qing-wu-gong-qian-yuan-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/0QR7rk67/qing-wu-gong-qian-yuan-yin-zhou.png'
    }
  },
  '宫城/04六宫/青芜宫寝阁': {
    name: '青芜宫寝阁',
    fullPath: '宫城/04六宫',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/vBrfVJ9S/qing-wu-gong-qin-ge-ye.png',
      '昼': 'https://i.postimg.cc/ydmcZMcC/qing-wu-gong-qin-ge-zhou.png'
    }
  },
  '宫城/04六宫/青芜宫正殿': {
    name: '青芜宫正殿',
    fullPath: '宫城/04六宫',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/L5mfBxBG/qing-wu-gong-zheng-dian-ye.png',
      '昼': 'https://i.postimg.cc/RhvfQgLS/qing-wu-gong-zheng-dian-zhou.png'
    }
  },
  '外城/03会馆/沅溪会馆客房': {
    name: '沅溪会馆客房',
    fullPath: '外城/03会馆',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/Zn0fxYcK/yuan-xi-hui-guan-ke-fang-ye.png',
      '昼': 'https://i.postimg.cc/d3DWjQBy/yuan-xi-hui-guan-ke-fang-zhou.png'
    }
  },
  '外城/03会馆/沅溪会馆门庭': {
    name: '沅溪会馆门庭',
    fullPath: '外城/03会馆',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/2yJ0cpcH/yuan-xi-hui-guan-men-ting-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/CM6rLDhz/yuan-xi-hui-guan-men-ting-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/c4pDfS86/yuan-xi-hui-guan-men-ting-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/Kv69t2gT/yuan-xi-hui-guan-men-ting-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/4N7LKdyB/yuan-xi-hui-guan-men-ting-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/qMPm2T6F/yuan-xi-hui-guan-men-ting-yin-zhou.png'
    }
  },
  '外城/03会馆/云间会馆客房': {
    name: '云间会馆客房',
    fullPath: '外城/03会馆',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/Fs86GSw7/yun-jian-hui-guan-ke-fang-ye.png',
      '昼': 'https://i.postimg.cc/0ySB4Qqy/yun-jian-hui-guan-ke-fang-zhou.png'
    }
  },
  '外城/03会馆/云间会馆门庭': {
    name: '云间会馆门庭',
    fullPath: '外城/03会馆',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/3xGcqRHX/yun-jian-hui-guan-men-ting-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/nLtPfJH0/yun-jian-hui-guan-men-ting-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/76KszJgy/yun-jian-hui-guan-men-ting-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/d3DWjQBP/yun-jian-hui-guan-men-ting-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/Jhcd120h/yun-jian-hui-guan-men-ting-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/d1sNDjZ5/yun-jian-hui-guan-men-ting-yin-zhou.png'
    }
  },
};

/** 复用场景模板池
 *  key: 场景名（无路径前缀） */
export const TEMPLATE_LOCATIONS: Record<string, TemplateLocationEntry> = {
  '石桥': {
    name: '石桥',
    type: 'outdoor',
    variants: {
      '阴夜': 'https://i.postimg.cc/J0N7pK0R/shi-qiao-yin-ye.png',
      '晴夜': 'https://i.postimg.cc/50H6Sw84/shi-qiao-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/KjBjdx96/shi-qiao-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/BnQZCTGR/shi-qiao-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/FKY9Mhzw/shi-qiao-xue-zhou.png',
      '阴昼': 'https://i.postimg.cc/9XZfXXbM/shi-qiao-yin-zhou.png'
    }
  },
  '草户农家堂屋': {
    name: '草户农家堂屋',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/s24B2jsJ/cao-hu-nong-jia-tang-wu-ye.png',
      '昼': 'https://i.postimg.cc/V6sJrxNP/cao-hu-nong-jia-tang-wu-zhou.png'
    }
  },
  '草户农家院': {
    name: '草户农家院',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/bJ6sQmGG/cao-hu-nong-jia-yuan-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/wM73FDJ5/cao-hu-nong-jia-yuan-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/Kv3RMrmc/cao-hu-nong-jia-yuan-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/Gm09J8pP/cao-hu-nong-jia-yuan-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/WzCzyt6C/cao-hu-nong-jia-yuan-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/BZVjbw9M/cao-hu-nong-jia-yuan-yin-zhou.png'
    }
  },
  '粮仓庄园仓房': {
    name: '粮仓庄园仓房',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/vmF9B2nJ/liang-cang-zhuang-yuan-cang-fang-ye.png',
      '昼': 'https://i.postimg.cc/nL4mQKYL/liang-cang-zhuang-yuan-cang-fang-zhou.png'
    }
  },
  '粮仓庄园场院': {
    name: '粮仓庄园场院',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/nznDKs0G/liang-cang-zhuang-yuan-chang-yuan-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/bJL2mz5f/liang-cang-zhuang-yuan-chang-yuan-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/2yKLf0mT/liang-cang-zhuang-yuan-chang-yuan-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/XqzB0s46/liang-cang-zhuang-yuan-chang-yuan-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/x8CN7wrb/liang-cang-zhuang-yuan-chang-yuan-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/VvV0cK1X/liang-cang-zhuang-yuan-chang-yuan-yin-zhou.png'
    }
  },
  '粮仓庄园正房': {
    name: '粮仓庄园正房',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/ZY7d353v/liang-cang-zhuang-yuan-zheng-fang-ye.png',
      '昼': 'https://i.postimg.cc/wxfmJjJD/liang-cang-zhuang-yuan-zheng-fang-zhou.png'
    }
  },
  '石屋山户石屋': {
    name: '石屋山户石屋',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/4xMP1191/shi-wu-shan-hu-shi-wu-ye.png',
      '昼': 'https://i.postimg.cc/MGQD3j0z/shi-wu-shan-hu-shi-wu-zhou.png'
    }
  },
  '石屋山户院': {
    name: '石屋山户院',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/j5Yhpdvf/shi-wu-shan-hu-yuan-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/C5FsKPWv/shi-wu-shan-hu-yuan-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/bNwRc50g/shi-wu-shan-hu-yuan-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/TYNJRcCd/shi-wu-shan-hu-yuan-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/cCXMt7W8/shi-wu-shan-hu-yuan-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/bYTR5PnS/shi-wu-shan-hu-yuan-yin-zhou.png'
    }
  },
  '瓦舍农家堂屋': {
    name: '瓦舍农家堂屋',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/CMHvVDWv/wa-she-nong-jia-tang-wu-ye.png',
      '昼': 'https://i.postimg.cc/NG7NwT3B/wa-she-nong-jia-tang-wu-zhou.png'
    }
  },
  '瓦舍农家院': {
    name: '瓦舍农家院',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/ryChLWBD/wa-she-nong-jia-yuan-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/dts5Q3F1/wa-she-nong-jia-yuan-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/Hs6BrmW2/wa-she-nong-jia-yuan-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/gkgNxpkd/wa-she-nong-jia-yuan-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/FsrTFzv0/wa-she-nong-jia-yuan-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/Yqrd207R/wa-she-nong-jia-yuan-yin-zhou.png'
    }
  },
  '苇棚户柴门': {
    name: '苇棚户柴门',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/MZPQRpRP/wei-peng-hu-chai-men-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/PrC8MnzV/wei-peng-hu-chai-men-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/MKgfP39J/wei-peng-hu-chai-men-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/6pR2DVPZ/wei-peng-hu-chai-men-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/SNnzGbfF/wei-peng-hu-chai-men-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/qMNCGHxJ/wei-peng-hu-chai-men-yin-zhou.png'
    }
  },
  '苇棚户棚屋': {
    name: '苇棚户棚屋',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/6QX2w2sM/wei-peng-hu-peng-wu-ye.png',
      '昼': 'https://i.postimg.cc/xd3kdfnQ/wei-peng-hu-peng-wu-zhou.png'
    }
  },
  '砖屏农家堂屋': {
    name: '砖屏农家堂屋',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/mgcNhF51/zhuan-ping-nong-jia-tang-wu-ye.png',
      '昼': 'https://i.postimg.cc/JhZN5CmW/zhuan-ping-nong-jia-tang-wu-zhou.png'
    }
  },
  '砖屏农家院': {
    name: '砖屏农家院',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/B63xh7Q5/zhuan-ping-nong-jia-yuan-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/hvPVnJd6/zhuan-ping-nong-jia-yuan-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/bN51XwwG/zhuan-ping-nong-jia-yuan-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/XYydn6rs/zhuan-ping-nong-jia-yuan-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/FzW3H9bT/zhuan-ping-nong-jia-yuan-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/fTyYg9ZP/zhuan-ping-nong-jia-yuan-yin-zhou.png'
    }
  },
  '祠堂': {
    name: '祠堂',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/Wbch0qzM/ci-tang-ye.png',
      '昼': 'https://i.postimg.cc/J43tx7H3/ci-tang-zhou.png'
    }
  },
  '孤坟': {
    name: '孤坟',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/WpC4TFgn/gu-fen-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/jdfS5x41/gu-fen-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/L8B4txwp/gu-fen-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/MG66dyJW/gu-fen-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/NfXjMsxG/gu-fen-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/g2PkLCMh/gu-fen-yin-zhou.png'
    }
  },
  '河湾渡口': {
    name: '河湾渡口',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/2yZrVGhw/he-wan-du-kou-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/23NmvWxj/he-wan-du-kou-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/cLmgx1sK/he-wan-du-kou-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/jjSWLV5B/he-wan-du-kou-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/662vrN0J/he-wan-du-kou-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/NfR2n7S7/he-wan-du-kou-yin-zhou.png'
    }
  },
  '荒庙': {
    name: '荒庙',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/8Pds4kfn/huang-miao-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/RV1qdCnr/huang-miao-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/5ty0fw7S/huang-miao-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/nLrznvSx/huang-miao-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/6p9qmsdt/huang-miao-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/HkBnGS2x/huang-miao-yin-zhou.png'
    }
  },
  '井台': {
    name: '井台',
    type: 'outdoor',
    variants: {
      '晴夜': 'https://i.postimg.cc/fRxyHz3r/jing-tai-qing-ye.png',
      '晴昼': 'https://i.postimg.cc/8CN592M5/jing-tai-qing-zhou.png',
      '雪夜': 'https://i.postimg.cc/qRZvtgYR/jing-tai-xue-ye.png',
      '雪昼': 'https://i.postimg.cc/NF9fRBqK/jing-tai-xue-zhou.png',
      '阴夜': 'https://i.postimg.cc/ZqHRSwx6/jing-tai-yin-ye.png',
      '阴昼': 'https://i.postimg.cc/DZzzy1xY/jing-tai-yin-zhou.png'
    }
  },
  '山神庙': {
    name: '山神庙',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/vmYY3Wwr/shan-shen-miao-ye.png',
      '昼': 'https://i.postimg.cc/rpf8bKqQ/shan-shen-miao-zhou.png'
    }
  },
  '水磨坊': {
    name: '水磨坊',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/HxjpCdLR/shui-mo-fang-ye.png',
      '昼': 'https://i.postimg.cc/NMVQsS9K/shui-mo-fang-zhou.png'
    }
  },
  '土地庙': {
    name: '土地庙',
    type: 'indoor',
    variants: {
      '夜': 'https://i.postimg.cc/2yb8nrRG/tu-de-miao-ye.png',
      '昼': 'https://i.postimg.cc/kG0Mcz7r/tu-de-miao-zhou.png'
    }
  },
};

/** 获取某个地点的图片 URL
 *  @param locationKey 地点路径，如 "内城/北城/07肃王府/肃王府大门前庭" 或 "荒庙"
 *  @param variant 图片变体类型
 */
export function getLocationImage(
  locationKey: string,
  variant: ImageVariant,
): string | undefined {
  // 1. 先在常驻地点中精确匹配
  const resident = RESIDENT_LOCATIONS[locationKey];
  if (resident) return resident.variants[variant];

  // 2. 按 / 分割，取最后一段作为场景名，在模板池中查找
  const parts = locationKey.split('/');
  const sceneName = parts[parts.length - 1];
  const template = TEMPLATE_LOCATIONS[sceneName];
  if (template) return template.variants[variant];

  // 3. 都找不到
  return undefined;
}

/** 模糊查找地点图片
 *  支持部分路径匹配，如 "肃王府/大门前庭" 也能匹配到 "内城/北城/07肃王府/肃王府大门前庭"
 *  @param locationKey 地点路径（完整或部分）
 *  @param variant 图片变体类型
 */
export function getLocationImageFuzzy(
  locationKey: string,
  variant: ImageVariant,
): string | undefined {
  // 精确匹配
  const exact = getLocationImage(locationKey, variant);
  if (exact) return exact;

  // 模糊匹配：在常驻地点中查找以 locationKey 结尾的 key
  for (const [key, entry] of Object.entries(RESIDENT_LOCATIONS)) {
    if (key.endsWith('/' + locationKey) || key === locationKey) {
      return entry.variants[variant];
    }
  }

  // 模板池模糊匹配
  const parts = locationKey.split('/');
  const sceneName = parts[parts.length - 1];
  const template = TEMPLATE_LOCATIONS[sceneName];
  if (template) return template.variants[variant];

  return undefined;
}

/** 获取某个路径前缀下所有常驻地点 */
export function getLocationsByPath(pathPrefix: string): ResidentLocationEntry[] {
  return Object.entries(RESIDENT_LOCATIONS)
    .filter(([key]) => key.startsWith(pathPrefix))
    .map(([, entry]) => entry);
}

/** 获取所有顶级区域 */
export function getTopLevelAreas(): string[] {
  return [...new Set(Object.values(RESIDENT_LOCATIONS).map(e => e.fullPath.split('/')[0]))];
}

/** 获取某个路径下直接的子节点（区域/分区/场景） */
export function getChildNodes(pathPrefix: string): { name: string; isLeaf: boolean }[] {
  const prefix = pathPrefix ? pathPrefix + '/' : '';
  const result = new Map<string, boolean>();

  for (const [key] of Object.entries(RESIDENT_LOCATIONS)) {
    if (!key.startsWith(prefix)) continue;
    const rest = key.slice(prefix.length);
    const parts = rest.split('/');
    if (parts.length === 1) {
      // 叶子节点
      result.set(parts[0], true);
    } else {
      // 中间节点
      result.set(parts[0], false);
    }
  }

  return Array.from(result.entries()).map(([name, isLeaf]) => ({ name, isLeaf }));
}

/** 获取所有复用场景模板名称 */
export function getTemplateNames(): string[] {
  return Object.keys(TEMPLATE_LOCATIONS);
}

/** 获取总地点数量 */
export function getTotalLocationCount(): number {
  return Object.keys(RESIDENT_LOCATIONS).length + Object.keys(TEMPLATE_LOCATIONS).length;
}
