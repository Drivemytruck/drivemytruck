import Link from "next/link";
import type { Metadata } from "next";
import { getLang } from "@/lib/i18n";

export const metadata: Metadata = { title: "How it works" };

const content = {
  en: {
    title: "How Drive My Truck works",
    intro:
      "Drive My Truck is a simple marketplace connecting HGV drivers looking for extra, ad-hoc or permanent work with transport companies that need a driver — often at short notice.",
    faqs: [
      {
        q: "Is it only for one-off shifts?",
        a: "No. Companies can post one-off shifts or permanent / regular roles, and drivers can mark themselves as open to permanent work. Permanent adverts stay live for 14 days and can be renewed.",
      },
      {
        q: "How much does it cost?",
        a: "Drivers never pay to find work. Companies use Drive My Truck free during our launch period; if we introduce fees for companies later, we'll announce them at least 30 days in advance.",
      },
      {
        q: "Who pays the driver?",
        a: "The company pays the driver directly, as agreed between them (e.g. PAYE, the driver's limited company, self-employed or umbrella). Drive My Truck is an introduction platform and isn't the driver's employer.",
      },
      {
        q: "How are drivers verified?",
        a: "Drivers give us a DVLA licence check code and their CPC, tacho card and right-to-work details. We check them with official gov.uk services before showing the ✓ Verified badge. We never ask for photos of documents.",
      },
      {
        q: "How do reviews work?",
        a: "After a completed job, both sides can leave a 1–5 star review. Reviews are blind — neither side sees the other's until both have posted, or 14 days have passed — so they stay honest.",
      },
      {
        q: "What happens if a driver doesn't turn up?",
        a: "The company can report a no-show, which appears on the driver's profile. Drivers can dispute it. After 3 no-shows a driver's account is suspended. Late cancellations (less than 24h) are shown for both drivers and companies.",
      },
      {
        q: "What about drivers' hours?",
        a: "Drivers must make sure they've had their legal rest and stay within driving and working time limits, including hours worked for other operators. Companies remain responsible for drivers' hours compliance on their operator licence.",
      },
      {
        q: "What about insurance?",
        a: "The company's fleet insurance must cover the driver. Companies should list any insurer requirements (e.g. minimum age or maximum points) in the job's requirements.",
      },
    ],
    contactTitle: "Questions or feedback?",
    contact: "Help, feedback, partnerships & agencies:",
    cta: "Create a free account",
  },
  pl: {
    title: "Jak działa Drive My Truck",
    intro:
      "Drive My Truck to prosty serwis, który łączy kierowców HGV szukających pracy dorywczej, dodatkowej albo na stałe z firmami transportowymi, które potrzebują kierowcy — często na już.",
    faqs: [
      {
        q: "Czy to tylko pojedyncze zmiany?",
        a: "Nie. Firmy mogą dodawać pojedyncze zmiany albo pracę na stałe, a kierowcy mogą zaznaczyć, że szukają pracy na stałe. Ogłoszenia o pracę na stałe są aktywne 14 dni i można je przedłużyć.",
      },
      {
        q: "Ile to kosztuje?",
        a: "Kierowcy nigdy nie płacą za szukanie pracy. Firmy korzystają za darmo w okresie startowym; jeśli kiedyś wprowadzimy opłaty dla firm, zapowiemy je co najmniej 30 dni wcześniej.",
      },
      {
        q: "Kto płaci kierowcy?",
        a: "Firma płaci kierowcy bezpośrednio, tak jak się umówią (np. PAYE, Ltd kierowcy, self-employed albo umbrella). Drive My Truck łączy strony i nie jest pracodawcą kierowcy.",
      },
      {
        q: "Jak weryfikujecie kierowców?",
        a: "Kierowca podaje kod DVLA do sprawdzenia prawa jazdy oraz dane CPC, karty tacho i prawa do pracy. Sprawdzamy je w oficjalnych serwisach gov.uk i dopiero wtedy pokazujemy odznakę ✓ Verified. Nigdy nie prosimy o zdjęcia dokumentów.",
      },
      {
        q: "Jak działają opinie?",
        a: "Po wykonanym zleceniu obie strony mogą wystawić ocenę 1–5 gwiazdek. Opinie są „w ciemno” — nikt nie widzi opinii drugiej strony, dopóki obie nie zostaną wystawione albo nie minie 14 dni — dzięki temu są uczciwe.",
      },
      {
        q: "Co jeśli kierowca nie przyjedzie?",
        a: "Firma może zgłosić no-show, który pojawia się na profilu kierowcy. Kierowca może się odwołać. Po 3 no-showach konto zostaje zablokowane. Odwołania w ostatniej chwili (poniżej 24 h) są widoczne zarówno u kierowców, jak i u firm.",
      },
      {
        q: "A czas pracy kierowcy?",
        a: "Kierowca musi mieć wymagany odpoczynek i mieścić się w limitach czasu jazdy i pracy — także licząc pracę u innych przewoźników. Za zgodność z przepisami na swojej licencji operatora odpowiada firma.",
      },
      {
        q: "A ubezpieczenie?",
        a: "Kierowca musi być objęty ubezpieczeniem floty firmy. Firmy powinny wpisać wymagania ubezpieczyciela (np. minimalny wiek, maksymalna liczba punktów) w wymaganiach zlecenia.",
      },
    ],
    contactTitle: "Pytania albo uwagi?",
    contact: "Pomoc, uwagi, współpraca i agencje:",
    cta: "Załóż darmowe konto",
  },
};

export default async function HowItWorks() {
  const c = content[await getLang()];
  return (
    <div className="page max-w-3xl space-y-6">
      <h1 className="h1">{c.title}</h1>
      <p className="text-slate-700">{c.intro}</p>
      <div className="space-y-3">
        {c.faqs.map((f) => (
          <details key={f.q} className="card group p-5" open>
            <summary className="cursor-pointer list-none font-bold text-navy-900">{f.q}</summary>
            <p className="mt-2 text-slate-700">{f.a}</p>
          </details>
        ))}
      </div>
      <div className="card p-5">
        <h2 className="h2">{c.contactTitle}</h2>
        <p className="mt-1 text-slate-700">
          {c.contact}{" "}
          <a className="font-semibold text-brand-600 underline" href="mailto:hello@drivemytruck.co.uk">
            hello@drivemytruck.co.uk
          </a>
        </p>
      </div>
      <Link href="/register" className="btn-primary">
        {c.cta}
      </Link>
    </div>
  );
}
