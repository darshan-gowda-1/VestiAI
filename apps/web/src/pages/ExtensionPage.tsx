import React from 'react';
import { Link } from 'react-router-dom';
import {
  Chrome,
  ArrowRight,
  ShieldCheck,
  ExternalLink,
  Laptop,
  Sparkles,
} from 'lucide-react';

export const ExtensionPage: React.FC = () => {
  return (
    <div className="bg-[#fffffc] text-[#170404] min-h-screen py-12 sm:py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-12">
        {/* Hero Section */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#170404]/5 border border-black/10 text-xs font-mono uppercase tracking-wider text-[#5a2542]">
            <Chrome className="w-3.5 h-3.5 text-[#4285F4]" />
            <span>Chrome Extension (Manifest V3)</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-sans font-medium tracking-tight text-[#170404] leading-[1.05]">
            Try Clothes On, <br />
            <span className="italic font-normal text-[#c65a92]">Anywhere You Shop</span>
          </h1>

          <p className="text-base sm:text-lg text-[#6b5858] font-light leading-relaxed">
            Install the Anywear extension for Google Chrome to drag any garment from Revolve, ASOS, Zara, Nordstrom, or any fashion store and see it on you instantly.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="https://chromewebstore.google.com/detail/anywear-virtual-try-on/hijnklblgecbdlhjiofhlhjpndpifejh"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto h-13 px-8 rounded-xl bg-[#170404] hover:bg-black text-[#fffffc] font-medium text-sm tracking-tight transition flex items-center justify-center gap-2.5 shadow-md"
            >
              <Chrome className="w-4 h-4 text-white" />
              <span>Add to Chrome (Web Store)</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-70" />
            </a>

            <Link
              to="/try-on"
              className="w-full sm:w-auto h-13 px-6 rounded-xl bg-white hover:bg-stone-50 border border-black/15 text-[#170404] font-medium text-sm tracking-tight transition flex items-center justify-center gap-2"
            >
              <span>Test Live in Studio</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#c65a92]" />
            </Link>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-white border border-black/10 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#fedfff]/50 text-[#7a2256] flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-[#170404] text-base">Automatic Detection</h3>
            <p className="text-xs text-stone-600 leading-relaxed font-light">
              Detects clothing product images on any eCommerce store and reveals a clean, unobtrusive Try-On button.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-black/10 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#eae4f7] text-[#5a2542] flex items-center justify-center">
              <Laptop className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-[#170404] text-base">Companion Sidepanel</h3>
            <p className="text-xs text-stone-600 leading-relaxed font-light">
              Opens Chrome's native Side Panel without redirecting away from your checkout or browsing flow.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-black/10 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-[#170404] text-base">Zero Data Scraping</h3>
            <p className="text-xs text-stone-600 leading-relaxed font-light">
              Strictly extracts garment image URLs on user interaction. Never collects passwords, carts, or payment data.
            </p>
          </div>
        </div>

        {/* Step-by-Step Developer Mode Installation Guide */}
        <div className="p-8 rounded-3xl bg-white border border-black/10 shadow-sm space-y-8">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-[#c65a92] font-semibold">
              Developer Installation
            </span>
            <h2 className="text-2xl sm:text-3xl font-medium tracking-tight text-[#170404] mt-1">
              Load Unpacked in Google Chrome
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 mt-1">
              Follow these simple steps to install and test the extension locally:
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex gap-4">
              <span className="w-7 h-7 rounded-full bg-[#170404] text-white text-xs font-mono flex items-center justify-center font-bold shrink-0 mt-0.5">
                1
              </span>
              <div className="space-y-2 flex-1">
                <h3 className="text-sm font-semibold text-[#170404]">Build the Extension Bundle</h3>
                <p className="text-xs text-stone-600">
                  Open your terminal and compile the TypeScript source into the distribution folder:
                </p>
                <div className="rounded-xl bg-[#170404] p-3 font-mono text-xs text-[#fec6ff]">
                  <code>cd apps/extension &amp;&amp; npm.cmd run build</code>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <span className="w-7 h-7 rounded-full bg-[#170404] text-white text-xs font-mono flex items-center justify-center font-bold shrink-0 mt-0.5">
                2
              </span>
              <div className="space-y-1 flex-1">
                <h3 className="text-sm font-semibold text-[#170404]">Open Chrome Extensions Management</h3>
                <p className="text-xs text-stone-600">
                  In Google Chrome, navigate to <code>chrome://extensions</code> in your address bar (or Menu &rarr; Extensions &rarr; Manage Extensions).
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <span className="w-7 h-7 rounded-full bg-[#170404] text-white text-xs font-mono flex items-center justify-center font-bold shrink-0 mt-0.5">
                3
              </span>
              <div className="space-y-1 flex-1">
                <h3 className="text-sm font-semibold text-[#170404]">Enable Developer Mode</h3>
                <p className="text-xs text-stone-600">
                  Toggle on the <strong>Developer mode</strong> switch located in the top-right corner of the Extensions page.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <span className="w-7 h-7 rounded-full bg-[#170404] text-white text-xs font-mono flex items-center justify-center font-bold shrink-0 mt-0.5">
                4
              </span>
              <div className="space-y-2 flex-1">
                <h3 className="text-sm font-semibold text-[#170404]">Load the Unpacked Extension</h3>
                <p className="text-xs text-stone-600">
                  Click the <strong>Load unpacked</strong> button in the top-left toolbar, browse to your project root, and select:
                </p>
                <div className="rounded-xl bg-stone-100 p-3 font-mono text-xs text-stone-800 border border-black/10">
                  <code>apps/extension/dist</code>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <span className="w-7 h-7 rounded-full bg-emerald-600 text-white text-xs font-mono flex items-center justify-center font-bold shrink-0 mt-0.5">
                ✓
              </span>
              <div className="space-y-1 flex-1">
                <h3 className="text-sm font-semibold text-emerald-900">Done! Ready to Try On</h3>
                <p className="text-xs text-stone-600">
                  Visit any supported shopping website. You'll see the Anywear Try-On pill appear over clothing products!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
