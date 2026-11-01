import { Router, Request, Response } from 'express';
import { db } from './db.js';
import { 
  User, 
  Task, 
  TaskSubmission, 
  Withdrawal, 
  PaymentMethod, 
  ReferralMilestone, 
  ReferralClaim,
  ProofMethod
} from '../types.js';

export const apiRouter = Router();

// Middleware to extract token or user session
// We support simple Bearer token or User ID header for robust client-server communication
function getAuthUser(req: Request): User | null {
  const authHeader = req.headers.authorization;
  const userIdHeader = req.headers['x-user-id'] as string;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    // Token can be userId or admin token
    const user = db.findUserById(token);
    if (user) return user;
  }
  
  if (userIdHeader) {
    const user = db.findUserById(userIdHeader);
    if (user) return user;
  }
  
  return null;
}

function requireAuth(req: Request, res: Response, next: () => void) {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: 'অনুগ্রহ করে প্রথমে লগইন করুন।' });
    return;
  }
  if (user.status === 'suspended') {
    res.status(403).json({ error: 'আপনার অ্যাকাউন্টটি সাময়িকভাবে স্থগিত করা হয়েছে। সাপোর্টে যোগাযোগ করুন।' });
    return;
  }
  (req as any).user = user;
  next();
}

// Authorized Admin Whitelist: ONLY supportteambd@gmail.com and optional ADMIN_EMAIL env var
export const AUTHORIZED_ADMIN_EMAILS: string[] = [
  'supportteambd@gmail.com',
  (process.env.ADMIN_EMAIL || '').toLowerCase().trim()
].filter(Boolean);

export function isAuthorizedAdminUser(user: User | null | undefined): boolean {
  if (!user) return false;
  if (user.role !== 'admin') return false;
  
  const userEmail = (user.email || '').toLowerCase().trim();
  if (userEmail && AUTHORIZED_ADMIN_EMAILS.includes(userEmail)) {
    return true;
  }
  
  return false;
}

function requireAdmin(req: Request, res: Response, next: () => void) {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: 'অনুগ্রহ করে প্রথমে লগইন করুন।' });
    return;
  }
  if (!isAuthorizedAdminUser(user)) {
    res.status(403).json({ error: 'শুধুমাত্র নির্ধারিত অনুমোদিত অ্যাডমিন একাউন্ট থেকে এই প্যানেল ও কার্যক্রমে প্রবেশ করা যাবে।' });
    return;
  }
  if (user.status === 'suspended') {
    res.status(403).json({ error: 'আপনার অ্যাকাউন্টটি সাময়িকভাবে স্থগিত করা হয়েছে।' });
    return;
  }
  (req as any).user = user;
  next();
}

// ---------------- AUTH ROUTES ---------------- //

// Register
apiRouter.post('/auth/register', (req: Request, res: Response) => {
  const { fullName, username, mobile, password, confirmPassword, referralCode } = req.body;

  if (!fullName || !username || !mobile || !password) {
    res.status(400).json({ error: 'অনুগ্রহ করে সব তথ্য সঠিকভাবে পূরণ করুন।' });
    return;
  }

  if (password !== confirmPassword) {
    res.status(400).json({ error: 'পাসওয়ার্ড দুটি মিলছে না।' });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ error: 'পাসওয়ার্ড ন্যূনতম ৬ অক্ষরের হতে হবে।' });
    return;
  }

  const cleanUsername = username.trim().toLowerCase();
  const cleanMobile = mobile.trim();

  // Check unique username
  const existingUsername = db.getUsers().find(u => u.username.toLowerCase() === cleanUsername);
  if (existingUsername) {
    res.status(400).json({ error: 'এই ব্যবহারকারী নামটি (Username) ইতিমধ্যে ব্যবহৃত হয়েছে।' });
    return;
  }

  // Check unique mobile
  const existingMobile = db.getUsers().find(u => u.mobile === cleanMobile);
  if (existingMobile) {
    res.status(400).json({ error: 'এই মোবাইল নম্বরটি ইতিমধ্যে নিবন্ধিত হয়েছে।' });
    return;
  }

  // Generate unique User ID: GP + 5 random digits
  let newUserId = `GP${Math.floor(10000 + Math.random() * 90000)}`;
  while (db.findUserById(newUserId)) {
    newUserId = `GP${Math.floor(10000 + Math.random() * 90000)}`;
  }

  // Generate unique referral code
  let userRefCode = `GP${Math.floor(100 + Math.random() * 900)}${cleanUsername.substring(0, 3).toUpperCase()}`;

  // Check if referred by someone
  let referrerUser: User | undefined;
  if (referralCode && referralCode.trim()) {
    const cleanRef = referralCode.trim().toUpperCase();
    referrerUser = db.getUsers().find(u => u.referralCode === cleanRef || u.userId === cleanRef);
  }

  const newUser: User = {
    id: `usr_${Date.now()}`,
    userId: newUserId,
    fullName: fullName.trim(),
    username: cleanUsername,
    mobile: cleanMobile,
    password: password,
    balance: 20, // Free signup bonus in BDT
    totalEarnings: 20,
    completedTasksCount: 0,
    pendingTasksCount: 0,
    referralCode: userRefCode,
    referredBy: referrerUser ? referrerUser.userId : undefined,
    totalInvited: 0,
    totalSuccessfulReferrals: 0,
    role: 'user',
    status: 'active',
    createdAt: new Date().toISOString()
  };

  db.addUser(newUser);

  // Add signup bonus transaction
  db.addTransaction({
    userId: newUser.userId,
    type: 'SIGNUP_BONUS',
    amount: 20,
    description: 'নতুন রেজিস্ট্রেশন ওয়েলকাম বোনাস',
    balanceAfter: 20
  });

  // If invited by a user, increment inviter's totalInvited count only.
  // The referral stays INACTIVE until they complete an approved task.
  if (referrerUser) {
    db.updateUser(referrerUser.userId, {
      totalInvited: (referrerUser.totalInvited || 0) + 1
    });

    db.addNotification({
      userId: referrerUser.userId,
      title: 'নতুন রেফারেল যুক্ত হয়েছে (Inactive)',
      message: `${newUser.fullName} (${newUser.userId}) আপনার রেফারেল কোড দিয়ে একাউন্ট খুলেছেন। টাস্ক সম্পন্ন ও অনুমোদিত হলে উনি Active রেফারেল হবেন।`,
      type: 'referral'
    });
  }

  // Welcome notification
  db.addNotification({
    userId: newUser.userId,
    title: 'GP Wallet BD-তে স্বাগতম!',
    message: 'আপনার একাউন্ট সফলভাবে তৈরি হয়েছে এবং ৳২০ ওয়েলকাম বোনাস যুক্ত করা হয়েছে। প্রতিদিন টাস্ক সম্পন্ন করে আয় করুন!',
    type: 'system'
  });

  const { password: _, ...safeUser } = newUser;
  res.status(201).json({
    message: 'রেজিস্ট্রেশন সফল হয়েছে!',
    user: safeUser,
    token: newUser.userId
  });
});

