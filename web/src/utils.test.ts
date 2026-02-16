import { escapeHtml, getFileExtension } from "./utils";

describe("escapeHtml", () => {
  it("should escape special characters", () => {
    const input = `& < > " '`;
    const expected = `&amp; &lt; &gt; &quot; &#039;`;
    expect(escapeHtml(input)).toBe(expected);
  });

  it("should not modify safe strings", () => {
    const input = `Hello World!`;
    expect(escapeHtml(input)).toBe(input);
  });
});

describe("getFileExtension", () => {
  it("should return the file extension in lowercase", () => {
    expect(getFileExtension("document.PDF")).toBe("pdf");
    expect(getFileExtension("archive.tar.gz")).toBe("gz");
  });

  it("should return an empty string if there is no extension", () => {
    expect(getFileExtension("file")).toBe("");
    expect(getFileExtension(".hiddenfile")).toBe("");
  });

  it("should ignore query parameters and fragments", () => {
    expect(getFileExtension("image.png?version=1.2")).toBe("png");
    expect(getFileExtension("script.js#section")).toBe("js");
  });
});