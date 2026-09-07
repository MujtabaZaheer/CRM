import { describe, it, expect } from "vitest";
import { getUniversityCampusImage, REAL_UNIVERSITY_IMAGES } from "./universityImages";

describe("getUniversityCampusImage", () => {
  it("resolves University of Sydney to its real campus image", () => {
    const imgById = getUniversityCampusImage("univ_syd");
    expect(imgById).toBe(REAL_UNIVERSITY_IMAGES.univ_syd.image);

    const imgByName = getUniversityCampusImage("University of Sydney");
    expect(imgByName).toBe(REAL_UNIVERSITY_IMAGES.univ_syd.image);

    const imgByObj = getUniversityCampusImage({ name: "University of Sydney", id: "univ_syd" });
    expect(imgByObj).toBe(REAL_UNIVERSITY_IMAGES.univ_syd.image);
  });

  it("ensures different universities have distinct, non-identical real images", () => {
    const sydneyImg = getUniversityCampusImage("University of Sydney");
    const oxfordImg = getUniversityCampusImage("University of Oxford");
    const harvardImg = getUniversityCampusImage("Harvard University");
    const melbourneImg = getUniversityCampusImage("University of Melbourne");
    const torontoImg = getUniversityCampusImage("University of Toronto");

    // All must be distinct
    const set = new Set([sydneyImg, oxfordImg, harvardImg, melbourneImg, torontoImg]);
    expect(set.size).toBe(5);
  });
});