// Login
apiRouter.post('/auth/login', (req: Request, res: Response) => {
  const identifier = req.body.username || req.body.usernameOrMobile;
  const { password } = req.body;

  if (!identifier || !password) {
    res.status(400).json({ error: 'ব্যবহারকারী নাম/মোবাইল ও পাসওয়ার্ড প্রদান করুন।' });
    return;
  }

  const clean = identifier.trim();
  const user = db.findUserByUsernameOrMobile(clean);

  if (!user || user.password !== password) {
    res.status(401).json({ error: 'ভুল ব্যবহারকারী নাম বা পাসওয়ার্ড।' });
    return;
  }

  if (user.status === 'suspended') {
    res.status(403).json({ error: 'আপনার অ্যাকাউন্ট সাময়িকভাবে স্থগিত করা হয়েছে। এডমিনের সাথে যোগাযোগ করুন।' });
    return;
  }

  const { password: _, ...safeUser } = user;
  res.json({
    message: 'লগইন সফল হয়েছে!',
    user: safeUser,
    token: user.userId
  });
});

// Get current user profile & live stats
apiRouter.get('/auth/me', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const freshUser = db.findUserById(user.userId);
  if (!freshUser) {
    res.status(404).json({ error: 'ব্যবহারকারী খুঁজে পাওয়া যায়নি।' });
    return;
  }
  const { password: _, ...safeUser } = freshUser;
  res.json({ user: safeUser });
});

// Change Password
apiRouter.post('/auth/change-password', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const { currentPassword, newPassword, confirmPassword } = req.body;

  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: 'সকল তথ্য প্রদান করুন।' });
    return;
  }

  if (user.password !== currentPassword) {
    res.status(400).json({ error: 'বর্তমান পাসওয়ার্ডটি সঠিক নয়।' });
    return;
  }

  if (newPassword !== confirmPassword) {
    res.status(400).json({ error: 'নতুন পাসওয়ার্ড দুটি মিলছে না।' });
    return;
  }

  if (newPassword.length < 6) {
    res.status(400).json({ error: 'নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।' });
    return;
  }

  db.updateUser(user.userId, { password: newPassword });
  res.json({ message: 'পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে।' });
});

// Password recovery reset
apiRouter.post('/auth/reset-password', (req: Request, res: Response) => {
  const { usernameOrMobile, newPassword, confirmPassword } = req.body;
  if (!usernameOrMobile || !newPassword) {
    res.status(400).json({ error: 'প্রয়োজনীয় তথ্য পূরণ করুন।' });
    return;
  }
  if (newPassword !== confirmPassword) {
    res.status(400).json({ error: 'পাসওয়ার্ড দুটি মিলছে না।' });
    return;
  }
  if (newPassword.length < 6) {
    res.status(400).json({ error: 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।' });
    return;
  }

  const user = db.findUserByUsernameOrMobile(usernameOrMobile.trim());
  if (!user) {
    res.status(404).json({ error: 'এই ব্যবহারকারী নাম বা নম্বরে কোনো অ্যাকাউন্ট পাওয়া যায়নি।' });
    return;
  }

  db.updateUser(user.userId, { password: newPassword });
  db.addNotification({
    userId: user.userId,
    title: 'পাসওয়ার্ড রিসেট সম্পন্ন',
    message: 'আপনার অ্যাকাউন্টের পাসওয়ার্ড সফলভাবে রিসেট করা হয়েছে।',
    type: 'system'
  });

  res.json({ message: 'পাসওয়ার্ড সফলভাবে রিসেট হয়েছে! এখন নতুন পাসওয়ার্ড দিয়ে লগইন করুন।' });
});

// Firebase Google / Email Sign-in & Registration
apiRouter.post('/auth/firebase-login', (req: Request, res: Response) => {
  const { email, displayName, firebaseUid, emailVerified, referralCode } = req.body;

  if (!email || !firebaseUid) {
    res.status(400).json({ error: 'ইমেইল বা ফায়ারবেস তথ্য প্রদান করা হয়নি।' });
    return;
  }

  const cleanEmail = email.toLowerCase().trim();
  const isAdminEmail = AUTHORIZED_ADMIN_EMAILS.includes(cleanEmail);

  // Check if existing user by email or firebaseUid
  let existingUser = db.findUserByEmail(cleanEmail) || db.findUserByFirebaseUid(firebaseUid);

  if (existingUser) {
    if (existingUser.status === 'suspended') {
      res.status(403).json({ error: 'আপনার অ্যাকাউন্টটি সাময়িকভাবে স্থগিত করা হয়েছে। সাপোর্টে যোগাযোগ করুন।' });
      return;
    }

    // Update verified status, firebaseUid and admin role if matching admin email
    const updateData: Partial<User> = {
      firebaseUid,
      email: cleanEmail,
      emailVerified: !!emailVerified
    };

    if (isAdminEmail) {
      updateData.role = 'admin';
    } else if (existingUser.role === 'admin' && !isAdminEmail) {
      // Strip any unapproved admin role
      updateData.role = 'user';
    }

    const updatedUser = db.updateUser(existingUser.userId, updateData) || existingUser;
    const { password: _, ...safeUser } = updatedUser;

    res.json({
      message: 'লগইন সফল হয়েছে!',
      user: safeUser,
      token: updatedUser.userId
    });
    return;
  }

  // Create new user with Google account
  let baseUsername = cleanEmail.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'user';
  if (baseUsername.length > 12) baseUsername = baseUsername.substring(0, 12);
  let finalUsername = baseUsername;
  let counter = 1;
  while (db.getUsers().find(u => u.username.toLowerCase() === finalUsername)) {
    finalUsername = `${baseUsername}${counter}`;
    counter++;
  }

  // Generate unique User ID: GP + 5 random digits
  let newUserId = `GP${Math.floor(10000 + Math.random() * 90000)}`;
  while (db.findUserById(newUserId)) {
    newUserId = `GP${Math.floor(10000 + Math.random() * 90000)}`;
  }

  // Generate unique referral code
  let userRefCode = `GP${Math.floor(100 + Math.random() * 900)}${finalUsername.substring(0, 3).toUpperCase()}`;

  // Check referral
  let referrerUser: User | undefined;
  if (referralCode && referralCode.trim()) {
    const cleanRef = referralCode.trim().toUpperCase();
    referrerUser = db.getUsers().find(u => u.referralCode === cleanRef || u.userId === cleanRef);
  }

  const role: 'user' | 'admin' = isAdminEmail ? 'admin' : 'user';

  const newUser: User = {
    id: `usr_${Date.now()}`,
    userId: newUserId,
    fullName: (displayName && displayName.trim()) ? displayName.trim() : finalUsername,
    username: finalUsername,
    email: cleanEmail,
    firebaseUid,
    emailVerified: !!emailVerified,
    mobile: '', // Can be filled in Profile
    balance: 20, // Free signup bonus in BDT
    totalEarnings: 20,
    completedTasksCount: 0,
    pendingTasksCount: 0,
    referralCode: userRefCode,
    referredBy: referrerUser ? referrerUser.userId : undefined,
    totalInvited: 0,
    totalSuccessfulReferrals: 0,
    role,
    status: 'active',
    createdAt: new Date().toISOString()
  };

  db.addUser(newUser);

  // Add signup bonus transaction
  db.addTransaction({
    userId: newUser.userId,
    type: 'SIGNUP_BONUS',
    amount: 20,
    description: 'নতুন রেজিস্ট্রেশন ওয়েলকাম বোনাস',
    balanceAfter: 20
  });

  if (referrerUser) {
    db.updateUser(referrerUser.userId, {
      totalInvited: (referrerUser.totalInvited || 0) + 1
    });

    db.addNotification({
      userId: referrerUser.userId,
      title: 'নতুন রেফারেল যুক্ত হয়েছে (Inactive)',
      message: `${newUser.fullName} (${newUser.userId}) আপনার রেফারেল কোড দিয়ে যুক্ত হয়েছেন। টাস্ক সম্পন্ন ও অনুমোদিত হলে উনি Active রেফারেল হবেন।`,
      type: 'referral'
    });
  }

  db.addNotification({
    userId: newUser.userId,
    title: 'GP Wallet BD-তে স্বাগতম!',
    message: 'আপনার গুগল অ্যাকাউন্ট দিয়ে একাউন্ট তৈরি সফল হয়েছে এবং ৳২০ ওয়েলকাম বোনাস যোগ করা হয়েছে।',
    type: 'system'
  });

  const { password: _, ...safeUser } = newUser;
  res.status(201).json({
    message: 'গুগল দিয়ে অ্যাকাউন্ট তৈরি সফল হয়েছে!',
    user: safeUser,
    token: newUser.userId
  });
});

// Admin verification status endpoint
apiRouter.get('/admin/verify-access', requireAdmin, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  res.json({
    authorized: true,
    email: user.email,
    userId: user.userId,
    role: user.role
  });
});

// ---------------- PUBLIC SETTINGS ---------------- //

apiRouter.get('/settings/public', (req: Request, res: Response) => {
  const settings = db.getSettings();
  res.json({ settings });
});

// ---------------- TASKS ROUTES ---------------- //

// List tasks (enriched with current user's submission state)
apiRouter.get('/tasks', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  const tasks = db.getTasks().filter(t => t.isActive);
  const submissions = user ? db.getSubmissions().filter(s => s.userId === user.userId) : [];

  const enriched = tasks.map(t => {
    const userSub = submissions.find(s => s.taskId === t.id);
    return {
      ...t,
      userSubmissionStatus: userSub ? userSub.status : 'not_submitted',
      userSubmissionId: userSub ? userSub.id : null
    };
  });

  res.json({ tasks: enriched });
});

