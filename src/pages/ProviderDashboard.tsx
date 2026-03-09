import React, { useState, useEffect } from "react";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { Booking } from "../types";
import { Calendar, MapPin, Phone, User, CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";
import { motion } from "motion/react";

const ProviderDashboard = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAssignedTasks = async () => {
      if (!user) return;
      try {
        const q = query(collection(db, "bookings"), where("providerId", "==", user.uid));
        const querySnapshot = await getDocs(q);
        const fetchedBookings = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
        
        // Sort client-side
        fetchedBookings.sort((a, b) => {
          const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
          const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
          return dateB.getTime() - dateA.getTime();
        });
        
        setBookings(fetchedBookings);
      } catch (error) {
        console.error("Error fetching provider tasks:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAssignedTasks();
  }, [user]);

  const updateStatus = async (bookingId: string, newStatus: Booking["status"]) => {
    try {
      await updateDoc(doc(db, "bookings", bookingId), { status: newStatus });
      setBookings(bookings.map(b => b.id === bookingId ? { ...b, status: newStatus } : b));
      alert(`Status updated to ${newStatus}`);
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 bg-gray-50 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900">My Tasks</h1>
          <p className="text-gray-500 mt-1">Manage your assigned service requests</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {bookings.length > 0 ? bookings.map((booking) => (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden"
              >
                <div className="p-8">
                  <div className="flex flex-col md:flex-row justify-between gap-8">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                          booking.status === "assigned" ? "bg-blue-100 text-blue-700" :
                          booking.status === "in-progress" ? "bg-purple-100 text-purple-700" :
                          booking.status === "completed" ? "bg-emerald-100 text-emerald-700" :
                          "bg-gray-100 text-gray-700"
                        }`}>
                          {booking.status}
                        </span>
                        <span className="text-xs text-gray-400 font-medium">#{booking.id.slice(-6)}</span>
                      </div>
                      
                      <h3 className="text-2xl font-bold text-gray-900 mb-6">{booking.serviceName}</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="flex items-start gap-3">
                            <User size={20} className="text-emerald-600 shrink-0" />
                            <div>
                              <p className="text-xs text-gray-400 font-bold uppercase">Customer</p>
                              <p className="text-gray-900 font-bold">{booking.userName}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <Phone size={20} className="text-emerald-600 shrink-0" />
                            <div>
                              <p className="text-xs text-gray-400 font-bold uppercase">Contact</p>
                              <p className="text-gray-900 font-bold">{booking.userPhone}</p>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div className="flex items-start gap-3">
                            <MapPin size={20} className="text-emerald-600 shrink-0" />
                            <div>
                              <p className="text-xs text-gray-400 font-bold uppercase">Location</p>
                              <p className="text-gray-900 font-bold leading-tight">{booking.address}, {booking.city}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <Calendar size={20} className="text-emerald-600 shrink-0" />
                            <div>
                              <p className="text-xs text-gray-400 font-bold uppercase">Scheduled Date</p>
                              <p className="text-gray-900 font-bold">{booking.serviceDate}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {booking.notes && (
                        <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
                          <p className="text-xs text-gray-400 font-bold uppercase mb-1">Customer Notes</p>
                          <p className="text-sm text-gray-600 italic">"{booking.notes}"</p>
                        </div>
                      )}
                    </div>

                    <div className="w-full md:w-64 flex flex-col gap-3 justify-center">
                      {booking.status === "assigned" && (
                        <button
                          onClick={() => updateStatus(booking.id, "in-progress")}
                          className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                        >
                          <Clock size={20} /> Start Work
                        </button>
                      )}
                      
                      {booking.status === "in-progress" && (
                        <button
                          onClick={() => updateStatus(booking.id, "completed")}
                          className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                        >
                          <CheckCircle2 size={20} /> Mark Completed
                        </button>
                      )}

                      {booking.status === "completed" && (
                        <div className="text-center p-6 bg-emerald-50 rounded-2xl border border-emerald-100">
                          <CheckCircle2 size={32} className="text-emerald-600 mx-auto mb-2" />
                          <p className="text-emerald-800 font-bold">Service Completed</p>
                          <p className="text-xs text-emerald-600 mt-1">
                            {booking.remainingPaid ? "Payment Received" : "Waiting for Payment"}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )) : (
              <div className="text-center py-20 bg-white rounded-[2rem] border border-gray-100">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Briefcase size={40} className="text-gray-300" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No tasks assigned</h3>
                <p className="text-gray-500">You don't have any service requests assigned to you yet.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const Briefcase = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
  </svg>
);

export default ProviderDashboard;
