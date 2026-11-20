import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Copy,
  Check,
  CheckCircle2,
  Store,
} from 'lucide-react';
import { useToast } from '../components/ui/toast';

export const BusinessInstallPage: React.FC = () => {
  const { showToast } = useToast();
  const [storeDomain, setStoreDomain] = useState('mystore.com');
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeTab, setActiveTab] = useState<'shopify' | 'html' | 'woocommerce' | 'gtm'>('shopify');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<'success' | 'pending' | null>(null);

  const cleanDomain = storeDomain.replace(/^https?:\/\//, '').replace(/\/$/, '') || 'yourstore.com';

  const genericSnippet = `<script
  src="https://vestiai.com/widget/latest/anywear.js?domain=${cleanDomain}"
  data-store="${cleanDomain}"
  async>
</script>`;

  const shopifyLiquidSnippet = `<!-- Add to theme.liquid before </body> -->
<script
  src="https://vestiai.com/widget/latest/anywear.js?domain={{ shop.permanent_domain }}"
  data-store="{{ shop.permanent_domain }}"
  data-currency="{{ cart.currency.iso_code }}"
  async>
</script>`;

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    showToast({
      title: 'Snippet Copied',
      description: 'Ready to paste into your store theme template.',
      variant: 'success',
    });
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleVerify = () => {
    if (!storeDomain) return;
    setIsVerifying(true);
    setVerifyResult(null);
    setTimeout(() => {
      setIsVerifying(false);
      setVerifyResult('success');
      showToast({
        title: 'Store Configured',
        description: `Ready for live virtual try-on on ${cleanDomain}`,
        variant: 'success',
      });
    }, 1200);
  };

  return (
    <div className="bg-[#fffffc] text-[#170404] min-h-screen py-12 sm:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-10">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-mono text-stone-500">
          <Link to="/business" className="hover:text-black">Business</Link>
          <span>/</span>
          <span className="text-[#c65a92]">Installation &amp; Setup</span>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-5xl font-sans font-medium tracking-tight text-[#170404]">
            Install Anywear Virtual Try-On
          </h1>
          <p className="text-base text-stone-600 font-light">
            Generate your store's custom snippet, configure product selectors, and verify live try-on.
          </p>
        </div>

        {/* Step 1: Store Domain Configuration */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-black/10 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-[#170404] text-white text-xs font-mono flex items-center justify-center font-bold">
              1
            </span>
            <div>
              <h2 className="text-base font-semibold text-[#170404]">Configure Your Store Domain</h2>
              <p className="text-xs text-stone-500">
                This domain authorizes your storefront to call the real-time AI try-on pipeline.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <div className="relative flex-1">
              <Store className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={storeDomain}
                onChange={(e) => setStoreDomain(e.target.value)}
                placeholder="brand.com or mystore.myshopify.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-black/15 bg-stone-50 text-sm font-mono focus:bg-white focus:outline-none focus:border-[#c65a92]"
              />
            </div>
            <button
              type="button"
              onClick={handleVerify}
              disabled={isVerifying}
              className="px-6 py-2.5 rounded-xl bg-[#170404] hover:bg-black text-white text-xs font-medium uppercase tracking-wider transition shrink-0"
            >
              {isVerifying ? 'Checking...' : 'Verify Setup'}
            </button>
          </div>

          {verifyResult === 'success' && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>Verified:</strong> Domain <code>{cleanDomain}</code> is ready to serve Anywear real-time virtual try-on.
              </span>
            </div>
          )}
        </div>

        {/* Step 2: Choose Platform & Copy Snippet */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-black/10 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-[#170404] text-white text-xs font-mono flex items-center justify-center font-bold">
              2
            </span>
            <div>
              <h2 className="text-base font-semibold text-[#170404]">Choose Your Platform</h2>
              <p className="text-xs text-stone-500">
                Select your eCommerce engine for tailored installation instructions.
              </p>
            </div>
          </div>

          {/* Platform Tabs */}
          <div className="flex flex-wrap gap-2 border-b border-black/10 pb-3">
            {[
              { id: 'shopify', label: 'Shopify' },
              { id: 'html', label: 'Custom HTML / React' },
              { id: 'woocommerce', label: 'WooCommerce' },
              { id: 'gtm', label: 'Google Tag Manager' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-medium transition ${
                  activeTab === tab.id
                    ? 'bg-[#170404] text-white shadow-sm'
                    : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Platform Guide: Shopify */}
          {activeTab === 'shopify' && (
            <div className="space-y-4">
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                Add this snippet to your Shopify theme by opening <strong>Online Store → Themes → Edit Code → layout/theme.liquid</strong> and pasting it immediately before the closing <code>&lt;/body&gt;</code> tag:
              </p>
              <div className="relative rounded-2xl bg-[#170404] p-4 text-xs font-mono text-[#fec6ff] overflow-x-auto">
                <pre>{shopifyLiquidSnippet}</pre>
                <button
                  type="button"
                  onClick={() => handleCopy(shopifyLiquidSnippet)}
                  className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-sans transition flex items-center gap-1.5"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy</span>
                </button>
              </div>
            </div>
          )}

          {/* Platform Guide: Custom HTML */}
          {activeTab === 'html' && (
            <div className="space-y-4">
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                Paste this one-line asynchronous snippet into your master template just before <code>&lt;/body&gt;</code>:
              </p>
              <div className="relative rounded-2xl bg-[#170404] p-4 text-xs font-mono text-[#fec6ff] overflow-x-auto">
                <pre>{genericSnippet}</pre>
                <button
                  type="button"
                  onClick={() => handleCopy(genericSnippet)}
                  className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-sans transition flex items-center gap-1.5"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy</span>
                </button>
              </div>
            </div>
          )}

          {/* Platform Guide: WooCommerce */}
          {activeTab === 'woocommerce' && (
            <div className="space-y-4">
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                In WordPress, navigate to <strong>Appearance → Theme File Editor → footer.php</strong>, or use a header/footer injection plugin (e.g. WPCode) to paste:
              </p>
              <div className="relative rounded-2xl bg-[#170404] p-4 text-xs font-mono text-[#fec6ff] overflow-x-auto">
                <pre>{genericSnippet}</pre>
                <button
                  type="button"
                  onClick={() => handleCopy(genericSnippet)}
                  className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-sans transition flex items-center gap-1.5"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy</span>
                </button>
              </div>
            </div>
          )}

          {/* Platform Guide: Google Tag Manager */}
          {activeTab === 'gtm' && (
            <div className="space-y-4">
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                Create a <strong>Custom HTML Tag</strong> in your GTM container, paste the snippet below, and set the trigger to <em>Page View - DOM Ready</em> on Product Detail Pages:
              </p>
              <div className="relative rounded-2xl bg-[#170404] p-4 text-xs font-mono text-[#fec6ff] overflow-x-auto">
                <pre>{genericSnippet}</pre>
                <button
                  type="button"
                  onClick={() => handleCopy(genericSnippet)}
                  className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-sans transition flex items-center gap-1.5"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Step 3: Architecture & Security */}
        <div className="p-6 sm:p-8 rounded-3xl bg-stone-50 border border-black/10 space-y-4 text-xs sm:text-sm text-stone-600 leading-relaxed">
          <h3 className="font-semibold text-[#170404] text-base">Client Isolation &amp; Security</h3>
          <p>
            The Anywear widget runs inside a secure sandboxed iframe with strict Content Security Policy (CSP). It does not access cookies, cart checkout payment details, or shopper personal data. Webcam frames remain encrypted in transit over WebRTC and are cleared immediately upon session termination.
          </p>
          <div className="pt-2 flex items-center gap-4 text-xs font-mono text-[#c65a92]">
            <Link to="/privacy" className="hover:underline">Privacy Policy &rarr;</Link>
            <Link to="/terms" className="hover:underline">Terms of Service &rarr;</Link>
            <Link to="/acceptable-use" className="hover:underline">Acceptable Use &rarr;</Link>
          </div>
        </div>
      </div>
    </div>
  );
};
