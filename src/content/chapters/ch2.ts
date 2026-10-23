// ============================================================
// 第二章 应用层（Application Layer）—— 课程内容数据
// 对应 PPT：Chapter2.pptx（124 页）
// 所有 ID 契约见 src/content/outline.ts（ch2Outline）
// ============================================================
import type { Chapter } from '../../types/content'
import { ch2S21 } from './ch2-s21'
import { ch2S22 } from './ch2-s22'
import { ch2S23 } from './ch2-s23'
import { ch2S24 } from './ch2-s24'
import { ch2S25 } from './ch2-s25'
import { ch2S26 } from './ch2-s26'
import { ch2S27 } from './ch2-s27'
import { ch2Summary } from './ch2-summary'

export const ch2: Chapter = {
  id: 'ch2',
  order: 2,
  title: '第二章 应用层',
  en: 'Application Layer',
  pptFile: 'Chapter2.pptx',
  intro:
    '应用层是 OSI 参考模型与 TCP/IP 五层模型的最高层，直接面对用户，是“网络能做什么”的最终体现。' +
    '本章从应用体系结构出发，依次讲解 Web 与 HTTP、FTP、电子邮件（SMTP/POP3/IMAP）、DNS、P2P 文件分发，' +
    '最后落到 Socket 编程。核心线索是：应用层协议规定“消息长什么样、什么时候发、怎么响应”，' +
    '而可靠性、时延、带宽等服务质量需求则交由传输层（TCP/UDP）来保障或牺牲。' +
    '本章的学习目标（PPT 第 3 页）有四：① 理解网络应用协议的概念与实现；' +
    '② 掌握传输层的服务模型；③ 掌握客户-服务器范式与对等（P2P）范式；' +
    '④ 通过剖析 HTTP、FTP、SMTP/POP3/IMAP、DNS 等真实协议来学习协议是如何设计的，' +
    '并最终能够使用套接字 API 编写网络应用。',
  sections: [
    // ==========================================================
    // 2.1 网络应用原理
    // ==========================================================
    {
      id: 's2.1',
      title: '2.1 网络应用原理',
      en: 'Principles of Network Applications',
      subsections: ch2S21,
    },
    // ==========================================================
    // 2.2 Web 与 HTTP
    // ==========================================================
    {
      id: 's2.2',
      title: '2.2 Web 与 HTTP',
      en: 'Web and HTTP',
      subsections: ch2S22,
    },
    // ==========================================================
    // 2.3 FTP
    // ==========================================================
    {
      id: 's2.3',
      title: '2.3 FTP',
      en: 'File Transfer Protocol',
      subsections: ch2S23,
    },
    // ==========================================================
    // 2.4 电子邮件
    // ==========================================================
    {
      id: 's2.4',
      title: '2.4 电子邮件',
      en: 'Electronic Mail',
      subsections: ch2S24,
    },
    // ==========================================================
    // 2.5 DNS
    // ==========================================================
    {
      id: 's2.5',
      title: '2.5 DNS',
      en: 'Domain Name System',
      subsections: ch2S25,
    },
    // ==========================================================
    // 2.6 P2P 文件分发
    // ==========================================================
    {
      id: 's2.6',
      title: '2.6 P2P 文件分发',
      en: 'P2P File Sharing',
      subsections: ch2S26,
    },
    // ==========================================================
    // 2.7 / 2.8 Socket 编程
    // ==========================================================
    {
      id: 's2.7',
      title: '2.7/2.8 Socket 编程',
      en: 'Socket Programming',
      subsections: ch2S27,
    },
  ],
  summary: ch2Summary,
}
