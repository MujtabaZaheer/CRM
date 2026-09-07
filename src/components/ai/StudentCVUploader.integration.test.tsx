import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { StudentCVUploader } from "./StudentCVUploader";
import { toCountryName, toNationalityDemonym } from "../../utils/cvExtractor";

describe("StudentCVUploader Integration Tests", () => {
  it("should extract clean candidate details when user pastes CV text and triggers extraction", async () => {
    const onExtractedMock = vi.fn();

    render(
      <StudentCVUploader
        onExtracted={onExtractedMock}
        title="Auto-Fill Profile with AI (CV / Resume Scanner)"
      />
    );

    // Click 'Paste text' button
    const pasteBtn = screen.getByText(/Paste text/i);
    fireEvent.click(pasteBtn);

    // Find textarea in modal
    const textarea = screen.getByPlaceholderText(/Paste your CV text/i);
    expect(textarea).toBeDefined();

    // Paste the student CV text matching the user's scenario
    const testCvText = `
Khawaja Tariq Mahmood 271016
Email: tariq512@yahoo.com
Phone: +92 300 9876543
Date of Birth: 27/10/1998
Gender: Male
Nationality: Pakistani
Country of Residence: Pakistan
City: Lahore

ACADEMIC QUALIFICATIONS:
Bachelor of Science in Computer Science (2018 - 2022)
FAST National University of Computer & Emerging Sciences
CGPA: 3.65 / 4.00
    `;

    fireEvent.change(textarea, { target: { value: testCvText } });

    // Click 'Extract with AI'
    const extractBtn = screen.getByText(/Extract with AI/i);
    fireEvent.click(extractBtn);

    // Wait for onExtracted to be called
    await waitFor(() => {
      expect(onExtractedMock).toHaveBeenCalled();
    });

    const extractedData = onExtractedMock.mock.calls[0][0];

    // 1. Full name must be cleaned of '271016'
    expect(extractedData.fullName).toBe("Khawaja Tariq Mahmood");
    expect(extractedData.firstName).toBe("Khawaja");
    expect(extractedData.lastName).toBe("Tariq Mahmood");

    // 2. Email & Phone
    expect(extractedData.email).toBe("tariq512@yahoo.com");
    expect(extractedData.phone).toBe("+92 300 9876543");

    // 3. Date of Birth & Gender
    expect(extractedData.dob).toBe("1998-10-27");
    expect(extractedData.gender).toBe("Male");

    // 4. Country & Nationality mapping
    expect(extractedData.nationality).toBe("Pakistani");
    expect(toCountryName(extractedData.nationality)).toBe("Pakistan");
    expect(toNationalityDemonym(extractedData.countryOfResidence)).toBe("Pakistani");

    // 5. Verification badge rendered in UI
    expect(await screen.findByText(/Details Extracted & Auto-Filled!/i)).toBeDefined();
  });
});
