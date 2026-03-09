import React, { useState, useEffect } from "react";
import { collection, query, where, getDocs, doc, updateDoc, orderBy } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { Booking, Service } from "../types";
import { Calendar, Clock, CheckCircle2, AlertCircle, MapPin, CreditCard, ArrowRight, Plus, History, LayoutGrid } from "lucide-react";
import { motion } from "motion/react";
import { Link } from "react-router-dom";

const UserDashboard = () => {
  const { user, profile } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"bookings" | "services">("bookings");

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        // Fetch Bookings
        const q = query(
          collection(db, "bookings"), 
          where("userId", "==", user.uid)
        );
        const querySnapshot = await getDocs(q);
        const fetchedBookings = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
        
        // Sort client-side to avoid Firestore index requirement
        fetchedBookings.sort((a, b) => {
          const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
          const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
          return dateB.getTime() - dateA.getTime();
        });
        
        setBookings(fetchedBookings);

        // Fetch Services
        const servicesSnapshot = await getDocs(collection(db, "services"));
        setServices(servicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service)));
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleFinalPayment = async (booking: Booking) => {
    const remainingAmount = booking.totalCost - booking.advancePaid;
    
    try {
      const response = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: remainingAmount }),
      });
      const order = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          alert("Razorpay is not configured. Please add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in the Settings menu.");
        } else {
          alert(`Error: ${order.message || "Failed to create order"}`);
        }
        return;
      }

      const res = await loadRazorpay();
      if (!res) return;

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_placeholder",
        amount: order.amount,
        currency: order.currency,
        name: "Anjaneya Services",
        description: `Final payment for ${booking.serviceName}`,
        order_id: order.id,
        handler: async (response: any) => {
          const verifyRes = await fetch("/api/verify-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(response),
          });
          const verifyData = await verifyRes.json();

          if (verifyData.status === "ok") {
            await updateDoc(doc(db, "bookings", booking.id), {
              remainingPaid: true,
              status: "completed"
            });
            alert("Payment successful! Service completed.");
            window.location.reload();
          }
        },
        prefill: {
          name: profile?.displayName || "",
          email: user?.email || "",
          contact: booking.userPhone,
        },
        theme: { color: "#059669" },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error("Final payment error:", error);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 bg-gray-50 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Welcome, {profile?.displayName || "User"}</h1>
            <p className="text-gray-500 mt-1">Manage your service requests and book new ones</p>
          </div>
          <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-gray-100">
            <button
              onClick={() => setActiveTab("bookings")}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === "bookings" ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <History size={18} /> My Bookings
            </button>
            <button
              onClick={() => setActiveTab("services")}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === "services" ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <LayoutGrid size={18} /> Book Service
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
          </div>
        ) : activeTab === "bookings" ? (
          <div className="space-y-6">
            {bookings.length > 0 ? bookings.map((booking) => (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden"
              >
                <div className="p-8">
                  <div className="flex flex-col md:flex-row justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                          booking.status === "pending" ? "bg-amber-100 text-amber-700" :
                          booking.status === "completed" ? "bg-emerald-100 text-emerald-700" :
                          "bg-blue-100 text-blue-700"
                        }`}>
                          {booking.status}
                        </span>
                        <span className="text-xs text-gray-400 font-medium">#{booking.id.slice(-6)}</span>
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">{booking.serviceName}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                        <div className="flex items-center gap-3 text-gray-600">
                          <Calendar size={18} className="text-emerald-600" />
                          <span className="text-sm font-medium">{booking.serviceDate} at {booking.serviceTime}</span>
                        </div>
                        <div className="flex items-center gap-3 text-gray-600">
                          <MapPin size={18} className="text-emerald-600" />
                          <span className="text-sm font-medium line-clamp-1">{booking.address}</span>
                        </div>
                        <div className="flex items-center gap-3 text-gray-600">
                          <Clock size={18} className="text-emerald-600" />
                          <span className="text-sm font-medium">Booked on {new Date(booking.createdAt?.toDate()).toLocaleDateString()}</span>
                        </div>
                        {booking.providerName && (
                          <div className="flex items-center gap-3 text-gray-600">
                            <CheckCircle2 size={18} className="text-emerald-600" />
                            <span className="text-sm font-medium">Assigned: {booking.providerName}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="w-full md:w-64 bg-gray-50 rounded-2xl p-6 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Total Cost</span>
                          <span className="font-bold text-gray-900">₹{booking.totalCost}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Advance Paid</span>
                          <span className="font-bold text-emerald-600">₹{booking.advancePaid}</span>
                        </div>
                        <div className="pt-2 border-t border-gray-200 flex justify-between">
                          <span className="text-sm font-bold text-gray-900">Remaining</span>
                          <span className="text-lg font-bold text-gray-900">₹{booking.totalCost - booking.advancePaid}</span>
                        </div>
                      </div>

                      {booking.status === "completed" && !booking.remainingPaid && (
                        <button
                          onClick={() => handleFinalPayment(booking)}
                          className="w-full mt-4 bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                        >
                          Pay Final Balance <ArrowRight size={18} />
                        </button>
                      )}
                      
                      {booking.remainingPaid && (
                        <div className="mt-4 flex items-center justify-center gap-2 text-emerald-600 font-bold bg-emerald-50 py-3 rounded-xl">
                          <CheckCircle2 size={20} /> Paid
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )) : (
              <div className="text-center py-20 bg-white rounded-[2rem] border border-gray-100">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <AlertCircle size={40} className="text-gray-300" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No bookings yet</h3>
                <p className="text-gray-500 mb-8">You haven't booked any services yet. Start exploring!</p>
                <button 
                  onClick={() => setActiveTab("services")}
                  className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all"
                >
                  Browse Services
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ y: -5 }}
                className="bg-white rounded-[2rem] overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all"
              >
                <div className="h-48 relative">
                  <img
                    src={service.imageUrl || "https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&q=80&w=800"}
                    alt={service.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-sm font-bold text-emerald-700">
                    ₹{service.baseCost}
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{service.name}</h3>
                  <p className="text-gray-500 text-sm mb-6 line-clamp-2">{service.description}</p>
                  <Link
                    to={`/book/${service.id}`}
                    className="w-full bg-emerald-50 text-emerald-600 py-3 rounded-xl font-bold hover:bg-emerald-600 hover:text-white transition-all flex items-center justify-center gap-2"
                  >
                    Book Now <Plus size={18} />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;
