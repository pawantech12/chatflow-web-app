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
import { Lock, Mail, MessageCircle } from "lucide-react";
import Link from "next/link";
import axios from "axios";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();
  const router = useRouter();
  const { setUser, setToken } = useAuth(); // ✅ Use Auth Context
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, // ✅ Your backend endpoint
        data
      );

      // Save to Auth Context
      setUser(res.data.user);
      setToken(res.data.token);

      toast.success("Login successful!");

      reset();
      router.push("/chat");
    } catch (error) {
      console.log(error);

      toast.error(error.response.data.message);
    }
    setLoading(false);
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
            Welcome Back
          </CardTitle>

          {/* Subtitle */}
          <CardDescription className="text-center text-[15px] text-slate-600">
            Sign in to{" "}
            <span className="font-semibold text-indigo-600">ChatFlow</span> and
            continue your conversations.
          </CardDescription>
        </CardHeader>

        <CardContent className="px-6 pb-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          {/* Bottom Links */}
          <div className="mt-6 text-center text-sm text-slate-600">
            Don’t have an account?{" "}
            <Link
              href="/signup"
              className="text-blue-600 hover:text-indigo-600 font-medium transition-all"
            >
              Sign Up
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
