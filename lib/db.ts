import Dexie, { Table } from 'dexie';

export interface Execution {
  id?: number;
  executionId: string;
  fileName: string;
  status: 'running' | 'success' | 'error' | 'waiting' | 'unknown';
  createdAt: Date;
  updatedAt: Date;
}

export class TaskManagerDB extends Dexie {
  executions!: Table<Execution>;

  constructor() {
    super('taskManagerDB');
    this.version(1).stores({
      executions: '++id, executionId, status, createdAt'
    });
  }
}

export const db = new TaskManagerDB();