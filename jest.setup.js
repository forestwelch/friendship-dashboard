import "@testing-library/jest-dom";

// Mock Supabase client
jest.mock("./lib/supabase", () => ({
  supabase: {
    from: jest.fn(),
  },
}));

// Mock sounds
jest.mock("./lib/sounds", () => ({
  playSound: jest.fn(),
}));
