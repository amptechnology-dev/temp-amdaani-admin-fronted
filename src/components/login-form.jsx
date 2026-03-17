"use client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiCall } from "../../utils/api";
import URL from "../../utils/url";
import { toast } from "sonner"; // Import toast for notifications
import Cookies from "js-cookie";

export function LoginForm({ className, ...props }) {
  const [showOtp, setShowOtp] = useState(false);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      //NOTE: Hardcoded mobile number for super admin.
      const mobileNo = "9903419235";
      if (phone !== mobileNo) {
        setLoading(false);
        setError("Invalid mobile number.");
        return;
      }
      // Call the send OTP API
      const response = await apiCall({
        endpoint: URL.getOtp,
        method: "POST",
        body: {
          phone: phone,
        },
      });

      if (response.success) {
        toast.success(response.message || "OTP sent successfully!");
        console.log(response.data);
        setShowOtp(true);
      } else {
        setError(response.message || "Failed to send OTP");
      }
    } catch (error) {
      console.error("Error sending OTP:", error);
      setError("Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Call the verify OTP API
      const response = await apiCall({
        endpoint: URL.verifyOtp,
        method: "POST",
        body: {
          otp: otp,
        },
      });

      console.log("OTP verified successfully:", response);

      if (response.success && response.data?.token) {
        // Save token to cookies (expires in 7 days)
        Cookies.set("token", response.data.token, {
          expires: 7,
          sameSite: "strict",
        });

        // Show success toast
        toast.success(response.message || "Login successful!");

        // Redirect to dashboard
        router.push("/dashboard");
      } else {
        setError(response.message || "Invalid OTP. Please try again.");
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
      setError("Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await apiCall({
        endpoint: "/auth/get-otp",
        method: "POST",
        body: {
          mobile: phone,
        },
      });

      console.log("OTP resent successfully:", response);

      if (response.success) {
        toast.success(response.message || "OTP resent successfully!");
      } else {
        setError(response.message || "Failed to resend OTP");
      }
    } catch (error) {
      console.error("Error resending OTP:", error);
      setError("Failed to resend OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle>
            {showOtp ? "Verify OTP" : "Login to your account"}
          </CardTitle>
          <CardDescription>
            {showOtp
              ? `Enter the 6-digit code sent to ${phone}`
              : "Enter your phone number to login to your account"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}

          {!showOtp ? (
            <form onSubmit={handleSubmit}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-3">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Enter your mobile number"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Sending OTP..." : "Send OTP"}
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleOtpSubmit}>
              <div className="flex flex-col gap-6 items-center">
                <div className="grid gap-3 w-full">
                  <div className="flex justify-center">
                    <InputOTP
                      id="otp"
                      maxLength={6}
                      value={otp}
                      onChange={(value) => setOtp(value)}
                      disabled={loading}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  <div className="text-center text-sm">
                    Didn't receive a code?{" "}
                    <button
                      type="button"
                      className="underline underline-offset-4 hover:no-underline"
                      onClick={handleResendOtp}
                      disabled={loading}
                    >
                      {loading ? "Resending..." : "Resend"}
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-3 w-full">
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loading || otp.length !== 6}
                  >
                    {loading ? "Verifying..." : "Verify & Login"}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setShowOtp(false);
                      setOtp("");
                      setError("");
                    }}
                    disabled={loading}
                  >
                    Back to Login
                  </Button>
                </div>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
