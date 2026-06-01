const baseUrl = process.env.NEXT_PUBLIC_API_URL;

const URL = {
  ads: `${baseUrl}/ads`,
  plans: `${baseUrl}/plan`,
  appVersion: `${baseUrl}/app-version`,
  dashboardTracking: `${baseUrl}/dashboard/tracking-dashboard`,
  userSubscription: `${baseUrl}/subscription/user-subscription`,
  uploadApk: `${baseUrl}/app-version/upload-apk`,
  staff: `${baseUrl}/staff`,
  getOtp: `${baseUrl}/auth/get-otp`,
  register: `${baseUrl}/auth/register-superadmin`,
  verifyOtp: `${baseUrl}/auth/verify-otp-superadmin`,
  store: `${baseUrl}/store/all`,
  feedback: `${baseUrl}/feedback`,
  faq: `${baseUrl}/faq`,
  helpline: `${baseUrl}/helpline`,
  allHelpline: `${baseUrl}/helpline/all-helpline`,
  videos: `${baseUrl}/how-to-videos`,
  hero: `${baseUrl}/hero`,
  heroButton: `${baseUrl}/herobutton`,
  about: `${baseUrl}/about`,
  chatbot: `${baseUrl}/chatbot`,
  testimonial: `${baseUrl}/testimonial`,
  notificationSettings: `${baseUrl}/notification-settings`,
  referralSettings: `${baseUrl}/referral-settings`,
};
export default URL;
