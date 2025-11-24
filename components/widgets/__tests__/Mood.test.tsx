import { render, screen } from "@testing-library/react";
import { Mood } from "../Mood";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const mockThemeColors = {
  primary: "#3a3a3a",
  secondary: "#4a4a4a",
  accent: "#2a2a2a",
  bg: "#0a0a0a",
  text: "#e8e8e8",
};

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  Wrapper.displayName = "TestWrapper";
  return Wrapper;
};

describe("Mood Widget", () => {
  it("should render 1x1 tile with current mood emoji", () => {
    const config = {
      current_mood: {
        emoji: ":)",
        timestamp: new Date().toISOString(),
      },
    };

    render(
      <Mood
        size={1}
        friendId="test-friend"
        widgetId="test-widget"
        themeColors={mockThemeColors}
        config={config}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText(":)")).toBeInTheDocument();
  });

  it("should render 2x2 tile with mood details", () => {
    const config = {
      current_mood: {
        emoji: ":D",
        timestamp: new Date().toISOString(),
      },
    };

    render(
      <Mood
        size={2}
        friendId="test-friend"
        widgetId="test-widget"
        themeColors={mockThemeColors}
        config={config}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText(":D")).toBeInTheDocument();
    expect(screen.getByText("Happy")).toBeInTheDocument();
  });

  it("should render 3x3 tile with history", () => {
    const config = {
      current_mood: {
        emoji: ":|",
        timestamp: new Date().toISOString(),
      },
      history: [
        { emoji: ":D", timestamp: new Date().toISOString() },
        { emoji: ":)", timestamp: new Date().toISOString() },
      ],
    };

    render(
      <Mood
        size={3}
        friendId="test-friend"
        widgetId="test-widget"
        themeColors={mockThemeColors}
        config={config}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText("Current Mood")).toBeInTheDocument();
    expect(screen.getByText(":|")).toBeInTheDocument();
  });
});

