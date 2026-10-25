import type { SubsectionFigure } from './types'

export const ch3Figures: Record<string, SubsectionFigure> = {
  's3.1.1': { figureId: 'f3.1.1-transport', contextByKnowledge: {
    'k3.1.1': '追踪传输层如何把主机间交付扩展为进程间逻辑通信。',
    'k3.1.2': '比较网络层主机地址与传输层进程端口在路径中的作用。',
  } },
  's3.2.1': { figureId: 'f3.2.3-demux', contextByKnowledge: {
    'k3.2.1': '沿发送端合并套接字数据和接收端按首部分派的相反方向观察。',
    'k3.2.2': '查看 IP 地址与端口信息怎样参与选择目标套接字。',
    'k3.2.3': '本图只演示 UDP 二元组分用；改变源端口但保持目的 IP 与端口时，分组仍进入同一套接字。',
    'k3.2.4': '本图没有 TCP 模式；TCP 以源/目的 IP 与端口组成四元组区分连接，见完整讲解。',
  } },
  's3.3.1': { figureId: 'f3.3.3-checksum', contextByKnowledge: {
    'k3.3.1': '正文讲 UDP 的无连接数据报与应用场景；此图单独演示相关的校验和计算，不代表 UDP 服务流程。',
    'k3.3.2': '完整讲解列出 UDP 的四个 16 位首部字段；本图仅演示校验和的计算步骤。',
    'k3.3.3': '播放 16 位字相加、回卷进位与按位取反的校验和过程。',
  } },
  's3.4.1': { figureId: 'f3.4.1-reliable-transport-evolution', contextByKnowledge: {
    'k3.4.1': '先标出信道假设，再观察为可靠交付必须补上的机制。',
    'k3.4.2': '逐步切换 rdt 版本，辨认校验和、序号与 ACK 的引入顺序。',
    'k3.4.3': '切换到包含定时器的 rdt3.0，观察超时如何触发重传；本图不提供独立丢包场景选择器。',
    'k3.4.4': '观察停等确认造成的空闲区间，联系链路利用率下降。',
  } },
  's3.4.2': { figureId: 'f3.4.6-window', contextByKnowledge: {
    'k3.4.5': '观察多个未确认分组在途，理解窗口如何形成流水线。',
    'k3.4.6': '播放 GBN，查看接收端丢弃乱序段及超时后整段重传。',
    'k3.4.7': '本图继续展示 GBN：乱序分组被丢弃，超时后重传未确认窗口；SR 的缓存与选择性重传见完整讲解。',
  } },
  's3.5.1': { figureId: 'f3.5.1-tcp-byte-assembly', contextByKnowledge: {
    'k3.5.1': '观察字节流切成报文段传输，消息边界不会由 TCP 自动保留。',
    'k3.5.2': '本图展示 Seq、Len 与 ACK 的字节序号和接收装配；TCP 首部字段见完整讲解。',
    'k3.5.3': '使用字节刻度查看段序号和累计 ACK 的下一个期望字节。',
  } },
  's3.5.2': { figureId: 'f3.5.4-rtt-timeout', contextByKnowledge: {
    'k3.5.4': '选择 RTT 观测、平滑估计或定时器视图；示例样本固定，EstimatedRTT、DevRTT 与 RTO 的教材公式见完整讲解。',
  } },
  's3.5.3': { figureId: 'f3.5.3-tcp-reliability-bench', contextByKnowledge: {
    'k3.5.5': '观察发送窗口、累计确认与超时重传如何共同维护字节流。',
    'k3.5.6': '本图固定轨迹包含乱序到达、重复 ACK 与缺口补齐；它没有 ACK 策略选择器，接收方规则见完整讲解。',
    'k3.5.7': '切换到快速重传轨迹，观察第三个重复 ACK 如何触发重传最早未确认段。',
  } },
  's3.5.4': { figureId: 'f3.5.8-rwnd', contextByKnowledge: {
    'k3.5.8': '切换应用读取速率或暂停读取，观察缓冲区填满时 rwnd 降为 0、恢复读取后发送重启。',
  } },
  's3.5.5': { figureId: 'f3.5.9-connection-management', contextByKnowledge: {
    'k3.5.9': '选择两次握手，观察旧请求或延迟消息如何造成状态不一致。',
    'k3.5.10': '选择三次握手，跟踪 SYN、SYN+ACK、ACK 与双方序号确认。',
    'k3.5.11': '选择关闭连接，观察两个方向分别关闭和主动端 TIME_WAIT。',
  } },
  's3.6.1': { figureId: 'f3.6.1-congestion', contextByKnowledge: {
    'k3.6.1': '调节水泵数量改变示例输入速率，观察有限队列积压、溢出丢包与出口吞吐；这不是 TCP 拥塞控制模型。',
    'k3.6.2': '本图没有端系统算法或网络反馈模式；两类拥塞控制信号及其差异见完整讲解。',
    'k3.6.3': '本图不模拟 ATM ABR 或 RM 信元；显式反馈机制见完整讲解。',
  } },
  's3.7.1': { figureId: 'f3.7.2-cwnd', contextByKnowledge: {
    'k3.7.1': '把 cwnd 曲线与 AIMD 的增大、减小动作联系起来。',
    'k3.7.2': '观察慢启动指数增长与拥塞避免线性增长的阶段切换。',
    'k3.7.3': '本图按固定轨迹展示重复 ACK 与超时两次转折，并非可选择的状态机；逐步细节见完整讲解。',
    'k3.7.4': '本图只显示一条教材控制轨迹，不含 TCP 变体选择器；Tahoe、Reno、NewReno 与 SACK 的差异见完整讲解表。',
  } },
}
