import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, AlertCircle, ArrowLeft, CheckCircle2, Lock } from 'lucide-react';

export const AcceptableUsePage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-10 text-[#170404]">
      <div className="space-y-3">
        <Link to="/" className="inline-flex items-center text-xs text-stone-500 hover:text-black gap-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>
        <h1 className="text-3xl sm:text-4xl font-sans font-medium tracking-tight">
          Acceptable Use Policy
        </h1>
        <p className="text-sm text-stone-600">
          Responsible AI guidelines and ethical standards for Anywear virtual try-on technology.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-black/10 p-6 sm:p-10 space-y-8 text-sm text-stone-600 leading-relaxed shadow-sm">
        <section className="space-y-3">
          <h2 className="text-lg font-medium text-[#170404] flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#c65a92]" />
            <span>1. Ethical Usage &amp; Consent</span>
          </h2>
          <p>
            You must only submit photographs or live camera streams of yourself or individuals who have given clear, informed, and explicit consent to participate in virtual try-on synthesis. Creating unauthorized depictions of third parties without permission is strictly prohibited.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-medium text-[#170404] flex items-center gap-2">
            <Lock className="w-5 h-5 text-[#c65a92]" />
            <span>2. Prohibited Content &amp; Garments</span>
          </h2>
          <p>
            The Anywear virtual try-on engine is exclusively intended for fashion retail visualization. You agree not to upload or attempt to synthesize:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm text-stone-700">
            <li>Sexually explicit, non-consensual, or pornographic imagery.</li>
            <li>Weapons, violent depictions, or hate symbols.</li>
            <li>Images intended to harass, defame, impersonate, or demean any person.</li>
            <li>Content that infringes upon copyright, trademark, or privacy rights.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-medium text-[#170404] flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-[#c65a92]" />
            <span>3. Automated Abuse &amp; Reverse Engineering</span>
          </h2>
          <p>
            Users and merchants agree not to launch denial-of-service attacks, scrape model weights, reverse-engineer neural diffusion weights, or bypass rate limits on our WebRTC inference servers.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-medium text-[#170404] flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>4. Enforcement &amp; Account Termination</span>
          </h2>
          <p>
            Violations of this policy will result in immediate termination of API access, suspension of merchant domains, and deletion of associated data. To report an abuse concern, please contact{' '}
            <Link to="/privacy" className="text-[#c65a92] underline">privacy &amp; security</Link>.
          </p>
        </section>
      </div>
    </div>
  );
};