// Get task details
apiRouter.get('/tasks/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const user = getAuthUser(req);
  const task = db.getTasks().find(t => t.id === id);

  if (!task) {
    res.status(404).json({ error: 'টাস্কটি খুঁজে পাওয়া যায়নি।' });
    return;
  }

  const userSub = user ? db.getSubmissions().find(s => s.taskId === task.id && s.userId === user.userId) : null;

  res.json({
    task,
    userSubmission: userSub || null
  });
});

// Submit task proof
apiRouter.post('/tasks/:id/submit', requireAuth, (req: Request, res: Response) => {
  const { id } = req.params;
  const user = (req as any).user as User;
  const { proofNote } = req.body;

  const task = db.getTasks().find(t => t.id === id && t.isActive);
  if (!task) {
    res.status(404).json({ error: 'টাস্কটি খুঁজে পাওয়া যায়নি বা নিষ্ক্রিয়।' });
    return;
  }

  // Check if user already submitted this task
  const existingSub = db.getSubmissions().find(s => s.taskId === id && s.userId === user.userId);
  if (existingSub) {
    if (existingSub.status === 'approved') {
      res.status(400).json({ error: 'আপনি ইতিমধ্যে এই টাস্কটি সম্পন্ন করে পুরস্কার পেয়েছেন।' });
      return;
    }
    if (existingSub.status === 'pending') {
      res.status(400).json({ error: 'আপনার প্রমাণ সাবমিট করা হয়েছে এবং অ্যাডমিন ভেরিফিকেশনের অপেক্ষায় আছে।' });
      return;
    }
  }

  const newSubmission: TaskSubmission = {
    id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    taskId: task.id,
    taskTitle: task.title,
    userId: user.userId,
    userName: user.fullName,
    userMobile: user.mobile,
    rewardAmount: task.rewardAmount,
    proofNote: (proofNote || '').trim(),
    proofMethodUsed: task.proofMethod,
    status: 'pending',
    submittedAt: new Date().toISOString()
  };

  db.getSubmissions().unshift(newSubmission);
  db.updateUser(user.userId, {
    pendingTasksCount: (user.pendingTasksCount || 0) + 1
  });
  db.save();

  db.addNotification({
    userId: user.userId,
    title: 'টাস্ক সাবমিশন গৃহীত হয়েছে',
    message: `"${task.title}" টাস্কের প্রমাণ সফলভাবে জমা হয়েছে। অ্যাডমিন যাচাই শেষে ৳${task.rewardAmount} আপনার ব্যালেন্সে যোগ হবে।`,
    type: 'task'
  });

  res.status(201).json({
    message: 'প্রমাণ সফলভাবে জমা হয়েছে!',
    submission: newSubmission
  });
});

// ---------------- REFERRAL ROUTES ---------------- //

apiRouter.get('/referrals', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  const milestones = db.getMilestones();

  if (!user) {
    res.json({
      referralCode: '',
      referralLink: '',
      totalInvited: 0,
      totalSuccessfulReferrals: 0,
      milestones: milestones.map(m => ({
        ...m,
        currentReferrals: 0,
        isEligible: false,
        claimStatus: 'not_claimed',
        claimedAt: null
      })),
      invitedUsers: [],
      claims: []
    });
    return;
  }

  const freshUser = db.findUserById(user.userId)!;
  const claims = db.getClaims().filter(c => c.userId === freshUser.userId);
  
  // List of users referred by this user
  const rawInvitedUsers = db.getUsers().filter(u => u.referredBy === freshUser.userId);
  
  const invitedUsers = rawInvitedUsers.map(u => {
    // Only approved tasks make a user Active
    const approvedSubmissions = db.getSubmissions().filter(s => s.userId === u.userId && s.status === 'approved');
    const pendingSubmissions = db.getSubmissions().filter(s => s.userId === u.userId && s.status === 'pending');
    const isReferralActive = approvedSubmissions.length > 0;
    
    let taskActivityStatus = 'কোনো কাজ করেনি (Inactive)';
    if (approvedSubmissions.length > 0) {
      taskActivityStatus = `${approvedSubmissions.length}টি কাজ সম্পন্ন ও অনুমোদিত`;
    } else if (pendingSubmissions.length > 0) {
      taskActivityStatus = `${pendingSubmissions.length}টি কাজ জমা (যাচাই চলছে)`;
    }

    return {
      userId: u.userId,
      fullName: u.fullName,
      joinedAt: u.createdAt,
      completedTasks: approvedSubmissions.length,
      pendingTasks: pendingSubmissions.length,
      isReferralActive,
      referralStatus: isReferralActive ? ('Active' as const) : ('Inactive' as const),
      taskActivityStatus,
      status: u.status
    };
  });

  const activeReferralsCount = invitedUsers.filter(u => u.isReferralActive).length;
  const inactiveReferralsCount = invitedUsers.length - activeReferralsCount;

  // Sync inviter's totalSuccessfulReferrals in database
  if (freshUser.totalSuccessfulReferrals !== activeReferralsCount || freshUser.totalInvited !== invitedUsers.length) {
    db.updateUser(freshUser.userId, {
      totalSuccessfulReferrals: activeReferralsCount,
      totalInvited: invitedUsers.length
    });
    freshUser.totalSuccessfulReferrals = activeReferralsCount;
    freshUser.totalInvited = invitedUsers.length;
  }

  const enrichedMilestones = milestones.map(m => {
    const claim = claims.find(c => c.milestoneId === m.id);
    const isEligible = activeReferralsCount >= m.requiredReferrals;
    return {
      ...m,
      currentReferrals: activeReferralsCount,
      isEligible,
      claimStatus: claim ? claim.status : 'not_claimed',
      claimedAt: claim ? claim.claimedAt : null
    };
  });

  res.json({
    referralCode: freshUser.referralCode,
    referralLink: `${req.protocol}://${req.get('host')}/?ref=${freshUser.referralCode}`,
    totalInvited: invitedUsers.length,
    totalSuccessfulReferrals: activeReferralsCount,
    totalActiveReferrals: activeReferralsCount,
    totalInactiveReferrals: inactiveReferralsCount,
    milestones: enrichedMilestones,
    invitedUsers,
    claims
  });
});

