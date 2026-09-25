export interface SwapiSpeciesDto {
  swapiId: string;
  name: string;
  classification: string | null;
  designation: string | null;
  averageHeight: string | null;
  skinColors: string | null;
  hairColors: string | null;
  eyeColors: string | null;
  averageLifespan: number | null;
  language: string | null;
  homeworldSwapiId: string | null;
}
