import data from "../../../content/municipalities.json";

export type Municipality = { id: string; name: string; url: string; healthAuthority: string };

export const municipalities: Municipality[] = data.municipalities;
export const regionalProgramme = data.regionalProgramme;
export const municipalitiesVerifiedAt = data.verifiedAt;
export const municipality = (id: string) => municipalities.find((m) => m.id === id);
