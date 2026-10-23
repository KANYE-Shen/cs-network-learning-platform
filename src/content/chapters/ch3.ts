import type { Chapter } from '../../types/content'
import { ch3Summary } from './ch3-summary'
import { ch3Part1 } from './ch3-part1'
import { ch3Part2 } from './ch3-part2'
import { ch3Part3 } from './ch3-part3'

export const ch3: Chapter = {
  id: 'ch3',
  order: 3,
  title: '第三章 传输层',
  en: 'Transport Layer',
  pptFile: 'Chapter3.pptx',
  intro:
    '传输层是协议栈中第一个"端到端"的层次：它把网络层"主机到主机"的尽力而为服务，升级为"进程到进程"的可靠（TCP）或轻量（UDP）服务。本章沿两条主线展开——可靠数据传输的原理（rdt 演进、流水线、GBN/SR）与其实例化（TCP 的序号确认、超时重传、快重传、流量控制、连接管理、拥塞控制）。',
  sections: [
    { id: 's3.1', title: '3.1 传输层服务', en: 'Transport-Layer Services', subsections: ch3Part1.slice(0, 1) },
    { id: 's3.2', title: '3.2 复用与分用', en: 'Multiplexing & Demultiplexing', subsections: ch3Part1.slice(1, 2) },
    { id: 's3.3', title: '3.3 UDP', en: 'Connectionless Transport: UDP', subsections: ch3Part1.slice(2, 3) },
    { id: 's3.4', title: '3.4 可靠数据传输原理', en: 'Principles of Reliable Data Transfer', subsections: ch3Part2 },
    { id: 's3.5', title: '3.5 TCP', en: 'Connection-Oriented Transport: TCP', subsections: ch3Part3.slice(0, 5) },
    {
      id: 's3.6',
      title: '3.6 拥塞控制原理',
      en: 'Principles of Congestion Control',
      subsections: ch3Part3.slice(5, 6),
    },
    {
      id: 's3.7',
      title: '3.7 TCP 拥塞控制',
      en: 'TCP Congestion Control',
      subsections: ch3Part3.slice(6, 7),
    },
  ],
  summary: ch3Summary,
}
