"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Lock, Mail, MessageCircle, User } from "lucide-react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function SignUpPage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const [loading, setLoading] = useState(false);
  const { setUser, setToken } = useAuth();
  const router = useRouter();

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`,
        {
          name: data.fullName,
          email: data.email,
          password: data.password,
        }
      );

      if (res.data.token) {
        // Save to AuthContext
        setUser(res.data.user);
        setToken(res.data.token);

        // Redirect to dashboard
        toast.success("✅ Account created successfully!");
        router.push("/chat");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "❌ Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-white overflow-hidden">
      {/* Floating Gradient Orbs */}
      <div className="absolute top-[-120px] left-[-100px] w-[400px] h-[400px] bg-blue-400/30 blur-3xl rounded-full animate-pulse"></div>
      <div className="absolute bottom-[-150px] right-[-100px] w-[500px] h-[500px] bg-indigo-500/30 blur-3xl rounded-full animate-pulse delay-300"></div>

      {/* Card */}
      <Card className="relative w-full max-w-md backdrop-blur-2xl bg-white/80 border border-white/40 shadow-2xl rounded-2xl overflow-hidden transition-all duration-500 hover:shadow-indigo-200 hover:-translate-y-1">
        <CardHeader className="space-y-3 pt-10">
          {/* Icon Badge */}
          <div className="flex justify-center">
            <div className="h-16 w-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-400/40 hover:shadow-indigo-400/50 transition-all duration-500">
              <MessageCircle className="h-8 w-8 text-white" />
            </div>
          </div>

          {/* Title */}
          <CardTitle className="text-3xl sm:text-[1.9rem] font-bold text-center bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent leading-snug">
            Create your account
          </CardTitle>

          {/* Subtitle */}
          <CardDescription className="text-center text-[15px] text-slate-600">
            Join <span className="font-semibold text-indigo-600">ChatFlow</span>{" "}
            and start real-time conversations instantly.
          </CardDescription>
        </CardHeader>

        <CardContent className="px-6 pb-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-slate-700 font-medium">
                Full Name
              </Label>
              <div className="relative">
                <Input
                  id="fullName"
                  type="text"
                  placeholder="John Doe"
                  className="h-12 pl-11 rounded-xl border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-300"
                  {...register("fullName", {
                    required: "Full name is required",
                  })}
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500/70">
                  <User className="h-5 w-5" />
                </span>
              </div>
              {errors.fullName && (
                <p className="text-red-500 text-sm">
                  {errors.fullName.message}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700 font-medium">
                Email
              </Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className="h-12 pl-11 rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all duration-300"
                  {...register("email", { required: "Email is required" })}
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-500/70">
                  <Mail className="h-5 w-5" />
                </span>
              </div>
              {errors.email && (
                <p className="text-red-500 text-sm">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-700 font-medium">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="h-12 pl-11 rounded-xl border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all duration-300"
                  {...register("password", {
                    required: "Password is required",
                    minLength: {
                      value: 6,
                      message: "Minimum 6 characters required",
                    },
                  })}
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-500/70">
                  <Lock className="h-5 w-5" />
                </span>
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-12 text-[1rem] font-medium bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/40 transition-all duration-300 rounded-xl hover:scale-[1.02]"
              disabled={loading}
            >
              {loading ? "Creating Account..." : "Create Account"}
            </Button>
          </form>

          {/* Bottom Links */}
          <div className="mt-6 text-center text-sm text-slate-600">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-blue-600 hover:text-indigo-600 font-medium transition-all"
            >
              Sign In
            </Link>
          </div>

          <div className="mt-5 text-center">
            <Link href="/">
              <Button
                variant="ghost"
                className="text-slate-600 hover:text-blue-600 transition-all"
              >
                ← Back to Home
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
