export type Role = 'AbyssZero' | 'superAdministrator' | 'siteOfficer' | 'siteEmployees'
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'
export interface User {
  id:number;
  employeeNo:string;
  username:string;
  displayName:string;
  alias:string;
  role:Role;
  department:string;
  departments?:string[];
  contact:string;
  active:boolean
}
export interface DepartmentOfficer {
  id:number;
  username:string;
  displayName:string
}
export interface Department {
  id:number;
  name:string;
  parentId?:number|null;
  employeeCount:number;
  officers:DepartmentOfficer[]
}
export interface Task {
  id:number;
  taskNo:string;
  title:string;
  description:string;
  priority:string;
  status:TaskStatus;
  department:string;
  assignee?:string;
  assigneeAlias?:string;
  failureReason?:string;
  dueAt:string;
  createdAt:string;
  updatedAt?:string
}
export interface TaskReport {
  id:number;
  reporter:string;
  status:TaskStatus;
  content:string;
  createdAt:string
}
export interface TaskDetail {
  task:Task;
  reports:TaskReport[] 
}