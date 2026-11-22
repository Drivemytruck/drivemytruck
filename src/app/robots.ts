import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: "*", allow: ["/", "/how-it-works", "/terms", "/privacy"], disallow: ["/driver", "/company", "/admin", "/bookings", "/jobs", "/drivers", "/companies"] }] };
}
