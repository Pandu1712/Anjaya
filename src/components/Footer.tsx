import React from "react";
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center space-x-2 mb-6">
              <div className="w-8 h-8 bg-emerald-600 rounded flex items-center justify-center text-white font-bold">
                A
              </div>
              <span className="text-xl font-bold tracking-tight">
                Anjaneya <span className="text-emerald-500">Services</span>
              </span>
            </div>
            <p className="text-gray-400 mb-6 leading-relaxed">
              Your trusted partner for all home maintenance and repair services. Professional, reliable, and affordable.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-emerald-500 transition-colors">
                <Facebook size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-emerald-500 transition-colors">
                <Twitter size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-emerald-500 transition-colors">
                <Instagram size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-6">Quick Links</h3>
            <ul className="space-y-4">
              <li><a href="#home" className="text-gray-400 hover:text-emerald-500 transition-colors">Home</a></li>
              <li><a href="#about" className="text-gray-400 hover:text-emerald-500 transition-colors">About Us</a></li>
              <li><a href="#services" className="text-gray-400 hover:text-emerald-500 transition-colors">Services</a></li>
              <li><a href="#gallery" className="text-gray-400 hover:text-emerald-500 transition-colors">Gallery</a></li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-lg font-semibold mb-6">Our Services</h3>
            <ul className="space-y-4">
              <li><a href="#" className="text-gray-400 hover:text-emerald-500 transition-colors">AC Repair</a></li>
              <li><a href="#" className="text-gray-400 hover:text-emerald-500 transition-colors">Electrical Work</a></li>
              <li><a href="#" className="text-gray-400 hover:text-emerald-500 transition-colors">Plumbing</a></li>
              <li><a href="#" className="text-gray-400 hover:text-emerald-500 transition-colors">Appliance Repair</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-6">Contact Us</h3>
            <ul className="space-y-4">
              <li className="flex items-start space-x-3">
                <MapPin size={20} className="text-emerald-500 shrink-0 mt-1" />
                <span className="text-gray-400">123 Service Lane, Guntur, Andhra Pradesh, India</span>
              </li>
              <li className="flex items-center space-x-3">
                <Phone size={20} className="text-emerald-500 shrink-0" />
                <span className="text-gray-400">+91 98765 43210</span>
              </li>
              <li className="flex items-center space-x-3">
                <Mail size={20} className="text-emerald-500 shrink-0" />
                <span className="text-gray-400">info@anjaneyaservices.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-800 text-center text-gray-500 text-sm">
          <p>© {new Date().getFullYear()} Anjaneya Services. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
