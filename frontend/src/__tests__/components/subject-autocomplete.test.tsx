import { useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SubjectAutocomplete } from "@/components/search/SubjectAutocomplete";
import { searchSubjects } from "@/lib/api/subjects";

function StatefulAutocomplete({
  onChangeSpy,
}: {
  onChangeSpy?: (patch: { subjectId: string; subjectName: string }) => void;
}) {
  const [state, setState] = useState({ subjectId: "", subjectName: "" });
  return (
    <SubjectAutocomplete
      subjectId={state.subjectId}
      subjectName={state.subjectName}
      onChange={(patch) => {
        setState(patch);
        onChangeSpy?.(patch);
      }}
    />
  );
}

vi.mock("@/lib/api/subjects", () => ({
  searchSubjects: vi.fn(),
}));

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
}

const RESULTS = [
  { _id: "1", name: "Національний банк України", count: 152 },
  { _id: "2", name: "Банк", count: 40 },
];

describe("SubjectAutocomplete", () => {
  beforeEach(() => {
    vi.mocked(searchSubjects).mockReset();
    vi.mocked(searchSubjects).mockResolvedValue(RESULTS);
  });

  it("queries subjects on input and renders suggestions with counts", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    renderWithClient(<StatefulAutocomplete onChangeSpy={onChange} />);

    await user.type(screen.getByRole("combobox"), "банк");

    expect(onChange).toHaveBeenLastCalledWith({
      subjectName: "банк",
      subjectId: "",
    });

    await waitFor(() =>
      expect(searchSubjects).toHaveBeenCalledWith(
        "банк",
        expect.objectContaining({ signal: expect.any(AbortSignal) }),
      ),
    );

    expect(
      await screen.findByText("Національний банк України"),
    ).toBeInTheDocument();
    expect(screen.getByText("152")).toBeInTheDocument();
  });

  it("commits the selected subject", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    renderWithClient(
      <SubjectAutocomplete
        subjectId=""
        subjectName="банк"
        onChange={onChange}
      />,
    );

    // Focus to open the dropdown for the already-present text.
    await user.click(screen.getByRole("combobox"));

    const option = await screen.findByText("Національний банк України");
    await user.click(option);

    expect(onChange).toHaveBeenLastCalledWith({
      subjectName: "Національний банк України",
      subjectId: "1",
    });
  });

  it("clears the selection via the clear button", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    renderWithClient(
      <SubjectAutocomplete
        subjectId="1"
        subjectName="Національний банк України"
        onChange={onChange}
      />,
    );

    await user.click(screen.getByLabelText("Очистити суб'єкта"));

    expect(onChange).toHaveBeenCalledWith({ subjectName: "", subjectId: "" });
  });

  it("does not query while a subject is committed", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    renderWithClient(
      <SubjectAutocomplete
        subjectId="1"
        subjectName="Національний банк України"
        onChange={onChange}
      />,
    );

    await user.click(screen.getByRole("combobox"));

    expect(searchSubjects).not.toHaveBeenCalled();
  });
});
