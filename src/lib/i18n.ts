import "server-only";
import { cookies, headers } from "next/headers";

export type Lang = "en" | "pl";
export const LANG_COOKIE = "dmt_lang";

/** Language from the cookie, or the browser's preference on first visit (Polish phones get Polish). */
export async function getLang(): Promise<Lang> {
  const c = (await cookies()).get(LANG_COOKIE)?.value;
  if (c === "pl" || c === "en") return c;
  const accept = (await headers()).get("accept-language") ?? "";
  return /^\s*pl\b/i.test(accept) ? "pl" : "en";
}

export async function getDict() {
  const lang = await getLang();
  return { lang, t: dict[lang] };
}

const en = {
  nav: {
    login: "Log in",
    getStarted: "Get started",
    logout: "Log out",
    account: "Account",
    driver: { jobs: "Find jobs", work: "My work", availability: "Availability", profile: "Profile" },
    driverShort: { jobs: "Jobs", work: "My work", availability: "Availability", profile: "Profile" },
    company: { home: "Dashboard", post: "Post a job", drivers: "Find drivers", company: "Company" },
    companyShort: { home: "Home", post: "Post job", drivers: "Drivers", company: "Company" },
  },
  footer: { tagline: "Drivers • Jobs • Opportunities", how: "How it works", terms: "Terms", privacy: "Privacy", security: "Security" },
  home: {
    deleted: "Your account and data have been deleted. Thanks for trying Drive My Truck.",
    kicker: "Drivers • Jobs • Opportunities",
    h1a: "Right Driver.",
    h1b: "Right Job.",
    h1c: "Right Now.",
    lead: "Drive My Truck connects HGV drivers with transport companies that need reliable, verified drivers — for one-off shifts or permanent roles. Simple. Fast. Fair.",
    ctaDriver: "I'm a Driver →",
    ctaCompany: "I'm a Company →",
    slogan: "Keep Britain Moving",
    example: {
      title: "Class 1 (C+E) driver",
      perShift: "per shift",
      where: "📍 Birmingham · 6 miles away",
      when: "🕒 Tomorrow, 18:00 start · approx 10 h",
      what: "🚛 Trunking · Curtainsider",
      cta: "I'm available →",
      caption: "Example job",
    },
    features: [
      { icon: "🛡️", title: "Verified drivers", text: "Licence, CPC, tacho and right to work checked with official gov.uk services." },
      { icon: "⚡", title: "Shifts & permanent", text: "Post a shift for tomorrow or a permanent role in under a minute." },
      { icon: "⭐", title: "Honest reviews", text: "Drivers rate companies, companies rate drivers. Both ways, after every job." },
      { icon: "💷", title: "No agency mark-up", text: "Drivers set their own rate and keep it. Free for drivers, always." },
    ],
    forDrivers: "For drivers",
    forDriversSub: "Find flexible or permanent work on your terms.",
    driverSteps: [
      "Create your free profile — licence class, area, your rate.",
      "Add your documents once and get the ✓ Verified badge.",
      "Mark the days and hours you're available — or that you want something permanent.",
      "Say “I'm available” to jobs you like, or accept invites.",
    ],
    joinDriver: "Join as a driver",
    forCompanies: "For companies",
    forCompaniesSub: "Get a reliable driver in minutes.",
    companySteps: [
      "Post a shift or a permanent role: class, location, pay.",
      "See available drivers nearby, with reviews and reliability.",
      "Book the driver you want — get their contact details instantly.",
      "After the job, mark it done and leave a review.",
    ],
    postFirst: "Post your first job",
    bottom: "Built for the UK haulage industry. Free for drivers. Free for companies during our launch period.",
    getStartedFree: "Get started — it's free",
    howItWorks: "How it works",
  },
  auth: {
    loginTitle: "Welcome back",
    loginSub: "Log in to find work or book a driver.",
    email: "Email",
    password: "Password",
    forgot: "Forgot password?",
    loginBtn: "Log in",
    loggingIn: "Logging in…",
    newHere: "New here?",
    createFree: "Create a free account",
    registerTitle: "Create your free account",
    registerSub: "Takes about a minute. No agency fees.",
    iAm: "I am…",
    aDriver: "A driver",
    aDriverSub: "Find HGV work",
    aCompany: "A company",
    aCompanySub: "Book drivers",
    name: "Your full name or company name",
    passwordHint: "At least 8 characters",
    postcode: "Postcode",
    postcodeHint: "Where you're based. Used to show work or drivers nearby.",
    agreeA: "I agree to the",
    terms: "terms",
    and: "and",
    privacy: "privacy policy",
    marketing:
      "Send me occasional discounts and offers for drivers & hauliers (e.g. CPC training, insurance, accountants). Optional — you can turn this off any time.",
    createBtn: "Create account",
    creating: "Creating account…",
    haveAccount: "Already have an account?",
    forgotTitle: "Forgot your password?",
    forgotSub: "Enter your email and we'll send you a link to set a new one.",
    sendLink: "Send reset link",
    sending: "Sending…",
    remembered: "Remembered it?",
    backToLogin: "Back to log in",
    resetTitle: "Set a new password",
    newPassword: "New password",
    repeatPassword: "Repeat new password",
    savePassword: "Save new password",
    saving: "Saving…",
    linkMissing: "This link is missing its code.",
    requestNew: "Request a new link",
  },
};

