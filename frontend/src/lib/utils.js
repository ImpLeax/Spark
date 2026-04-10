import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function calculateAge(birthDate) {
  if (!birthDate) return null;
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export function parseLocation(locationStr) {
  if (!locationStr) return null;

  const match = locationStr.match(/\(([^)]+)\)/);

  if (match) {
    const coords = match[1].split(' ');
    return {
      lng: parseFloat(coords[0]),
      lat: parseFloat(coords[1])
    };
  }
  return null;
}
