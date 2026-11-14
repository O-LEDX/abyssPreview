// 公告通知静态数据。纯前端展示：新增公告 = 在此追加条目后重新部署。
export type AnnouncementCategory = 'announcement' | 'versionUpdate' | 'important'

export interface Announcement {
  id: string
  title: string
  date: string // YYYY-MM-DD，视图按月分组展示
  category: AnnouncementCategory
  version?: string // 仅版本更新类携带
  content: string[]
}

export const announcements: Announcement[] = [
    {
    id: 'ann-2026-11-1001',
    title: '数据库更新',
    date: '2026-11-10',
    category: 'important',
    content: [
      '历史数据保留，采用MySQL数据库。',
    ],
  },
  {
    id: 'ann-2026-10-2601',
    title: 'ABYSS SYSTEM v1.0.0 正式发布',
    date: '2026-10-26',
    category: 'versionUpdate',
    version: 'v1.0.0',
    content: [
      '委托情况总览、详细事务列表、公海池、人员管理等核心模块全部上线。',
      '各站点历史委托数据已完成迁移，流转记录完整保留。',
    ],
  },
  {
    id: 'ann-2026-10-1802',
    title: '公海池流转规则说明',
    date: '2026-10-18',
    category: 'important',
    content: [
      '公海池，供各站点部长/雇员认领。',
    ],
  },
  {
    id: 'ann-2026-10-1003',
    title: '事务状态口径统一',
    date: '2026-10-10',
    category: 'announcement',
    content: [
      '事务状态统一为：待领取、跟进中、已完成、已失败四类。',
      '历史数据中的中间状态已按最新口径重新归类，统计口径以新版本为准。',
    ],
  },
  {
    id: 'ann-2026-09-3004',
    title: '公共接口白名单启用',
    date: '2026-09-30',
    category: 'announcement',
    content: [
      '接口管理页已上线，公共只读接口面向全体成员开放。',
      '涉及写入操作的接口仅限管理角色调用，如有疑问请先核对接口权限。',
    ],
  },
  {
    id: 'ann-2026-09-1205',
    title: 'v0.0.1 开发阶段',
    date: '2026-09-12',
    category: 'versionUpdate',
    version: 'v0.0.1',
    content: [
      "全栈开发阶段，已核心功能模块未完成。",
      "vibeCoding+AI辅助检查，完整链路实现采用AI审核排查+人工审核干预。",
    ],
  },
]