import type { Subsection } from '../../types/content'

export const ch1S17: Subsection[] = [
        {
          id: 's1.7.1',
          title: '发展脉络',
          knowledge: [
            {
              id: 'k1.7.1',
              figureIds: ['f1.7.1-timeline'],
              title: '从 ARPAnet 到商业化互联网',
              en: 'Internet History',
              summary:
                '互联网历经分组交换原理的确立（1961–1972）、互联网互联与私有网络（1972–1980）、新协议与网络激增（1980s）、商业化与 Web（1990s）到 2007 年的 5 亿主机。',
              tags: ['互联网历史', 'ARPAnet', 'Cerf-Kahn', 'TCP/IP', 'Web', '年表'],
              sources: [{ kind: 'ppt', ppt: 'Chapter1', slides: [111, 112, 113, 114, 115, 116] }],
              insight: {
                why: '本章讲的每一项技术都有其历史成因：分组交换为什么是"最优"的、TCP/IP 为什么能赢过 OSI、为什么互联网是"网络之网络"、为什么安全要"追赶补课"。**历史不是背景知识，而是解释设计选择的答案库。**',
                coreIdea: '互联网的历史可以概括为**四个阶段**：1961–1972 分组交换原理的确立；1972–1980 互联网互联与私有网络兴起；1980–1990 新协议爆发与网络激增；1990–2000 商业化、Web 与新应用。贯穿其中的核心是 **Cerf 与 Kahn 的互联网互联原则**：极简、自治、尽力而为服务模型、无状态路由器、去中心化控制。',
                mechanism: 'PPT 第 111–112 页的时间线可以按阶段读。1961 年 Kleinrock 用排队论证明分组交换的有效性，1964 年 Baran 把它引入军事网络，1967 年 ARPAnet 立项，1969 年第一个节点运行，1972 年公开演示并出现 NCP、第一个 email 程序，节点数达到 15。此后，1970 年有 ALOHAnet，1974 年 Cerf 与 Kahn 提出网络互联架构，1976 年 Xerox PARC 做出以太网；70 年代末 DECnet、SNA、XNA 等私有架构盛行，并出现定长分组交换（ATM 前身），1979 年 ARPAnet 达到 200 个节点。',
                comparison: '1983 年是分水岭：**TCP/IP 部署**取代 NCP，同年 DNS 定义；此前有 1982 年的 SMTP，此后有 1985 年的 FTP 与 1988 年的 TCP 拥塞控制。1990 年代 ARPAnet 退役（1991 年 NSF 解除商业限制，1995 年 NSFnet 退役），Web 诞生（超文本源自 Bush 1945、Nelson 1960s，HTML/HTTP 由 Berners-Lee 提出，1994 年出现 Mosaic 与 Netscape），1990 年代末估计有 5000 万主机、1 亿以上用户，骨干达到 Gbps。2007 年约 5 亿主机，语音视频 over IP、BitTorrent/Skype/PPLive 等 P2P 应用、YouTube 与游戏、无线与移动性兴起。',
              },
              blocks: [
                {
                  type: 'p',
                  text: 'PPT 第 111–115 页是一条跨越半个多世纪的时间线，第 116 页是本章总结。把它按阶段整理，才看得出**技术演进的内在逻辑**。',
                },
                {
                  type: 'h',
                  text: '阶段一（1961–1972）：分组交换原理的确立',
                },
                {
                  type: 'table',
                  caption: 'PPT 第 111 页：1961–1972',
                  headers: ['年份', '事件', '意义'],
                  rows: [
                    ['1961', '**Kleinrock** —— 排队论证明分组交换的有效性', '为"分组的统计复用优于电路预留"提供了第一份数学论证'],
                    ['1964', '**Baran** —— 分组交换在军事网络中的应用设想', '分组交换从理论走向工程构想'],
                    ['1967', '**ARPAnet** 由高级研究计划局（ARPA）构想', '首个大规模分组交换网络的立项'],
                    ['1969', '**第一个 ARPAnet 节点投入运行**', '分组交换第一次真正跑起来'],
                    ['1972', 'ARPAnet **公开演示**；**NCP（Network Control Protocol，第一个主机-主机协议）**；**第一个 email 程序**；ARPAnet 达 **15 个节点**', '从实验网走向可提供服务的网络'],
                  ],
                },
                {
                  type: 'callout',
                  tone: 'why',
                  title: '为什么 1961 年的排队论这么重要',
                  text: '因为它回答了"分组 vs 电路"这个**后来成为全章核心的争论**（k1.3.4）：在突发数据下，按需统计复用（分组）比预留独占（电路）能服务多得多的用户。**PPT 第 111 页把 Kleinrock 排在 1961 年的第一位，是在说：分组交换先是理论胜利，然后才是工程胜利。**',
                },
                {
                  type: 'h',
                  text: '阶段二（1972–1980）：互联网互联与私有网络',
                },
                {
                  type: 'table',
                  caption: 'PPT 第 112 页：1972–1980',
                  headers: ['年份', '事件', '意义'],
                  rows: [
                    ['1970', '**ALOHAnet** 夏威夷卫星网络', '无线随机接入（CSMA）的早期实践'],
                    ['1974', '**Cerf 与 Kahn** —— 网络互联的架构', '互联网的"宪法"'],
                    ['1976', '**Xerox PARC 的以太网**', '局域网技术的诞生'],
                    ['70 年代', '私有架构盛行：**DECnet、SNA、XNA**', '市场碎片化，为互联标准留出需求'],
                    ['70 年代末', '切换到**定长分组**（ATM 的前身）', '为高速网络做技术储备'],
                    ['1979', 'ARPAnet 达 **200 个节点**', '规模迅速增长'],
                  ],
                },
                {
                  type: 'callout',
                  tone: 'exam',
                  title: '考点提示：Cerf-Kahn 四原则',
                  text: 'PPT 第 112 页专门列出了 Cerf and Kahn\'s internetworking principles：**minimalism（极简）、autonomy（自治，互联网络不需要内部改动）、best effort service model（尽力而为服务模型）、stateless routers（无状态路由器）、decentralized control（去中心化控制）**，并总结为“define today\'s Internet architecture”（奠定了今天的互联网架构）。这五点与本章各处呼应：**无状态** → k1.3.5/k1.3.6；尽力而为 → k1.1.3；自治 → k1.3.7 的 ISP 层次结构；去中心化 → 没有中央管理者。',
                },
                {
                  type: 'p',
                  text: '类比：ARPAnet 走向互联网，像从一家铁路公司变成多式联运——各家只管自己的一段，靠统一时刻表和票务规则衔接。区别在于，互联网没有统一的调度中心，互联规则靠自愿共识。',
                },
                {
                  type: 'h',
                  text: '阶段三（1980–1990）：新协议与网络激增',
                },
                {
                  type: 'table',
                  caption: 'PPT 第 113 页：1980–1990',
                  headers: ['年份', '事件', '意义'],
                  rows: [
                    ['1982', '**SMTP** 邮件协议定义', '邮件成为互联网的标准应用'],
                    ['1983', '**TCP/IP 部署**（分水岭）；**DNS** 定义（名字到 IP 地址的转换）', '统一的协议族取代 NCP；名字系统出现'],
                    ['1985', '**FTP** 协议定义', '文件传输标准化'],
                    ['1988', '**TCP 拥塞控制**', '互联网学会自我保护'],
                    ['80 年代', '新的国家网络：**Csnet、BITnet、NSFnet、Minitel**；**10 万台主机**连入网络联合体', '规模爆炸，"网络之网络"成形'],
                  ],
                },
                {
                  type: 'callout',
                  tone: 'why',
                  title: '为什么 1983 是分水岭',
                  text: '因为此前 ARPAnet 用的是 NCP 协议，只有“ARPAnet 内部”的机器能互通。==1983 年 TCP/IP 全面部署==之后，不同网络（NSFnet、CSnet、各国网络）第一次有了**共同的语言**，互联网才真正成为“网络之网络”。这也印证了 k1.5.3 的结论：**事实标准一旦形成，就会碾过所有竞争者。**同年的 DNS 定义同样关键——人类需要用名字而不是数字来访问主机。',
                },
                {
                  type: 'h',
                  text: '阶段四（1990–2000 年代）：商业化、Web 与新应用',
                },
                {
                  type: 'table',
                  caption: 'PPT 第 114 页：1990 年代',
                  headers: ['年份', '事件', '意义'],
                  rows: [
                    ['1990s 初', '**ARPAnet 退役**', '军网让位给民用网络'],
                    ['1991', '**NSF 解除对 NSFnet 的商业使用限制**（1995 NSFnet 退役）', '互联网商业化的大门打开'],
                    ['1990s 初', '**Web**：超文本思想源自 **Bush 1945、Nelson 1960s**；**HTML、HTTP 由 Berners-Lee** 提出', '互联网找到了killer app'],
                    ['1994', '**Mosaic**（后有 Netscape）', '浏览器让普通人用上 Web'],
                    ['1990s 末', '**Web 商业化**', '互联网从研究网变成大众基础设施'],
                    ['1990s 末–2000s', '更多 killer app：**即时通信、P2P 文件共享**；**网络安全走到前台**；约 **5000 万主机、1 亿以上用户**；骨干链路达到 **Gbps**', '规模与商业双双起飞'],
                  ],
                },
                {
                  type: 'table',
                  caption: 'PPT 第 115 页：2007 年',
                  headers: ['方向', '内容'],
                  rows: [
                    ['规模', '约 **5 亿主机**（~500 million hosts）'],
                    ['业务', '**语音、视频 over IP**'],
                    ['P2P 应用', '**BitTorrent**（文件共享）、**Skype**（VoIP）、**PPLive**（视频）'],
                    ['更多应用', '**YouTube**、游戏'],
                    ['接入', '**无线与移动性**（wireless, mobility）'],
                  ],
                },
                {
                  type: 'callout',
                  tone: 'why',
                  title: '2007 年的条目与本节的呼应',
                  text: '① “Voice, Video over IP”——正是 k1.3.4 第 46 页那个“如何提供电路式行为”难题的产物，也是 RTP/RTCP、UDP 存在的理由（k1.2.4）；② “P2P 应用”——回到 k1.2.2 的两种通信范式；③ “wireless, mobility”——回到 k1.2.9 的无线接入网。**2007 年的互联网几乎把本章讲过的每一条线都拉到了一个新的量级。**',
                },
                {
                  type: 'h',
                  text: '第 116 页：本章小结',
                },
                {
                  type: 'p',
                  text: 'PPT 第 116 页 **"Introduction: Summary"** 说 **"Covered a ‘ton’ of material!"**，并列出本章覆盖的内容：Internet overview（互联网概览）、what\'s a protocol?（什么是协议）、network edge, core, access network（边缘、核心、接入网）、packet-switching versus circuit-switching（分组交换 vs 电路交换）、Internet structure（互联网结构）、performance: loss, delay, throughput（丢包、时延、吞吐量）、layering, service models（分层、服务模型）、security（安全）、history（历史）。最后一句总结得最好：',
                },
                {
                  type: 'quote',
                  text: 'You now have: context, overview, "feel" of networking — more depth, detail to follow!',
                  cite: 'Chapter1.pptx 第 116 页',
                },
                {
                  type: 'callout',
                  tone: 'exam',
                  title: '考点提示：历史部分的常见考法',
                  text: '① **按年份排序**是最常见的题型，重点记 1961、1969、1972、1974、1976、1983、1988、1994 与 2007；各年细节见上方四张表。② **Cerf-Kahn 五原则**要能默写。③ 关键年份要能说清“为什么重要”，而不只是背年份。',
                },
                {
                  type: 'callout',
                  tone: 'warning',
                  title: '易错点',
                  text: '① **1969 年是第一个 ARPAnet 节点**，不是 ARPAnet 建成；1972 年才达到 15 个节点。② 1983 年是 TCP/IP 部署，1982 年是 SMTP，顺序别错。③ Web 的超文本思想来自 Bush（1945）与 Nelson（1960s），HTML/HTTP 则是 Berners-Lee 的贡献。④ 1976 年以太网诞生于 Xerox PARC。',
                },
                {
                  type: 'callout',
                  tone: 'tip',
                  title: '记忆口诀',
                  text: '“**六一排队、七四互联、七六以太网、八三 TCP/IP、九十 Web、两千零七五亿机。**”“**Cerf-Kahn 五原则：简、自治、尽力而为、无状态、去中心。**”',
                },
                {
                  type: 'p',
                  text: '把 60 年的历史压缩成一句话：**互联网的成功 = 一个正确的技术选择（分组交换）+ 一套开放的制度（RFC/IETF）+ 一个压倒性的既成事实（TCP/IP）+ 一个引爆点（Web）**。四个因素缺一不可，而**"开放的制度"与"压倒性的既成事实"这两条，恰好就是 OSI 失败（k1.5.3）与 IPX/SPX 退场（k1.5.3 第 100 页）的反面注脚。**',
                },
              ],
              questionIds: ['q1.7.1-01', 'q1.7.1-02'],
              related: ['k1.3.4', 'k1.5.3', 'k1.1.2'],
            },
          ],
        },
]
