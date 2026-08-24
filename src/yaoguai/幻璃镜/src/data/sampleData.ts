import type { CharacterProfile, GalleryCG, Character } from '../types';

/** 角色字典 — 仅保留主角狐小九 */
export const SAMPLE_CHARACTERS: Record<string, Character> = {
  'c3': {
    id: 'c3',
    name: '狐小九',
    title: '青丘八尾灵狐 · 俏皮天仙',
    themeColor: 'vermilion',
    // 灵魅仙姿主立绘 — 檐下避雨
    illustrationUrl: 'https://i.postimg.cc/kXF3h1kk/eedcec62-8f7b-4309-8ce4-2a231a712459.png',
    avatarUrl: 'https://i.postimg.cc/DycdNL5D/xiao-ren.png',
    affinity: 92,
    personality: '傲娇灵动 · 重情护短',
    sprites: {
      'chi-cu': 'https://i.postimg.cc/rsF7rMwN/chi-cu.png',
      'hai-pa': 'https://i.postimg.cc/RFTjhN4p/hai-pa.png',
      'hai-xiu': 'https://i.postimg.cc/T1YBDf3c/hai-xiu.png',
      'shang-xin': 'https://i.postimg.cc/Pf7kwv1b/shang-xin.png',
      'sheng-qi': 'https://i.postimg.cc/ZYQhdv6M/sheng-qi.png',
      'mo-ren': 'https://i.postimg.cc/RCYzHJwL/mo-ren.png',
      'xian-qi': 'https://i.postimg.cc/KvbDQJ7b/xian-qi.png',
      'kai-xin': 'https://i.postimg.cc/XJyk1PDC/kai-xin.png',
      'jing-ya': 'https://i.postimg.cc/BQ3BNM5G/jing-ya.png',
      'xiao-ren': 'https://i.postimg.cc/DycdNL5D/xiao-ren.png',
    }
  },
};

/** CG 列表 — 仅保留狐小九相关 CG */
export const GALLERY_CGS: GalleryCG[] = [
  { id: 'char_cg1', url: 'https://i.postimg.cc/kXF3h1kk/eedcec62-8f7b-4309-8ce4-2a231a712459.png', title: '小九贪欢 · 檐下避雨', unlocked: true, category: 'character' as const },
];

/** 角色列表 — 仅保留狐小九 */
export const CHARACTER_PROFILES: CharacterProfile[] = [
  {
    ...SAMPLE_CHARACTERS['c3'],
    description: '最初只是山上的一只懵懂小狐狸。三百年前大雍开国之际，在风雪交加的土地庙里，她与进京赶考的你种下宿世因缘。如今封印再起，她幻化为人重临金陵，依然保留着那份天真的纯良与贪嘴娇憨。',
    poem: '一饭之恩尚未酬，病骨偏向槐根休。若有来生重入世，满山踏遍寻红裘。',
    quotes: [
      '找到了！我鼻子可是很灵的，轻轻松松～嗯？身材不错，蛮结实的嘛！八尾狐仙小九大人就屈尊降贵跟在你身边，防止你被山精妖怪欺负了！',
      '既然镇抚司发了俸禄，那些肉干和糖葫芦就都是我的了！',
      '你若敢多看那秦淮乐姬一眼，小心本姑娘半夜往你官靴里放小刺猬！'
    ],
    likes: [
      { item: '看集市吵架', quote: '那些商贩吵架可有意思了，先炸毛然后跺脚吓唬对面！掉下来的毛还能带回去给自己垫窝呢。' },
      { item: '晒太阳贪睡', quote: '我早就想给自己搞一个小院子住了，这大雍皇都的地好贵啊，你啥时候当上大都督，咱们买个大院玩！' },
      { item: '糖葫芦与炙肉', quote: '给我买那个糖人！我要画个九尾狐仙威风凛凛的！' },
      { item: '被顺毛轻抚', quote: '唔……耳朵后面不许乱摸！……好吧，就只准摸三下。' }
    ],
    dislikes: [
      { item: '狐裘大氅', quote: '上次看到一个贪官穿那个，要不是怕暴露身份，我一脚就给他踢到钟山顶上去！' },
      { item: '恶犬与道士', quote: '有些臭道士不分青红皂白就扔符箓，本狐仙可是修仙灵狐，才不是吸人精气的妖孽！' },
      { item: '酸腐言情戏本', quote: '一点意思都没有！误会半天不张嘴，换作本姑娘，直接一口咬上去！' }
    ],
    secrets: [
      '其实很在意自己的耳朵偶尔会抖动，害羞时尾巴会不自主冒出来。',
      '其实很怕打雷天，害怕时会偷偷钻进你的被褥蜷成一团。',
      '手腕上的红绳铃铛是当年你亲手替她系上的，三百年从未摘下。',
      '虽然嘴上嫌弃凡间琐事，但每次查案都会暗中用狐火为你照亮伏兵。'
    ],
    gallerySprites: {
      sfw: [
        { id: 'mo-ren', name: '默认', url: 'https://i.postimg.cc/RCYzHJwL/mo-ren.png' },
        { id: 'kai-xin', name: '开心', url: 'https://i.postimg.cc/XJyk1PDC/kai-xin.png' },
        { id: 'sheng-qi', name: '生气', url: 'https://i.postimg.cc/ZYQhdv6M/sheng-qi.png' },
        { id: 'jing-ya', name: '惊讶', url: 'https://i.postimg.cc/BQ3BNM5G/jing-ya.png' },
        { id: 'chi-cu', name: '吃醋', url: 'https://i.postimg.cc/rsF7rMwN/chi-cu.png' },
        { id: 'hai-xiu', name: '害羞', url: 'https://i.postimg.cc/T1YBDf3c/hai-xiu.png' },
        { id: 'shang-xin', name: '伤心', url: 'https://i.postimg.cc/Pf7kwv1b/shang-xin.png' },
        { id: 'hai-pa', name: '害怕', url: 'https://i.postimg.cc/RFTjhN4p/hai-pa.png' },
        { id: 'xian-qi', name: '嫌弃', url: 'https://i.postimg.cc/KvbDQJ7b/xian-qi.png' },
      ],
      nsfw: [],
      chibi: [
        { id: 'xiao-ren', name: '小人', url: 'https://i.postimg.cc/DycdNL5D/xiao-ren.png' }
      ]
    }
  }
];
