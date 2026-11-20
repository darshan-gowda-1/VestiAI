import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Copy,
  Check,
  ShoppingBag,
  TrendingUp,
  Clock,
  ExternalLink,
  Store,
  ChevronDown,
} from 'lucide-react';
import { useToast } from '../components/ui/toast';

export const BusinessPage: React.FC = () => {
  const { showToast } = useToast();
  const [storeDomain, setStoreDomain] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Merchant inquiry form states
  const [merchantName, setMerchantName] = useState('');
  const [merchantEmail, setMerchantEmail] = useState('');
  const [merchantStore, setMerchantStore] = useState('');
  const [merchantTraffic, setMerchantTraffic] = useState('10k-50k');
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);

  const snippetCode = `<script src="https://vestiai.com/widget/latest/anywear.js?domain=${
    storeDomain.trim() || 'yourstore.com'
  }" async></script>`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(snippetCode);
    setCopiedCode(true);
    showToast({
      title: 'Snippet Copied',
      description: 'Paste this line right before </body> in your store template.',
      variant: 'success',
    });
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchantEmail || !merchantStore) return;
    setIsSubmittingForm(true);
    setTimeout(() => {
      setIsSubmittingForm(false);
      setFormSubmitted(true);
      showToast({
        title: 'Inquiry Submitted',
        description: 'Our retail engineering team will reach out within 24 hours.',
        variant: 'success',
      });
    }, 800);
  };

  const faqs = [
    {
      q: 'How does Anywear virtual try-on work on my storefront?',
      a: 'A single lightweight asynchronous JavaScript line detects your garment photography automatically and injects an elegant "Try On" button on your product detail pages. Shoppers click to open their camera and see themselves wearing your item with natural drape and motion.',
    },
    {
      q: 'Will this slow down my store page load times?',
      a: 'Not at all. The script is loaded asynchronously (<12KB gzipped) and execution only initializes when a customer clicks the Try-On action. It runs on global CDN edges and has zero impact on Core Web Vitals or SEO.',
    },
    {
      q: 'How do customers access the camera?',
      a: 'Anywear requests standard browser webcam permissions via navigator.mediaDevices. All video processing occurs over secure WebRTC pipelines with explicit customer consent.',
    },
    {
      q: 'Do I need 3D models or 3D clothing CAD assets?',
      a: 'No. Anywear utilizes advanced 2D neural diffusion. It directly uses your existing flat-lay, ghost mannequin, or on-model catalog photography. Zero 3D asset creation required.',
    },
    {
      q: 'Can I trial Anywear before rolling it out to all shoppers?',
      a: 'Yes. Our preview mode allows your internal team to test try-on on your live domain with a private query parameter (e.g. ?anywear_preview=1) before publishing it to public visitors.',
    },
  ];

  return (
    <div className="bg-[#fffffc] text-[#170404] min-h-screen">
      {/* ========================================================= */}
      {/* 1. HERO SECTION                                           */}
      {/* ========================================================= */}
      <section className="relative pt-16 pb-20 sm:pt-24 sm:pb-28 border-b border-black/5 overflow-hidden">
        {/* Soft background glow */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#fedfff]/50 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-[#eae4f7]/60 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#170404]/5 border border-black/10 text-xs font-mono uppercase tracking-wider text-[#5a2542]">
            <Sparkles className="w-3.5 h-3.5 text-[#c65a92]" />
            <span>Virtual Try-On for Any Online Fashion Store</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-sans font-medium tracking-tight text-[#170404] leading-[1.02]">
            Real-time <br className="hidden sm:inline" />
            <span className="italic font-normal text-[#c65a92]">virtual try-on</span> for your store
          </h1>

          <p className="text-lg sm:text-xl text-[#6b5858] max-w-2xl mx-auto font-light leading-relaxed">
            Your shopper opens their camera and sees themselves wearing it — moving, in real time.
            Not a photo upload, not a render queue.
          </p>

          {/* Primary Action Buttons */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/business/install"
              className="w-full sm:w-auto h-14 px-8 rounded-xl bg-[#170404] hover:bg-black text-[#fffffc] font-medium text-base tracking-tight transition flex items-center justify-center gap-2 shadow-lg shadow-black/10 hover:shadow-black/20"
            >
              <span>Install on my store</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <a
              href="#try-demo"
              className="w-full sm:w-auto h-14 px-8 rounded-xl bg-white hover:bg-stone-50 text-[#170404] border border-[#170404]/20 hover:border-[#170404]/50 font-medium text-base tracking-tight transition flex items-center justify-center gap-2 shadow-sm"
            >
              <span>See live demo below</span>
              <ChevronDown className="w-4 h-4 text-[#c65a92]" />
            </a>
          </div>

          <p className="text-xs text-[#8c7b7b] pt-1">
            Free during Beta • One line of code • No 3D files required
          </p>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 2. PROVEN METRICS & IMPACT                                */}
      {/* ========================================================= */}
      <section className="py-20 border-b border-black/5 bg-[#faf8f6]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-xl mx-auto mb-14 space-y-2">
            <span className="text-xs font-mono uppercase tracking-wider text-[#c65a92] font-semibold">
              Conversion &amp; Engagement Impact
            </span>
            <h2 className="text-3xl sm:text-4xl font-medium tracking-tight text-[#170404]">
              Try-on keeps shoppers in your store for longer.
            </h2>
            <p className="text-sm text-stone-600">
              Measured across live brand storefronts during customer try-on sessions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-white border border-black/5 shadow-sm space-y-3 text-center">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-[#fec6ff]/30 text-[#7a2256] flex items-center justify-center">
                <TrendingUp className="w-6 h-6" />
              </div>
              <p className="text-4xl sm:text-5xl font-mono font-bold text-[#170404] tracking-tight">
                +11.3%
              </p>
              <h3 className="text-sm font-semibold text-[#170404]">Add-to-Cart Conversion</h3>
              <p className="text-xs text-stone-600 leading-relaxed font-light">
                11.3% of shoppers who tried a garment on clicked add-to-cart or buy-now in the same session.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white border border-black/5 shadow-sm space-y-3 text-center">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-[#eae4f7] text-[#5a2542] flex items-center justify-center">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <p className="text-4xl sm:text-5xl font-mono font-bold text-[#170404] tracking-tight">
                3 in 4
              </p>
              <h3 className="text-sm font-semibold text-[#170404]">Multi-Item Exploration</h3>
              <p className="text-xs text-stone-600 leading-relaxed font-light">
                75% of shoppers go past the first garment they came for to try on companion outfits and styles.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white border border-black/5 shadow-sm space-y-3 text-center">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-[#fedfff] text-[#c65a92] flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
              <p className="text-4xl sm:text-5xl font-mono font-bold text-[#170404] tracking-tight">
                4.8 min
              </p>
              <h3 className="text-sm font-semibold text-[#170404]">Average Session Length</h3>
              <p className="text-xs text-stone-600 leading-relaxed font-light">
                Shoppers spend nearly 5 minutes engaging with your products, rotating stances, and checking fits.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 3. INTERACTIVE SNIPPET GENERATOR                          */}
      {/* ========================================================= */}
      <section id="try-demo" className="py-20 border-b border-black/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-mono uppercase tracking-wider text-[#c65a92] font-semibold">
              Instant Setup
            </span>
            <h2 className="text-3xl sm:text-4xl font-medium tracking-tight text-[#170404]">
              One line of code to install. One click to try it first.
            </h2>
            <p className="text-sm text-stone-600 max-w-lg mx-auto">
              Paste one line before &lt;/body&gt; in your store theme. On Shopify, it is a 1-click install.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-[#170404] text-white shadow-2xl border border-black/20 space-y-6">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
              <div className="space-y-1">
                <p className="text-xs font-mono uppercase text-stone-400">Store Domain</p>
                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4 text-[#c65a92]" />
                  <input
                    type="text"
                    value={storeDomain}
                    onChange={(e) => setStoreDomain(e.target.value)}
                    placeholder="yourstore.com"
                    className="bg-black/40 border border-white/20 rounded-lg px-3 py-1.5 text-sm font-mono text-white placeholder-stone-500 focus:outline-none focus:border-[#c65a92] w-52"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  to="/business/install"
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-mono transition flex items-center gap-1.5"
                >
                  <span>Full Install Guide</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Generated Code Block */}
            <div className="relative rounded-2xl bg-black/60 border border-white/10 p-5 overflow-x-auto font-mono text-xs sm:text-sm text-[#fec6ff]">
              <code>{snippetCode}</code>

              <button
                type="button"
                onClick={handleCopyCode}
                className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-sans transition flex items-center gap-1.5 border border-white/15"
              >
                {copiedCode ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Snippet</span>
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-stone-400 pt-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Zero engineering overhead</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Auto-detects garment images</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Mobile &amp; desktop responsive</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 4. MERCHANT ONBOARDING & ENQUIRY FORM                     */}
      {/* ========================================================= */}
      <section className="py-20 border-b border-black/5 bg-[#faf8f6]">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-medium tracking-tight text-[#170404]">
              Talk to our retail team
            </h2>
            <p className="text-sm text-stone-600">
              Get an enterprise pilot, custom branding, or volume pricing for high-traffic brands.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-white border border-black/10 shadow-sm">
            {formSubmitted ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-14 h-14 mx-auto rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-medium text-[#170404]">Thank you!</h3>
                <p className="text-sm text-stone-600 max-w-sm mx-auto">
                  We have received your store information and will get back to you with custom demo credentials shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-stone-600 mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    value={merchantName}
                    onChange={(e) => setMerchantName(e.target.value)}
                    placeholder="Alex Mercer"
                    className="w-full px-4 py-2.5 rounded-xl border border-black/15 bg-stone-50 focus:bg-white focus:outline-none focus:border-[#c65a92] text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono uppercase text-stone-600 mb-1">
                      Work Email
                    </label>
                    <input
                      type="email"
                      required
                      value={merchantEmail}
                      onChange={(e) => setMerchantEmail(e.target.value)}
                      placeholder="alex@brand.com"
                      className="w-full px-4 py-2.5 rounded-xl border border-black/15 bg-stone-50 focus:bg-white focus:outline-none focus:border-[#c65a92] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono uppercase text-stone-600 mb-1">
                      Store Website URL
                    </label>
                    <input
                      type="text"
                      required
                      value={merchantStore}
                      onChange={(e) => setMerchantStore(e.target.value)}
                      placeholder="https://brand.com"
                      className="w-full px-4 py-2.5 rounded-xl border border-black/15 bg-stone-50 focus:bg-white focus:outline-none focus:border-[#c65a92] text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-stone-600 mb-1">
                    Monthly Shopper Volume
                  </label>
                  <select
                    value={merchantTraffic}
                    onChange={(e) => setMerchantTraffic(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-black/15 bg-stone-50 focus:bg-white focus:outline-none focus:border-[#c65a92] text-sm"
                  >
                    <option value="under-10k">Under 10,000 monthly visitors</option>
                    <option value="10k-50k">10,000 – 50,000 monthly visitors</option>
                    <option value="50k-250k">50,000 – 250,000 monthly visitors</option>
                    <option value="over-250k">Over 250,000 monthly visitors</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingForm}
                  className="w-full py-3.5 rounded-xl bg-[#170404] hover:bg-black text-white font-medium text-sm transition shadow mt-2"
                >
                  {isSubmittingForm ? 'Submitting...' : 'Request Store Integration Demo'}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 5. FREQUENTLY ASKED QUESTIONS                             */}
      {/* ========================================================= */}
      <section className="py-20 max-w-3xl mx-auto px-4 sm:px-6 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-medium tracking-tight text-[#170404]">
            Frequently Asked Questions
          </h2>
          <p className="text-sm text-stone-600">
            Everything merchants ask about technical setup, security, and performance.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = activeFaq === index;
            return (
              <div
                key={faq.q}
                className="rounded-2xl border border-black/10 bg-white overflow-hidden transition"
              >
                <button
                  type="button"
                  onClick={() => setActiveFaq(isOpen ? null : index)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-medium text-sm sm:text-base text-[#170404]"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-[#c65a92] shrink-0 transition-transform ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-stone-600 leading-relaxed border-t border-black/5 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
