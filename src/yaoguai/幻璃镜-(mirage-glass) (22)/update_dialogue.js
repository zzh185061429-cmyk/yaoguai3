const fs = require('fs');
let content = fs.readFileSync('src/data/sampleData.ts', 'utf8');

const newDialogue = `export const SAMPLE_DIALOGUE = [
  {
    id: 'd1',
    characterId: 'c3',
    text: '所长！昨晚子时，我在土地庙外巡逻，听到一阵奇怪的响动，随后看到一个黑影往城北方向逃窜。',
    backgroundUrl: 'https://images.unsplash.com/photo-1542869781-a2725cb105f4?q=80&w=2000&auto=format&fit=crop',
    expression: 'jing-ya'
  },
  {
    id: 'd2',
    characterId: 'c3',
    text: '但是那里实在太黑了，我...我有点害怕，没敢追上去。',
    backgroundUrl: 'https://images.unsplash.com/photo-1542869781-a2725cb105f4?q=80&w=2000&auto=format&fit=crop',
    expression: 'hai-pa'
  },
  {
    id: 'd3',
    characterId: 'c1',
    text: '土地庙的供桌下，我发现了这块『带血的玉佩』，很可能是凶手不慎遗落的。',
    backgroundUrl: 'https://images.unsplash.com/photo-1542869781-a2725cb105f4?q=80&w=2000&auto=format&fit=crop',
    expression: 'neutral'
  },
  {
    id: 'd4',
    characterId: 'c3',
    text: '玉佩？难道说...哎呀，这种事情人家怎么好意思说出口。',
    backgroundUrl: 'https://images.unsplash.com/photo-1542869781-a2725cb105f4?q=80&w=2000&auto=format&fit=crop',
    expression: 'hai-xiu'
  },
  {
    id: 'd5',
    characterId: 'c3',
    text: '要是所长你昨天陪我一起巡逻就好了，你是不是陪隔壁的花魁喝酒去了！哼！',
    backgroundUrl: 'https://images.unsplash.com/photo-1542869781-a2725cb105f4?q=80&w=2000&auto=format&fit=crop',
    expression: 'chi-cu'
  },
  {
    id: 'd6',
    characterId: 'c3',
    text: '呜呜...明明说好要一直陪着小九的...',
    backgroundUrl: 'https://images.unsplash.com/photo-1542869781-a2725cb105f4?q=80&w=2000&auto=format&fit=crop',
    expression: 'shang-xin'
  },
  {
    id: 'd7',
    characterId: 'c1',
    text: '别闹了，玉佩的材质是上等的和田玉，而且背面雕刻着京城李家的纹章。',
    backgroundUrl: 'https://images.unsplash.com/photo-1542869781-a2725cb105f4?q=80&w=2000&auto=format&fit=crop',
    expression: 'neutral'
  },
  {
    id: 'd8',
    characterId: 'c3',
    text: '往城北跑了...？我想起来了！京城来的那位李公子，这几天正好就住在城北的悦来客栈！',
    backgroundUrl: 'https://images.unsplash.com/photo-1542869781-a2725cb105f4?q=80&w=2000&auto=format&fit=crop',
    expression: 'kai-xin'
  },
  {
    id: 'd9',
    characterId: 'c3',
    text: '这次一定不能让他跑了！敢在我们的地盘撒野，真是活腻了！',
    backgroundUrl: 'https://images.unsplash.com/photo-1542869781-a2725cb105f4?q=80&w=2000&auto=format&fit=crop',
    expression: 'sheng-qi'
  },
  {
    id: 'd10',
    characterId: 'c3',
    text: '不过，那家客栈的伙食太差了，我才不想去那种地方...好嫌弃...',
    backgroundUrl: 'https://images.unsplash.com/photo-1542869781-a2725cb105f4?q=80&w=2000&auto=format&fit=crop',
    expression: 'xian-qi'
  },
  {
    id: 'd11',
    characterId: 'c3',
    text: '总之，所长我们快出发吧！',
    backgroundUrl: 'https://images.unsplash.com/photo-1542869781-a2725cb105f4?q=80&w=2000&auto=format&fit=crop',
    expression: 'mo-ren'
  }
];`;

content = content.replace(/export const SAMPLE_DIALOGUE = \[[\s\S]*?\];/, newDialogue);

fs.writeFileSync('src/data/sampleData.ts', content, 'utf8');
