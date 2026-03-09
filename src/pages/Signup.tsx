import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { createUserWithEmailAndPassword, signInWithPopup, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { auth, googleProvider, db } from "../lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { UserPlus, Mail, Lock, Chrome, User, Briefcase, Phone, ArrowRight, ExternalLink } from "lucide-react";
import { motion } from "motion/react";
import { UserRole } from "../types";

const Signup = () => {
  const [searchParams] = useSearchParams();
  const isGoogle = searchParams.get("google") === "true";
  
  const [authMethod, setAuthMethod] = useState<"email" | "phone">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<UserRole>("user");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isGoogle && auth.currentUser) {
      setEmail(auth.currentUser.email || "");
      setDisplayName(auth.currentUser.displayName || "");
    }
  }, [isGoogle]);

  useEffect(() => {
    if (authMethod === "phone" && !window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container-signup', {
        'size': 'invisible'
      });
    }
  }, [authMethod]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      let user;
      if (isGoogle && auth.currentUser) {
        user = auth.currentUser;
      } else if (authMethod === "email") {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        user = result.user;
      } else {
        const result = await confirmationResult.confirm(otp);
        user = result.user;
      }

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: user.email || null,
        displayName: displayName || user.displayName,
        role: role,
        createdAt: serverTimestamp(),
        isApproved: role === "serviceman" ? false : true,
      });

      if (role === "serviceman") {
        navigate("/provider-pending");
      } else {
        navigate("/dashboard");
      }
    } catch (err: any) {
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const appVerifier = window.recaptchaVerifier;
      const confirmation = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      setConfirmationResult(confirmation);
    } catch (err: any) {
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setLoading(true);
    setError("");
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthError = (err: any) => {
    console.error("Auth Error:", err);
    if (err.code === "auth/invalid-credential") {
      setError(authMethod === "email" 
        ? "Invalid credentials. If you're using Google, try signing in again." 
        : "Invalid OTP code. Please check and try again.");
    } else if (err.code === "auth/email-already-in-use") {
      setError("This email is already in use. Please try logging in.");
    } else if (err.code === "auth/network-request-failed") {
      setError("Network error. This usually happens because the app domain is not whitelisted in Firebase or browser blocks iframe auth.");
    } else if (err.code === "auth/operation-not-allowed") {
      setError("This authentication method is not enabled in Firebase Console.");
    } else if (err.code === "permission-denied") {
      setError("Database permission denied. Please check your Firestore security rules.");
    } else {
      setError(err.message || "An error occurred during signup.");
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 flex items-center justify-center bg-gray-50 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-[2.5rem] shadow-xl border border-gray-100 p-8 md:p-12"
      >
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-6 shadow-lg shadow-emerald-200">
            <UserPlus size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
          <p className="text-gray-500">Join the Anjaneya Services community</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium mb-6 border border-red-100">
            <p className="mb-2 font-bold">Error: {error}</p>
            
            {error.includes("Network error") && (
              <div className="mt-4 space-y-3 bg-white p-4 rounded-lg border border-red-200">
                <p className="text-xs text-gray-700 font-semibold uppercase tracking-wider">Required Setup Steps:</p>
                <ol className="list-decimal list-inside text-xs space-y-2 text-gray-600">
                  <li>
                    Go to <b>Firebase Console</b> &gt; <b>Authentication</b> &gt; <b>Settings</b> &gt; <b>Authorized Domains</b>
                  </li>
                  <li>
                    Add these domains:
                    <div className="mt-1 p-2 bg-gray-50 rounded font-mono text-[10px] break-all">
                      ais-dev-riphgul7zjw7fvyz5kb662-84831825365.asia-southeast1.run.app<br/>
                      ais-pre-riphgul7zjw7fvyz5kb662-84831825365.asia-southeast1.run.app
                    </div>
                  </li>
                  <li>
                    <b>Try opening the app in a new tab:</b>
                  </li>
                </ol>
                <button 
                  onClick={() => window.open(window.location.href, '_blank')}
                  className="w-full mt-2 flex items-center justify-center gap-2 py-2 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-all"
                >
                  <ExternalLink size={14} /> Open in New Tab
                </button>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2 mb-8 bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setAuthMethod("email")}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${authMethod === "email" ? "bg-white text-emerald-600 shadow-sm" : "text-gray-500"}`}
          >
            Email
          </button>
          <button
            onClick={() => setAuthMethod("phone")}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${authMethod === "phone" ? "bg-white text-emerald-600 shadow-sm" : "text-gray-500"}`}
          >
            Phone OTP
          </button>
        </div>

        <form onSubmit={authMethod === "phone" && !confirmationResult ? handleSendOtp : handleSignup} className="space-y-5">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <button
              type="button"
              onClick={() => setRole("user")}
              className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${
                role === "user"
                  ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                  : "border-gray-100 bg-white text-gray-500 hover:border-gray-200"
              }`}
            >
              <User size={24} className="mb-2" />
              <span className="font-bold">User</span>
            </button>
            <button
              type="button"
              onClick={() => setRole("serviceman")}
              className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${
                role === "serviceman"
                  ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                  : "border-gray-100 bg-white text-gray-500 hover:border-gray-200"
              }`}
            >
              <Briefcase size={24} className="mb-2" />
              <span className="font-bold">Service Man</span>
            </button>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                placeholder="John Doe"
              />
            </div>
          </div>

          {authMethod === "email" && !isGoogle && (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </>
          )}

          {authMethod === "phone" && (
            <>
              {!confirmationResult ? (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="tel"
                      required
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                      placeholder="+91 98765 43210"
                    />
                  </div>
                  <div id="recaptcha-container-signup" className="mt-4"></div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Enter OTP</label>
                  <input
                    type="text"
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-center text-2xl tracking-[1em]"
                    placeholder="000000"
                    maxLength={6}
                  />
                </div>
              )}
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? "Processing..." : (
              authMethod === "phone" && !confirmationResult ? "Send OTP" : 
              isGoogle ? "Complete Registration" : "Create Account"
            )} <ArrowRight size={20} />
          </button>
        </form>

        {!isGoogle && authMethod === "email" && (
          <>
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500 font-medium">Or continue with</span>
              </div>
            </div>

            <button
              onClick={handleGoogleSignup}
              disabled={loading}
              className="w-full bg-white border-2 border-gray-100 text-gray-700 py-4 rounded-xl font-bold hover:bg-gray-50 transition-all flex items-center justify-center gap-3 shadow-sm"
            >
              <Chrome size={20} className="text-blue-500" />
              Sign up with Google
            </button>
          </>
        )}

        <p className="text-center mt-10 text-gray-600 font-medium">
          Already have an account?{" "}
          <Link to="/login" className="text-emerald-600 hover:text-emerald-700 font-bold">
            Login
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Signup;
