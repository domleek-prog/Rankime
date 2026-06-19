// Plain-English Privacy Policy and Terms for Rankime. Rendered both pre-login
// (AuthPage) and post-login (MainApp), so it's a content-only component.

const EFFECTIVE = '19 June 2026';
const CONTACT = 'domleek@hotmail.co.uk';

function H({ children }) {
  return <h3 className="text-white font-semibold text-sm mt-5 mb-1.5" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}>{children}</h3>;
}
function P({ children }) {
  return <p className="text-white/55 text-sm leading-relaxed mb-2">{children}</p>;
}
function LI({ children }) {
  return <li className="text-white/55 text-sm leading-relaxed mb-1">{children}</li>;
}

function Privacy() {
  return (
    <div>
      <P><span className="text-white/35">Last updated: {EFFECTIVE}</span></P>
      <P>This policy explains what personal data Rankime ("we", "the app") collects, why, and your rights over it. Rankime is a free, non-commercial fan project operated by an individual based in the United Kingdom. For any privacy question or request, contact <span className="text-violet-300">{CONTACT}</span>.</P>

      <H>What we collect</H>
      <ul className="list-disc pl-5">
        <LI><b className="text-white/70">Account data</b> — your email address, display name, and a securely hashed (bcrypt) version of your password. We never store your password in plain text.</LI>
        <LI><b className="text-white/70">Your content</b> — the anime you add to your leaderboard, categories, and watched list.</LI>
        <LI><b className="text-white/70">Technical data</b> — a single essential login cookie, and standard server/network logs (including IP address) kept by our hosting and network providers for security and reliability.</LI>
      </ul>

      <H>How we use it</H>
      <P>Solely to provide the service: to create and secure your account, keep you logged in, and store and display your lists. We do not sell your data, show ads, or use third-party tracking or analytics.</P>

      <H>Legal basis (UK GDPR)</H>
      <P>We process your account and content data to perform our agreement to provide you the service, and we rely on our legitimate interest in keeping the service secure for technical/log data.</P>

      <H>Cookies</H>
      <P>We use one strictly-necessary cookie to keep you signed in. It is httpOnly and secure, and is not used for tracking. Because it is essential to the service, no consent banner is required.</P>

      <H>Third parties</H>
      <P>We share data only with the providers that run the app: <b className="text-white/70">Railway</b> (hosting/database) and <b className="text-white/70">Cloudflare</b> (DNS, security, content delivery). When you search for anime, your search term is sent to <b className="text-white/70">AniList</b> to fetch results. These providers may process data outside the UK under appropriate safeguards.</P>

      <H>Retention</H>
      <P>We keep your account and content until you delete your account, after which it is removed from our database. Provider logs are retained per their own schedules.</P>

      <H>Your rights</H>
      <P>Under UK GDPR you can access, correct, export, or delete your data, and object to or restrict processing. You can delete your account and all associated data at any time from your Profile page. To exercise any other right, email {CONTACT}. You also have the right to complain to the UK Information Commissioner's Office (ICO).</P>

      <H>Security</H>
      <P>Passwords are hashed with bcrypt and all traffic is served over HTTPS. No system is perfectly secure, but we take reasonable measures to protect your data.</P>

      <H>Children</H>
      <P>Rankime is not directed at children under 13, and we do not knowingly collect their data.</P>

      <H>Changes</H>
      <P>We may update this policy; material changes will be reflected by the "last updated" date above.</P>
    </div>
  );
}

function Terms() {
  return (
    <div>
      <P><span className="text-white/35">Last updated: {EFFECTIVE}</span></P>
      <P>By creating an account or using Rankime, you agree to these terms. If you do not agree, please do not use the app.</P>

      <H>The service</H>
      <P>Rankime is a free, non-commercial fan project that lets you build and rank personal anime lists. It is provided "as is", with no guarantee of availability, and may change or be discontinued at any time.</P>

      <H>Your account</H>
      <P>You are responsible for keeping your login details secure and for activity under your account. Provide accurate information when signing up. You must be at least 13 years old to use Rankime.</P>

      <H>Acceptable use</H>
      <ul className="list-disc pl-5">
        <LI>Don't abuse, overload, scrape, or attempt to disrupt or gain unauthorised access to the service.</LI>
        <LI>Don't use the app for unlawful purposes or to infringe others' rights.</LI>
        <LI>Don't impersonate others or submit content you have no right to use.</LI>
      </ul>

      <H>Anime data &amp; AniList</H>
      <P>Anime titles, descriptions, and cover images are provided by AniList and remain the property of their respective owners. Rankime is an independent fan project and is not affiliated with, endorsed by, or sponsored by AniList or any rights holder.</P>

      <H>Availability &amp; liability</H>
      <P>To the fullest extent permitted by law, Rankime is provided without warranties and we are not liable for any loss arising from use of, or inability to use, the service — including loss of your lists or data. Nothing in these terms limits liability that cannot be excluded by law.</P>

      <H>Termination</H>
      <P>You may delete your account at any time from your Profile page. We may suspend or remove accounts that breach these terms or abuse the service.</P>

      <H>Governing law</H>
      <P>These terms are governed by the laws of England and Wales.</P>

      <H>Contact</H>
      <P>Questions about these terms? Email <span className="text-violet-300">{CONTACT}</span>.</P>
    </div>
  );
}

export default function LegalContent({ doc }) {
  return (
    <div className="pb-6">
      {doc === 'terms' ? <Terms /> : <Privacy />}
      <p className="text-white/25 text-xs leading-relaxed mt-8 pt-4 border-t border-white/5">
        Anime data and images provided by AniList. Rankime is not affiliated with or endorsed by AniList.
      </p>
    </div>
  );
}
