export interface RequestComment {
  commentId: number;
  requestId: number;
  userId: number;
  username: string;
  roleName: string;
  commentText: string;
  createdDate: string;
}