// Claim referral reward
apiRouter.post('/referrals/claim', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const freshUser = db.findUserById(user.userId)!;
  const { milestoneId } = req.body;

  const milestone = db.getMilestones().find(m => m.id === Number(milestoneId));
  if (!milestone) {
    res.status(404).json({ error: 'রেফারেল মাইলস্টোন খুঁজে পাওয়া যায়নি।' });
    return;
  }

  if (freshUser.totalSuccessfulReferrals < milestone.requiredReferrals) {
    res.status(400).json({ 
      error: `এই পুরস্কারের জন্য ন্যূনতম ${milestone.requiredReferrals} জন রেফারেল প্রয়োজন। আপনার বর্তমান রেফারেল ${freshUser.totalSuccessfulReferrals} জন।` 
    });
    return;
  }

  const existingClaim = db.getClaims().find(c => c.userId === freshUser.userId && c.milestoneId === milestone.id);
  if (existingClaim) {
    res.status(400).json({ error: 'আপনি ইতিমধ্যে এই মাইলস্টোনের পুরস্কার দাবি করেছেন।' });
    return;
  }

  const newClaim: ReferralClaim = {
    id: `claim_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    userId: freshUser.userId,
    userName: freshUser.fullName,
    userMobile: freshUser.mobile,
    milestoneId: milestone.id,
    milestoneName: milestone.title,
    rewardAmount: milestone.rewardAmount,
    referralsAtClaim: freshUser.totalSuccessfulReferrals,
    status: 'pending',
    claimedAt: new Date().toISOString()
  };

  db.getClaims().unshift(newClaim);
  db.save();

  db.addNotification({
    userId: freshUser.userId,
    title: 'রেফারেল পুরস্কার দাবি জমা হয়েছে',
    message: `${milestone.title} (৳${milestone.rewardAmount}) দাবি সফলভাবে জমা হয়েছে। অ্যাডমিন রিভিউ করে আপনার ব্যালেন্সে ক্রেডিট করবে।`,
    type: 'referral'
  });

  res.status(201).json({
    message: 'রেফারেল বোনাসের আবেদন সফলভাবে জমা হয়েছে!',
    claim: newClaim
  });
});

// ---------------- WITHDRAWAL ROUTES ---------------- //

// Submit withdrawal request
apiRouter.post('/withdrawals', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const freshUser = db.findUserById(user.userId)!;
  const { paymentMethod, accountMobileNumber, amount } = req.body;
  const settings = db.getSettings();

  const numAmount = Number(amount);

  if (!paymentMethod || !accountMobileNumber || !numAmount) {
    res.status(400).json({ error: 'সকল তথ্য সঠিকভাবে পূরণ করুন।' });
    return;
  }

  if (paymentMethod === 'bkash' && !settings.bkashEnabled) {
    res.status(400).json({ error: 'বর্তমানে bKash উত্তোলন সাময়িকভাবে বন্ধ আছে।' });
    return;
  }

  if (paymentMethod === 'nagad' && !settings.nagadEnabled) {
    res.status(400).json({ error: 'বর্তমানে নগদ উত্তোলন সাময়িকভাবে বন্ধ আছে।' });
    return;
  }

  if (numAmount < settings.minWithdrawal) {
    res.status(400).json({ error: `সর্বনিম্ন উত্তোলনের পরিমাণ ৳${settings.minWithdrawal}।` });
    return;
  }

  if (numAmount > settings.maxWithdrawal) {
    res.status(400).json({ error: `সর্বোচ্চ উত্তোলনের পরিমাণ ৳${settings.maxWithdrawal}।` });
    return;
  }

  if (freshUser.balance < numAmount) {
    res.status(400).json({ error: 'আপনার অ্যাকাউন্টে পর্যাপ্ত ব্যালেন্স নেই।' });
    return;
  }

  // Check 24-hour interval limit
  const userWithdrawals = db.getWithdrawals().filter(w => w.userId === freshUser.userId);
  const now = Date.now();
  const intervalMs = settings.withdrawalIntervalHours * 3600 * 1000;
  const recentRequest = userWithdrawals.find(w => {
    const reqTime = new Date(w.requestedAt).getTime();
    return (now - reqTime) < intervalMs && w.status !== 'Rejected' && w.status !== 'Cancelled';
  });

  if (recentRequest) {
    res.status(400).json({ 
      error: `আপনি প্রতি ${settings.withdrawalIntervalHours} ঘণ্টায় কেবল ১টি উত্তোলনের অনুরোধ করতে পারেন। আপনার আগের অনুরোধটি প্রসেস হচ্ছে।` 
    });
    return;
  }

  // RESERVE BALANCE SAFELY (Deduct immediately so user cannot double-spend)
  const newBalance = freshUser.balance - numAmount;
  db.updateUser(freshUser.userId, { balance: newBalance });

  const newWithdrawal: Withdrawal = {
    id: `wth_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    userId: freshUser.userId,
    userName: freshUser.fullName,
    userMobile: freshUser.mobile,
    paymentMethod: paymentMethod as PaymentMethod,
    accountMobileNumber: accountMobileNumber.trim(),
    amount: numAmount,
    status: 'Pending',
    requestedAt: new Date().toISOString()
  };

  db.getWithdrawals().unshift(newWithdrawal);

  // Add transaction record
  db.addTransaction({
    userId: freshUser.userId,
    type: 'WITHDRAWAL_RESERVE',
    amount: -numAmount,
    description: `${paymentMethod === 'bkash' ? 'bKash' : 'Nagad'} উত্তোলন অনুরোধ (সংরক্ষিত: ${accountMobileNumber})`,
    referenceId: newWithdrawal.id,
    balanceAfter: newBalance
  });

  db.addNotification({
    userId: freshUser.userId,
    title: 'উত্তোলন অনুরোধ গৃহীত হয়েছে',
    message: `৳${numAmount} উত্তোলনের অনুরোধ সফলভাবে গ্রহণ করা হয়েছে (${paymentMethod.toUpperCase()})। আপনার টাকা সংরক্ষিত রাখা হয়েছে এবং শীঘ্রই পাঠানো হবে।`,
    type: 'withdrawal'
  });

  res.status(201).json({
    message: 'উত্তোলনের আবেদন সফলভাবে সম্পন্ন হয়েছে!',
    withdrawal: newWithdrawal,
    newBalance
  });
});

