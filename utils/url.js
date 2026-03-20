const baseUrl = process.env.NEXT_PUBLIC_API_URL;

const URL = {
  ads: `${baseUrl}/ads`,
  plans: `${baseUrl}/plan`,
  getOtp: `${baseUrl}/auth/get-otp`,
  register: `${baseUrl}/auth/register-superadmin`,
  verifyOtp: `${baseUrl}/auth/verify-otp-superadmin`,
  store: `${baseUrl}/store/all`,
  videos: `${baseUrl}/how-to-videos`,
};
export default URL;
