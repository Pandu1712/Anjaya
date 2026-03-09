import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { Service } from "../types";
import { Calendar, MapPin, Phone, User, FileText, CreditCard, ArrowLeft, Clock } from "lucide-react";
import { motion } from "motion/react";

const BookingPage = () => {
  const { serviceId } = useParams();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: profile?.displayName || "",
    phone: profile?.phoneNumber || "",
    address: "",
    city: "Guntur",
    pincode: "",
    serviceDate: "",
    serviceTime: "",
    notes: "",
  });

  useEffect(() => {
    const fetchService = async () => {
      if (!serviceId) return;
      const docRef = doc(db, "services", serviceId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setService({ id: docSnap.id, ...docSnap.data() } as Service);
      }
      setLoading(false);
    };
    fetchService();
  }, [serviceId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!service || !user) return;

    setBookingLoading(true);
    
    try {
      const advanceAmount = service.baseCost * 0.2;
      
      // 1. Create order on server
      const response = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: advanceAmount }),
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

      // 2. Initialize Razorpay
      const res = await loadRazorpay();
      if (!res) {
        alert("Razorpay SDK failed to load. Are you online?");
        return;
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_placeholder",
        amount: order.amount,
        currency: order.currency,
        name: "Anjaneya Services",
        description: `Advance for ${service.name}`,
        order_id: order.id,
        handler: async (response: any) => {
          // 3. Verify payment on server
          const verifyRes = await fetch("/api/verify-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(response),
          });
          const verifyData = await verifyRes.json();

          if (verifyData.status === "ok") {
            // 4. Create booking in Firestore
            await addDoc(collection(db, "bookings"), {
              userId: user.uid,
              userName: formData.fullName,
              userPhone: formData.phone,
              address: formData.address,
              city: formData.city,
              pincode: formData.pincode,
              serviceId: service.id,
              serviceName: service.name,
              serviceDate: formData.serviceDate,
              serviceTime: formData.serviceTime,
              notes: formData.notes,
              status: "pending",
              totalCost: service.baseCost,
              advancePaid: advanceAmount,
              remainingPaid: false,
              createdAt: serverTimestamp(),
              paymentId: response.razorpay_payment_id,
            });
            
            alert("Booking successful! Our admin will assign a service provider soon.");
            navigate("/dashboard");
          } else {
            alert("Payment verification failed");
          }
        },
        prefill: {
          name: formData.fullName,
          email: user.email,
          contact: formData.phone,
        },
        theme: { color: "#059669" },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error("Booking error:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div></div>;
  if (!service) return <div className="min-h-screen flex items-center justify-center">Service not found</div>;

  return (
    <div className="min-h-screen pt-24 pb-12 bg-gray-50 px-4">
      <div className="max-w-5xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-emerald-600 font-medium mb-8 transition-colors"
        >
          <ArrowLeft size={20} /> Back to Services
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Service Summary */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden sticky top-24"
            >
              <img
                src={service.imageUrl || "https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&q=80&w=800"}
                alt={service.name}
                className="w-full h-48 object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{service.name}</h2>
                <p className="text-gray-500 text-sm mb-6 leading-relaxed">{service.description}</p>
                
                <div className="space-y-4 pt-6 border-t border-gray-100">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium">Base Cost</span>
                    <span className="text-xl font-bold text-gray-900">₹{service.baseCost}</span>
                  </div>
                  <div className="flex justify-between items-center text-emerald-600">
                    <span className="font-medium">Advance (20%)</span>
                    <span className="font-bold">₹{service.baseCost * 0.2}</span>
                  </div>
                  <div className="pt-4 flex items-start gap-3 bg-emerald-50 p-4 rounded-2xl">
                    <CreditCard className="text-emerald-600 shrink-0" size={20} />
                    <p className="text-xs text-emerald-800 leading-relaxed">
                      You only need to pay the 20% advance now to confirm your booking. The remaining 80% is payable after service completion.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Booking Form */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-[2rem] shadow-xl border border-gray-100 p-8 md:p-12"
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-8">Booking Details</h3>
              
              <form onSubmit={handleBooking} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type="text"
                        name="fullName"
                        required
                        value={formData.fullName}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                        placeholder="John Doe"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type="tel"
                        name="phone"
                        required
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                        placeholder="+91 98765 43210"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Service Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-4 text-gray-400" size={20} />
                    <textarea
                      name="address"
                      required
                      rows={3}
                      value={formData.address}
                      onChange={handleInputChange}
                      className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                      placeholder="House No, Street Name, Area..."
                    ></textarea>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
                    <input
                      type="text"
                      name="city"
                      required
                      readOnly
                      value={formData.city}
                      className="w-full px-4 py-3.5 rounded-xl border border-gray-100 bg-gray-50 text-gray-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Pincode</label>
                    <input
                      type="text"
                      name="pincode"
                      required
                      value={formData.pincode}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                      placeholder="522001"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Preferred Service Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type="date"
                        name="serviceDate"
                        required
                        min={new Date().toISOString().split("T")[0]}
                        value={formData.serviceDate}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Preferred Service Time</label>
                    <div className="relative">
                      <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type="time"
                        name="serviceTime"
                        required
                        value={formData.serviceTime}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Additional Notes (Optional)</label>
                  <div className="relative">
                    <FileText className="absolute left-4 top-4 text-gray-400" size={20} />
                    <textarea
                      name="notes"
                      rows={2}
                      value={formData.notes}
                      onChange={handleInputChange}
                      className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                      placeholder="Any specific instructions for the service man?"
                    ></textarea>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={bookingLoading}
                  className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg hover:shadow-emerald-200 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {bookingLoading ? "Processing..." : `Pay ₹${service.baseCost * 0.2} & Confirm Booking`}
                </button>
              </form>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;
