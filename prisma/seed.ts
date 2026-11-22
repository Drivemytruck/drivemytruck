/**
 * Demo data for local development: `npm run db:seed`
 * All demo accounts use the password "password123".
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const places = {
  birmingham: { postcode: "B1 1AA", town: "Birmingham", lat: 52.4796, lng: -1.9026 },
  coventry: { postcode: "CV1 1AA", town: "Coventry", lat: 52.4081, lng: -1.5106 },
  wolverhampton: { postcode: "WV1 1AA", town: "Wolverhampton", lat: 52.5862, lng: -2.1288 },
  walsall: { postcode: "WS1 1AA", town: "Walsall", lat: 52.5862, lng: -1.9829 },
  leicester: { postcode: "LE1 1AA", town: "Leicester", lat: 52.6369, lng: -1.1398 },
};

function at(daysFromNow: number, hour: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + daysFromNow);
  d.setUTCHours(hour, 0, 0, 0);
  return d;
}

async function main() {
  if (process.env.NODE_ENV === "production") throw new Error("Refusing to seed production");
  await db.reliabilityEvent.deleteMany();
  await db.review.deleteMany();
  await db.booking.deleteMany();
  await db.application.deleteMany();
  await db.job.deleteMany();
  await db.availability.deleteMany();
  await db.driverDocument.deleteMany();
  await db.driverProfile.deleteMany();
  await db.companyProfile.deleteMany();
  await db.user.deleteMany();

  const passwordHash = await bcrypt.hash("password123", 10);

  await db.user.create({ data: { email: "admin@drivemytruck.test", passwordHash, role: "ADMIN" } });

  const mkDriver = async (email: string, fullName: string, place: keyof typeof places, extra: object) =>
    db.user.create({
      data: {
        email,
        passwordHash,
        role: "DRIVER",
        driver: { create: { fullName, ...places[place], ...extra } as never },
      },
      include: { driver: true },
    });

  const alex = await mkDriver("alex@drivemytruck.test", "Alex Turner", "birmingham", {
    phone: "07700 900123",
    licenceClasses: ["C+E"],
    skills: ["ADR", "Nights", "Trunking"],
    experienceYears: 9,
    rateType: "SHIFT",
    rateAmount: 25000,
    bio: "Class 1 driver, 9 years trunking and general haulage. Clean licence, happy with nights.",
    availableToday: true,
    verificationStatus: "VERIFIED",
    travelRadiusMiles: 40,
  });
  const sophie = await mkDriver("sophie@drivemytruck.test", "Sophie Green", "coventry", {
    licenceClasses: ["C+E"],
    skills: ["Multi-drop", "Fridge / Reefer"],
    experienceYears: 4,
    rateType: "HOURLY",
    rateAmount: 2000,
    verificationStatus: "VERIFIED",
  });
  const marcus = await mkDriver("marcus@drivemytruck.test", "Marcus Bell", "wolverhampton", {
    licenceClasses: ["C"],
    skills: ["HIAB", "Multi-drop"],
    experienceYears: 6,
    rateType: "SHIFT",
    rateAmount: 18000,
    availableToday: true,
  });

  for (const d of [alex.driver!, sophie.driver!]) {
    await db.driverDocument.createMany({
      data: [
        { driverId: d.id, type: "LICENCE", reference: "TURNE801", checkCode: "Ab Cd Ef Gh", status: "VERIFIED" },
        { driverId: d.id, type: "CPC", reference: "DQC123456", expiresAt: at(600, 0), status: "VERIFIED" },
        { driverId: d.id, type: "TACHO", reference: "DB12345678901234", expiresAt: at(900, 0), status: "VERIFIED" },
        { driverId: d.id, type: "RIGHT_TO_WORK", reference: "British/Irish passport", status: "VERIFIED" },
      ],
    });
  }
  await db.driverDocument.create({ data: { driverId: marcus.driver!.id, type: "LICENCE", reference: "BELLM702", checkCode: "Xy Zz 12 34" } });

  for (let i = 0; i < 14; i++) {
    const date = new Date(at(i, 0).toISOString().slice(0, 10) + "T00:00:00Z");
    if (i % 2 === 0) await db.availability.create({ data: { driverId: alex.driver!.id, date, startTime: "16:00", endTime: "06:00", rateAmount: 26000, rateType: "SHIFT" } });
    if (i % 3 !== 0) await db.availability.create({ data: { driverId: sophie.driver!.id, date, startTime: "05:00", endTime: "17:00" } });
    if (i < 5) await db.availability.create({ data: { driverId: marcus.driver!.id, date } });
  }

  const mkCompany = (email: string, companyName: string, place: keyof typeof places, extra: object = {}) =>
    db.user.create({
      data: { email, passwordHash, role: "COMPANY", company: { create: { companyName, ...places[place], ...extra } } },
      include: { company: true },
    });

  const midlands = await mkCompany("midlands@drivemytruck.test", "Midlands Freight Ltd", "birmingham", {
    contactName: "Dave",
    phone: "0121 496 0000",
    companiesHouseNumber: "01234567",
    about: "Family-run haulier, 40 trucks, mostly trunking and general haulage across the Midlands and the North.",
    verificationStatus: "VERIFIED",
  });
  const rapid = await mkCompany("rapid@drivemytruck.test", "Rapid Logistics", "coventry", { phone: "024 7696 0000" });

  const job = (companyId: string, place: keyof typeof places, data: object) =>
    db.job.create({ data: { companyId, ...places[place], durationHours: 10, payType: "SHIFT", ...data } as never });

  await job(midlands.company!.id, "birmingham", {
    licenceClass: "C+E",
    startAt: at(1, 18),
    payAmount: 25000,
    jobType: "Trunking",
    vehicleType: "Curtainsider",
    description: "Night trunk Birmingham → Leeds and back. Modern fleet, auto gearbox.",
    requirements: "Insurance: age 25+, max 6 points.",
  });
  await job(midlands.company!.id, "walsall", { licenceClass: "C+E", startAt: at(2, 6), payAmount: 22000, jobType: "General haulage", vehicleType: "Curtainsider" });
  const rapidJob = await job(rapid.company!.id, "coventry", {
    licenceClass: "C",
    startAt: at(1, 6),
    durationHours: 8,
    payAmount: 18000,
    jobType: "Multi-drop",
    vehicleType: "Box",
  });
  await job(rapid.company!.id, "leicester", { licenceClass: "C+E", startAt: at(3, 5), payType: "HOURLY", payAmount: 2100, jobType: "Container" });

  await db.application.create({ data: { jobId: rapidJob.id, driverId: marcus.driver!.id, message: "Can start at 5:30 if needed." } });

  // A completed past job with reviews from both sides.
  const past = await job(midlands.company!.id, "birmingham", { licenceClass: "C+E", startAt: at(-5, 18), payAmount: 24000, status: "COMPLETED", jobType: "Trunking" });
  await db.application.create({ data: { jobId: past.id, driverId: alex.driver!.id, status: "ACCEPTED" } });
  const booking = await db.booking.create({
    data: { jobId: past.id, driverId: alex.driver!.id, companyId: midlands.company!.id, status: "COMPLETED", completedAt: at(-4, 8) },
  });
  await db.review.createMany({
    data: [
      { bookingId: booking.id, authorId: midlands.id, subjectId: alex.id, rating: 5, comment: "Spot on — on time, professional, will book again." },
      { bookingId: booking.id, authorId: alex.id, subjectId: midlands.id, rating: 5, comment: "Good truck, paid on time, friendly transport office." },
    ],
  });

  // A confirmed job that started yesterday (Rapid + Marcus) — used to test no-show reporting.
  const ydayJob = await job(rapid.company!.id, "wolverhampton", { licenceClass: "C", startAt: at(-1, 6), payAmount: 17000, status: "FILLED" });
  await db.application.create({ data: { jobId: ydayJob.id, driverId: marcus.driver!.id, status: "ACCEPTED" } });
  await db.booking.create({ data: { jobId: ydayJob.id, driverId: marcus.driver!.id, companyId: rapid.company!.id } });

  // A confirmed job starting in 3 hours (Midlands + Sophie) — cancelling it now is a late cancellation.
  const soonJob = await db.job.create({
    data: { companyId: midlands.company!.id, ...places.coventry, licenceClass: "C+E", startAt: new Date(Date.now() + 3 * 3600000), durationHours: 9, payAmount: 23000, status: "FILLED" },
  });
  await db.application.create({ data: { jobId: soonJob.id, driverId: sophie.driver!.id, status: "ACCEPTED" } });
  await db.booking.create({ data: { jobId: soonJob.id, driverId: sophie.driver!.id, companyId: midlands.company!.id } });

  console.log("Seeded. Log in with e.g. alex@drivemytruck.test / midlands@drivemytruck.test / admin@drivemytruck.test — password: password123");
}

main().finally(() => db.$disconnect());