export type Dict = typeof en;

const pl: Dict = {
  nav: {
    login: "Zaloguj",
    getStarted: "Załóż konto",
    logout: "Wyloguj",
    account: "Konto",
    driver: { jobs: "Oferty", work: "Moja praca", availability: "Dostępność", profile: "Profil" },
    driverShort: { jobs: "Oferty", work: "Praca", availability: "Dostępność", profile: "Profil" },
    company: { home: "Panel", post: "Dodaj zlecenie", drivers: "Kierowcy", company: "Firma" },
    companyShort: { home: "Panel", post: "Dodaj", drivers: "Kierowcy", company: "Firma" },
  },
  footer: { tagline: "Kierowcy • Praca • Możliwości", how: "Jak to działa", terms: "Regulamin", privacy: "Prywatność", security: "Bezpieczeństwo" },
  home: {
    deleted: "Twoje konto i dane zostały usunięte. Dzięki, że wypróbowałeś Drive My Truck.",
    kicker: "Kierowcy • Praca • Możliwości",
    h1a: "Właściwy kierowca.",
    h1b: "Właściwa praca.",
    h1c: "Od razu.",
    lead: "Drive My Truck łączy kierowców HGV z firmami transportowymi, które potrzebują sprawdzonych kierowców — na pojedyncze zmiany albo na stałe. Prosto. Szybko. Uczciwie.",
    ctaDriver: "Jestem kierowcą →",
    ctaCompany: "Jestem firmą →",
    slogan: "Keep Britain Moving",
    example: {
      title: "Kierowca Class 1 (C+E)",
      perShift: "za zmianę",
      where: "📍 Birmingham · 6 mil od Ciebie",
      when: "🕒 Jutro, start 18:00 · ok. 10 h",
      what: "🚛 Trunking · Curtainsider",
      cta: "Jestem dostępny →",
      caption: "Przykładowe zlecenie",
    },
    features: [
      { icon: "🛡️", title: "Sprawdzeni kierowcy", text: "Prawo jazdy, CPC, tacho i prawo do pracy weryfikowane w oficjalnych serwisach gov.uk." },
      { icon: "⚡", title: "Zmiany i praca na stałe", text: "Zmiana na jutro albo etat — ogłoszenie dodasz w minutę." },
      { icon: "⭐", title: "Uczciwe opinie", text: "Kierowcy oceniają firmy, firmy oceniają kierowców — po każdym zleceniu." },
      { icon: "💷", title: "Bez marży agencji", text: "Kierowca sam ustala stawkę i bierze ją w całości. Dla kierowców zawsze za darmo." },
    ],
    forDrivers: "Dla kierowców",
    forDriversSub: "Praca dorywcza albo na stałe — na Twoich warunkach.",
    driverSteps: [
      "Załóż darmowy profil — kategoria, okolica, Twoja stawka.",
      "Wpisz dokumenty raz i zdobądź odznakę ✓ Verified.",
      "Zaznacz dni i godziny, kiedy możesz pracować — albo że szukasz pracy na stałe.",
      "Zgłaszaj się do zleceń, które Ci pasują, albo przyjmuj zaproszenia.",
    ],
    joinDriver: "Dołącz jako kierowca",
    forCompanies: "Dla firm",
    forCompaniesSub: "Sprawdzony kierowca w kilka minut.",
    companySteps: [
      "Dodaj zmianę albo pracę na stałe: kategoria, miejsce, stawka.",
      "Zobacz dostępnych kierowców w okolicy, z opiniami i niezawodnością.",
      "Zarezerwuj kierowcę — od razu dostajesz jego kontakt.",
      "Po zleceniu oznacz je jako wykonane i wystaw opinię.",
    ],
    postFirst: "Dodaj pierwsze zlecenie",
    bottom: "Stworzone dla branży transportowej w UK. Za darmo dla kierowców. Za darmo dla firm w okresie startowym.",
    getStartedFree: "Załóż konto — za darmo",
    howItWorks: "Jak to działa",
  },
  auth: {
    loginTitle: "Witaj ponownie",
    loginSub: "Zaloguj się, żeby znaleźć pracę albo zarezerwować kierowcę.",
    email: "E-mail",
    password: "Hasło",
    forgot: "Nie pamiętasz hasła?",
    loginBtn: "Zaloguj",
    loggingIn: "Logowanie…",
    newHere: "Pierwszy raz?",
    createFree: "Załóż darmowe konto",
    registerTitle: "Załóż darmowe konto",
    registerSub: "Zajmie Ci to minutę. Bez opłat agencyjnych.",
    iAm: "Jestem…",
    aDriver: "Kierowcą",
    aDriverSub: "Szukam pracy HGV",
    aCompany: "Firmą",
    aCompanySub: "Szukam kierowców",
    name: "Imię i nazwisko albo nazwa firmy",
    passwordHint: "Minimum 8 znaków",
    postcode: "Kod pocztowy",
    postcodeHint: "Gdzie mieszkasz / masz bazę. Pokażemy pracę albo kierowców w okolicy.",
    agreeA: "Akceptuję",
    terms: "regulamin",
    and: "i",
    privacy: "politykę prywatności",
    marketing:
      "Chcę czasem dostawać zniżki i oferty dla kierowców i przewoźników (np. szkolenia CPC, ubezpieczenia, księgowi). Dobrowolne — możesz to wyłączyć w każdej chwili.",
    createBtn: "Załóż konto",
    creating: "Zakładanie konta…",
    haveAccount: "Masz już konto?",
    forgotTitle: "Nie pamiętasz hasła?",
    forgotSub: "Wpisz swój e-mail, a wyślemy Ci link do ustawienia nowego hasła.",
    sendLink: "Wyślij link",
    sending: "Wysyłanie…",
    remembered: "Przypomniałeś sobie?",
    backToLogin: "Wróć do logowania",
    resetTitle: "Ustaw nowe hasło",
    newPassword: "Nowe hasło",
    repeatPassword: "Powtórz nowe hasło",
    savePassword: "Zapisz nowe hasło",
    saving: "Zapisywanie…",
    linkMissing: "W tym linku brakuje kodu.",
    requestNew: "Poproś o nowy link",
  },
};

const dict: Record<Lang, Dict> = { en, pl };

/** Inline translation for one-off messages (e.g. form errors in server actions). */
export async function tr(en: string, pl: string) {
  return (await getLang()) === "pl" ? pl : en;
}
