"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  User,
  Mail,
  Calendar,
  Shield,
  LogOut,
  Loader2,
  Camera,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import Image from "next/image";

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<"profile" | "settings">("profile");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { user, supabaseUser, logout, isLoading: authLoading } = useAuth();
  const { isLoading: guardLoading } = useAuthGuard();
  const router = useRouter();

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      setIsLoggingOut(false);
    }
  };

  if (authLoading || guardLoading) {
    return (
      <div className="h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const joinedDate = supabaseUser?.created_at
    ? new Date(supabaseUser.created_at).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : "N/A";

  const provider = supabaseUser?.app_metadata?.provider || "email";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-5xl">
        {/* Back Button */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold text-sm transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-200">
          {/* Header with Gradient */}
          <div className="bg-blue-500 h-32 relative">
            <div className="absolute -bottom-16 left-8">
              <div className="relative">
                <div className="w-32 h-32 rounded-full border-4 border-white bg-gray-200 overflow-hidden shadow-lg">
                  {user.avatar_url ? (
                    <Image
                      src={user.avatar_url}
                      alt={`${user.first_name} ${user.last_name}`}
                      width={128}
                      height={128}
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-blue-300">
                      <User className="w-16 h-16 text-white" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* User Info Section */}
          <div className="pt-20 px-8 pb-6 border-b border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-1">
                  {user.first_name} {user.last_name}
                </h1>
                <p className="text-gray-600 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  {user.email}
                </p>
              </div>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="inline-flex items-center gap-2 px-6 py-3 bg-red-50 text-red-600 rounded-full font-semibold hover:bg-red-100 transition-colors border border-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoggingOut ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Logging out...
                  </>
                ) : (
                  <>
                    <LogOut className="w-4 h-4" />
                    Logout
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 px-8">
            <button
              onClick={() => setActiveTab("profile")}
              className={`flex items-center gap-2 px-6 py-4 font-semibold text-sm transition-all relative ${
                activeTab === "profile"
                  ? "text-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <User className="w-4 h-4" />
              Profile Information
              {activeTab === "profile" && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`flex items-center gap-2 px-6 py-4 font-semibold text-sm transition-all relative ${
                activeTab === "settings"
                  ? "text-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Settings className="w-4 h-4" />
              Account Settings
              {activeTab === "settings" && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-8">
            <AnimatePresence mode="wait">
              {activeTab === "profile" ? (
                <motion.div
                  key="profile"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  {/* Profile Info Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* First Name */}
                    <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">
                            First Name
                          </p>
                          <p className="text-lg font-semibold text-gray-900">
                            {user.first_name || "Not set"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Last Name */}
                    <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <User className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">
                            Last Name
                          </p>
                          <p className="text-lg font-semibold text-gray-900">
                            {user.last_name || "Not set"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Email */}
                    <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <Mail className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-600 mb-1">Email</p>
                          <p className="text-lg font-semibold text-gray-900 truncate">
                            {user.email}
                          </p>
                          {user.email_confirmed && (
                            <span className="inline-flex items-center gap-1 mt-2 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                              <Shield className="w-3 h-3" />
                              Verified
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Member Since */}
                    <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                          <Calendar className="w-5 h-5 text-yellow-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">
                            Member Since
                          </p>
                          <p className="text-lg font-semibold text-gray-900">
                            {joinedDate}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Auth Provider Info */}
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-200">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-white rounded-lg shadow-sm">
                        <Shield className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">
                          Authentication Method
                        </p>
                        <p className="text-lg font-semibold text-gray-900 capitalize">
                          {provider === "google"
                            ? "Google Sign-In"
                            : "Email & Password"}
                        </p>
                        <p className="text-sm text-gray-600 mt-2">
                          Your account is secured with{" "}
                          {provider === "google"
                            ? "Google OAuth 2.0"
                            : "encrypted password authentication"}
                          .
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="settings"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  {/* Account Settings */}
                  <div className="space-y-4">
                    {/* <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Account Settings
                    </h3> */}

                    {/* Email Notifications */}
                    {/* <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">
                            Email Notifications
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            Receive updates about your learning progress
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            defaultChecked
                          />
                          <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div> */}

                    {/* Learning Reminders */}
                    {/* <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">
                            Learning Reminders
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            Get reminders to continue your practice sessions
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            defaultChecked
                          />
                          <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div> */}

                    {/* AI Assistance */}
                    {/* <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">
                            AI Assistance
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            Enable AI-powered explanations and study tips
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            defaultChecked
                          />
                          <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div> */}
                  </div>

                  {/* Privacy & Security */}
                  {/* <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Privacy & Security
                    </h3>

                    <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl p-6 border border-red-200">
                      <div className="flex items-start gap-3">
                        <Shield className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 mb-2">
                            Data Privacy
                          </p>
                          <p className="text-sm text-gray-600 mb-4">
                            Your learning progress and personal information are
                            securely stored and never shared with third parties.
                          </p>
                          <button className="text-sm text-red-600 hover:text-red-700 font-semibold">
                            View Privacy Policy →
                          </button>
                        </div>
                      </div>
                    </div>
                  </div> */}

                  {/* Danger Zone */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 text-red-600">
                      Danger Zone
                    </h3>

                    <div className="bg-red-50 rounded-2xl p-6 border-2 border-red-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">
                            Delete Account
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            Permanently delete your account and all data
                          </p>
                        </div>
                        <button className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors text-sm">
                          Delete Account
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer */}
        {/* <div className="text-center mt-8 text-sm text-gray-600">
          <p>
            Need help? Contact us at{" "}
            <a
              href="mailto:support@upcat-reviewer.com"
              className="text-blue-600 hover:text-blue-700 font-semibold"
            >
              support@upcat-reviewer.com
            </a>
          </p>
        </div> */}
      </div>
    </div>
  );
}
