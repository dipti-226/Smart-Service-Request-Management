export interface Dashboard {
  totalRequests: number;
  openRequests: number;
  inProgressRequests: number;
  onHoldRequests: number;
  resolvedRequests: number;
  closedRequests: number;
  cancelledRequests: number;
}