import React, { useState, useRef, useEffect } from "react";
import { PopCard } from "../components/ui/PopCard";
import { motion, AnimatePresence } from "motion/react";
import { X, Star, Heart, AlertCircle, Quote, ChevronLeft, ChevronRight } from "lucide-react";

const CHARACTERS = [
  {
    id: "1",
    name: "沈千金",
    role: "经纪人 / 妹妹",
    price: "经纪人",
    color: "bg-pop-yellow",
    avatar: "https://i.postimg.cc/qMd7QGKF/1000213232.png",
    desc: "你的妹妹，燕大金融大一新生。因家族破产负债，两人需共同还债。她擅长社交、金融和艺术鉴赏，性格聪明、骄傲，爱吐槽。",
    tags: ["妹妹", "经纪人", "吐槽", "骄傲"],
    likes: "内增高、高定礼服、商战案例",
    dislikes: "被人可怜、出汗、被打乱计划",
    secret: [
      "其实最喜欢的小饰品是你十二岁时做的小发卡。",
      "其实是并夕夕的资深用户，收纳工具、手机壳等全来源于'甄选好物'。",
      "浏览器里有很多'怎么快速攒一千万'的搜索记录，拒绝肉体交易并曾将骚扰者送进警局拘留十五天。",
      "其实有一个叫'胖达'的布偶，一个人时会自己配音和它聊天。",
      "手机备忘录里有三类名单：加倍补偿的、还完钱就行的、还完钱立马搞垮的。"
    ],
    sisterNote: "我是你妹妹兼经纪人！不准给我接奇怪的单子，赶紧给我把债还完！"
  },
  {
    id: "2",
    name: "姜朝渔",
    role: "姜氏财团董事长",
    price: "¥500,000/天",
    color: "bg-pop-cyan",
    avatar: "https://i.postimg.cc/k5trk03S/1000213361.png",
    desc: "姜氏财团董事长，裴今歌的挚友。行事果断，实则是一位充满母性光辉的猫系大姐姐，看似高不可攀实则渴望亲密关系。",
    tags: ["成熟", "母性", "猫系大姐姐"],
    likes: "大型犬、击剑、看烂片",
    dislikes: "深夜电话、虚伪的精致礼盒、被坐热的椅子",
    secret: [
      "其实更喜欢跪坐在地上，头靠在亲密的人腿上，尤其是被人挠下巴的时候会不自觉发出呼噜声。",
      "其实'股东'是一个叔伯遗弃的，她想着狗又没什么错，就带回了家里养着。",
      "其实经常幻想如果妈妈还活着，以及如果自己当了妈妈会怎么样。",
      "其实睡姿很不雅，醒来的被子从来没有盖好过。"
    ],
    sisterNote: "这位可是大金主！虽然从小看着我们长大，但现在是还债的关键时期，一定要好好表现！"
  },
  {
    id: "3",
    name: "裴今歌",
    role: "一线女演员",
    price: "¥500,000/天",
    color: "bg-pop-pink",
    avatar: "https://i.postimg.cc/yNSqwM4h/1000213352.png",
    desc: "自由散漫的当红女演员，你的青梅竹马。充满孩童般的天真与好奇，有走失七年的经历。",
    tags: ["青梅竹马", "当红演员", "好奇宝宝"],
    likes: "高处、起外号、片场的折叠椅、被人摸头",
    dislikes: "片场的监视器、塑料袋味",
    secret: [
      "其实有一本名为'今日心情'的日记本，里边没有文字，全是不同姿态的火柴人。",
      "其实，父母每周都会要求报备出行和位置，防止再度突发奇想离家出走。",
      "其实每次新剧组开拍前都会去姜朝渔家里一趟，据说是为了'撸大猫'放松心情。",
      "其实会在一个人在家的时候，抱着那只叫'姜董'的猫对戏。"
    ],
    sisterNote: "今歌姐可是自家人，不过她出价也是顶级的，千万别因为熟就懈怠了！"
  },
  {
    id: "4",
    name: "周念安",
    role: "法学院学霸 / 前女友",
    price: "¥2,000/天",
    color: "bg-pop-yellow",
    avatar: "https://i.postimg.cc/bN8z1wX5/1000213237.png",
    desc: "燕大法学院大三学生，你的前女友。外表冷漠，因为自卑曾主动提分手，实则拼命攒钱只为包养你。",
    tags: ["前女友", "学霸", "自卑又自尊"],
    likes: "物美价廉的小玩意儿、自己做菜、下雨天",
    dislikes: "游乐园的卡通发箍、欠条、别人请客",
    secret: [
      "其实吃不了一点辣，但是不会告诉任何人。",
      "打工地点是城东的'回头草咖啡'，对老板娘的起名水平和回头草这个词带有微妙的怨念。",
      "其实有阅读癖，连洗发水包装上的配方表也会偷偷记下来。",
      "其实只有在涉及法律专业知识的时候才会引用那些条文，对搭讪者会甩看垃圾的眼神。",
      "其实每次的工资都会打给妈妈大头并虚报金额，不想让妈妈知道自己很累。",
      "其实有一个单独的账户每周存钱，用来攒'包养'你的嫁妆。",
      "其实酒量不行，喝醉后会晕乎乎地撒娇要抱抱，但除了你没人见过。"
    ],
    sisterNote: "她居然也来下单了...虽然以前是嫂子，但现在是客户，公私分明懂不懂？"
  },
  {
    id: "5",
    name: "季明舒",
    role: "地产千金 / 霸总脑",
    price: "¥500,000/天",
    color: "bg-pop-black",
    textColor: "text-white",
    avatar: "https://i.postimg.cc/kgpwtzwq/nai-3587295711.png",
    desc: "季氏地产的掌上明珠，深受霸总文学毒害，喜欢对你使用土味情话和霸总语录。",
    tags: ["自信直率", "霸总脑", "浪漫主义"],
    likes: "给自己配旁白、言情小说、被人注视",
    dislikes: "文艺片、掉头发、恐怖片",
    secret: [
      "其实对你用的每一句台词都是前一晚熬夜到两三点钟才想好的，为此掉了很多头发。",
      "其实连载的小说有被人批评过不切实际，她的回复是'虚构作品甜一点也没什么不好'。",
      "其实除了那些言情小说，她的房间布置很乱，每天都需要保姆重新整理。",
      "因为狗毛过敏养了一只会模仿她说话的鹦鹉，起名'季明舒的鹦武者'。",
      "其实每周六都会风雨无阻地去福利院做一整天的公益志愿者。"
    ],
    sisterNote: "这位大小姐脑回路有点特别，你只要配合她演好'娇妻'...啊不，男主角就行了！"
  },
  {
    id: "6",
    name: "傅霁",
    role: "R18画师 / 白化病少女",
    price: "¥8,000/天",
    color: "bg-white",
    textColor: "text-pop-black",
    avatar: "https://i.postimg.cc/zfRm9sZ7/1000213236.png",
    desc: "患有白化病的数媒大一学生，知名R18画师'白兔先生'。为了突破创作瓶颈而雇佣你作为模特。",
    tags: ["三无", "画师", "白发红瞳"],
    likes: "被人说好话、毛毯、颜文字",
    dislikes: "人多的场合、拽专业名词的人、阳光直射",
    secret: [
      "其实有一个用来取材的小圈子，里边全部都是各种哭唧唧的宅女画师。",
      "因为个子不高，对于公共洗手间的镜子有怨念，因此作品里从不出现洗浴间剧情。",
      "其实作品里的女角色都是胸大腿长，被外界误认为是一个高挑的冷艳御姐。",
      "其实家里有很多不同品牌的木瓜牛奶。"
    ],
    sisterNote: "去她家当模特？老哥你可悠着点，别被画进什么奇怪的本子里了。"
  },
  {
    id: "7",
    name: "椎名律",
    role: "小提琴天才",
    price: "¥3,000/天",
    color: "bg-pop-pink",
    avatar: "https://i.postimg.cc/0Np69H75/nai-4055558051.png",
    desc: "日本小提琴天才，性格张扬叛逆，喜欢恶作剧。因为觉得有趣而下载了APP看你的笑话。",
    tags: ["天才", "叛逆", "恶作剧"],
    likes: "恶作剧、麻辣烫、夜晚便利店",
    dislikes: "正经场合、被说可惜、密码日记本",
    secret: [
      "其实手机壁纸是被禁赛那天评委们的脸，看到他们不爽的脸就想笑。",
      "其实只有左耳打了耳洞，因为怕疼宣布绝对不要再打洞。",
      "其实很讨厌闹钟，觉得像节拍器在喊人起床练习，令人不爽。",
      "其实对体重很在意，来到中国后胖了三斤，有微妙的不满却控制不住嘴。"
    ],
    sisterNote: "这丫头一肚子坏水，小心点，别被她整蛊了！"
  },
  {
    id: "8",
    name: "温知晚",
    role: "舞蹈系学妹",
    price: "¥5,000/天",
    color: "bg-pop-cyan",
    avatar: "https://i.postimg.cc/25BpPsRQ/1000213271.png",
    desc: "燕大舞蹈系女生，温柔体面但内心压抑欲望，对你有好感并主动约见。",
    tags: ["温柔", "体面", "压抑欲望"],
    likes: "凌晨的路灯、给别人泡茶、旧电影的吻戏、水袖扇舞",
    dislikes: "被当成仙女、刺眼的光、吵架",
    secret: [
      "其实手机里有一个叫做'宋词选读'的便签文件夹，里边全是自己私下看的东西。",
      "其实比起视觉更喜欢文字，因为可以发挥想象力，更有代入感。",
      "其实给你发大胆消息前，做了很长时间的思想建设和反复删改。",
      "其实最喜欢的那把木簪是小时候用小刀雕出来的，划伤手时罕见地大哭过。",
      "其实发量太多洗头很苦恼，经常在想剪短和不想剪之间横跳。",
      "其实几乎没接触过家人以外的男性，理论知识丰富，但毫无实践经验。"
    ],
    sisterNote: "虽然温柔体贴，但是不要忘了这可是客户啊！"
  },
  {
    id: "9",
    name: "罗兰",
    role: "法国交换生",
    price: "¥10,000/天",
    color: "bg-white",
    textColor: "text-pop-black",
    avatar: "https://i.postimg.cc/HnZVHWtB/1000213897.png",
    desc: "法国交换生，你的小学同学，霍千黎的名义未婚夫。被人称为'布列塔尼的守门人'。",
    tags: ["骑士", "交换生", "大剑"],
    likes: "高热量食物、《堂吉诃德》、煎饼摊",
    dislikes: "浓烈的香水味、被人从背后拍肩膀、阴雨天",
    secret: [
      "其实是HEMA全法青年大赛的优胜者，每天都会小心翼翼地擦拭奖牌与奖杯。",
      "其实睡觉的时候会打呼噜和说梦话，经常被霍千黎要求滚出房间睡地上。",
      "其实喜欢闻旧皮革和布料的味道。",
      "其实常用的剑起名叫杜兰达尔三世，前两把被她用怪力砸断。",
      "其实小时候带着法国赌神口音，现在的普通话已经拿到一级甲等证书。"
    ],
    sisterNote: "这家伙真是，明明是个女孩子还那么能打！"
  },
  {
    id: "10",
    name: "霍千黎",
    role: "金融系恶役千金",
    price: "¥10,000/天",
    color: "bg-pop-black",
    textColor: "text-white",
    avatar: "https://i.postimg.cc/RhsN9CTD/1000213899.png",
    desc: "燕大金融大三，你的小学同学。总是笑眯眯的恶役千金，罗兰的名义未婚妻。",
    tags: ["恶役千金", "笑面虎", "腹黑"],
    likes: "猫、桌游、拍照、红茶、深夜广播",
    dislikes: "早起、拆卡包出平卡、被当成有心机的女人",
    secret: [
      "其实很怕虫子，小时候郊游被蟑螂吓得跳上桌子，至今包里常备杀虫剂，甚至讨厌蜘蛛侠。",
      "其实是昼伏夜出型，与罗兰同居后才逐步适应正常作息。",
      "其实收集了你很多糗照，对外说是把柄，实际上每天都会坐在书桌前翻看。",
      "其实有认真研究过为什么罗兰胸部发育良好还不影响运动。",
      "其实很擅长烘焙小蛋糕，尤其是法式甜点。",
      "其实时至今日还在关注那个被霸凌的女孩，但从不点赞或评论。",
      "其实运气很差，有考虑过佩戴转运珠和魔法水晶。"
    ],
    sisterNote: "这女人太危险了，和她打交道一定要小心！"
  },
  {
    id: "11",
    name: "步玲燕",
    role: "宗教学燕半仙",
    price: "¥200/天",
    color: "bg-pop-yellow",
    avatar: "https://i.postimg.cc/ht5M76MK/2729c1ef-df54-4b2e-85fe-d65322e28c65.png",
    desc: "宗教学大四学生，以街头算命为课题研究。善于话术包装和观察，喜欢免单和打麻将。",
    tags: ["半仙", "神棍", "滑头"],
    likes: "小吃、免单、打麻将",
    dislikes: "遇上真的过的很差的人、下雨天、体测",
    secret: [
      "其实每次点单都会仅退款来白嫖你的服务，把2000块的单价压到了每天200块。",
      "其实是城管的黑名单，选在南门附近摆摊是因为跑路时能快点躲进燕大。",
      "其实手机里存了很多期《故事会》和《知音》，话术和小故事多来源于此。",
      "自从躲城管崴脚后，每次出摊包里都会带云南白药。",
      "其实论文已经基本完成，导师对她能让算命先生讲真实收入感到惊奇。"
    ],
    sisterNote: "这神棍，居然才给200块！简直是抠门到家了！"
  },
  {
    id: "12",
    name: "陆时予",
    role: "回头草咖啡老板娘",
    price: "¥10,000/天",
    color: "bg-white",
    textColor: "text-pop-black",
    avatar: "https://i.meee.com.tw/tPhxPog.png",
    desc: `回头草咖啡的老板娘，遵循"一个故事一杯咖啡"原则的咖啡师`,
    tags: ["老板娘", "松弛感", "倾听者", "中性风"],
    likes: "机车（本田CB400）、听别人说话、下雨天、贝斯、自己的工作",
    dislikes: "早起进货、不停索求认同的人、被人催促",
    secret: [
      "其实是严重的拖延症，不拖到最后一刻不会完成任务。",
      "其实很清楚燕大论坛对于自己的性别争议，她在帅哥、美人和其他的投票里投给了其他。",
      "其实是冷笑话爱好者，手机便签里收集了很多网上的段子。",
      "其实SCA笔试是刚刚及格的程度，被视为手艺优于理论知识的非科班天才。",
      "其实高中乐队唯一一次演出结束后才发现贝斯没通电，一整场都没人发现，原来贝斯手笑话是真的。"
    ],
    sisterNote: "回头草咖啡的老板娘啊，念安打工的那家店。听说燕大论坛上天天吵这人是帅哥还是美人，念安倒是心知肚明就是不说，真是的。"
  },
  {
    id: "13",
    name: "许不倦",
    role: "燕大形势与政策教师",
    price: "¥3,000/天",
    color: "bg-pop-cyan",
    avatar: "https://i.postimg.cc/kgKMgWHv/20a3b651-666d-4dd2-a651-13fee3a9eaf0.png",
    desc: "燕大形势与政策任课教师，一心想安稳躺平到退休，因被催婚而租借男友交差。",
    tags: ["佛系", "教师", "躺平"],
    likes: "放置类手游、下午两点半的课、看学生编请假理由",
    dislikes: "开会时被领导点名、全糖奶茶、体育锻炼",
    secret: [
      "其实记性很好，每一个来请假的学生和假条都能对的上。",
      "其实兜里经常带着几块水果软糖，据说是为了补充糖分。",
      "其实被人问过是不是高中生。",
      "时刻关注着老家的天气，目的是为了能够在被催婚时转进到关心父母穿衣保暖来含糊过去。"
    ],
    sisterNote: "许老师是为了应付催婚才来下单的，虽然价格不算高，但人家是正经教师，可千万别露馅了！"
  }
];

