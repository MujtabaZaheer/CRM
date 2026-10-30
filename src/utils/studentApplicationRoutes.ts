import { Programme, University } from "../types/university";

export const STUDENT_APPLICATION_PATH = "/student/new-application";

export interface StudentApplicationRouteValues {
  universityId: string;
  programmeId: string;
  applicationId: string;
  intake: string;
}

export interface StudentApplicationRouteParams {
  programmeId?: string;
  applicationId?: string;
  id?: string;
}

export interface StudentApplicationReference {
  universityId?: string;
  programmeId?: string;
  universityName?: string;
  programmeName?: string;
}

export const getStudentApplicationRouteValues = (
  searchParams: URLSearchParams,
  params: StudentApplicationRouteParams = {},
): StudentApplicationRouteValues => ({
  universityId: searchParams.get("universityId") || "",
  programmeId: searchParams.get("programmeId") || params.programmeId || params.id || "",
  applicationId: searchParams.get("applicationId") || params.applicationId || "",
  intake: searchParams.get("intake") || "",
});

export const buildStudentApplicationPath = (
  values: Partial<StudentApplicationRouteValues>,
): string => {
  const query = new URLSearchParams();
  (["universityId", "programmeId", "applicationId", "intake"] as const).forEach((key) => {
    const value = values[key];
    if (value) query.set(key, value);
  });

  const queryString = query.toString();
  return `${STUDENT_APPLICATION_PATH}${queryString ? `?${queryString}` : ""}`;
};

export const resolveStudentApplicationTarget = (
  universities: University[],
  routeValues: StudentApplicationRouteValues,
  application?: StudentApplicationReference | null,
): { university: University; programme: Programme } | null => {
  const applicationUniversityId = application?.universityId || "";
  const applicationProgrammeId = application?.programmeId || "";

  if (application && !applicationUniversityId && !applicationProgrammeId) return null;
  if (routeValues.universityId && applicationUniversityId && routeValues.universityId !== applicationUniversityId) return null;
  if (routeValues.programmeId && applicationProgrammeId && routeValues.programmeId !== applicationProgrammeId) return null;

  const universityId = routeValues.universityId || applicationUniversityId;
  const programmeId = routeValues.programmeId || applicationProgrammeId;
  if (!programmeId) return null;

  const university = universities.find((item) => {
    if (universityId && item.id !== universityId) return false;
    return item.programmes?.some((programme) => programme.id === programmeId) ||
      (!!application?.universityName && item.name.toLowerCase() === application.universityName.toLowerCase());
  });
  if (!university) return null;

  const programme = university.programmes?.find((item) =>
    item.id === programmeId ||
    (!!application?.programmeName && item.title.toLowerCase() === application.programmeName.toLowerCase()),
  );
  return programme ? { university, programme } : null;
};
