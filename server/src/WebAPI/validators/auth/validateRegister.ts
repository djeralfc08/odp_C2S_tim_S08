import { ValidationResult } from "../../../Domain/types/ValidationResult";

export type RegisterBody = {
  gamer_tag?: string;
  username?: string;
  full_name?: string;
  email?: string;
  password?: string;
  profile_image?: string | null;
};

export const validateGamerTag = (tag: string): ValidationResult => {
  const t = tag.trim();
  if (!t || t.length < 3 || t.length > 30 || !/^[a-zA-Z0-9._-]+$/.test(t)) {
    return { valid: false, message: "Gamer tag je zauzet ili nije validan" };
  }
  return { valid: true };
};

export const validateRegister = (body: RegisterBody): ValidationResult => {
  const gamerTag = (body.gamer_tag ?? body.username ?? "").trim();
  const tagCheck = validateGamerTag(gamerTag);
  if (!tagCheck.valid) return tagCheck;

  const email = body.email?.trim() ?? "";
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { valid: false, message: "Email je već zauzet" };
  }

  const password = body.password ?? "";
  if (!password || password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
    return { valid: false, message: "Lozinka ne ispunjava uslove" };
  }

  const fullName = body.full_name?.trim() ?? "";
  if (fullName && fullName.length > 120) {
    return { valid: false, message: "Puno ime može imati najviše 120 karaktera" };
  }

  const image = body.profile_image;
  if (image && image.length > 500_000) {
    return { valid: false, message: "Profilna slika je prevelika" };
  }

  return { valid: true };
};
