export const SAMPLE_CHARACTERS = {
  'c1': {
    id: 'c1',
    name: '陆离',
    title: 'Lu Li · 事务所所长',
    themeColor: 'cyan',
    illustrationUrl: '',
    sprites: {
      'neutral': ''
    }
  },
  'c3': {
    id: 'c3',
    name: '狐小九',
    title: 'Hu Xiao Jiu · 八尾狐仙',
    themeColor: 'vermilion',
    illustrationUrl: 'https://i.postimg.cc/kXF3h1kk/eedcec62-8f7b-4309-8ce4-2a231a712459.png',
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
  }
};

export const SAMPLE_DIALOGUE = [
  {
    id: 'd1',
    characterId: 'c3',
    text: '所长！昨晚子时，我在土地庙外巡逻，听到一阵奇怪的响动，随后看到一个黑影往城北方向逃窜。',
    backgroundUrl: 'https://images.unsplash.com/photo-1542869781-a2725cb105f4?q=80&w=2000&auto=format&fit=crop',
    expression: 'jing-ya'
  },
  {
    id: 'd1_2',
    characterId: 'c3',
    text: '但是那里实在太黑了，我...我有点害怕，没敢追上去。',
    backgroundUrl: 'https://images.unsplash.com/photo-1542869781-a2725cb105f4?q=80&w=2000&auto=format&fit=crop',
    expression: 'hai-pa'
  },
  {
    id: 'd1_3',
    characterId: 'c3',
    text: '哎呀，这种事情人家怎么好意思说出口。',
    backgroundUrl: 'https://images.unsplash.com/photo-1542869781-a2725cb105f4?q=80&w=2000&auto=format&fit=crop',
    expression: 'hai-xiu'
  },
  {
    id: 'd1_4',
    characterId: 'c3',
    text: '要是所长你昨天陪我一起巡逻就好了，你是不是陪隔壁的花魁喝酒去了！哼！',
    backgroundUrl: 'https://images.unsplash.com/photo-1542869781-a2725cb105f4?q=80&w=2000&auto=format&fit=crop',
    expression: 'chi-cu'
  },
  {
    id: 'd1_5',
    characterId: 'c3',
    text: '呜呜...明明说好要一直陪着小九的...',
    backgroundUrl: 'https://images.unsplash.com/photo-1542869781-a2725cb105f4?q=80&w=2000&auto=format&fit=crop',
    expression: 'shang-xin'
  },
  {
    id: 'd1_6',
    characterId: 'c3',
    text: '这次一定不能让犯人跑了！敢在我们的地盘撒野，真是活腻了！',
    backgroundUrl: 'https://images.unsplash.com/photo-1542869781-a2725cb105f4?q=80&w=2000&auto=format&fit=crop',
    expression: 'sheng-qi'
  },
  {
    id: 'd2',
    characterId: 'c1',
    text: '别闹了，土地庙的供桌下，我发现了这块『带血的玉佩』，很可能是凶手不慎遗落的。',
    backgroundUrl: 'https://images.unsplash.com/photo-1542869781-a2725cb105f4?q=80&w=2000&auto=format&fit=crop',
    expression: 'neutral'
  },
  {
    id: 'd3',
    characterId: 'c1',
    text: '玉佩的材质是上等的和田玉，而且背面雕刻着京城李家的纹章。',
    backgroundUrl: 'https://images.unsplash.com/photo-1542869781-a2725cb105f4?q=80&w=2000&auto=format&fit=crop',
    expression: 'neutral'
  },
  {
    id: 'd4',
    characterId: 'c3',
    text: '往城北跑了...？我想起来了！京城来的那位李公子，这几天正好就住在城北的悦来客栈！',
    backgroundUrl: 'https://images.unsplash.com/photo-1542869781-a2725cb105f4?q=80&w=2000&auto=format&fit=crop',
    expression: 'kai-xin'
  },
  {
    id: 'd4_1',
    characterId: 'c3',
    text: '不过，那家客栈的伙食太差了，我才不想去那种地方...好嫌弃...',
    backgroundUrl: 'https://images.unsplash.com/photo-1542869781-a2725cb105f4?q=80&w=2000&auto=format&fit=crop',
    expression: 'xian-qi'
  },
  {
    id: 'd5',
    characterId: 'c1',
    text: '看来我们有必要带着调查卷宗里的线索，去一趟悦来客栈了。',
    backgroundUrl: 'https://images.unsplash.com/photo-1542869781-a2725cb105f4?q=80&w=2000&auto=format&fit=crop',
    expression: 'neutral'
  },
  {
    id: 'd6',
    characterId: 'c3',
    text: '总之，所长我们快出发吧！',
    backgroundUrl: 'https://images.unsplash.com/photo-1542869781-a2725cb105f4?q=80&w=2000&auto=format&fit=crop',
    expression: 'mo-ren'
  }
];

