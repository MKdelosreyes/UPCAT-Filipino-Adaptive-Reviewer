"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  X,
  AlertCircle,
  CheckCircle,
  BookOpen,
} from "lucide-react";
import { registerSchema, type RegisterFormData } from "@/lib/validations/auth";
import { signUp, signInWithGoogle } from "@/lib/api/supabaseAuth";

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setError("");
    setSuccess(false);

    try {
      await signUp({
        email: data.email,
        password: data.password,
        first_name: data.firstName,
        last_name: data.lastName,
      });

      setSuccess(true);
      // Don't redirect yet - user needs to verify email
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError("");

    try {
      await signInWithGoogle();
      // Redirect handled by Supabase callback
    } catch (err: any) {
      setError(err.message || "Google Sign-In failed");
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    router.push("/");
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 text-center border border-gray-100">
          <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            Check Your Email!
          </h2>
          <p className="text-gray-600 mb-6 leading-relaxed">
            We've sent a confirmation link to your email address. Please click
            the link to verify your account and start learning.
          </p>
          <Link
            href="/login"
            className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-8 rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4">
      <div className="w-full max-w-md">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-600 hover:text-gray-800 transition-colors bg-white rounded-full p-2 shadow-md"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
          {/* Logo/Badge */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-full px-4 py-2 border-2 border-blue-200">
              <BookOpen className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-semibold text-gray-700">
                UPCAT Filipino Reviewer
              </span>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900 text-center mb-2">
            Create Account
          </h1>
          <p className="text-gray-600 text-center mb-8">
            Start your Filipino learning journey today
          </p>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="email"
                  placeholder="you@example.com"
                  {...register("email")}
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-200 text-gray-700 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                />
              </div>
              {errors.email && (
                <p className="mt-2 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle size={12} />
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  First Name
                </label>
                <div className="relative">
                  <User
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    size={20}
                  />
                  <input
                    type="text"
                    placeholder="Juan"
                    {...register("firstName")}
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-200 text-gray-700 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                  />
                </div>
                {errors.firstName && (
                  <p className="mt-2 text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle size={12} />
                    {errors.firstName.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  placeholder="Dela Cruz"
                  {...register("lastName")}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-200 text-gray-700 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                />
                {errors.lastName && (
                  <p className="mt-2 text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle size={12} />
                    {errors.lastName.message}
                  </p>
                )}
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Create password"
                  {...register("password")}
                  className="w-full pl-12 pr-12 py-3 rounded-xl bg-gray-50 border-2 border-gray-200 text-gray-700 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-2 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle size={12} />
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Confirm Password Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type={showPassword2 ? "text" : "password"}
                  placeholder="Confirm password"
                  {...register("password2")}
                  className="w-full pl-12 pr-12 py-3 rounded-xl bg-gray-50 border-2 border-gray-200 text-gray-700 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword2(!showPassword2)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showPassword2 ? "Hide password" : "Show password"}
                >
                  {showPassword2 ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password2 && (
                <p className="mt-2 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle size={12} />
                  {errors.password2.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02]"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Creating account...
                </span>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500 font-medium">
                Or continue with
              </span>
            </div>
          </div>

          {/* Google Sign-In Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3 rounded-xl border-2 border-gray-200 hover:border-gray-300 transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-50 shadow-sm hover:shadow"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Sign up with Google
          </button>

          {/* Login Link */}
          <p className="text-center text-gray-600 mt-6">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-blue-600 hover:text-blue-700 font-semibold"
            >
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
