const baseUrl = "http://localhost:8001/api";

const URL = {
  ads: `${baseUrl}/ads`,
  plans: `${baseUrl}/plan`,
  getOtp: `${baseUrl}/auth/get-otp`,
  verifyOtp: `${baseUrl}/auth/verify-otp-superadmin`,
  store: `${baseUrl}/store/all`,
  videos: `${baseUrl}/how-to-videos`,
};
export default URL;
