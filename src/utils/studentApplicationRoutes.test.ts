import { describe, expect, it } from "vitest";
import { DEMO_UNIVERSITIES } from "../data/demoData";
import {
  buildStudentApplicationPath,
  getStudentApplicationRouteValues,
  resolveStudentApplicationTarget,
} from "./studentApplicationRoutes";

describe("student application routes", () => {
  it("extracts canonical and compatibility route parameters", () => {
    const values = getStudentApplicationRouteValues(
      new URLSearchParams("universityId=univ_oxf&programmeId=prog_ox_cs&applicationId=app_1&intake=September%202026"),
      { programmeId: "route-programme", applicationId: "route-application" },
    );

    expect(values).toEqual({
      universityId: "univ_oxf",
      programmeId: "prog_ox_cs",
      applicationId: "app_1",
      intake: "September 2026",
    });
  });

  it("builds the canonical path without dropping application context", () => {
    expect(buildStudentApplicationPath({
      universityId: "univ_oxf",
      programmeId: "prog_ox_cs",
      applicationId: "app/1",
      intake: "September 2026",
    })).toBe("/student/new-application?universityId=univ_oxf&programmeId=prog_ox_cs&applicationId=app%2F1&intake=September+2026");
  });

  it("resolves only programmes that exist in the catalogue", () => {
    const routeValues = getStudentApplicationRouteValues(
      new URLSearchParams("universityId=univ_oxf&programmeId=prog_ox_cs"),
    );

    expect(resolveStudentApplicationTarget(DEMO_UNIVERSITIES, routeValues)?.programme.id).toBe("prog_ox_cs");
    expect(resolveStudentApplicationTarget(DEMO_UNIVERSITIES, {
      ...routeValues,
      programmeId: "missing-programme",
    })).toBeNull();
    expect(resolveStudentApplicationTarget(DEMO_UNIVERSITIES, {
      ...routeValues,
      universityId: "missing-university",
    })).toBeNull();
  });

  it("requires a valid application reference when opening a draft deep link", () => {
    const routeValues = getStudentApplicationRouteValues(
      new URLSearchParams("applicationId=app_1"),
    );
    const application = { universityId: "univ_oxf", programmeId: "prog_ox_cs" };

    expect(resolveStudentApplicationTarget(DEMO_UNIVERSITIES, routeValues, application)?.university.id).toBe("univ_oxf");
    expect(resolveStudentApplicationTarget(DEMO_UNIVERSITIES, routeValues, null)).toBeNull();
  });
});
