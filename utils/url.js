const baseUrl = process.env.NEXT_PUBLIC_API_URL;

const URL = {
  ads: `${baseUrl}/ads`,
  plans: `${baseUrl}/plan`,
  appVersion: `${baseUrl}/app-version`,
  uploadApk: `${baseUrl}/app-version/upload-apk`,
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
};
export default URL;
