import fs from 'fs';
import path from 'path';
import { 
  User, 
  Task, 
  TaskSubmission, 
  ReferralMilestone, 
  ReferralClaim, 
  Withdrawal, 
  Transaction, 
  NotificationItem, 
  WebsiteSettings, 
  AuditLog 
} from '../types.js';

interface DatabaseSchema {
  users: User[];
  tasks: Task[];
  taskSubmissions: TaskSubmission[];
  referralMilestones: ReferralMilestone[];
  referralClaims: ReferralClaim[];
  withdrawals: Withdrawal[];
  transactions: Transaction[];
  notifications: NotificationItem[];
  settings: WebsiteSettings;
  auditLogs: AuditLog[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const defaultSettings: WebsiteSettings = {
  siteName: 'GP Wallet BD',
  siteLogo: '/src/assets/images/gp_wallet_logo_1793521411853.jpg',
  announcement: 'স্বাগতম GP Wallet BD-তে! সফলভাবে প্রতিটি টাস্ক শেষ করে প্রমাণ জমা দিন এবং বিকাশ বা নগদে সরাসরি দ্রুত পেমেন্ট নিন। কোনো ভুয়া তথ্য দিলে আইডি সাময়িক ব্লক হতে পারে।',
  whatsappUrl: 'https://wa.me/8801700000000',
  telegramUrl: 'https://t.me/gpwalletbd',
  facebookUrl: 'https://facebook.com/gpwalletbd',
  helpCenterUrl: 'https://t.me/gpwalletbd_support',
  termsAndConditions: '১. প্রতিটি ব্যবহারকারী কেবল একটি একাউন্ট ব্যবহার করতে পারবেন।\n২. টাস্কের সঠিক স্ক্রিনশট এবং ইউজার আইডি প্রমাণ হিসেবে জমা দিতে হবে।\n৩. রেফারেল কমিশন কেবল তখনই গণ্য হবে যখন আমন্ত্রিত ব্যক্তি সক্রিয়ভাবে টাস্ক সম্পন্ন করবে।\n৪. কোনো অসদুপায় বা অটোমেশন ব্যবহার করলে অ্যাকাউন্ট কোনো নোটিশ ছাড়াই স্থায়ীভাবে সাসপেন্ড করা হবে।',
  privacyPolicy: 'GP Wallet BD আপনার ব্যক্তিগত তথ্যের গোপনীয়তা রক্ষা করতে প্রতিশ্রুতিবদ্ধ। আপনার মোবাইল নম্বর ও লেনদেনের তথ্য কেবল পেমেন্ট প্রক্রিয়াকরণ ও যোগাযোগের জন্য সুরক্ষিতভাবে সংরক্ষিত থাকে।',
  referralPolicy: '১. আপনার রেফারেল কোড ব্যবহার করে যেকোনো নতুন ব্যবহারকারী নিবন্ধন করতে পারবেন।\n২. ২০, ৩০ এবং ১০০ জন সফল রেফারে যথাক্রমে ১০০০৳, ১৫০০৳ এবং ৫০০০৳ বোনাস দাবি করতে পারবেন।\n৩. প্রতিটি মাইলস্টোন একবারই দাবি করা যাবে। এডমিন ভেরিফিকেশনের পর মূল ব্যালেন্সে যুক্ত হবে।',
  withdrawalPolicy: '১. সর্বনিম্ন উত্তোলন ১০০ টাকা এবং সর্বোচ্চ ৫,০০০ টাকা।\n২. ২৪ ঘণ্টায় সর্বোচ্চ ১ বার উইথড্র রিকোয়েস্ট দেওয়া যাবে।\n৩. বিকাশ ও নগদ পার্সোনাল নাম্বারে ক্যাশ-আউট বা সেন্ড মানি পাঠানো হয়।\n৪. সাধারণত ২ থেকে ১২ ঘণ্টার মধ্যে এডমিন যাচাই করে পেমেন্ট সম্পন্ন করেন।',
  minWithdrawal: 100,
  maxWithdrawal: 5000,
  withdrawalIntervalHours: 24,
  bkashEnabled: true,
  nagadEnabled: true,
  bkashInstructions: 'আপনার সচল bKash Personal নম্বর দিন। উইথড্র রিকোয়েস্ট দেওয়ার পর ব্যালেন্স থেকে সমপরিমাণ টাকা সাময়িক রিজার্ভ রাখা হবে এবং পেমেন্ট সম্পন্ন হলে "Paid" স্ট্যাটাস দেখাবে।',
  nagadInstructions: 'আপনার সচল Nagad Personal নম্বর দিন। এডমিন ভেরিফাই করে আপনার নাম্বারে সরাসরি টাকা ট্রান্সফার করবে।',
  maintenanceMode: false
};

const defaultMilestones: ReferralMilestone[] = [
  { id: 1, title: '২০ জন সফল রেফারেল বোনাস', requiredReferrals: 20, rewardAmount: 1000 },
  { id: 2, title: '৩০ জন সফল রেফারেল বোনাস', requiredReferrals: 30, rewardAmount: 1500 },
  { id: 3, title: '১০০ জন ভিআইপি রেফারেল বোনাস', requiredReferrals: 100, rewardAmount: 5000 }
];

const defaultTasks: Task[] = [
  {
    id: 'task_yt_sub_1',
    title: 'ইউটিউব চ্যানেল সাবস্ক্রাইব ও বেল আইকন ক্লিক',
    shortDescription: 'আমাদের অফিসিয়াল ইউটিউব চ্যানেল সাবস্ক্রাইব করুন এবং বেল আইকন চালু করুন।',
    fullDescription: 'চ্যানেলে প্রবেশ করে "Subscribe" বাটনে চাপ দিন এবং Bell Icon "All" সিলেক্ট করুন। সাবস্ক্রাইব করা অবস্থার একটি পরিষ্কার স্ক্রিনশট নিন যাতে আপনার জিমেইল প্রোফাইল ও সাবস্ক্রিপশন দৃশ্যমান থাকে।',
    instructions: '১. নিচের "লিংক খুলুন" বাটনে ক্লিক করে ইউটিউব চ্যানেলে যান।\n২. Subscribe বাটনে ক্লিক করুন ও বেল আইকন অল করুন।\n৩. স্ক্রিনশট নিন এবং প্রমাণ জমা বাটনে ক্লিক করে আপনার GP Wallet ইউজার আইডি সহ পাঠান।',
    category: 'youtube',
    rewardAmount: 15,
    taskUrl: 'https://youtube.com',
    proofMethod: 'telegram',
    proofUrl: 'https://t.me/gpwalletbd_support',
    logoUrl: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=100&auto=format&fit=crop&q=80',
    iconName: 'youtube',
    isActive: true,
    totalCompleted: 142,
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString()
  },
  {
    id: 'task_tg_join_1',
    title: 'অফিসিয়াল টেলিগ্রাম আর্নিং চ্যানেলে যুক্ত হোন',
    shortDescription: 'টেলিগ্রাম চ্যানেলে জয়েন করে প্রতিদিনের নতুন অফার ও পেমেন্ট প্রুফ আপডেট পান।',
    fullDescription: 'আমাদের অফিশিয়াল টেলিগ্রাম চ্যানেলে জয়েন করুন এবং অন্তত সর্বশেষ ৩টি মেসেজে রিয়্যাকশন দিন। জয়েন থাকা অবস্থার স্ক্রিনশট প্রমাণ হিসেবে সাবমিট করুন।',
    instructions: '১. Telegram চ্যানেলের লিংকে প্রবেশ করুন।\n২. Join Channel বাটনে চাপুন।\n৩. স্ক্রিনশট তুলে নিচে আপনার ইউজার আইডি ও টাস্ক আইডি উল্লেখ করে হোয়াটসঅ্যাপ বা টেলিগ্রামে পাঠান।',
    category: 'telegram',
    rewardAmount: 10,
    taskUrl: 'https://t.me/gpwalletbd',
    proofMethod: 'whatsapp',
    proofUrl: 'https://wa.me/8801700000000',
    logoUrl: 'https://images.unsplash.com/photo-1614680376593-902f749f7ffc?w=100&auto=format&fit=crop&q=80',
    iconName: 'send',
    isActive: true,
    totalCompleted: 210,
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString()
  },
  {
    id: 'task_fb_like_1',
    title: 'ফেসবুক অফিসিয়াল পেজে লাইক ও ফলো করুন',
    shortDescription: 'ফেসবুক পেজ লাইক দিন, ফলো বাটন চাপুন এবং যেকোনো ১টি পোস্টে লাইক দিন।',
    fullDescription: 'আমাদের ফেসবুক ভেরিফাইড ব্র্যান্ড পেজে গিয়ে Like ও Follow দিন। পেজের পিন করা পোস্টে একটি সুন্দর কমেন্ট করুন। আপনার ফেসবুক আইডির নাম ও স্ক্রিনশট প্রমাণ পাঠান।',
    instructions: '১. ফেসবুক লিংকে ক্লিক করুন।\n২. Like এবং Follow করুন।\n৩. স্ক্রিনশট নিয়ে জমা দিন।',
    category: 'facebook',
    rewardAmount: 12,
    taskUrl: 'https://facebook.com/gpwalletbd',
    proofMethod: 'telegram',
    proofUrl: 'https://t.me/gpwalletbd_support',
    logoUrl: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=100&auto=format&fit=crop&q=80',
    iconName: 'facebook',
    isActive: true,
    totalCompleted: 98,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString()
  },
  {
    id: 'task_app_reg_1',
    title: 'মাইক্রোফাইন্যান্স অ্যাপ ডাউনলোড ও সাইন আপ',
    shortDescription: 'অংশীদার ফিন্যান্স অ্যাপ্লিকেশন ইনস্টল করুন এবং মোবাইল নাম্বার দিয়ে ফ্রিতে একাউন্ট খুলুন।',
    fullDescription: 'প্লে স্টোর থেকে স্পনসরড অ্যাপটি ডাউনলোড করে আপনার বৈধ মোবাইল নাম্বার দিয়ে সাইন আপ সম্পন্ন করুন। সফল সাইন আপের ওয়েলকাম ড্যাশবোর্ডের স্ক্রিনশট জমা দিন।',
    instructions: '১. লিংকে গিয়ে প্লেস্টোর থেকে অ্যাপ ইনস্টল করুন।\n২. নাম ও ফোন দিয়ে ফ্রি একাউন্ট তৈরি করুন।\n৩. ড্যাশবোর্ডের স্ক্রিনশট নিন এবং টাস্ক আইডি ও ইউজার আইডি সহ সেন্ড করুন।',
    category: 'app_registration',
    rewardAmount: 45,
    taskUrl: 'https://play.google.com',
    proofMethod: 'whatsapp',
    proofUrl: 'https://wa.me/8801700000000',
    logoUrl: 'https://images.unsplash.com/photo-1556742049-0a67e557224f?w=100&auto=format&fit=crop&q=80',
    iconName: 'smartphone',
    isActive: true,
    totalCompleted: 64,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: 'task_web_visit_1',
    title: 'স্পনসরড নিউজ পোর্টাল ভিজিট ও ১ মিনিট পাঠ',
    shortDescription: 'ওয়েবসাইট ভিজিট করুন এবং অন্তত ২ পাতা স্ক্রল করে ১ মিনিট অবস্থান করুন।',
    fullDescription: 'ওয়েবসাইটে প্রবেশ করে যেকোনো একটি আর্টিকেলে ক্লিক করুন। ১ মিনিট সময় নিয়ে পুরো পেজটি স্ক্রল করে পড়ুন এবং ভিজিট হিস্টোরি বা পেজের নিচের অংশের স্ক্রিনশট নিন।',
    instructions: '১. ওপেন লিংক ক্লিক করুন।\n২. ওয়েবসাইটে ৬০ সেকেন্ড সময় কাটান।\n৩. প্রুফ হিসেবে স্ক্রিনশট হোয়াটসঅ্যাপে প্রেরণ করুন।',
    category: 'web_visit',
    rewardAmount: 8,
    taskUrl: 'https://bdnews24.com',
    proofMethod: 'whatsapp',
    proofUrl: 'https://wa.me/8801700000000',
    logoUrl: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=100&auto=format&fit=crop&q=80',
    iconName: 'globe',
    isActive: true,
    totalCompleted: 312,
    createdAt: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 'task_web_reg_1',
    title: 'অনলাইন শপ রেজিস্ট্রেশন ও ইমেইল ভেরিফাই',
    shortDescription: 'বিডি শপ পোর্টালে নতুন অ্যাকাউন্ট খুলুন এবং ইমেইল নিশ্চিত করুন।',
    fullDescription: 'ওয়েবসাইটে ফ্রি অ্যাকাউন্ট খুলুন। সফল প্রোফাইল ক্রিয়েশনের পর অ্যাকাউন্ট পেইজের স্ক্রিনশট প্রমাণ হিসেবে পাঠান।',
    instructions: '১. ওপেন লিংকে গিয়ে Register বাটনে চাপুন।\n২. নাম, ইমেইল দিয়ে সাবমিট করুন।\n৩. সফল লগইন পাতার স্ক্রিনশট জমা দিন।',
    category: 'web_registration',
    rewardAmount: 35,
    taskUrl: 'https://daraz.com.bd',
    proofMethod: 'telegram',
    proofUrl: 'https://t.me/gpwalletbd_support',
    logoUrl: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=100&auto=format&fit=crop&q=80',
    iconName: 'shopping-bag',
    isActive: true,
    totalCompleted: 89,
    createdAt: new Date(Date.now() - 43200000).toISOString()
  }
];

const defaultUsers: User[] = [
  {
    id: 'usr_admin',
    userId: 'GP-ADMIN-01',
    fullName: 'সুপার অ্যাডমিন (Admin)',
    username: 'admin',
    email: 'supportteambd@gmail.com',
    mobile: '01700000000',
    password: 'admin123',
    balance: 50000,
    totalEarnings: 0,
    completedTasksCount: 0,
    pendingTasksCount: 0,
    referralCode: 'GPADMIN',
    totalInvited: 0,
    totalSuccessfulReferrals: 0,
    role: 'admin',
    status: 'active',
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString()
  },
  {
    id: 'usr_shakib',
    userId: 'GP10021',
    fullName: 'সাকিব আল হাসান',
    username: 'shakib75',
    mobile: '01812345678',
    password: 'password123',
    balance: 280,
    totalEarnings: 820,
    completedTasksCount: 5,
    pendingTasksCount: 1,
    referralCode: 'GP75SKB',
    totalInvited: 24,
    totalSuccessfulReferrals: 22,
    role: 'user',
    status: 'active',
    createdAt: new Date(Date.now() - 86400000 * 15).toISOString()
  },
  {
    id: 'usr_rahim',
    userId: 'GP10022',
    fullName: 'আব্দুর রহিম',
    username: 'rahim99',
    mobile: '01711223344',
    password: 'password123',
    balance: 150,
    totalEarnings: 350,
    completedTasksCount: 3,
    pendingTasksCount: 0,
    referralCode: 'GP99RHM',
    referredBy: 'GP10021',
    totalInvited: 5,
    totalSuccessfulReferrals: 4,
    role: 'user',
    status: 'active',
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString()
  }
];

const defaultTransactions: Transaction[] = [
  {
    id: 'tx_init_1',
    userId: 'GP10021',
    type: 'SIGNUP_BONUS',
    amount: 50,
    description: 'স্বাগতম বোনাস',
    balanceAfter: 50,
    createdAt: new Date(Date.now() - 86400000 * 15).toISOString()
  },
  {
    id: 'tx_init_2',
    userId: 'GP10021',
    type: 'TASK_REWARD',
    amount: 15,
    description: 'ইউটিউব সাবস্ক্রাইব টাস্ক সম্পন্ন করার পুরস্কার',
    referenceId: 'task_yt_sub_1',
    balanceAfter: 65,
    createdAt: new Date(Date.now() - 86400000 * 14).toISOString()
  },
  {
    id: 'tx_init_3',
    userId: 'GP10021',
    type: 'TASK_REWARD',
    amount: 45,
    description: 'মাইক্রোফাইন্যান্স অ্যাপ ডাউনলোড ও সাইন আপ পুরস্কার',
    referenceId: 'task_app_reg_1',
    balanceAfter: 110,
    createdAt: new Date(Date.now() - 86400000 * 12).toISOString()
  },
  {
    id: 'tx_init_4',
    userId: 'GP10021',
    type: 'WITHDRAWAL_RESERVE',
    amount: -100,
    description: 'bKash উত্তোলন অনুরোধ (সংরক্ষিত)',
    referenceId: 'wth_demo_1',
    balanceAfter: 10,
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString()
  },
  {
    id: 'tx_init_5',
    userId: 'GP10021',
    type: 'TASK_REWARD',
    amount: 270,
    description: 'দৈনিক স্পন্সরড টাস্ক রিওয়ার্ড',
    balanceAfter: 280,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
  }
];

const defaultWithdrawals: Withdrawal[] = [
  {
    id: 'wth_demo_1',
    userId: 'GP10021',
    userName: 'সাকিব আল হাসান',
    userMobile: '01812345678',
    paymentMethod: 'bkash',
    accountMobileNumber: '01812345678',
    amount: 100,
    status: 'Paid',
    requestedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    processedAt: new Date(Date.now() - 86400000 * 4).toISOString()
  }
];

const defaultSubmissions: TaskSubmission[] = [
  {
    id: 'sub_demo_1',
    taskId: 'task_tg_join_1',
    taskTitle: 'অফিসিয়াল টেলিগ্রাম আর্নিং চ্যানেলে যুক্ত হোন',
    userId: 'GP10021',
    userName: 'সাকিব আল হাসান',
    userMobile: '01812345678',
    rewardAmount: 10,
    proofNote: 'আমি চ্যানেলে জয়েন করেছি এবং ৩টি পোস্টে লাইক দিয়েছি। স্ক্রিনশট হোয়াটসঅ্যাপে পাঠিয়েছি।',
    proofMethodUsed: 'whatsapp',
    status: 'pending',
    submittedAt: new Date(Date.now() - 3600000 * 2).toISOString()
  }
];

const defaultNotifications: NotificationItem[] = [
  {
    id: 'notif_welcome',
    userId: 'GP10021',
    title: 'স্বাগতম GP Wallet BD-তে!',
    message: 'আপনার অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে। প্রতিদিন নতুন নতুন টাস্ক সম্পন্ন করে বিকাশ ও নগদে টাকা উত্তোলন করুন।',
    type: 'system',
    isRead: false,
    createdAt: new Date(Date.now() - 86400000 * 15).toISOString()
  },
  {
    id: 'notif_payout',
    userId: 'GP10021',
    title: 'উত্তোলন সফল হয়েছে (৳১০০)',
    message: 'আপনার bKash নম্বরে ৳১০০ সফলভাবে প্রেরণ করা হয়েছে। ধন্যবাদ GP Wallet BD-এর সাথে থাকার জন্য!',
    type: 'withdrawal',
    isRead: true,
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString()
  }
];

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        return {
          users: parsed.users || defaultUsers,
          tasks: parsed.tasks || defaultTasks,
          taskSubmissions: parsed.taskSubmissions || defaultSubmissions,
          referralMilestones: parsed.referralMilestones || defaultMilestones,
          referralClaims: parsed.referralClaims || [],
          withdrawals: parsed.withdrawals || defaultWithdrawals,
          transactions: parsed.transactions || defaultTransactions,
          notifications: parsed.notifications || defaultNotifications,
          settings: { ...defaultSettings, ...(parsed.settings || {}) },
          auditLogs: parsed.auditLogs || []
        };
      }
    } catch (e) {
      console.error('Error loading database. Initializing defaults.', e);
    }

    const initial: DatabaseSchema = {
      users: defaultUsers,
      tasks: defaultTasks,
      taskSubmissions: defaultSubmissions,
      referralMilestones: defaultMilestones,
      referralClaims: [],
      withdrawals: defaultWithdrawals,
      transactions: defaultTransactions,
      notifications: defaultNotifications,
      settings: defaultSettings,
      auditLogs: [
        {
          id: 'audit_init',
          adminUsername: 'system',
          action: 'SYSTEM_BOOT',
          details: 'GP Wallet BD প্ল্যাটফর্ম ডাটাবেজ প্রারম্ভিকীকরণ সফল হয়েছে।',
          timestamp: new Date().toISOString()
        }
      ]
    };
    this.saveData(initial);
    return initial;
  }

  private saveData(data: DatabaseSchema): void {
    try {
      const tempFile = `${DB_FILE}.tmp`;
      fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
      fs.renameSync(tempFile, DB_FILE);
    } catch (err) {
      console.error('Failed to write database file:', err);
    }
  }

  public save(): void {
    this.saveData(this.data);
  }

  // Getters
  public getUsers(): User[] { return this.data.users; }
  public getTasks(): Task[] { return this.data.tasks; }
  public getSubmissions(): TaskSubmission[] { return this.data.taskSubmissions; }
  public getMilestones(): ReferralMilestone[] { return this.data.referralMilestones; }
  public getClaims(): ReferralClaim[] { return this.data.referralClaims; }
  public getWithdrawals(): Withdrawal[] { return this.data.withdrawals; }
  public getTransactions(): Transaction[] { return this.data.transactions; }
  public getNotifications(): NotificationItem[] { return this.data.notifications; }
  public getSettings(): WebsiteSettings { return this.data.settings; }
  public getAuditLogs(): AuditLog[] { return this.data.auditLogs; }

  // Helpers
  public findUserById(idOrUserId: string): User | undefined {
    return this.data.users.find(u => u.id === idOrUserId || u.userId === idOrUserId);
  }

  public findUserByUsernameOrMobile(usernameOrMobile: string): User | undefined {
    return this.data.users.find(u => 
      u.username.toLowerCase() === usernameOrMobile.toLowerCase() || 
      u.mobile === usernameOrMobile ||
      (u.email && u.email.toLowerCase() === usernameOrMobile.toLowerCase())
    );
  }

  public findUserByEmail(email: string): User | undefined {
    if (!email) return undefined;
    const clean = email.toLowerCase().trim();
    return this.data.users.find(u => u.email && u.email.toLowerCase().trim() === clean);
  }

  public findUserByFirebaseUid(uid: string): User | undefined {
    if (!uid) return undefined;
    return this.data.users.find(u => u.firebaseUid === uid);
  }

  public addUser(user: User): void {
    this.data.users.push(user);
    this.save();
  }

  public updateUser(userId: string, partial: Partial<User>): User | undefined {
    const idx = this.data.users.findIndex(u => u.userId === userId || u.id === userId);
    if (idx !== -1) {
      this.data.users[idx] = { ...this.data.users[idx], ...partial };
      this.save();
      return this.data.users[idx];
    }
    return undefined;
  }

  public addTransaction(tx: Omit<Transaction, 'id' | 'createdAt'>): Transaction {
    const fullTx: Transaction = {
      ...tx,
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString()
    };
    this.data.transactions.unshift(fullTx);
    this.save();
    return fullTx;
  }

  public addNotification(notif: Omit<NotificationItem, 'id' | 'createdAt' | 'isRead'>): NotificationItem {
    const fullNotif: NotificationItem = {
      ...notif,
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      isRead: false,
      createdAt: new Date().toISOString()
    };
    this.data.notifications.unshift(fullNotif);
    this.save();
    return fullNotif;
  }

  public addAuditLog(adminUsername: string, action: string, details: string, targetId?: string): AuditLog {
    const log: AuditLog = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      adminUsername,
      action,
      details,
      targetId,
      timestamp: new Date().toISOString()
    };
    this.data.auditLogs.unshift(log);
    this.save();
    return log;
  }

  public updateSettings(partial: Partial<WebsiteSettings>): WebsiteSettings {
    this.data.settings = { ...this.data.settings, ...partial };
    this.save();
    return this.data.settings;
  }

  public updateMilestones(milestones: ReferralMilestone[]): void {
    this.data.referralMilestones = milestones;
    this.save();
  }

  public addTask(task: Task): Task {
    this.data.tasks.unshift(task);
    this.save();
    return task;
  }

  public updateTask(id: string, partial: Partial<Task>): Task | undefined {
    const idx = this.data.tasks.findIndex(t => t.id === id);
    if (idx !== -1) {
      this.data.tasks[idx] = { ...this.data.tasks[idx], ...partial };
      this.save();
      return this.data.tasks[idx];
    }
    return undefined;
  }

  public deleteTask(id: string): boolean {
    const idx = this.data.tasks.findIndex(t => t.id === id);
    if (idx !== -1) {
      this.data.tasks.splice(idx, 1);
      this.save();
      return true;
    }
    return false;
  }
}

export const db = new Database();
