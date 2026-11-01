export type TaskCategory = 
  | 'youtube' 
  | 'telegram' 
  | 'facebook' 
  | 'web_registration' 
  | 'app_registration' 
  | 'web_visit' 
  | 'other';

export type ProofMethod = 'whatsapp' | 'telegram' | 'external';

export type TaskSubmissionStatus = 'pending' | 'approved' | 'rejected';

export type WithdrawalStatus = 
  | 'Pending' 
  | 'Approved' 
  | 'Processing' 
  | 'Paid' 
  | 'Rejected' 
  | 'Cancelled';

export type PaymentMethod = 'bkash' | 'nagad';

export type TransactionType = 
  | 'TASK_REWARD' 
  | 'REFERRAL_REWARD' 
  | 'WITHDRAWAL_RESERVE' 
  | 'WITHDRAWAL_REFUND' 
  | 'ADMIN_ADJUSTMENT' 
  | 'SIGNUP_BONUS';

export interface User {
  id: string;
  userId: string; // e.g. GP10284
  fullName: string;
  username: string;
  mobile: string;
  email?: string;
  firebaseUid?: string;
  emailVerified?: boolean;
  password?: string;
  balance: number;
  totalEarnings: number;
  completedTasksCount: number;
  pendingTasksCount: number;
  referralCode: string;
  referredBy?: string; // inviter userId
  totalInvited: number;
  totalSuccessfulReferrals: number;
  role: 'user' | 'admin';
  status: 'active' | 'suspended';
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  instructions: string;
  category: TaskCategory;
  rewardAmount: number; // in BDT (৳)
  taskUrl: string;
  proofMethod: ProofMethod;
  proofUrl: string;
  logoUrl?: string;
  iconName?: string;
  isActive: boolean;
  totalCompleted: number;
  createdAt: string;
}

export interface TaskSubmission {
  id: string;
  taskId: string;
  taskTitle: string;
  userId: string;
  userName: string;
  userMobile: string;
  rewardAmount: number;
  proofNote: string;
  proofMethodUsed: ProofMethod;
  status: TaskSubmissionStatus;
  adminFeedback?: string;
  submittedAt: string;
  reviewedAt?: string;
}

export interface ReferralMilestone {
  id: 1 | 2 | 3;
  title: string;
  requiredReferrals: number;
  rewardAmount: number; // in BDT (৳)
}

export interface ReferralClaim {
  id: string;
  userId: string;
  userName: string;
  userMobile: string;
  milestoneId: 1 | 2 | 3;
  milestoneName: string;
  rewardAmount: number;
  referralsAtClaim: number;
  status: 'pending' | 'approved' | 'rejected';
  claimedAt: string;
  reviewedAt?: string;
}

export interface Withdrawal {
  id: string;
  userId: string;
  userName: string;
  userMobile: string;
  paymentMethod: PaymentMethod;
  accountMobileNumber: string;
  amount: number;
  status: WithdrawalStatus;
  rejectionReason?: string;
  requestedAt: string;
  processedAt?: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number; // positive for credit, negative for debit
  description: string;
  referenceId?: string;
  balanceAfter: number;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string; // user ID or 'all'
  title: string;
  message: string;
  type: 'task' | 'referral' | 'withdrawal' | 'system';
  isRead: boolean;
  createdAt: string;
}

export interface WebsiteSettings {
  siteName: string;
  siteLogo: string;
  announcement: string;
  whatsappUrl: string;
  telegramUrl: string;
  facebookUrl: string;
  helpCenterUrl: string;
  termsAndConditions: string;
  privacyPolicy: string;
  referralPolicy: string;
  withdrawalPolicy: string;
  minWithdrawal: number;
  maxWithdrawal: number;
  withdrawalIntervalHours: number;
  bkashEnabled: boolean;
  nagadEnabled: boolean;
  bkashInstructions: string;
  nagadInstructions: string;
  maintenanceMode: boolean;
}

export interface AuditLog {
  id: string;
  adminUsername: string;
  action: string;
  targetId?: string;
  details: string;
  timestamp: string;
}