export function ArchiveView() {
  const [selectedChar, setSelectedChar] = useState<typeof CHARACTERS[0] | null>(null);
  const [isSecretOpen, setIsSecretOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? CHARACTERS.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === CHARACTERS.length - 1 ? 0 : prev + 1));
  };

  const currentChar = CHARACTERS[currentIndex];

  return (
    <div className="w-full h-full bg-stripes pt-0 p-4 md:p-8 flex flex-col relative overflow-hidden">

      {/* 大屏：drag 轮播 */}
      <div ref={carouselRef} className="hidden md:flex flex-1 overflow-hidden z-10 px-2 md:px-4 cursor-grab active:cursor-grabbing pb-24 md:pb-0">
        <motion.div
          drag="x"
          dragConstraints={carouselRef}
          dragElastic={0.2}
          className="flex gap-8 h-full items-center w-max"
        >
          {CHARACTERS.map((char) => (
            <motion.div
              key={char.id}
              whileHover={{ y: -15, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => { setSelectedChar(char); setIsSecretOpen(false); }}
              className="shrink-0 relative h-[320px] md:h-[420px] min-h-[280px] cursor-pointer"
            >
              <div
                className={`w-[220px] md:w-[260px] lg:w-[280px] h-full pop-border shadow-pop-lg relative overflow-hidden flex flex-col clip-diagonal ${char.color}`}
              >
                <div className="absolute inset-0 bg-halftone opacity-30 mix-blend-overlay pointer-events-none z-0"></div>
                <div className="flex-1 bg-white/20 m-4 pop-border relative overflow-hidden pointer-events-none z-10">
                   {char.avatar ? (
                     <img src={char.avatar} alt={char.name} className="absolute inset-0 w-full h-full object-cover object-top" />
                   ) : (
                     <div className="absolute inset-0 flex flex-col items-center justify-center font-black text-5xl md:text-6xl opacity-50 mix-blend-overlay -skew-x-6 text-center leading-tight tracking-widest">
                       {char.name.split('').map((n, i) => <div key={i}>{n}</div>)}
                     </div>
                   )}
                </div>
                <div className={`p-4 md:p-6 pt-0 pointer-events-none z-10 relative ${char.textColor || 'text-pop-black'}`}>
                  <h2 className="text-3xl md:text-4xl font-black italic -skew-x-6 drop-shadow-md">{char.name}</h2>
                  <div className="inline-block px-3 py-1 bg-pop-black text-white text-sm font-bold mt-2 pop-border italic">
                    {char.price}
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-4 right-4 z-20">
                <div className="bg-pop-yellow text-pop-black px-4 py-2 font-black pop-border shadow-pop clip-diagonal">
                  VIEW
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* 竖屏：按钮翻页 */}
      <div className="flex md:hidden flex-1 flex-col items-center justify-center z-10 px-4 pb-20">
        <div className="flex items-center gap-4 w-full max-w-sm">
          <button
            onClick={goToPrev}
            className="shrink-0 p-3 bg-pop-black text-white pop-border shadow-pop hover:bg-pop-pink transition-colors clip-diagonal"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <div className="flex-1 relative">
            <div
              className={`w-full aspect-3/4 pop-border shadow-pop-lg relative overflow-hidden flex flex-col clip-diagonal ${currentChar.color}`}
            >
              <div className="absolute inset-0 bg-halftone opacity-30 mix-blend-overlay pointer-events-none z-0"></div>
              <div className="flex-1 bg-white/20 m-3 pop-border relative overflow-hidden pointer-events-none z-10">
                {currentChar.avatar ? (
                  <img src={currentChar.avatar} alt={currentChar.name} className="absolute inset-0 w-full h-full object-cover object-top" />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center font-black text-4xl opacity-50 mix-blend-overlay -skew-x-6 text-center leading-tight tracking-widest">
                    {currentChar.name.split('').map((n, i) => <div key={i}>{n}</div>)}
                  </div>
                )}
              </div>
              <div className={`p-4 pt-0 pointer-events-none z-10 relative ${currentChar.textColor || 'text-pop-black'}`}>
                <h2 className="text-2xl font-black italic -skew-x-6 drop-shadow-md">{currentChar.name}</h2>
                <div className="inline-block px-2 py-0.5 bg-pop-black text-white text-xs font-bold mt-1 pop-border italic">
                  {currentChar.price}
                </div>
              </div>
            </div>
            <div className="absolute -bottom-3 right-3 z-20">
              <div className="bg-pop-yellow text-pop-black px-3 py-1.5 font-black text-sm pop-border shadow-pop clip-diagonal">
                {currentIndex + 1} / {CHARACTERS.length}
              </div>
            </div>
          </div>

          <button
            onClick={goToNext}
            className="shrink-0 p-3 bg-pop-black text-white pop-border shadow-pop hover:bg-pop-pink transition-colors clip-diagonal"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        <button
          onClick={() => { setSelectedChar(currentChar); setIsSecretOpen(false); }}
          className="mt-6 px-6 py-2 bg-pop-yellow text-pop-black font-black text-lg pop-border shadow-pop hover:scale-105 transition-transform clip-diagonal"
        >
          查看详细档案
        </button>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedChar && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-pop-black/80 backdrop-blur-sm"
              onClick={() => { setSelectedChar(null); setIsSecretOpen(false); }}
            />

            <motion.div
              initial={{ scale: 0.8, y: 100, rotate: -5 }}
              animate={{ scale: 1, y: 0, rotate: 0 }}
              exit={{ scale: 0.8, y: 100, rotate: 5 }}
              transition={{ type: "tween", duration: 0.2, ease: "easeOut" }}
              className="relative w-full max-w-4xl bg-white pop-border shadow-pop-lg z-10 flex flex-col md:flex-row overflow-hidden clip-diagonal max-h-[90vh] md:max-h-[90vh] my-4 md:my-4"
            >
              <button
                onClick={() => { setSelectedChar(null); setIsSecretOpen(false); }}
                className="absolute top-4 right-4 z-20 bg-pop-pink text-white p-2 pop-border hover:scale-110 active:scale-90 transition-transform shadow-[2px_2px_0_#1a1a1a]"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Left: Graphic */}
              <div className={`w-full md:w-2/5 p-4 flex flex-col justify-center items-center relative shrink-0 ${selectedChar.color}`}>
                <div className="absolute inset-0 bg-halftone opacity-30"></div>
                {selectedChar.avatar ? (
                  <div className="z-10 w-24 h-24 md:w-48 md:h-48 rounded-full border-4 border-white overflow-hidden shadow-pop-lg transform -skew-x-6">
                    <img src={selectedChar.avatar} alt={selectedChar.name} className="w-full h-full object-cover object-top scale-110" />
                  </div>
                ) : (
                  <h2 className={`text-4xl md:text-6xl font-black italic -skew-x-12 z-10 text-center drop-shadow-md ${selectedChar.textColor || 'text-pop-black'}`}>
                    {selectedChar.name}
                  </h2>
                )}
                <div className="mt-4 md:mt-6 px-4 md:px-6 py-1.5 md:py-2 bg-pop-black text-white font-black text-lg md:text-xl pop-border z-10 transform -rotate-3 uppercase tracking-wider shadow-[4px_4px_0_#ffcc00] antialiased">
                  {selectedChar.role}
                </div>
              </div>

              {/* Right: Info */}
              <div className="w-full md:w-3/5 p-4 bg-halftone flex flex-col gap-3 md:gap-4 overflow-y-auto">

                <div className="flex flex-wrap gap-2">
                  {selectedChar.tags.map(tag => (
                    <span key={tag} className="px-3 py-1 bg-white text-pop-black text-sm font-bold pop-border -skew-x-6 shadow-[2px_2px_0_#1a1a1a]">
                      #{tag}
                    </span>
                  ))}
                </div>

                <PopCard className="bg-white">
                  <h3 className="text-lg md:text-xl font-black mb-2 flex items-center gap-2"><Star className="fill-pop-yellow text-pop-yellow"/> 个人情报</h3>
                  <p className="font-bold text-gray-700 leading-relaxed text-sm md:text-base">{selectedChar.desc}</p>
                </PopCard>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <PopCard variant="pink" className="p-3 md:p-4 shadow-pop">
                    <h3 className="text-sm md:text-md font-black text-white mb-2 flex items-center gap-2 border-b-2 border-white pb-1">
                      <Heart className="w-4 h-4 fill-white" /> 喜欢 (Likes)
                    </h3>
                    <p className="font-bold text-sm leading-relaxed">{selectedChar.likes}</p>
                  </PopCard>
                  <PopCard variant="cyan" className="p-3 md:p-4 shadow-pop">
                    <h3 className="text-sm md:text-md font-black text-pop-black mb-2 flex items-center gap-2 border-b-2 border-pop-black/30 pb-1">
                      <X className="w-4 h-4 stroke-[4px]" /> 讨厌 (Dislikes)
                    </h3>
                    <p className="font-bold text-sm leading-relaxed">{selectedChar.dislikes}</p>
                  </PopCard>
                </div>

                <PopCard className="bg-pop-black text-white shadow-pop-pink border-pop-pink relative">
                  <div className="absolute top-2 right-2 opacity-20 pointer-events-none"><AlertCircle className="w-12 h-12 md:w-16 md:h-16 text-pop-pink" /></div>
                  <div className="relative z-10 cursor-pointer" onClick={() => setIsSecretOpen(!isSecretOpen)}>
                    <div className="text-base md:text-lg font-black text-pop-pink outline-none select-none flex items-center justify-between">
                      CLASSIFIED SECRET / 小秘密
                      <span className={`text-pop-pink transition-transform ${isSecretOpen ? 'rotate-180' : ''}`}>▼</span>
                    </div>
                  </div>
                  <AnimatePresence>
                    {isSecretOpen && (
                      <motion.ul
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.15, ease: "linear" }}
                        className="font-bold text-white antialiased list-disc pl-5 space-y-2 relative z-10 overflow-hidden mt-4 text-sm md:text-base"
                      >
                        {selectedChar.secret.map((s, i) => <li key={i}>{s}</li>)}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </PopCard>

                <PopCard variant="yellow" className="bg-pop-yellow shadow-pop-pink border-4 border-pop-pink">
                  <h3 className="text-base md:text-lg font-black flex items-center gap-2 mb-2"><AlertCircle className="w-5 h-5"/> 经纪人(妹妹)的备忘录</h3>
                  <p className="font-bold text-pop-black italic bg-white/50 p-2 border-l-4 border-pop-pink text-sm md:text-base">
                    {selectedChar.sisterNote}
                  </p>
                </PopCard>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
