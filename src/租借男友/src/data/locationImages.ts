/**
 * 地点背景图片映射（白日/夜晚）
 *
 * 使用嵌套结构：{ parentLocation: { spotName: { day, night } } }
 * 这样可以避免不同地点下同名子位置（如"客厅"）的冲突。
 *
 * 时间规则：19:00 - 5:59 为夜晚，6:00 - 18:59 为白日。
 */

export type LocationImage = {
  day: string;
  night: string;
};

export const LOCATION_IMAGES: Record<string, Record<string, LocationImage>> = {
  // ============================================================
  // 燕大校区（教学区/艺术区/生活区/休息区/公共区 的所有子位置）
  // ============================================================
  "燕大校区": {
    // === 教学区 - A区教室 ===
    "A101阶梯教室": {
      day: "https://i.postimg.cc/Gh8DxHQD/A101jie-ti-jiao-shi-bai-ri.png",
      night: "https://i.postimg.cc/8PJvmjH6/A101jie-ti-jiao-shi-ye-wan.png",
    },
    "A204教室": {
      day: "https://i.postimg.cc/Gh8DxHQs/A204jiao-shi-bai-ri.png",
      night: "https://i.postimg.cc/Nf9Xk542/A204jiao-shi-ye-wan.png",
    },
    "A302教室": {
      day: "https://i.postimg.cc/5NYzS63B/A302jiao-shi-bai-ri.png",
      night: "https://i.postimg.cc/rF04NKJN/A302jiao-shi-ye-wan.png",
    },

    // === 教学区 - B区教室 ===
    "B102教室": {
      day: "https://i.postimg.cc/kgZqFgTx/B102jiao-shi-bai-ri.png",
      night: "https://i.postimg.cc/RZ84QZgf/B102jiao-shi-ye-wan.png",
    },
    "B206教室": {
      day: "https://i.postimg.cc/rwbMCwfr/B206jiao-shi-bai-ri.png",
      night: "https://i.postimg.cc/RZ84QZgW/B206jiao-shi-ye-wan.png",
    },
    "B305教室": {
      day: "https://i.postimg.cc/439Z8R0v/B305jiao-shi-bai-ri.png",
      night: "https://i.postimg.cc/CKqYvp2m/B305jiao-shi-ye-wan.png",
    },

    // === 教学区 - C区教室 ===
    "C204自习室": {
      day: "https://i.postimg.cc/7L083MCB/C204zi-xi-shi-bai-ri.png",
      night: "https://i.postimg.cc/1zwhGcgv/C204zi-xi-shi-ye-wan.png",
    },
    "C301多媒体教室": {
      day: "https://i.postimg.cc/jjP0HQWZ/C301duo-mei-ti-jiao-shi-bai-ri.png",
      night: "https://i.postimg.cc/BvH9Tc87/C301duo-mei-ti-jiao-shi-ye-wan.png",
    },
    "C405开放画室": {
      day: "https://i.postimg.cc/CKkTGHZQ/C405kai-fang-hua-shi-bai-ri.png",
      night: "https://i.postimg.cc/7L083MCc/C405kai-fang-hua-shi-ye-wan.png",
    },

    // === 教学区 - 形势与政策教研室 ===
    "燕大形势与政策教研室": {
      day: "https://i.postimg.cc/bNSvD7Md/yan-da-xing-shi-yu-zheng-ce-jiao-yan-shi-bai-ri.png",
      night: "https://i.postimg.cc/htFt9CWc/yan-da-xing-shi-yu-zheng-ce-jiao-yan-shi-ye-wan.png",
    },

    // === 艺术区 - 艺术楼 ===
    "艺术楼一楼大厅": {
      day: "https://i.postimg.cc/d1sHh8G3/yi-shu-lou-yi-lou-da-ting-bai-ri.png",
      night: "https://i.postimg.cc/vBYq4W54/yi-shu-lou-yi-lou-da-ting-ye-wan.png",
    },
    "艺术楼二楼排练厅": {
      day: "https://i.postimg.cc/9ftgXxRK/yi-shu-lou-er-lou-pai-lian-ting-bai-ri.png",
      night: "https://i.postimg.cc/xdypjsJw/yi-shu-lou-er-lou-pai-lian-ting-ye-wan.png",
    },
    "艺术楼练功房": {
      day: "https://i.postimg.cc/QMkYN69y/yi-shu-lou-lian-gong-fang-bai-ri.png",
      night: "https://i.postimg.cc/W46Yp9Ff/yi-shu-lou-lian-gong-fang-ye-wan.png",
    },
    "艺术楼四楼理论教室": {
      day: "https://i.postimg.cc/KYrpc93K/yi-shu-lou-si-lou-li-lun-jiao-shi-bai-ri.png",
      night: "https://i.postimg.cc/Xvc1N2Br/yi-shu-lou-si-lou-li-lun-jiao-shi-ye-wan.png",
    },
    "艺术楼琴房": {
      day: "https://i.postimg.cc/6QLb6H4T/yi-shu-lou-qin-fang-bai-ri.png",
      night: "https://i.postimg.cc/s29HfnGv/yi-shu-lou-qin-fang-ye-wan.png",
    },

    // === 生活区 - 食堂 ===
    "食堂一楼": {
      day: "https://i.postimg.cc/Mpsb9hBH/shi-tang-yi-lou-bai-ri.png",
      night: "https://i.postimg.cc/qvmX19Kz/shi-tang-yi-lou-ye-wan.png",
    },
    "食堂二楼": {
      day: "https://i.postimg.cc/RZPQgjtm/shi-tang-er-lou-bai-ri.png",
      night: "https://i.postimg.cc/htCb2Hmc/shi-tang-er-lou-ye-wan.png",
    },
    "食堂三楼": {
      day: "https://i.postimg.cc/CxvHcW8Y/shi-tang-san-lou-bai-ri.png",
      night: "https://i.postimg.cc/4x8bWrcg/shi-tang-san-lou-ye-wan.png",
    },

    // === 生活区 - 西区宿舍楼 ===
    "宿舍楼大门": {
      day: "https://i.postimg.cc/G3ZfQsCf/su-she-lou-da-men-bai-ri.png",
      night: "https://i.postimg.cc/fW6PK0NF/su-she-lou-da-men-ye-wan.png",
    },
    "宿管台": {
      day: "https://i.postimg.cc/7PpRVTkt/su-guan-tai-bai-ri.png",
      night: "https://i.postimg.cc/KcdWNg29/su-guan-tai-ye-wan.png",
    },
    "温知晚宿舍": {
      day: "https://i.postimg.cc/Y2JP3mHT/wen-zhi-wan-su-she-bai-ri.png",
      night: "https://i.postimg.cc/J79FqB8W/wen-zhi-wan-su-she-ye-wan.png",
    },
    "步玲燕宿舍": {
      day: "https://i.postimg.cc/pVgSZnHG/bu-ling-yan-su-she-bai-ri.png",
      night: "https://i.postimg.cc/dQzfBTY5/bu-ling-yan-su-she-ye-wan.png",
    },
    "周念安宿舍": {
      day: "https://i.postimg.cc/59Zr3FJV/zhou-nian-an-su-she-bai-ri.png",
      night: "https://i.postimg.cc/7PpRVT4L/zhou-nian-an-su-ye-wan-she.png",
    },
    "椎名律宿舍": {
      day: "https://i.postimg.cc/BZdzg13Q/chui-ming-lu-su-she-bai-ri.png",
      night: "https://i.postimg.cc/jqG1XJT5/chui-ming-lu-su-she-ye-wan.png",
    },

    // === 休息区 ===
    "校门口便利店": {
      day: "https://i.postimg.cc/vTWtXTrP/xiao-men-kou-bian-li-dian-bai-ri.png",
      night: "https://i.postimg.cc/vTWtXTrk/xiao-men-kou-bian-li-dian-ye-wan.png",
    },

    // === 公共区 - 图书馆 ===
    "图书馆一楼借还台": {
      day: "https://i.postimg.cc/yNZg05XG/tu-shu-guan-yi-lou-jie-hai-tai-bai-ri.png",
      night: "https://i.postimg.cc/fb9tYFjp/tu-shu-guan-yi-lou-jie-hai-tai-ye-wan.png",
    },
    "图书馆二楼文史哲区": {
      day: "https://i.postimg.cc/0NwM73dt/tu-shu-guan-er-lou-wen-shi-zhe-qu-bai-ri.png",
      night: "https://i.postimg.cc/0NwM73dX/tu-shu-guan-er-lou-wen-shi-zhe-qu-ye-wan.png",
    },
    "图书馆三楼经管法学区": {
      day: "https://i.postimg.cc/fb9tYFjB/tu-shu-guan-san-lou-jing-guan-fa-xue-qu-bai-ri.png",
      night: "https://i.postimg.cc/zfgbTMSt/tu-shu-guan-san-lou-jing-guan-fa-xue-qu-ye-wan.png",
    },
    "图书馆四楼自习区": {
      day: "https://i.postimg.cc/YSWGQVfy/tu-shu-guan-si-lou-zi-xi-qu-bai-ri.png",
      night: "https://i.postimg.cc/wBmyDPcG/tu-shu-guan-si-lou-zi-xi-qu-ye-wan.png",
    },

    // === 公共区 - 学校操场 ===
    "400米跑道": {
      day: "https://i.postimg.cc/XNQJB46p/400mi-pao-dao-bai-ri.png",
      night: "https://i.postimg.cc/7Pm6Jwrb/400mi-pao-dao-ye-wan.png",
    },
    "内圈足球场": {
      day: "https://i.postimg.cc/ryQmRM2C/nei-quan-zu-qiu-chang-bai-ri.png",
      night: "https://i.postimg.cc/3rnR0YQj/nei-quan-zu-qiu-chang-ye-wan.png",
    },
    "操场看台": {
      day: "https://i.postimg.cc/DfBZ4n3Z/cao-chang-kan-tai-bai-ri.png",
      night: "https://i.postimg.cc/fWBLSDQy/cao-chang-kan-tai-ye-wan.png",
    },

    // === 公共区 - 东区路灯步道 ===
    "银杏树下步道": {
      day: "https://i.postimg.cc/d1JsDSW4/yin-xing-shu-xia-bu-dao-bai-ri.png",
      night: "https://i.postimg.cc/gJGzrBMD/yin-xing-shu-xia-bu-dao-ye-wan.png",
    },
  },

  // ============================================================
  // 沈家别墅
  // ============================================================
  "沈家别墅": {
    "前院": {
      day: "https://i.postimg.cc/1XJcbTT1/qian-yuan-bai-ri.png",
      night: "https://i.postimg.cc/KjJrCVVF/qian-yuan-ye-wan.png",
    },
    "后院": {
      day: "https://i.postimg.cc/hvpbNwYH/hou-yuan-bai-ri.png",
      night: "https://i.postimg.cc/1XJcbTTx/hou-yuan-ye-wan.png",
    },
    "一楼玄关": {
      day: "https://i.postimg.cc/mZwwczrm/yi-lou-xuan-guan-bai-ri.png",
      night: "https://i.postimg.cc/Y2334GSn/yi-lou-xuan-guan-ye-wan.png",
    },
    "一楼客厅": {
      day: "https://i.postimg.cc/dQBB7k0m/yi-lou-ke-ting-bai-ri.png",
      night: "https://i.postimg.cc/kMccV65c/yi-lou-ke-ting-ye-wan.png",
    },
    "一楼开放式厨房": {
      day: "https://i.postimg.cc/bYTTGDv1/yi-lou-kai-fang-shi-chu-fang-bai-ri.png",
      night: "https://i.postimg.cc/VsRRSrNn/yi-lou-kai-fang-shi-chu-fang-ye-wan.png",
    },
    "二楼<user>卧室": {
      day: "https://i.postimg.cc/153KDmgJ/zhu-wo-bai-ri.png",
      night: "https://i.postimg.cc/gk2K3zwK/zhu-wo-ye-wan.png",
    },
    "二楼千金卧室": {
      day: "https://i.postimg.cc/3NnCz6qc/er-lou-qian-jin-wo-shi-bai-ri.png",
      night: "https://i.postimg.cc/SRD7H5PP/er-lou-qian-jin-wo-shi-ye-wan.png",
    },
    "二楼共用浴室": {
      day: "https://i.postimg.cc/yxvX25Gm/er-lou-gong-yong-yu-shi-bai-ri.png",
      night: "https://i.postimg.cc/J0PcSgFj/er-lou-gong-yong-yu-shi-ye-wan.png",
    },
    "三楼原书房": {
      day: "https://i.postimg.cc/xjRRkJdX/san-lou-yuan-shu-fang-bai-ri.png",
      night: "https://i.postimg.cc/7PVVCGLG/san-lou-yuan-shu-fang-ye-wan.png",
    },
    "三楼储物间": {
      day: "https://i.postimg.cc/j2ZQB91Q/chu-wu-jian-bai-ri.png",
      night: "https://i.postimg.cc/nr0YN5Wv/chu-wu-jian-ye-wan.png",
    },
  },

  // ============================================================
  // 傅霁公寓
  // ============================================================
  "傅霁公寓": {
    "客厅": {
      day: "https://i.postimg.cc/N0DM8c2p/fu-ji-gong-yu-ke-ting-bai-ri.png",
      night: "https://i.postimg.cc/hGsj8BQM/fu-ji-gong-yu-ke-ting-ye-wan.png",
    },
    "卧室": {
      day: "https://i.postimg.cc/W483mvqH/fu-ji-gong-yu-wo-shi-bai-ri.png",
      night: "https://i.postimg.cc/LsDXkpgW/fu-ji-gong-yu-wo-shi-ye-wan.png",
    },
    "独立卫浴": {
      day: "https://i.postimg.cc/Bvp650Pm/fu-ji-gong-yu-du-li-wei-yu-bai-ri.png",
      night: "https://i.postimg.cc/N0DM8c24/fu-ji-gong-yu-du-li-wei-yu-ye-wan.png",
    },
  },

  // ============================================================
  // 霍罗同居公寓
  // ============================================================
  "霍罗同居公寓": {
    "客厅": {
      day: "https://i.postimg.cc/1Xn3ZV7Z/huo-luo-tong-ju-gong-yu-ke-ting-bai-ri.png",
      night: "https://i.postimg.cc/Gt8m1Tgr/huo-luo-tong-ju-gong-yu-ke-ting-ye-wan.png",
    },
    "开放式厨房": {
      day: "https://i.postimg.cc/sxQgRGHC/huo-luo-tong-ju-gong-yu-kai-fang-shi-chu-fang-bai-ri.png",
      night: "https://i.postimg.cc/x8J1SNpQ/huo-luo-tong-ju-gong-yu-kai-fang-shi-chu-fang-ye-wan.png",
    },
    "罗兰卧室": {
      day: "https://i.postimg.cc/hvztqQZP/luo-lan-wo-shi-bai-ri.png",
      night: "https://i.postimg.cc/L5Y8MgQ8/luo-lan-wo-shi-ye-wan.png",
    },
    "霍千黎卧室": {
      day: "https://i.postimg.cc/Y0GCwLDr/huo-qian-li-wo-shi-bai-ri.png",
      night: "https://i.postimg.cc/vTgZdx28/huo-qian-li-wo-shi-ye-wan.png",
    },
  },

  // ============================================================
  // 鹿角奶茶店
  // ============================================================
  "鹿角奶茶店": {
    "一楼点单区": {
      day: "https://i.postimg.cc/G2Nbzh31/yi-lou-dian-dan-qu-bai-ri.png",
      night: "https://i.postimg.cc/cCn0zyC5/yi-lou-dian-dan-qu-ye-wan.png",
    },
    "二楼落地窗座位区": {
      day: "https://i.postimg.cc/wvP9FTxY/er-lou-luo-de-chuang-zuo-wei-qu-bai-ri.png",
      night: "https://i.postimg.cc/qq34FVqD/er-lou-luo-de-chuang-zuo-wei-qu-ye-wan.png",
    },
  },

  // ============================================================
  // 二十四帧电影院
  // ============================================================
  "二十四帧电影院": {
    "影院售票大厅": {
      day: "https://i.postimg.cc/9fQ4n0hv/ying-yuan-shou-piao-da-ting-bai-ri.png",
      night: "https://i.postimg.cc/s2gBNxrk/ying-yuan-shou-piao-da-ting-ye-wan.png",
    },
    "一号放映厅": {
      day: "https://i.postimg.cc/Ls8qb5pW/yi-hao-fang-ying-ting-bai-ri.png",
      night: "https://i.postimg.cc/Zq59MnSM/yi-hao-fang-ying-ting-ye-wan.png",
    },
    "二号放映厅": {
      day: "https://i.postimg.cc/Zq59MnS2/er-hao-fang-ying-ting-bai-ri.png",
      night: "https://i.postimg.cc/1z3gjXQT/er-hao-fang-ying-ting-ye-wan.png",
    },
  },

  // ============================================================
  // 辣当家麻辣烫
  // ============================================================
  "辣当家麻辣烫": {
    "选菜冷柜区": {
      day: "https://i.postimg.cc/jdyJWBvs/xuan-cai-leng-gui-qu-bai-ri.png",
      night: "https://i.postimg.cc/bN12G4LN/xuan-cai-leng-gui-qu-ye-wan.png",
    },
    "室内用餐区": {
      day: "https://i.postimg.cc/c4f8KPTJ/shi-nei-yong-can-qu-bai-ri.png",
      night: "https://i.postimg.cc/m27FcKVZ/shi-nei-yong-can-qu-ye-wan.png",
    },
  },

  // ============================================================
  // 落日居酒屋
  // ============================================================
  "落日居酒屋": {
    "居酒屋吧台": {
      day: "https://i.postimg.cc/Kzg86gHh/ju-jiu-wu-ba-tai-bai-ri.png",
      night: "https://i.postimg.cc/TwW3zW46/ju-jiu-wu-ba-tai-ye-wan.png",
    },
    "日式木质隔间": {
      day: "https://i.postimg.cc/zBRGsRcN/ri-shi-mu-zhi-ge-jian-bai-ri.png",
      night: "https://i.postimg.cc/vB6ZJ6Nd/ri-shi-mu-zhi-ge-jian-ye-wan.png",
    },
  },

  // ============================================================
  // 龙与骰子桌游卡牌店
  // ============================================================
  "龙与骰子桌游卡牌店": {
    "地下二层展示区": {
      day: "https://i.postimg.cc/SQMn5HBQ/de-xia-er-ceng-zhan-shi-qu-bai-ri.png",
      night: "https://i.postimg.cc/qB3NYWPN/de-xia-er-ceng-zhan-shi-qu-ye-wan.png",
    },
    "地下二层对战桌区": {
      day: "https://i.postimg.cc/RCHW82kh/de-xia-er-ceng-dui-zhan-zhuo-bai-ri.png",
      night: "https://i.postimg.cc/J7ksgSfh/de-xia-er-ceng-dui-zhan-zhuo-ye-wan.png",
    },
  },

  // ============================================================
  // 南门小吃街
  // ============================================================
  "南门小吃街": {
    "流动小吃摊位区": {
      day: "https://i.postimg.cc/RVTZxmXt/liu-dong-xiao-chi-tan-wei-bai-ri.png",
      night: "https://i.postimg.cc/pXBLMvqz/liu-dong-xiao-chi-tan-wei-ye-wan.png",
    },
    "步玲燕算命摊位": {
      day: "https://i.postimg.cc/4N1xRGBt/bu-ling-yan-suan-ming-tan-wei-bai-ri.png",
      night: "https://i.postimg.cc/RVTZxmXH/bu-ling-yan-suan-ming-tan-wei-ye-wan.png",
    },
  },

  // ============================================================
  // 大学城公园
  // ============================================================
  "大学城公园": {
    "人工湖岸": {
      day: "https://i.postimg.cc/VN2YWkLp/ren-gong-hu-an-bai-ri.png",
      night: "https://i.postimg.cc/bv4z9wNF/ren-gong-hu-an-ye-wan.png",
    },
    "环湖步道": {
      day: "https://i.postimg.cc/JhS15z42/huan-hu-bu-dao-bai-ri.png",
      night: "https://i.postimg.cc/6QF9fp5b/huan-hu-bu-dao-ye-wan.png",
    },
  },

  // ============================================================
  // 回头草咖啡
  // ============================================================
  "回头草咖啡": {
    "咖啡吧台": {
      day: "https://i.postimg.cc/Sx8VxZYJ/ka-fei-ba-tai-bai-ri.png",
      night: "https://i.postimg.cc/6pRzpH44/ka-fei-ba-tai-ye-wan.png",
    },
    "靠窗座位区": {
      day: "https://i.postimg.cc/MpRtpsfM/kao-chuang-zuo-wei-qu-bai-ri.png",
      night: "https://i.postimg.cc/7Z7XZBJC/kao-chuang-zuo-wei-qu-ye-wan.png",
    },
    "员工换装区": {
      day: "https://i.postimg.cc/0ymZytKS/yuan-gong-huan-zhuang-qu-bai-ri.png",
      night: "https://i.postimg.cc/XYFxY2BF/yuan-gong-huan-zhuang-qu-ye-wan.png",
    },
  },

  // ============================================================
  // 云顶商场
  // ============================================================
  "云顶商场": {
    "美食广场": {
      day: "https://i.postimg.cc/mgQNstKz/mei-shi-guang-chang-bai-ri.png",
      night: "https://i.postimg.cc/g2vqWn1Z/mei-shi-guang-chang-ye-wan.png",
    },
    "服装区": {
      day: "https://i.postimg.cc/L8zBpnG5/fu-zhuang-qu-bai-ri.png",
      night: "https://i.postimg.cc/JzbcLGSG/fu-zhuang-qu-ye-wan.png",
    },
    "影院": {
      day: "https://i.postimg.cc/L8zBpnGf/ying-yuan-bai-ri.png",
      night: "https://i.postimg.cc/6pdLXyFd/ying-yuan-ye-wan.png",
    },
    "溜冰场": {
      day: "https://i.postimg.cc/Z5rFSCX9/liu-bing-chang-bai-ri.png",
      night: "https://i.postimg.cc/vZWLscC6/liu-bing-chang-ye-wan.png",
    },
    "顶楼露台": {
      day: "https://i.postimg.cc/SxW7hJHK/ding-lou-lu-tai-bai-ri.png",
      night: "https://i.postimg.cc/qv8XTzWg/ding-lou-lu-tai-ye-wan.png",
    },
  },

  // ============================================================
  // 星河乐园
  // ============================================================
  "星河乐园": {
    "过山车区": {
      day: "https://i.postimg.cc/FzM3t4Zd/guo-shan-che-qu-bai-ri.png",
      night: "https://i.postimg.cc/x8wMr2Rk/guo-shan-che-qu-ye-wan.png",
    },
    "鬼屋": {
      day: "https://i.postimg.cc/GtWG0CQ4/gui-wu-bai-ri.png",
      night: "https://i.postimg.cc/qqPyfTL6/gui-wu-ye-wan.png",
    },
    "摩天轮区": {
      day: "https://i.postimg.cc/mkvCxsw7/mo-tian-lun-qu-bai-ri.png",
      night: "https://i.postimg.cc/T1zg869r/mo-tian-lun-qu-ye-wan.png",
    },
    "游客休息区": {
      day: "https://i.postimg.cc/3NsmMTBX/you-ke-xiu-xi-qu-bai-ri.png",
      night: "https://i.postimg.cc/yxMcqHPy/you-ke-xiu-xi-qu-ye-wan.png",
    },
  },

  // ============================================================
  // 利刃击剑会所
  // ============================================================
  "利刃击剑会所": {
    "单人练习场": {
      day: "https://i.postimg.cc/pLxqGwdR/dan-ren-lian-xi-chang-bai-ri.png",
      night: "https://i.postimg.cc/vZM3qJmY/dan-ren-lian-xi-chang-ye-wan.png",
    },
    "对练场": {
      day: "https://i.postimg.cc/K8FJq6Yc/dui-lian-chang-bai-ri.png",
      night: "https://i.postimg.cc/MpxdPCGW/dui-lian-chang-ye-wan.png",
    },
    "更衣室": {
      day: "https://i.postimg.cc/nhkT63sn/geng-yi-shi-bai-ri.png",
      night: "https://i.postimg.cc/L8TvrxqH/geng-yi-shi-ye-wan.png",
    },
  },

  // ============================================================
  // 铁砧兵击俱乐部
  // ============================================================
  "铁砧兵击俱乐部": {
    "防滑垫训练区": {
      day: "https://i.postimg.cc/DZmCQ1wL/fang-hua-dian-xun-lian-qu-bai-ri.png",
      night: "https://i.postimg.cc/LXhykj8j/fang-hua-dian-xun-lian-qu-ye-wan.png",
    },
    "器材室": {
      day: "https://i.postimg.cc/pTy0QKLF/qi-cai-shi-bai-ri.png",
      night: "https://i.postimg.cc/QtV6gcd5/qi-cai-shi-ye-wan.png",
    },
    "休息区": {
      day: "https://i.postimg.cc/LXhykj8V/xiu-xi-qu-bai-ri.png",
      night: "https://i.postimg.cc/zB3dwTGj/xiu-xi-qu-ye-wan.png",
    },
  },

  // ============================================================
  // 市立音乐厅
  // ============================================================
  "市立音乐厅": {
    "音乐厅一楼观众席": {
      day: "https://i.postimg.cc/j5C7L53J/yin-le-ting-yi-lou-guan-zhong-xi-bai-ri.png",
      night: "https://i.postimg.cc/MTXQvT3Q/yin-le-ting-yi-lou-guan-zhong-xi-ye-wan.png",
    },
    "音乐厅二楼观众席": {
      day: "https://i.postimg.cc/JhpXrJx3/yin-le-ting-er-lou-guan-zhong-xi-bai-ri.png",
      night: "https://i.postimg.cc/1zvFm6BG/yin-le-ting-er-lou-guan-zhong-xi-ye-wan.png",
    },
    "音乐厅三楼观众席": {
      day: "https://i.postimg.cc/N0dXsTD1/yin-le-ting-san-lou-guan-zhong-xi-bai-ri.png",
      night: "https://i.postimg.cc/q71KJnwX/yin-le-ting-san-lou-guan-zhong-xi-ye-wan.png",
    },
  },

  // ============================================================
  // 姜氏集团总部
  // ============================================================
  "姜氏集团总部": {
    "董事长办公室": {
      day: "https://i.postimg.cc/HngyWCRj/dong-shi-zhang-ban-gong-shi-bai-ri.png",
      night: "https://i.postimg.cc/nrJDVtgC/dong-shi-zhang-ban-gong-shi-ye-wan.png",
    },
    "大会议室": {
      day: "https://i.postimg.cc/j2b7qrmt/da-hui-yi-shi-bai-ri.png",
      night: "https://i.postimg.cc/5yVC9MTx/da-hui-yi-shi-ye-wan.png",
    },
    "办公区": {
      day: "https://i.postimg.cc/HngyWCRT/ban-gong-qu-bai-ri.png",
      night: "https://i.postimg.cc/J0Lk7Wv7/ban-gong-qu-ye-wan.png",
    },
  },

  // ============================================================
  // 市立福利院
  // ============================================================
  "市立福利院": {
    "儿童活动室": {
      day: "https://i.postimg.cc/ZqvBrRhq/er-tong-huo-dong-shi-bai-ri.png",
      night: "https://i.postimg.cc/d0Zk81KV/er-tong-huo-dong-shi-ye-wan.png",
    },
    "儿童宿舍区": {
      day: "https://i.postimg.cc/W4qFM3P3/er-tong-su-she-qu-bai-ri.png",
      night: "https://i.postimg.cc/QMK9ptrC/er-tong-su-she-qu-ye-wan.png",
    },
    "福利院食堂": {
      day: "https://i.postimg.cc/rpR0SmLd/fu-li-yuan-shi-tang-bai-ri.png",
      night: "https://i.postimg.cc/wBRyhvds/fu-li-yuan-shi-tang-ye-wan.png",
    },
  },

  // ============================================================
  // 姜朝渔住所
  // ============================================================
  "姜朝渔住所": {
    "客厅": {
      day: "https://i.postimg.cc/FsP78cr1/zhu-suo-ke-ting-bai-ri.png",
      night: "https://i.postimg.cc/sDnvqSjX/zhu-suo-ke-ting-ye-wan.png",
    },
    "主卧": {
      day: "https://i.postimg.cc/kXjBz8JK/zhu-suo-zhu-wo-bai-ri.png",
      night: "https://i.postimg.cc/J4TGvJrb/zhu-suo-zhu-wo-ye-wan.png",
    },
    "书房": {
      day: "https://i.postimg.cc/L6ynwf9P/zhu-suo-shu-fang-bai-ri.png",
      night: "https://i.postimg.cc/RVPNyfSf/zhu-suo-shu-fang-ye-wan.png",
    },
    "落地窗前区域": {
      day: "https://i.postimg.cc/J4TGvJrs/luo-de-chuang-qian-qu-yu-bai-ri.png",
      night: "https://i.postimg.cc/RVPNyfS3/luo-de-chuang-qian-qu-yu-ye-wan.png",
    },
  },

  // ============================================================
  // 裴今歌住所
  // ============================================================
  "裴今歌住所": {
    "一楼地毯投影区": {
      day: "https://i.postimg.cc/m2hbcn4D/yi-lou-de-tan-tou-ying-qu-bai-ri.png",
      night: "https://i.postimg.cc/J4t1yF8h/yi-lou-de-tan-tou-ying-qu-ye-wan.png",
    },
    "二楼卧室": {
      day: "https://i.postimg.cc/Fs19f6vQ/er-lou-wo-shi-bai-ri.png",
      night: "https://i.postimg.cc/MKXWcLww/er-lou-wo-shi-ye-wan.png",
    },
    "二楼阳台": {
      day: "https://i.postimg.cc/3JWKyqhT/er-lou-yang-tai-bai-ri.png",
      night: "https://i.postimg.cc/L6hHqWS2/er-lou-yang-tai-ye-wan.png",
    },
  },

  // ============================================================
  // 陆时予公寓
  // ============================================================
  "陆时予公寓": {
    "地下车库专属车位": {
      day: "https://i.meee.com.tw/d3Q3qfq.png",
      night: "https://i.meee.com.tw/3YtWgOi.png",
    },
    "开放式厨房": {
      day: "https://i.meee.com.tw/98WHhPF.png",
      night: "https://i.meee.com.tw/kjxaOmM.png",
    },
    "客厅": {
      day: "https://i.meee.com.tw/fMGqIdC.png",
      night: "https://i.meee.com.tw/SnqKSmS.png",
    },
    "卧室": {
      day: "https://i.meee.com.tw/X43j232.png",
      night: "https://i.meee.com.tw/dYRMRLi.png",
    },
  },

  // ============================================================
  // 季明舒公寓
  // ============================================================
  "季明舒公寓": {
    "客厅": {
      day: "https://i.postimg.cc/HxPhFBhJ/ji-ming-shu-gong-yu-ke-ting-bai-ri.png",
      night: "https://i.postimg.cc/vBSNC3Ng/ji-ming-shu-gong-yu-ke-ting-ye-wan.png",
    },
    "主卧": {
      day: "https://i.postimg.cc/B6wVRMVp/ji-ming-shu-gong-yu-zhu-wo-bai-ri.png",
      night: "https://i.postimg.cc/fLgr1Brg/ji-ming-shu-gong-yu-zhu-wo-ye-wan.png",
    },
    "次卧": {
      day: "https://i.postimg.cc/FRK6P2Dy/ji-ming-shu-gong-yu-ci-wo-bai-ri.png",
      night: "https://i.postimg.cc/W34y9QXM/ji-ming-shu-gong-yu-ci-wo-ye-wan.png",
    },
  },

  // ============================================================
  // 许不倦公寓
  // ============================================================
  "许不倦公寓": {
    "小区门禁入口": {
      day: "https://i.postimg.cc/Y06M87wq/xiao-qu-men-jin-ru-kou-bai-ri.png",
      night: "https://i.postimg.cc/2yQrTYfj/xiao-qu-men-jin-ru-kou-ye-wan.png",
    },
    "客厅": {
      day: "https://i.postimg.cc/d0V31hcm/ke-ting-bai-ri.png",
      night: "https://i.postimg.cc/Dzw0ZS3r/ke-ting-ye-wan.png",
    },
    "厨房": {
      day: "https://i.postimg.cc/jjS25DYz/chu-fang-bai-ri.png",
      night: "https://i.postimg.cc/7LZh65rn/chu-fang-ye-wan.png",
    },
    "卧室": {
      day: "https://i.postimg.cc/bvwrJZf6/wo-shi-bai-ri.png",
      night: "https://i.postimg.cc/yxmsnKz1/wo-shi-ye-wan.png",
    },
  },

  // ============================================================
  // 织部宵公寓
  // ============================================================
  "织部宵公寓": {
    "楼层走廊": {
      day: "https://i.postimg.cc/MTmqNtgf/lou-ceng-zou-lang-bai-ri.png",
      night: "https://i.postimg.cc/8kwTbKR5/lou-ceng-zou-lang-ye-wan.png",
    },
    "客厅与阳台": {
      day: "https://i.postimg.cc/Pf020hzR/ke-ting-yu-yang-tai-bai-ri.png",
      night: "https://i.postimg.cc/mZK8KRNp/ke-ting-yu-yang-tai-ye-wan.png",
    },
    "开放式厨房": {
      day: "https://i.postimg.cc/ry7Q7cCQ/kai-fang-shi-chu-fang-bai-ri.png",
      night: "https://i.postimg.cc/tR828ytB/kai-fang-shi-chu-fang-ye-wan.png",
    },
    "卧室": {
      day: "https://i.postimg.cc/fW5Mv2cy/wo-shi-bai-ri.png",
      night: "https://i.postimg.cc/BZNJCYTv/wo-shi-ye-wan.png",
    },
  },

  // ============================================================
  // 省外地点（地图上属于"省外"区域，但图片以地点名为父级）
  // ============================================================

  // 周念安母亲菜摊（无子位置，父级与子级同名）
  "周念安母亲菜摊": {
    "周念安母亲菜摊": {
      day: "https://i.postimg.cc/X7MbJYs2/zhou-nian-an-mu-qin-cai-tan-bai-ri.png",
      night: "https://i.postimg.cc/m2xsDgmm/zhou-nian-an-mu-qin-cai-tan-ye-wan.png",
    },
  },

  // 温知晚家
  "温知晚家": {
    "传统茶室": {
      day: "https://i.postimg.cc/PxLgXgZy/chuan-tong-cha-shi-bai-ri.png",
      night: "https://i.postimg.cc/sXBkjkSc/chuan-tong-cha-shi-ye-wan.png",
    },
    "温知晚卧室": {
      day: "https://i.postimg.cc/hG3FqDJj/wen-zhi-wan-wo-shi-bai-ri.png",
      night: "https://i.postimg.cc/637kWkRk/wen-zhi-wan-wo-shi-ye-wan.png",
    },
  },

  // 傅霁爷爷家
  "傅霁爷爷家": {
    "老公寓客厅": {
      day: "https://i.postimg.cc/9FBnhmKc/lao-gong-yu-ke-ting-bai-ri.png",
      night: "https://i.postimg.cc/28xKDkMz/lao-gong-yu-ke-ting-ye-wan.png",
    },
    "画室": {
      day: "https://i.postimg.cc/X7gzbjmb/hua-shi-bai-ri.png",
      night: "https://i.postimg.cc/RVTDBSy4/hua-shi-ye-wan.png",
    },
  },
};