export const GALLERY_CGS = [
  // Location CGs
  { id: 'cg1', url: 'https://images.unsplash.com/photo-1528646927357-55d81b29a286?q=80&w=2000&auto=format&fit=crop', title: '幻镜初启', unlocked: true, category: 'location' as const },
  { id: 'cg2', url: 'https://images.unsplash.com/photo-1505322022379-7c3353ee6291?q=80&w=2000&auto=format&fit=crop', title: '霓虹夜市', unlocked: true, category: 'location' as const },
  { id: 'cg3', url: 'https://images.unsplash.com/photo-1542869781-a2725cb105f4?q=80&w=2000&auto=format&fit=crop', title: '竹林迷雾', unlocked: false, category: 'location' as const },
  { id: 'cg4', url: 'https://images.unsplash.com/photo-1601042879364-f3947d3f9c16?q=80&w=2000&auto=format&fit=crop', title: '暗巷逢魔', unlocked: false, category: 'location' as const },
];

export const CHARACTER_PROFILES = [
  {
    ...SAMPLE_CHARACTERS['c3'],
    description: '最初只是山上的一只懵懂小狐狸。几百年前，在风雪交加的土地庙里，她对进京赶考的你产生了情愫，即使花光捡来的银子甚至险些丧命也要为你求药。如今在现代社会中，她依然保留着那份天真的善良。',
    poem: '一饭之恩尚未酬，病骨偏向槐根休。若有来生重入世，满山踏遍寻红裘。',
    quotes: ['找到了，我鼻子可是很灵的，轻轻松松～嗯？身材不错，蛮结实的嘛，比以前那副病怏怏的样子强多了。不过也就一般般吧，八尾狐仙小九大人就屈尊降贵跟在你身边，防止你被人欺负了！', '既然他不要了，那些银子和肉干就都是我的了！'],
    likes: [
      { item: '看别人吵架', quote: '那些商贩吵架可有意思了，就和没化形的狐狸一样想，先炸毛然后用大嗓门和跺脚吓唬对面，周围一圈人看热闹。我小时候可喜欢看狐狸打架了，掉下来的毛还能带回去给自己垫窝呢。' },
      { item: '晒太阳', quote: '我早就想给自己搞一个小院子住了，山上到处都是树，凉快倒是凉快，但是趴在上边硌死人了。不过这皇都的地好贵啊，你啥时候当个大官儿，咱们买个大院玩！' },
      { item: '逛集市', quote: '包子、炊饼、烧鹅...啊！你拍我干嘛？谁、谁嘴馋了！就出来看看都不准？小气鬼...以前给你买药的时候还得背个小褡裢，腿刚比我现在的巴掌长一点。你不知道我当时跑的都快吐出来了，我跑慢一点你就见不到我了，更别说念你的酸诗...给我买那个糖人，我要画个狐狸的。' },
      { item: '吓唬路过的读书人', quote: '又没正经事儿做，我也不看你那些杂七杂八的书，现在都八尾了拜月亮也没用。九尾？嗯...是有那个说法啦，八尾狐妖想变成九尾需要满足别人的一个心愿。不过好像没用诶，我帮那些村民打跑妖怪，刚长出九条尾巴立马就会掉一条。' }
    ],
    dislikes: [
      { item: '狐裘', quote: '不知道为啥那些达官显贵都喜欢穿这个，上次看到一个死胖子穿着那个，要不是在大街上闹事不合适，我一脚，就给他踢到月亮上去！' },
      { item: '狗', quote: '我也不是不讲理的人啦，那种听话又不乱咬人的狗还是很好的...但是那个欧罗巴来的，叫什么...泰迪？又丑又笨的，一辈子开不了灵智！一看到它对我呲牙我就想对它屁股来两脚！' },
      { item: '言情话本', quote: '一点意思都没有，不好看！这女主明明知道是自己救的王爷，干嘛不说啊！还有这个王爷说什么，「哼，那个女人宁愿被吊在城墙上晒成人干也不承认偷东西吗」，这俩人是不是都没脑子啊，一个张嘴问一下，一个张嘴说一下，误会不就解开了吗？唉...累了...晚上我想吃肉包子。' }
    ],
    secrets: [
      '其实很在意自己的耳朵不对称，每次照镜子的时候都会用手扒拉成一样的角度。',
      '其实很怕打雷，不过本人对此的解释是"检查桌子腿稳不稳"。',
      '手腕上的红绳小铃铛是姐姐送给她的，小九非常喜欢这个小装饰。',
      '因为是山间的小狐化形，所以没有掌握半分狐妖的媚术。',
      '其实随身带的小布包里有一些攒起来的碎银子，零钱被拿去解馋，剩下的据说是用来留着看病和买院子。'
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