// User withdrawal history
apiRouter.get('/withdrawals/history', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    res.json({ withdrawals: [] });
    return;
  }
  const list = db.getWithdrawals().filter(w => w.userId === user.userId);
  res.json({ withdrawals: list });
});

// ---------------- TRANSACTIONS & NOTIFICATIONS ---------------- //

apiRouter.get('/transactions', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    res.json({ transactions: [] });
    return;
  }
  const list = db.getTransactions().filter(t => t.userId === user.userId);
  res.json({ transactions: list });
});

apiRouter.get('/notifications', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    res.json({ notifications: [] });
    return;
  }
  const list = db.getNotifications().filter(n => n.userId === user.userId || n.userId === 'all');
  res.json({ notifications: list });
});

apiRouter.post('/notifications/mark-read', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  db.getNotifications().forEach(n => {
    if (n.userId === user.userId || n.userId === 'all') {
      n.isRead = true;
    }
  });
  db.save();
  res.json({ message: 'সকল নোটিফিকেশন পঠিত হিসেবে চিহ্নিত করা হয়েছে।' });
});

// ---------------- ADMIN ENDPOINTS ---------------- //

// Admin Dashboard stats
apiRouter.get('/admin/dashboard', requireAdmin, (req: Request, res: Response) => {
  const users = db.getUsers().filter(u => u.role !== 'admin');
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  const newUsersToday = users.filter(u => new Date(u.createdAt).getTime() >= startOfDay).length;
  const activeUsers = users.filter(u => u.status === 'active').length;
  const suspendedUsers = users.filter(u => u.status === 'suspended').length;

  const tasks = db.getTasks();
  const submissions = db.getSubmissions();
  const pendingSubmissions = submissions.filter(s => s.status === 'pending').length;
  const approvedTasks = submissions.filter(s => s.status === 'approved').length;

  const claims = db.getClaims();
  const pendingClaims = claims.filter(c => c.status === 'pending').length;

  const withdrawals = db.getWithdrawals();
  const pendingWithdrawals = withdrawals.filter(w => w.status === 'Pending').length;
  const paidWithdrawals = withdrawals.filter(w => w.status === 'Paid').length;
  const totalPaidAmount = withdrawals
    .filter(w => w.status === 'Paid')
    .reduce((sum, w) => sum + w.amount, 0);

  const recentTransactions = db.getTransactions().slice(0, 10);
  const recentAuditLogs = db.getAuditLogs().slice(0, 10);

  res.json({
    stats: {
      totalUsers: users.length,
      newUsersToday,
      activeUsers,
      suspendedUsers,
      totalTasks: tasks.length,
      pendingSubmissions,
      approvedTasks,
      pendingClaims,
      pendingWithdrawals,
      paidWithdrawals,
      totalPaidAmount
    },
    recentTransactions,
    recentAuditLogs
  });
});

// Admin Task Management
apiRouter.get('/admin/tasks', requireAdmin, (req: Request, res: Response) => {
  res.json({ tasks: db.getTasks() });
});

apiRouter.post('/admin/tasks', requireAdmin, (req: Request, res: Response) => {
  const adminUser = (req as any).user as User;
  const { 
    title, 
    shortDescription, 
    fullDescription, 
    instructions, 
    category, 
    rewardAmount, 
    taskUrl, 
    proofMethod, 
    proofUrl, 
    logoUrl, 
    iconName,
    isActive
  } = req.body;

  if (!title || !title.trim()) {
    res.status(400).json({ error: 'কাজের নাম (Task Name) প্রদান করুন।' });
    return;
  }

  const numReward = Number(rewardAmount);
  if (isNaN(numReward) || numReward <= 0) {
    res.status(400).json({ error: 'সঠিক পুরস্কারের পরিমাণ (টাকা) প্রদান করুন।' });
    return;
  }

  if (!taskUrl || !taskUrl.trim()) {
    res.status(400).json({ error: 'টাস্কের লিংক (Task URL) প্রদান করুন।' });
    return;
  }

  let finalTaskUrl = taskUrl.trim();
  if (!finalTaskUrl.startsWith('http://') && !finalTaskUrl.startsWith('https://')) {
    finalTaskUrl = `https://${finalTaskUrl}`;
  }

  const method = (proofMethod as ProofMethod) || 'whatsapp';
  let finalProofUrl = (proofUrl || '').trim();
  if (!finalProofUrl) {
    const siteSettings = db.getSettings();
    if (method === 'whatsapp') {
      finalProofUrl = siteSettings.whatsappUrl || 'https://wa.me/8801700000000';
    } else if (method === 'telegram') {
      finalProofUrl = siteSettings.telegramUrl || 'https://t.me/gpwalletbd';
    } else {
      finalProofUrl = finalTaskUrl;
    }
  }

  const cleanShort = (shortDescription || fullDescription || instructions || title).trim();
  const cleanFull = (fullDescription || shortDescription || cleanShort).trim();
  const cleanInstructions = (instructions || '১. লিংকে গিয়ে কাজ সম্পন্ন করুন।\n২. স্ক্রিনশট নিন এবং User ID সহ প্রমাণ জমা দিন।').trim();

  const newTask: Task = {
    id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    title: title.trim(),
    shortDescription: cleanShort,
    fullDescription: cleanFull,
    instructions: cleanInstructions,
    category: category || 'other',
    rewardAmount: numReward,
    taskUrl: finalTaskUrl,
    proofMethod: method,
    proofUrl: finalProofUrl,
    logoUrl: logoUrl && logoUrl.trim() ? logoUrl.trim() : undefined,
    iconName: iconName || 'check-circle',
    isActive: isActive !== false,
    totalCompleted: 0,
    createdAt: new Date().toISOString()
  };

  db.addTask(newTask);
  db.addAuditLog(adminUser.username, 'CREATE_TASK', `নতুন টাস্ক তৈরি করা হয়েছে: ${newTask.title} (৳${newTask.rewardAmount})`, newTask.id);

  res.status(201).json({ message: 'টাস্ক সফলভাবে তৈরি হয়েছে!', task: newTask });
});

