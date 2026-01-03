// API 타입 정의

// User 타입
export interface User {
  pk: string;
  id: string;
  password: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

