import React from "react";
import { Clock, ShieldCheck, Mail } from "lucide-react";
import { motion } from "motion/react";

const ProviderPending = () => {
  return (
    <div className="min-h-screen pt-24 pb-12 flex items-center justify-center bg-gray-50 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white rounded-[2.5rem] shadow-xl border border-gray-100 p-8 md:p-12 text-center"
      >
        <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-3xl flex items-center justify-center mx-auto mb-8">
          <Clock size={40} />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Approval Pending</h1>
        <p className="text-gray-600 mb-8 leading-relaxed">
          Thank you for registering as a Service Provider! Your account is currently under review by our admin team.
        </p>
        
        <div className="space-y-4 mb-10">
          <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-2xl text-left">
            <ShieldCheck className="text-emerald-600 shrink-0" size={24} />
            <p className="text-sm text-gray-700 font-medium">We verify all providers to ensure quality service.</p>
          </div>
          <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-2xl text-left">
            <Mail className="text-emerald-600 shrink-0" size={24} />
            <p className="text-sm text-gray-700 font-medium">You'll receive an email once your account is approved.</p>
          </div>
        </div>

        <button
          onClick={() => window.location.reload()}
          className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg"
        >
          Check Status
        </button>
      </motion.div>
    </div>
  );
};

export default ProviderPending;