apiRouter.put('/admin/tasks/:id', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const adminUser = (req as any).user as User;

  const current = db.getTasks().find(t => t.id === id);
  if (!current) {
    res.status(404).json({ error: 'টাস্কটি খুঁজে পাওয়া যায়নি।' });
    return;
  }

  let finalTaskUrl = req.body.taskUrl !== undefined ? String(req.body.taskUrl).trim() : current.taskUrl;
  if (finalTaskUrl && !finalTaskUrl.startsWith('http://') && !finalTaskUrl.startsWith('https://')) {
    finalTaskUrl = `https://${finalTaskUrl}`;
  }

  const updatedTask = db.updateTask(id, {
    ...req.body,
    taskUrl: finalTaskUrl,
    rewardAmount: req.body.rewardAmount ? Number(req.body.rewardAmount) : current.rewardAmount,
    isActive: req.body.isActive !== undefined ? Boolean(req.body.isActive) : current.isActive
  });

  db.addAuditLog(adminUser.username, 'UPDATE_TASK', `টাস্ক আপডেট করা হয়েছে: ${current.title}`, id);

  res.json({ message: 'টাস্ক আপডেট হয়েছে!', task: updatedTask });
});

apiRouter.delete('/admin/tasks/:id', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const adminUser = (req as any).user as User;
  const task = db.getTasks().find(t => t.id === id);

  if (!task) {
    res.status(404).json({ error: 'টাস্কটি পাওয়া যায়নি।' });
    return;
  }

  db.deleteTask(id);
  db.addAuditLog(adminUser.username, 'DELETE_TASK', `টাস্ক মুছে ফেলা হয়েছে: ${task.title}`, id);

  res.json({ message: 'টাস্কটি সফলভাবে মুছে ফেলা হয়েছে।' });
});

// Admin Submissions & Verification
apiRouter.get('/admin/submissions', requireAdmin, (req: Request, res: Response) => {
  res.json({ submissions: db.getSubmissions() });
});

apiRouter.post('/admin/submissions/:id/review', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const { action, feedback } = req.body; // action: 'approve' | 'reject'
  const adminUser = (req as any).user as User;

  const submission = db.getSubmissions().find(s => s.id === id);
  if (!submission) {
    res.status(404).json({ error: 'সাবমিশনটি খুঁজে পাওয়া যায়নি।' });
    return;
  }

  if (submission.status !== 'pending') {
    res.status(400).json({ error: 'এই সাবমিশনটি ইতিমধ্যে রিভিউ করা হয়েছে।' });
    return;
  }

  const user = db.findUserById(submission.userId);
  if (!user) {
    res.status(404).json({ error: 'ব্যবহারকারী খুঁজে পাওয়া যায়নি।' });
    return;
  }

  if (action === 'approve') {
    submission.status = 'approved';
    submission.adminFeedback = feedback || 'সফলভাবে যাচাই করা হয়েছে';
    submission.reviewedAt = new Date().toISOString();

    // Check if this is the user's first approved task
    const prevApprovedSubmissions = db.getSubmissions().filter(
      s => s.userId === user.userId && s.status === 'approved' && s.id !== submission.id
    );
    const isFirstApprovedTask = prevApprovedSubmissions.length === 0;

    // Credit task reward exactly once
    const newBalance = user.balance + submission.rewardAmount;
    const newTotalEarnings = user.totalEarnings + submission.rewardAmount;
    
    db.updateUser(user.userId, {
      balance: newBalance,
      totalEarnings: newTotalEarnings,
      completedTasksCount: (user.completedTasksCount || 0) + 1,
      pendingTasksCount: Math.max(0, (user.pendingTasksCount || 1) - 1)
    });

    // Increment task total completed
    const task = db.getTasks().find(t => t.id === submission.taskId);
    if (task) {
      task.totalCompleted = (task.totalCompleted || 0) + 1;
    }

    // Add financial ledger record
    db.addTransaction({
      userId: user.userId,
      type: 'TASK_REWARD',
      amount: submission.rewardAmount,
      description: `টাস্ক পুরস্কার অনুমোদিত: "${submission.taskTitle}"`,
      referenceId: submission.id,
      balanceAfter: newBalance
    });

    // Notify user
    db.addNotification({
      userId: user.userId,
      title: 'টাস্ক অনুমোদিত হয়েছে! (৳' + submission.rewardAmount + ')',
      message: `আপনার জমা দেওয়া "${submission.taskTitle}" টাস্কটি এডমিন কর্তৃক অনুমোদিত হয়েছে এবং ৳${submission.rewardAmount} ব্যালেন্সে যোগ হয়েছে।`,
      type: 'task'
    });

    // AUTOMATIC REFERRAL ACTIVATION:
    // If the user was referred by someone and this is their FIRST approved task, activate their referral
    if (user.referredBy && isFirstApprovedTask) {
      const referrerUser = db.findUserById(user.referredBy);
      if (referrerUser) {
        const newActiveCount = (referrerUser.totalSuccessfulReferrals || 0) + 1;
        db.updateUser(referrerUser.userId, {
          totalSuccessfulReferrals: newActiveCount
        });

        db.addNotification({
          userId: referrerUser.userId,
          title: 'রেফারেল সক্রিয় হয়েছে (Active Referral)!',
          message: `আপনার আমন্ত্রিত সদস্য ${user.fullName} (${user.userId}) সফলভাবে একটি টাস্ক সম্পন্ন ও অনুমোদিত করেছেন। আপনার রেফারেল এখন Active হয়েছে!`,
          type: 'referral'
        });

        db.addAuditLog(
          adminUser.username,
          'ACTIVATE_REFERRAL',
          `আমন্ত্রিত ইউজার ${user.fullName} (${user.userId}) এর প্রথম টাস্ক অনুমোদিত হওয়ায় আমন্ত্রণকারী ${referrerUser.fullName} (${referrerUser.userId}) এর Active Referral কাউন্ট ১ বৃদ্ধি পেয়ে ${newActiveCount} হয়েছে।`,
          referrerUser.userId
        );
      }
    }

    db.addAuditLog(adminUser.username, 'APPROVE_TASK_SUBMISSION', `টাস্ক সাবমিশন অনুমোদন: ${submission.userName} (${submission.userId}) - ৳${submission.rewardAmount}`, submission.id);

  } else if (action === 'reject') {
    submission.status = 'rejected';
    submission.adminFeedback = feedback || 'প্রমাণ সঠিক পাওয়া যায়নি';
    submission.reviewedAt = new Date().toISOString();

    db.updateUser(user.userId, {
      pendingTasksCount: Math.max(0, (user.pendingTasksCount || 1) - 1)
    });

    db.addNotification({
      userId: user.userId,
      title: 'টাস্ক সাবমিশন বাতিল হয়েছে',
      message: `"${submission.taskTitle}" টাস্কটি বাতিল করা হয়েছে। কারণ: ${submission.adminFeedback}`,
      type: 'task'
    });

    db.addAuditLog(adminUser.username, 'REJECT_TASK_SUBMISSION', `টাস্ক সাবমিশন বাতিল: ${submission.userName} (${submission.userId}) - কারণ: ${submission.adminFeedback}`, submission.id);
  } else {
    res.status(400).json({ error: 'অকার্যকর একশন।' });
    return;
  }

  db.save();
  res.json({ message: 'সাবমিশন সফলভাবে রিভিউ সম্পন্ন হয়েছে!', submission });
});

