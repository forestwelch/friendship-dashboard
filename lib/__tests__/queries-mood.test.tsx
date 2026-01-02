import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useMoodWidget, useSetMood } from "../queries-mood";
import { supabase } from "../supabase";

jest.mock("../supabase");
jest.mock("../sounds");

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

describe("Mood Queries", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should fetch mood widget data", async () => {
    const mockConfig = {
      current_mood: {
        emoji: ":)",
        timestamp: new Date().toISOString(),
      },
      history: [],
    };

    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { config: mockConfig },
        error: null,
      }),
    });

    const { result } = renderHook(() => useMoodWidget("friend-1", "widget-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockConfig);
  });

  it("should set mood with optimistic update", async () => {
    const mockConfig = {
      current_mood: {
        emoji: ":D",
        timestamp: new Date().toISOString(),
      },
      history: [],
    };

    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { config: mockConfig },
        error: null,
      }),
      update: jest.fn().mockReturnThis(),
    });

    const { result } = renderHook(() => useSetMood("friend-1", "widget-1"), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ emoji: ":)", notes: "test" });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });
});
