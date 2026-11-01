import { 
  User, 
  Task, 
  TaskSubmission, 
  Withdrawal, 
  ReferralMilestone, 
  ReferralClaim, 
  Transaction, 
  NotificationItem, 
  WebsiteSettings,
  AuditLog
} from '../types.js';

const TOKEN_KEY = 'gp_wallet_token';
const USER_KEY = 'gp_wallet_user';

export const authStorage = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },
  setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
  },
  getUser(): User | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },
  setUser(user: User) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
};

async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = authStorage.getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    headers['x-user-id'] = token;
  }

  const res = await fetch(`/api${endpoint}`, {
    ...options,
    headers
  });

  const data = await res.json().catch(() => ({ error: 'সার্ভার রেসপন্স বুঝতে সমস্যা হয়েছে।' }));

  if (!res.ok) {
    throw new Error(data.error || 'একটি অপ্রত্যাশিত সমস্যা দেখা দিয়েছে।');
  }

  return data as T;
}

export const api = {
  auth: {
    async register(payload: {
      fullName: string;
      username: string;
      mobile: string;
      password: string;
      confirmPassword: string;
      referralCode?: string;
    }) {
      const res = await fetchApi<{ message: string; user: User; token: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      authStorage.setToken(res.token);
      authStorage.setUser(res.user);
      return res;
    },

    async login(payload: { username: string; password: string }) {
      const res = await fetchApi<{ message: string; user: User; token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      authStorage.setToken(res.token);
      authStorage.setUser(res.user);
      return res;
    },

    async getMe() {
      const res = await fetchApi<{ user: User }>('/auth/me');
      authStorage.setUser(res.user);
      return res.user;
    },

    async changePassword(payload: { currentPassword: string; newPassword: string; confirmPassword: string }) {
      return fetchApi<{ message: string }>('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    },

    async resetPassword(payload: { usernameOrMobile: string; newPassword: string; confirmPassword: string }) {
      return fetchApi<{ message: string }>('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    },

    async firebaseLogin(payload: {
      email: string;
      displayName?: string;
      firebaseUid: string;
      emailVerified?: boolean;
      referralCode?: string;
    }) {
      const res = await fetchApi<{ message: string; user: User; token: string }>('/auth/firebase-login', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      authStorage.setToken(res.token);
      authStorage.setUser(res.user);
      return res;
    },

    async verifyAdminAccess() {
      return fetchApi<{ authorized: boolean; email?: string; userId: string; role: string }>('/admin/verify-access');
    },

    logout() {
      authStorage.clear();
    }
  },

  settings: {
    async getPublic() {
      return fetchApi<{ settings: WebsiteSettings }>('/settings/public');
    }
  },

  tasks: {
    async getAll() {
      return fetchApi<{ tasks: (Task & { userSubmissionStatus: string; userSubmissionId: string | null })[] }>('/tasks');
    },

    async getById(id: string) {
      return fetchApi<{ task: Task; userSubmission: TaskSubmission | null }>(`/tasks/${id}`);
    },

    async submitProof(taskId: string, proofNote: string) {
      return fetchApi<{ message: string; submission: TaskSubmission }>(`/tasks/${taskId}/submit`, {
        method: 'POST',
        body: JSON.stringify({ proofNote })
      });
    }
  },

  referrals: {
    async getStats() {
      return fetchApi<{
        referralCode: string;
        referralLink: string;
        totalInvited: number;
        totalSuccessfulReferrals: number;
        milestones: (ReferralMilestone & {
          currentReferrals: number;
          isEligible: boolean;
          claimStatus: string;
          claimedAt: string | null;
        })[];
        invitedUsers: {
          userId: string;
          fullName: string;
          joinedAt: string;
          completedTasks: number;
          status: string;
        }[];
        claims: ReferralClaim[];
      }>('/referrals');
    },

    async claimMilestone(milestoneId: number) {
      return fetchApi<{ message: string; claim: ReferralClaim }>('/referrals/claim', {
        method: 'POST',
        body: JSON.stringify({ milestoneId })
      });
    }
  },

  withdrawals: {
    async submit(payload: { paymentMethod: string; accountMobileNumber: string; amount: number }) {
      return fetchApi<{ message: string; withdrawal: Withdrawal; newBalance: number }>('/withdrawals', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    },

    async getHistory() {
      if (!authStorage.getToken()) {
        return { withdrawals: [] };
      }
      return fetchApi<{ withdrawals: Withdrawal[] }>('/withdrawals/history');
    }
  },

  transactions: {
    async getAll() {
      if (!authStorage.getToken()) {
        return { transactions: [] };
      }
      return fetchApi<{ transactions: Transaction[] }>('/transactions');
    }
  },

  notifications: {
    async getAll() {
      if (!authStorage.getToken()) {
        return { notifications: [] };
      }
      return fetchApi<{ notifications: NotificationItem[] }>('/notifications');
    },

    async markAllRead() {
      if (!authStorage.getToken()) {
        return { message: '' };
      }
      return fetchApi<{ message: string }>('/notifications/mark-read', {
        method: 'POST'
      });
    }
  },

  admin: {
    async getDashboard() {
      return fetchApi<{
        stats: {
          totalUsers: number;
          newUsersToday: number;
          activeUsers: number;
          suspendedUsers: number;
          totalTasks: number;
          pendingSubmissions: number;
          approvedTasks: number;
          pendingClaims: number;
          pendingWithdrawals: number;
          paidWithdrawals: number;
          totalPaidAmount: number;
        };
        recentTransactions: Transaction[];
        recentAuditLogs: AuditLog[];
      }>('/admin/dashboard');
    },

    async getTasks() {
      return fetchApi<{ tasks: Task[] }>('/admin/tasks');
    },

    async createTask(taskData: Partial<Task>) {
      return fetchApi<{ message: string; task: Task }>('/admin/tasks', {
        method: 'POST',
        body: JSON.stringify(taskData)
      });
    },

    async updateTask(id: string, taskData: Partial<Task>) {
      return fetchApi<{ message: string; task: Task }>(`/admin/tasks/${id}`, {
        method: 'PUT',
        body: JSON.stringify(taskData)
      });
    },

    async deleteTask(id: string) {
      return fetchApi<{ message: string }>(`/admin/tasks/${id}`, {
        method: 'DELETE'
      });
    },

    async getSubmissions() {
      return fetchApi<{ submissions: TaskSubmission[] }>('/admin/submissions');
    },

    async reviewSubmission(id: string, action: 'approve' | 'reject', feedback?: string) {
      return fetchApi<{ message: string; submission: TaskSubmission }>(`/admin/submissions/${id}/review`, {
        method: 'POST',
        body: JSON.stringify({ action, feedback })
      });
    },

    async getReferralClaims() {
      return fetchApi<{ claims: ReferralClaim[] }>('/admin/referral-claims');
    },

    async reviewReferralClaim(id: string, action: 'approve' | 'reject', feedback?: string) {
      return fetchApi<{ message: string; claim: ReferralClaim }>(`/admin/referral-claims/${id}/review`, {
        method: 'POST',
        body: JSON.stringify({ action, feedback })
      });
    },

    async getWithdrawals() {
      return fetchApi<{ withdrawals: Withdrawal[] }>('/admin/withdrawals');
    },

    async updateWithdrawalStatus(id: string, status: string, reason?: string) {
      return fetchApi<{ message: string; withdrawal: Withdrawal }>(`/admin/withdrawals/${id}/status`, {
        method: 'POST',
        body: JSON.stringify({ status, reason })
      });
    },

    async getUsers(query?: string) {
      return fetchApi<{ users: User[] }>(`/admin/users${query ? `?q=${encodeURIComponent(query)}` : ''}`);
    },

    async getUserDetails(userId: string) {
      return fetchApi<{
        user: User;
        submissions: TaskSubmission[];
        withdrawals: Withdrawal[];
        transactions: Transaction[];
        referrals: any[];
      }>(`/admin/users/${userId}`);
    },

    async toggleUserStatus(userId: string, status: 'active' | 'suspended') {
      return fetchApi<{ message: string }>(`/admin/users/${userId}/status`, {
        method: 'POST',
        body: JSON.stringify({ status })
      });
    },

    async adjustUserBalance(userId: string, amount: number, reason: string) {
      return fetchApi<{ message: string; newBalance: number }>(`/admin/users/${userId}/adjust-balance`, {
        method: 'POST',
        body: JSON.stringify({ amount, reason })
      });
    },

    async getSettings() {
      return fetchApi<{ settings: WebsiteSettings; milestones: ReferralMilestone[] }>('/admin/settings');
    },

    async updateSettings(settings: Partial<WebsiteSettings>) {
      return fetchApi<{ message: string; settings: WebsiteSettings }>('/admin/settings', {
        method: 'POST',
        body: JSON.stringify(settings)
      });
    },

    async updateMilestones(milestones: ReferralMilestone[]) {
      return fetchApi<{ message: string; milestones: ReferralMilestone[] }>('/admin/milestones', {
        method: 'POST',
        body: JSON.stringify({ milestones })
      });
    }
  }
};