// Admin Referral Claims
apiRouter.get('/admin/referral-claims', requireAdmin, (req: Request, res: Response) => {
  res.json({ claims: db.getClaims() });
});

apiRouter.post('/admin/referral-claims/:id/review', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const { action, feedback } = req.body;
  const adminUser = (req as any).user as User;

  const claim = db.getClaims().find(c => c.id === id);
  if (!claim) {
    res.status(404).json({ error: 'রেফারেল ক্লেইম পাওয়া যায়নি।' });
    return;
  }

  if (claim.status !== 'pending') {
    res.status(400).json({ error: 'এই ক্লেইমটি ইতিমধ্যে প্রক্রিয়া করা হয়েছে।' });
    return;
  }

  const user = db.findUserById(claim.userId);
  if (!user) {
    res.status(404).json({ error: 'ব্যবহারকারী খুঁজে পাওয়া যায়নি।' });
    return;
  }

  if (action === 'approve') {
    claim.status = 'approved';
    claim.reviewedAt = new Date().toISOString();

    const newBalance = user.balance + claim.rewardAmount;
    const newTotalEarnings = user.totalEarnings + claim.rewardAmount;

    db.updateUser(user.userId, {
      balance: newBalance,
      totalEarnings: newTotalEarnings
    });

    db.addTransaction({
      userId: user.userId,
      type: 'REFERRAL_REWARD',
      amount: claim.rewardAmount,
      description: `রেফারেল মাইলস্টোন পুরস্কার: ${claim.milestoneName}`,
      referenceId: claim.id,
      balanceAfter: newBalance
    });

    db.addNotification({
      userId: user.userId,
      title: 'রেফারেল বোনাস ক্রেডিট হয়েছে! (৳' + claim.rewardAmount + ')',
      message: `অভিনন্দন! আপনার ${claim.milestoneName} দাবি অনুমোদিত হয়েছে এবং ৳${claim.rewardAmount} ব্যালেন্সে যুক্ত করা হয়েছে।`,
      type: 'referral'
    });

    db.addAuditLog(adminUser.username, 'APPROVE_REFERRAL_CLAIM', `রেফারেল ক্লেইম অনুমোদন: ${user.fullName} (${user.userId}) - ৳${claim.rewardAmount}`, claim.id);
  } else if (action === 'reject') {
    claim.status = 'rejected';
    claim.reviewedAt = new Date().toISOString();

    db.addNotification({
      userId: user.userId,
      title: 'রেফারেল বোনাস আবেদন বাতিল',
      message: `আপনার ${claim.milestoneName} দাবিটি বাতিল করা হয়েছে। কারণ: ${feedback || 'সঠিক রেফারেল রিকোয়ারমেন্ট অপূর্ণ'}`,
      type: 'referral'
    });

    db.addAuditLog(adminUser.username, 'REJECT_REFERRAL_CLAIM', `রেফারেল ক্লেইম বাতিল: ${user.fullName} (${user.userId})`, claim.id);
  }

  db.save();
  res.json({ message: 'রেফারেল ক্লেইম রিভিউ সম্পন্ন হয়েছে!', claim });
});

// Admin Withdrawals Management
apiRouter.get('/admin/withdrawals', requireAdmin, (req: Request, res: Response) => {
  res.json({ withdrawals: db.getWithdrawals() });
});

apiRouter.post('/admin/withdrawals/:id/status', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, reason } = req.body; // 'Approved' | 'Processing' | 'Paid' | 'Rejected' | 'Cancelled'
  const adminUser = (req as any).user as User;

  const withdrawal = db.getWithdrawals().find(w => w.id === id);
  if (!withdrawal) {
    res.status(404).json({ error: 'উত্তোলনের আবেদন পাওয়া যায়নি।' });
    return;
  }

  const user = db.findUserById(withdrawal.userId);
  if (!user) {
    res.status(404).json({ error: 'ব্যবহারকারী খুঁজে পাওয়া যায়নি।' });
    return;
  }

  const oldStatus = withdrawal.status;

  // Prevent duplicate processing if already completed
  if (oldStatus === 'Paid' || oldStatus === 'Rejected' || oldStatus === 'Cancelled') {
    res.status(400).json({ error: `এই উত্তোলনের আবেদনটি ইতিমধ্যে ${oldStatus} অবস্থায় রয়েছে।` });
    return;
  }

  withdrawal.status = status;
  withdrawal.rejectionReason = reason;
  withdrawal.processedAt = new Date().toISOString();

  // If REJECTED or CANCELLED, REFUND the reserved amount to user wallet exactly once!
  if (status === 'Rejected' || status === 'Cancelled') {
    const refundBalance = user.balance + withdrawal.amount;
    db.updateUser(user.userId, { balance: refundBalance });

    db.addTransaction({
      userId: user.userId,
      type: 'WITHDRAWAL_REFUND',
      amount: withdrawal.amount,
      description: `উত্তোলন বাতিল/প্রত্যাখ্যাত হওয়ায় অর্থ ফেরত (আইডি: ${withdrawal.id})`,
      referenceId: withdrawal.id,
      balanceAfter: refundBalance
    });

    db.addNotification({
      userId: user.userId,
      title: `উত্তোলন ${status === 'Rejected' ? 'প্রত্যাখ্যাত' : 'বাতিল'} হয়েছে`,
      message: `আপনার ৳${withdrawal.amount} উত্তোলনের অনুরোধ ${status === 'Rejected' ? 'প্রত্যাখ্যাত' : 'বাতিল'} হয়েছে এবং সংরক্ষিত অর্থ মূল ব্যালেন্সে ফেরত দেওয়া হয়েছে। কারণ: ${reason || 'যাচাইকরণ ব্যর্থ'}`,
      type: 'withdrawal'
    });

    db.addAuditLog(adminUser.username, 'REFUND_WITHDRAWAL', `উত্তোলন ফেরত: ${user.fullName} (${user.userId}) - ৳${withdrawal.amount} রিফান্ড`, withdrawal.id);
  } else if (status === 'Paid') {
    db.addNotification({
      userId: user.userId,
      title: 'পেমেন্ট সফল হয়েছে! (৳' + withdrawal.amount + ')',
      message: `আপনার ${withdrawal.paymentMethod.toUpperCase()} নম্বরে (${withdrawal.accountMobileNumber}) ৳${withdrawal.amount} সফলভাবে পেমেন্ট প্রদান করা হয়েছে।`,
      type: 'withdrawal'
    });

    db.addAuditLog(adminUser.username, 'PAY_WITHDRAWAL', `উত্তোলন সম্পন্ন (PAID): ${user.fullName} (${user.userId}) - ৳${withdrawal.amount} sent to ${withdrawal.accountMobileNumber}`, withdrawal.id);
  } else {
    // Approved or Processing
    db.addNotification({
      userId: user.userId,
      title: `উত্তোলনের অবস্থা: ${status === 'Approved' ? 'অনুমোদিত' : 'প্রক্রিয়াদীন'}`,
      message: `আপনার ৳${withdrawal.amount} উত্তোলনের অনুরোধটি এডমিন কর্তৃক যাচাই চলছে। কিছুক্ষণের মধ্যে পেমেন্ট পাঠানো হবে।`,
      type: 'withdrawal'
    });

    db.addAuditLog(adminUser.username, 'UPDATE_WITHDRAWAL_STATUS', `উত্তোলনের অবস্থা পরিবর্তন: ${status} for ${withdrawal.userId}`, withdrawal.id);
  }

  db.save();
  res.json({ message: 'উত্তোলনের অবস্থা সফলভাবে আপডেট হয়েছে!', withdrawal });
});

