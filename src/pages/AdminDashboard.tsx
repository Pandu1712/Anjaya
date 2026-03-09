import React, { useState, useEffect } from "react";
import { collection, getDocs, doc, updateDoc, addDoc, deleteDoc, query, where } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Service, Booking, UserProfile } from "../types";
import { 
  LayoutDashboard, 
  Wrench, 
  Users, 
  Briefcase, 
  Calendar, 
  Plus, 
  Edit2, 
  Trash2, 
  Check, 
  X,
  UserCheck,
  Clock,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState<"overview" | "services" | "users" | "providers" | "bookings">("overview");
  const [services, setServices] = useState<Service[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [providers, setProviders] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [serviceForm, setServiceForm] = useState({
    name: "",
    description: "",
    baseCost: 0,
    extraCost: 0,
    category: "Repair",
    imageUrl: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const servicesSnap = await getDocs(collection(db, "services"));
      setServices(servicesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service)));

      const bookingsSnap = await getDocs(collection(db, "bookings"));
      const fetchedBookings = bookingsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
      
      // Sort client-side
      fetchedBookings.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
        return dateB.getTime() - dateA.getTime();
      });
      
      setBookings(fetchedBookings);

      const usersSnap = await getDocs(collection(db, "users"));
      const allUsers = usersSnap.docs.map(doc => doc.data() as UserProfile);
      setUsers(allUsers.filter(u => u.role === "user"));
      setProviders(allUsers.filter(u => u.role === "serviceman"));
    } catch (error) {
      console.error("Error fetching admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingService) {
        await updateDoc(doc(db, "services", editingService.id), serviceForm);
      } else {
        await addDoc(collection(db, "services"), serviceForm);
      }
      setShowServiceModal(false);
      setEditingService(null);
      setServiceForm({ name: "", description: "", baseCost: 0, extraCost: 0, category: "Repair", imageUrl: "" });
      fetchData();
    } catch (error) {
      console.error("Error saving service:", error);
    }
  };

  const deleteService = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this service?")) {
      await deleteDoc(doc(db, "services", id));
      fetchData();
    }
  };

  const approveProvider = async (uid: string) => {
    await updateDoc(doc(db, "users", uid), { isApproved: true });
    fetchData();
  };

  const assignProvider = async (bookingId: string, providerId: string, providerName: string) => {
    await updateDoc(doc(db, "bookings", bookingId), {
      providerId,
      providerName,
      status: "assigned"
    });
    fetchData();
  };

  const stats = [
    { label: "Total Bookings", value: bookings.length, icon: Calendar, color: "bg-blue-500" },
    { label: "Total Revenue", value: `₹${bookings.reduce((acc, b) => acc + b.totalCost, 0)}`, icon: Clock, color: "bg-emerald-500" },
    { label: "Active Providers", value: providers.filter(p => p.isApproved).length, icon: Briefcase, color: "bg-purple-500" },
    { label: "Pending Requests", value: bookings.filter(b => b.status === "pending").length, icon: AlertCircle, color: "bg-amber-500" },
  ];

  return (
    <div className="min-h-screen pt-16 bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:block">
        <div className="p-6">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Menu</h2>
          <nav className="space-y-2">
            {[
              { id: "overview", label: "Overview", icon: LayoutDashboard },
              { id: "services", label: "Services", icon: Wrench },
              { id: "bookings", label: "Bookings", icon: Calendar },
              { id: "providers", label: "Providers", icon: Briefcase },
              { id: "users", label: "Users", icon: Users },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                  activeTab === item.id 
                    ? "bg-emerald-50 text-emerald-700" 
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <item.icon size={20} />
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto">
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="space-y-8">
                <h1 className="text-3xl font-bold text-gray-900">Admin Overview</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {stats.map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                      <div className={`w-12 h-12 ${stat.color} text-white rounded-2xl flex items-center justify-center mb-4`}>
                        <stat.icon size={24} />
                      </div>
                      <p className="text-gray-500 text-sm font-medium">{stat.label}</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                    <h3 className="text-xl font-bold text-gray-900 mb-6">Recent Bookings</h3>
                    <div className="space-y-4">
                      {bookings.slice(0, 5).map((booking) => (
                        <div key={booking.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                          <div>
                            <p className="font-bold text-gray-900">{booking.serviceName}</p>
                            <p className="text-sm text-gray-500">{booking.userName}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            booking.status === "pending" ? "bg-amber-100 text-amber-700" :
                            booking.status === "completed" ? "bg-emerald-100 text-emerald-700" :
                            "bg-blue-100 text-blue-700"
                          }`}>
                            {booking.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                    <h3 className="text-xl font-bold text-gray-900 mb-6">Pending Approvals</h3>
                    <div className="space-y-4">
                      {providers.filter(p => !p.isApproved).map((provider) => (
                        <div key={provider.uid} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                          <div>
                            <p className="font-bold text-gray-900">{provider.displayName}</p>
                            <p className="text-sm text-gray-500">{provider.email}</p>
                          </div>
                          <button
                            onClick={() => approveProvider(provider.uid)}
                            className="bg-emerald-600 text-white p-2 rounded-lg hover:bg-emerald-700"
                          >
                            <Check size={18} />
                          </button>
                        </div>
                      ))}
                      {providers.filter(p => !p.isApproved).length === 0 && (
                        <p className="text-gray-500 text-center py-4">No pending approvals</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Services Tab */}
            {activeTab === "services" && (
              <div className="space-y-8">
                <div className="flex justify-between items-center">
                  <h1 className="text-3xl font-bold text-gray-900">Manage Services</h1>
                  <button
                    onClick={() => {
                      setEditingService(null);
                      setServiceForm({ name: "", description: "", baseCost: 0, extraCost: 0, category: "Repair", imageUrl: "" });
                      setShowServiceModal(true);
                    }}
                    className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-lg"
                  >
                    <Plus size={20} /> Add Service
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {services.map((service) => (
                    <div key={service.id} className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm">
                      <img src={service.imageUrl} alt={service.name} className="w-full h-40 object-cover" />
                      <div className="p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{service.name}</h3>
                        <p className="text-gray-500 text-sm mb-4 line-clamp-2">{service.description}</p>
                        <div className="flex justify-between items-center mb-6">
                          <span className="text-emerald-600 font-bold">₹{service.baseCost}</span>
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-500">{service.category}</span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditingService(service);
                              setServiceForm({ ...service });
                              setShowServiceModal(true);
                            }}
                            className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-bold hover:bg-gray-200 transition-all flex items-center justify-center gap-1"
                          >
                            <Edit2 size={16} /> Edit
                          </button>
                          <button
                            onClick={() => deleteService(service.id)}
                            className="bg-red-50 text-red-600 p-2 rounded-lg hover:bg-red-100 transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bookings Tab */}
            {activeTab === "bookings" && (
              <div className="space-y-8">
                <h1 className="text-3xl font-bold text-gray-900">All Bookings</h1>
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="px-6 py-4 text-sm font-bold text-gray-600">User / Service</th>
                        <th className="px-6 py-4 text-sm font-bold text-gray-600">Date / Time / Location</th>
                        <th className="px-6 py-4 text-sm font-bold text-gray-600">Status</th>
                        <th className="px-6 py-4 text-sm font-bold text-gray-600">Provider</th>
                        <th className="px-6 py-4 text-sm font-bold text-gray-600">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {bookings.map((booking) => (
                        <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <p className="font-bold text-gray-900">{booking.serviceName}</p>
                            <p className="text-sm text-gray-700 font-medium">{booking.userName}</p>
                            <p className="text-xs text-gray-500">{booking.userPhone}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-gray-900 font-medium">{booking.serviceDate}</p>
                            <p className="text-xs text-emerald-600 font-bold">{booking.serviceTime}</p>
                            <p className="text-xs text-gray-500">{booking.city}</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              booking.status === "pending" ? "bg-amber-100 text-amber-700" :
                              booking.status === "completed" ? "bg-emerald-100 text-emerald-700" :
                              "bg-blue-100 text-blue-700"
                            }`}>
                              {booking.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {booking.providerName ? (
                              <p className="text-sm font-medium text-gray-900">{booking.providerName}</p>
                            ) : (
                              <span className="text-xs text-red-500 font-medium italic">Not Assigned</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {booking.status === "pending" && (
                              <select
                                className="text-xs border border-gray-200 rounded-lg p-1 outline-none"
                                onChange={(e) => {
                                  const provider = providers.find(p => p.uid === e.target.value);
                                  if (provider) assignProvider(booking.id, provider.uid, provider.displayName || "");
                                }}
                                defaultValue=""
                              >
                                <option value="" disabled>Assign Provider</option>
                                {providers.filter(p => p.isApproved).map(p => (
                                  <option key={p.uid} value={p.uid}>{p.displayName}</option>
                                ))}
                              </select>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Providers Tab */}
            {activeTab === "providers" && (
              <div className="space-y-8">
                <h1 className="text-3xl font-bold text-gray-900">Service Providers</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {providers.map((provider) => (
                    <div key={provider.uid} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
                      <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400">
                        <UserCheck size={32} />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-gray-900">{provider.displayName}</p>
                        <p className="text-sm text-gray-500">{provider.email}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`w-2 h-2 rounded-full ${provider.isApproved ? "bg-emerald-500" : "bg-amber-500"}`}></span>
                          <span className="text-xs font-medium text-gray-500">{provider.isApproved ? "Approved" : "Pending Approval"}</span>
                        </div>
                      </div>
                      {!provider.isApproved && (
                        <button
                          onClick={() => approveProvider(provider.uid)}
                          className="bg-emerald-600 text-white p-2 rounded-lg hover:bg-emerald-700"
                        >
                          <Check size={18} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Users Tab */}
            {activeTab === "users" && (
              <div className="space-y-8">
                <h1 className="text-3xl font-bold text-gray-900">Registered Users</h1>
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="px-6 py-4 text-sm font-bold text-gray-600">Name</th>
                        <th className="px-6 py-4 text-sm font-bold text-gray-600">Email</th>
                        <th className="px-6 py-4 text-sm font-bold text-gray-600">Phone</th>
                        <th className="px-6 py-4 text-sm font-bold text-gray-600">Joined On</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {users.map((user) => (
                        <tr key={user.uid} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <p className="font-bold text-gray-900">{user.displayName || "N/A"}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-gray-900">{user.email}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-gray-900">{user.phoneNumber || "N/A"}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-xs text-gray-500">
                              {user.createdAt?.toDate ? user.createdAt.toDate().toLocaleDateString() : "N/A"}
                            </p>
                          </td>
                        </tr>
                      ))}
                      {users.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-6 py-8 text-center text-gray-500">No registered users found</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Service Modal */}
      <AnimatePresence>
        {showServiceModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl p-8 md:p-12"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900">{editingService ? "Edit Service" : "Add New Service"}</h2>
                <button onClick={() => setShowServiceModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleServiceSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Service Name</label>
                    <input
                      type="text"
                      required
                      value={serviceForm.name}
                      onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                      placeholder="AC Repair"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                    <select
                      value={serviceForm.category}
                      onChange={(e) => setServiceForm({ ...serviceForm, category: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                    >
                      <option value="Repair">Repair</option>
                      <option value="Electrical">Electrical</option>
                      <option value="Plumbing">Plumbing</option>
                      <option value="Cleaning">Cleaning</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                  <textarea
                    required
                    rows={3}
                    value={serviceForm.description}
                    onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="Brief description of the service..."
                  ></textarea>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Base Cost (₹)</label>
                    <input
                      type="number"
                      required
                      value={serviceForm.baseCost}
                      onChange={(e) => setServiceForm({ ...serviceForm, baseCost: Number(e.target.value) })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Image URL</label>
                    <input
                      type="text"
                      required
                      value={serviceForm.imageUrl}
                      onChange={(e) => setServiceForm({ ...serviceForm, imageUrl: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg"
                >
                  {editingService ? "Update Service" : "Create Service"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;
