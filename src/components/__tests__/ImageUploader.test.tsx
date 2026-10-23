import { fireEvent, render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const toast = vi.hoisted(() => ({
  error: vi.fn(),
  success: vi.fn(),
  warning: vi.fn(),
}));

vi.mock("sonner", () => ({ toast }));

import { ImageUploader } from "@/components/ImageUploader";

function pickFile(container: HTMLElement, name = "chart.png") {
  const input = container.querySelector(
    'input[type="file"]',
  ) as HTMLInputElement;
  const file = new File(["x"], name, { type: "image/png" });
  fireEvent.change(input, { target: { files: [file] } });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ImageUploader", () => {
  it("blocks every upload when the plan allows no images", () => {
    // DEV-156: the free plan can be set to zero images in the admin panel.
    const onChange = vi.fn();
    const { container } = render(
      <ImageUploader images={[]} onChange={onChange} maxImages={0} />,
    );

    pickFile(container);

    expect(onChange).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining("ارتقا"));
  });

  it("stops at the plan cap instead of taking every picked file", () => {
    const onChange = vi.fn();
    const { container } = render(
      <ImageUploader images={["a", "b"]} onChange={onChange} maxImages={2} />,
    );

    pickFile(container);

    expect(onChange).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalled();
  });
});