// Admin User Management
apiRouter.get('/admin/users', requireAdmin, (req: Request, res: Response) => {
  const query = (req.query.q as string || '').toLowerCase().trim();
  let users = db.getUsers().filter(u => u.role !== 'admin');

  if (query) {
    users = users.filter(u => 
      u.userId.toLowerCase().includes(query) ||
      u.username.toLowerCase().includes(query) ||
      u.fullName.toLowerCase().includes(query) ||
      u.mobile.includes(query)
    );
  }

  const safeUsers = users.map(u => {
    const { password, ...safe } = u;
    return safe;
  });

  res.json({ users: safeUsers });
});

apiRouter.get('/admin/users/:userId', requireAdmin, (req: Request, res: Response) => {
  const { userId } = req.params;
  const user = db.findUserById(userId);

  if (!user) {
    res.status(404).json({ error: 'ব্যবহারকারী খুঁজে পাওয়া যায়নি।' });
    return;
  }

  const submissions = db.getSubmissions().filter(s => s.userId === user.userId);
  const withdrawals = db.getWithdrawals().filter(w => w.userId === user.userId);
  const transactions = db.getTransactions().filter(t => t.userId === user.userId);
  const referrals = db.getUsers().filter(u => u.referredBy === user.userId).map(u => ({
    userId: u.userId,
    fullName: u.fullName,
    username: u.username,
    createdAt: u.createdAt,
    completedTasksCount: u.completedTasksCount
  }));

  const { password, ...safeUser } = user;
  res.json({
    user: safeUser,
    submissions,
    withdrawals,
    transactions,
    referrals
  });
});

// Admin toggle suspend/reactivate user
apiRouter.post('/admin/users/:userId/status', requireAdmin, (req: Request, res: Response) => {
  const { userId } = req.params;
  const { status } = req.body; // 'active' | 'suspended'
  const adminUser = (req as any).user as User;

  const user = db.findUserById(userId);
  if (!user) {
    res.status(404).json({ error: 'ব্যবহারকারী খুঁজে পাওয়া যায়নি।' });
    return;
  }

  db.updateUser(user.userId, { status });
  db.addAuditLog(adminUser.username, 'TOGGLE_USER_STATUS', `ব্যবহারকারী স্ট্যাটাস পরিবর্তন: ${user.fullName} (${user.userId}) -> ${status}`, user.userId);

  res.json({ message: `ব্যবহারকারী সফলভাবে ${status === 'active' ? 'সক্রিয়' : 'স্থগিত'} করা হয়েছে।` });
});

// Admin adjust balance with mandatory reason
apiRouter.post('/admin/users/:userId/adjust-balance', requireAdmin, (req: Request, res: Response) => {
  const { userId } = req.params;
  const { amount, reason } = req.body;
  const adminUser = (req as any).user as User;

  if (!amount || isNaN(Number(amount))) {
    res.status(400).json({ error: 'সঠিক টাকার পরিমাণ দিন।' });
    return;
  }

  if (!reason || !reason.trim()) {
    res.status(400).json({ error: 'ব্যালেন্স সমন্বয়ের জন্য বাধ্যতামূলক কারণ (Reason) প্রদান করুন।' });
    return;
  }

  const user = db.findUserById(userId);
  if (!user) {
    res.status(404).json({ error: 'ব্যবহারকারী খুঁজে পাওয়া যায়নি।' });
    return;
  }

  const numAmount = Number(amount);
  const newBalance = user.balance + numAmount;
  if (newBalance < 0) {
    res.status(400).json({ error: 'ব্যালেন্স ঋণাত্মক (negative) হতে পারে না।' });
    return;
  }

  db.updateUser(user.userId, {
    balance: newBalance,
    totalEarnings: numAmount > 0 ? user.totalEarnings + numAmount : user.totalEarnings
  });

  // Financial ledger transaction
  db.addTransaction({
    userId: user.userId,
    type: 'ADMIN_ADJUSTMENT',
    amount: numAmount,
    description: `এডমিন সমন্বয়: ${reason.trim()} (দ্বারা: ${adminUser.username})`,
    balanceAfter: newBalance
  });

  // User notification
  db.addNotification({
    userId: user.userId,
    title: 'ব্যালেন্স সমন্বয় সম্পন্ন',
    message: `এডমিন আপনার ব্যালেন্সে ${numAmount >= 0 ? '+' : ''}৳${numAmount} পরিবর্তন করেছেন। কারণ: ${reason.trim()}`,
    type: 'system'
  });

  db.addAuditLog(adminUser.username, 'ADJUST_BALANCE', `ব্যালেন্স সমন্বয়: ${user.fullName} (${user.userId}) -> ${numAmount >= 0 ? '+' : ''}৳${numAmount}, কারণ: ${reason.trim()}`, user.userId);

  res.json({
    message: 'ব্যালেন্স সফলভাবে সমন্বয় করা হয়েছে!',
    newBalance
  });
});

// Admin Settings
apiRouter.get('/admin/settings', requireAdmin, (req: Request, res: Response) => {
  res.json({
    settings: db.getSettings(),
    milestones: db.getMilestones()
  });
});

apiRouter.post('/admin/settings', requireAdmin, (req: Request, res: Response) => {
  const adminUser = (req as any).user as User;
  const updated = db.updateSettings(req.body);
  db.addAuditLog(adminUser.username, 'UPDATE_SETTINGS', 'ওয়েবসাইট ও পেমেন্ট সেটিংস আপডেট করা হয়েছে।');
  res.json({ message: 'সেটিংস সফলভাবে সংরক্ষিত হয়েছে!', settings: updated });
});

apiRouter.post('/admin/milestones', requireAdmin, (req: Request, res: Response) => {
  const adminUser = (req as any).user as User;
  const { milestones } = req.body;
  if (!Array.isArray(milestones)) {
    res.status(400).json({ error: 'সঠিক মাইলস্টোন তালিকা প্রদান করুন।' });
    return;
  }
  db.updateMilestones(milestones);
  db.addAuditLog(adminUser.username, 'UPDATE_MILESTONES', 'রেফারেল মাইলস্টোন ও পুরস্কার তালিকা আপডেট করা হয়েছে।');
  res.json({ message: 'রেফারেল মাইলস্টোন সফলভাবে আপডেট হয়েছে!', milestones: db.getMilestones() });
});
