import type { SubsectionFigure } from './types'

export const ch2Figures: Record<string, SubsectionFigure> = {
  's2.1.1': { figureId: 'f2.1.1-app-architectures', contextByKnowledge: {
    'k2.1.1': '追踪应用程序只在端系统运行，路由器只转发而不执行应用逻辑。',
    'k2.1.2': '切换 C/S 与 P2P，观察谁提供内容、谁贡献上传能力。',
  } },
  's2.1.2': { figureId: 'f2.1.3-sockets', contextByKnowledge: {
    'k2.1.3': '沿进程、套接字和端口找到消息进入目标程序的路径。',
    'k2.1.4': '观察消息交换规则怎样约定类型、字段格式和响应时序。',
  } },
  's2.1.3': { figureId: 'f2.1.3-transport-service-selector', contextByKnowledge: {
    'k2.1.5': '播放轮换可靠性、吞吐量、时延与安全需求，并选择 TCP/UDP 对比服务能力。',
    'k2.1.6': '比较 TCP 与 UDP 的实际服务能力，注意它们都不保证时延。',
  } },
  's2.2.1': { figureId: 'f2.2.4-httptime', contextByKnowledge: {
    'k2.2.1': '调整连接方式，沿客户端与服务器间的请求、响应和对象传输时间线观察 RTT。',
    'k2.2.2': '观察客户端请求与服务器响应，联系 HTTP 默认无状态这一限制。',
    'k2.2.3': '对比每对象新建连接与复用持续连接的往返过程。',
    'k2.2.4': '按时间线分别观察建连 RTT、请求 RTT 和对象传输时间。',
  } },
  's2.2.2': { figureId: 'f2.2.2-http-message-bench', contextByKnowledge: {
    'k2.2.5': '选择请求报文，沿请求行、首部、空行和可选正文逐项检查。',
    'k2.2.6': '选择响应报文，观察状态行和状态码位于响应方向。',
  } },
  's2.2.3': { figureId: 'f2.2.3-cookie-cache-bench', contextByKnowledge: {
    'k2.2.7': '选择 Cookie 模式，追踪浏览器标识与站点状态关联。',
    'k2.2.8': '选择缓存模式，对比命中与回源路径以及链路负载变化。',
    'k2.2.9': '选择条件 GET，观察对象未修改时返回 304 且不发送正文。',
  } },
  's2.3.1': { figureId: 'f2.3.1-ftp', contextByKnowledge: {
    'k2.3.1': '观察控制连接传递命令，数据连接独立承载文件内容。',
  } },
  's2.4.1': { figureId: 'f2.4.2-smtp', contextByKnowledge: {
    'k2.4.1': '定位用户代理、邮件服务器和 SMTP 在投递过程中的职责。',
    'k2.4.2': '播放 SMTP push 流程，查看握手、数据传输和关闭阶段。',
    'k2.4.3': '此图只演示 SMTP 投递对话，不呈现 MIME 结构；多媒体邮件的 Content-Type 与边界格式见完整讲解。',
  } },
  's2.4.2': { figureId: 'f2.4.2-mail-retrieval-bench', contextByKnowledge: {
    'k2.4.4': '切换 POP3 与 IMAP，比较客户端下载策略与服务器同步状态。',
  } },
  's2.5.1': { figureId: 'f2.5.1-dns-directory', contextByKnowledge: {
    'k2.5.1': '沿分级目录查看解析责任如何分散，避免集中式单点瓶颈。',
    'k2.5.2': '切换 A、NS、MX 示例记录，确认 DNS 返回资源数据；CNAME 等记录类型见完整讲解。',
    'k2.5.3': '沿根、TLD 到权威区的委派链查找记录。',
    'k2.5.4': '从本地解析器开始追踪代理查询与缓存位置。',
  } },
  's2.5.2': { figureId: 'f2.5.5-dnstree', contextByKnowledge: {
    'k2.5.5': '切换迭代和递归，观察谁继续询问下一台 DNS 服务器。',
    'k2.5.6': '此图只对比递归与迭代查询，不展示资源记录字段；A、NS、MX 示例见前一小节的 DNS 目录图，字段与 TTL 见完整讲解。',
    'k2.5.7': '此图不拆解 DNS 消息格式；首部标志及问题/应答区段见完整讲解。',
    'k2.5.8': '此图演示根、TLD 与权威服务器之间的查询委派，不模拟注册商注册流程；NS 与地址记录示例见前一小节的 DNS 目录图。',
    'k2.5.9': '此图不模拟缓存投毒或 DNS 欺骗；缓存风险与信任边界见完整讲解。',
  } },
  's2.6.1': { figureId: 'f2.6.1-file-distribution', contextByKnowledge: {
    'k2.6.1': '切换 C/S 与 P2P 并调整源站上传能力，比较模型下界中服务器上传、下载速率与对等端总上传能力的瓶颈。',
  } },
  's2.6.2': { figureId: 'f2.6.2-bittorrent', contextByKnowledge: {
    'k2.6.2': '观察 tracker 交换邻居列表，再看块交换和 tit-for-tat 回赠。',
  } },
  's2.7.1': { figureId: 'f2.7.2-socketapi', contextByKnowledge: {
    'k2.7.1': '沿 TCP 套接字调用观察 bind、listen、connect、accept 与连接读写；UDP 和应用协议见完整讲解。',
    'k2.7.2': '观察 listen、connect 和 accept 如何建立独立 TCP 会话。',
    'k2.7.3': '图中展示 TCP 连接套接字；UDP 数据报接口见完整讲解。',
    'k2.7.4': '观察服务器接收连接并分配独立套接字；HTTP 文件服务属于应用实现，见完整讲解。',
  } },
}