/**
 * 获取地点图片数据（LocationImage），支持 <user> → 玩家名 的模糊匹配
 *
 * LOCATION_IMAGES 中部分 key 含有 <user>（如 "二楼<user>卧室"），
 * AI 输出时会把 <user> 替换为实际玩家名（如 "二楼张三卧室"）。
 * 设置 playerName 后，查找时会尝试将 key 中的 <user> 替换为 playerName 来匹配。
 *
 * @param parentLocation 父级地点名
 * @param spotName 子地点名（可能含玩家实际名字）
 * @param playerName 玩家自定义名字（可选）
 * @returns LocationImage 或 null
 */
export function getLocationImageData(parentLocation: string, spotName: string, playerName?: string): LocationImage | null {
  const locImages = LOCATION_IMAGES[parentLocation];
  if (!locImages) return null;

  // 1. 直接查找
  let img = locImages[spotName];

  // 2. 模糊匹配：将 key 中的 <user> 替换为玩家名后比较
  if (!img && playerName) {
    for (const key of Object.keys(locImages)) {
      if (key.includes('<user>') && key.replace(/<user>/g, playerName) === spotName) {
        img = locImages[key];
        break;
      }
    }
  }

  return img || null;
}

/**
 * 判断当前时间是否为夜晚
 * 19:00 - 5:59 为夜晚，6:00 - 18:59 为白日
 */
export function isNightTime(date: Date): boolean {
  const hour = date.getHours();
  return hour >= 19 || hour < 6;
}

/**
 * 获取地点对应的背景图（根据时间自动选择白日/夜晚）
 * @param parentLocation 父级地点名（如"沈家别墅"、"燕大校区"）
 * @param spotName 子地点名（如"客厅"、"A101阶梯教室"，可能含玩家实际名字）
 * @param date 游戏时间
 * @param playerName 玩家自定义名字（可选，用于匹配 key 中的 <user>）
 * @returns 图片 URL，如果地点没有图片则返回 null
 */
export function getLocationImage(parentLocation: string, spotName: string, date: Date, playerName?: string): string | null {
  const img = getLocationImageData(parentLocation, spotName, playerName);
  if (!img) return null;
  return isNightTime(date) ? img.night : img.day;
}

/**
 * 检查地点是否有背景图片
 * @param parentLocation 父级地点名
 * @param spotName 子地点名（可能含玩家实际名字）
 * @param playerName 玩家自定义名字（可选）
 */
export function hasLocationImage(parentLocation: string, spotName: string, playerName?: string): boolean {
  return getLocationImageData(parentLocation, spotName, playerName) !== null;
}
