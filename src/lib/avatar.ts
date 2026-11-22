/** Public URL of a user's photo, or null if they haven't uploaded one. Versioned so browsers can cache forever. */
export function avatarUrl(user: { id: string; avatarVersion: number } | null | undefined) {
  if (!user || !user.avatarVersion) return null;
  return `/api/avatar/${user.id}?v=${user.avatarVersion}`;
}
