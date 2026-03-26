export function Footer() {
  return (
    <footer className="bg-surface-container-low border-t border-outline-variant/30 relative overflow-hidden pt-24 pb-12">
      <div className="absolute -bottom-20 -left-20 text-[20rem] font-black text-on-surface/[0.02] pointer-events-none select-none font-headline leading-none">
        Aura
      </div>
      <div className="max-w-7xl mx-auto px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12 lg:gap-8 mb-24">
          <div className="lg:col-span-2 space-y-8">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white shrink-0">
                <span
                  className="material-symbols-outlined"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  emergency
                </span>
              </div>
              <span className="text-2xl font-bold tracking-tight text-on-surface font-headline">
                AuraHealth
              </span>
            </div>
            <p className="text-on-surface-variant text-lg leading-relaxed max-w-sm">
              Eliminating financial barriers to emergency healthcare through
              technology and trust.
            </p>
            <div className="flex gap-4">
              <a
                className="w-10 h-10 rounded-full border border-outline-variant flex items-center justify-center hover:bg-white transition-colors"
                href="#"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"></path>
                </svg>
              </a>
              <a
                className="w-10 h-10 rounded-full border border-outline-variant flex items-center justify-center hover:bg-white transition-colors"
                href="#"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"></path>
                </svg>
              </a>
            </div>
          </div>
          <div>
            <h4 className="font-bold text-on-surface mb-6">Product</h4>
            <ul className="space-y-4 text-on-surface-variant font-medium text-sm">
              <li>
                <a className="hover:text-primary transition-colors" href="#">
                  Patient App
                </a>
              </li>
              <li>
                <a className="hover:text-primary transition-colors" href="#">
                  Hospital Dashboard
                </a>
              </li>
              <li>
                <a className="hover:text-primary transition-colors" href="#">
                  Voice Triage AI
                </a>
              </li>
              <li>
                <a className="hover:text-primary transition-colors" href="#">
                  Escrow Engine
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-on-surface mb-6">Solutions</h4>
            <ul className="space-y-4 text-on-surface-variant font-medium text-sm">
              <li>
                <a className="hover:text-primary transition-colors" href="#">
                  Private Clinics
                </a>
              </li>
              <li>
                <a className="hover:text-primary transition-colors" href="#">
                  State Hospitals
                </a>
              </li>
              <li>
                <a className="hover:text-primary transition-colors" href="#">
                  Corporate Health
                </a>
              </li>
              <li>
                <a className="hover:text-primary transition-colors" href="#">
                  Partnerships
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-on-surface mb-6">Company</h4>
            <ul className="space-y-4 text-on-surface-variant font-medium text-sm">
              <li>
                <a className="hover:text-primary transition-colors" href="#">
                  About Us
                </a>
              </li>
              <li>
                <a className="hover:text-primary transition-colors" href="#">
                  Our Mission
                </a>
              </li>
              <li>
                <a className="hover:text-primary transition-colors" href="#">
                  Press Room
                </a>
              </li>
              <li>
                <a className="hover:text-primary transition-colors" href="#">
                  Careers
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-on-surface mb-6">Legal</h4>
            <ul className="space-y-4 text-on-surface-variant font-medium text-sm">
              <li>
                <a className="hover:text-primary transition-colors" href="#">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a className="hover:text-primary transition-colors" href="#">
                  Terms of Service
                </a>
              </li>
              <li>
                <a className="hover:text-primary transition-colors" href="#">
                  Cookie Policy
                </a>
              </li>
              <li>
                <a className="hover:text-primary transition-colors" href="#">
                  Data Processing
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="pt-12 border-t border-outline-variant/30 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-sm font-medium text-on-surface-variant">
            © 2024 AuraHealth Technologies. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
              Powered by
            </span>
            <div className="flex items-center gap-1">
              <div className="w-5 h-5 rounded-[2px] bg-red-600 flex items-center justify-center text-[8px] text-white font-black">
                IS
              </div>
              <span className="text-xs font-bold text-on-surface">
                Interswitch
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
