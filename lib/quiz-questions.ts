export interface QuizQuestion {
  id: number;
  question: string;
  options: {
    a: string;
    b: string;
    c: string;
  };
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    question: "When faced with a problem, do you...",
    options: {
      a: "Rush in & fix it fast",
      b: "Think about it deeply first",
      c: "Ask for help & brainstorm",
    },
  },
  {
    id: 2,
    question: "At parties, you're the person who...",
    options: {
      a: "Works the room",
      b: "Finds deep conversation",
      c: "Bounces around",
    },
  },
  {
    id: 3,
    question: "When something breaks, you...",
    options: {
      a: "Fix it yourself",
      b: "Research first",
      c: "Call someone",
    },
  },
  {
    id: 4,
    question: "Your ideal free evening is...",
    options: {
      a: "Out with friends",
      b: "Alone with hobbies",
      c: "Depends on mood",
    },
  },
  {
    id: 5,
    question: "Trying something new, you...",
    options: {
      a: "Jump in",
      b: "Research first",
      c: "Need a friend",
    },
  },
  {
    id: 6,
    question: "When you disagree with someone...",
    options: {
      a: "Speak up",
      b: "Process first",
      c: "Find middle ground",
    },
  },
  {
    id: 7,
    question: "Your vibe is...",
    options: {
      a: "Bright & bold",
      b: "Quiet & cozy",
      c: "Whatever feels right",
    },
  },
  {
    id: 8,
    question: "Next year, you want to...",
    options: {
      a: "Have adventures",
      b: "Complete a project",
      c: "Be happy",
    },
  },
];

export interface QuizResult {
  emoji: string;
  title: string;
  description: string;
}

export function calculateResult(answers: string[]): QuizResult {
  const counts = { a: 0, b: 0, c: 0 };
  answers.forEach((answer) => {
    if (answer === "a") counts.a++;
    else if (answer === "b") counts.b++;
    else if (answer === "c") counts.c++;
  });

  const maxCount = Math.max(counts.a, counts.b, counts.c);
  const isMostlyA = counts.a === maxCount && counts.a > counts.b && counts.a > counts.c;
  const isMostlyB = counts.b === maxCount && counts.b > counts.a && counts.b > counts.c;
  const isMostlyC = counts.c === maxCount && counts.c > counts.a && counts.c > counts.b;

  if (isMostlyA) {
    return {
      emoji: "☀️",
      title: "THE SUN",
      description:
        "Bright & energetic, you light up every room. You're the person who brings energy, makes plans, and keeps things moving. Social, adventurous, and always ready for the next thing.",
    };
  }

  if (isMostlyB) {
    return {
      emoji: "🌙",
      title: "THE MOON",
      description:
        "Nocturnal & introspective, you think deep, create in the quiet, find peace in alone time. You're the person your friends call at 2am. Creative, contemplative, and beautifully complex.",
    };
  }

  if (isMostlyC) {
    return {
      emoji: "⭐",
      title: "THE STAR",
      description:
        "Balanced & flexible, you adapt to whatever feels right. You're the person who finds the middle ground, goes with the flow, and brings calm to chaos. Adaptable, wise, and always steady.",
    };
  }

  // Mixed results
  if (counts.a > 0 && counts.b > 0 && counts.a === counts.b) {
    return {
      emoji: "🌑",
      title: "THE ECLIPSE",
      description:
        "Sun & Moon combined. You balance energy with depth, social with solo, action with reflection. You're the person who can light up a room and then dive deep into meaningful conversation.",
    };
  }

  if (counts.a > 0 && counts.c > 0 && counts.a === counts.c) {
    return {
      emoji: "🌞",
      title: "THE DAWN",
      description:
        "Sun & Star combined. You bring energy and balance together. Adventurous yet steady, bold yet adaptable. You're the person who makes plans but stays flexible.",
    };
  }

  if (counts.b > 0 && counts.c > 0 && counts.b === counts.c) {
    return {
      emoji: "🌠",
      title: "THE COMET",
      description:
        "Moon & Star combined. Deep and balanced, introspective yet adaptable. You're the person who thinks deeply but knows when to go with the flow. Creative, wise, and beautifully complex.",
    };
  }

  // Truly mixed
  return {
    emoji: "🌈",
    title: "THE SPECTRUM",
    description:
      "You're a beautiful mix of everything. Sun, Moon, and Star all at once. You adapt, you shine, you reflect. You're the person who brings balance and color to every situation.",
  };
}

export function calculateCompatibility(
  yourResult: QuizResult,
  theirResult: QuizResult
): string {
  // Hardcoded compatibility notes based on result combinations
  const compatibilityMap: Record<string, Record<string, string>> = {
    "☀️": {
      "☀️": "Double the sunshine! You're both bright and energetic. Expect lots of adventures and shared energy.",
      "🌙": "You balance each other perfectly. Sun & Moon, day & night. They bring energy, you bring depth.",
      "⭐": "Energy meets balance. You bring the spark, they bring the steady. A perfect match for adventures.",
      "🌑": "Sun meets Eclipse. You both have energy, but they also have depth. Great for deep conversations.",
      "🌞": "Sun meets Dawn. Both energetic and balanced. Expect lots of fun with thoughtful moments.",
      "🌠": "Sun meets Comet. Energy meets depth and balance. A dynamic and thoughtful friendship.",
      "🌈": "Sun meets Spectrum. Your energy complements their adaptability. Always something new!",
    },
    "🌙": {
      "☀️": "You balance each other perfectly. Moon & Sun, night & day. They bring energy, you bring depth.",
      "🌙": "Double the depth! You're both introspective and creative. Expect deep conversations and quiet understanding.",
      "⭐": "Depth meets balance. You bring the quiet, they bring the steady. Perfect for thoughtful moments.",
      "🌑": "Moon meets Eclipse. Both introspective, but they also have energy. Great for creative projects.",
      "🌞": "Moon meets Dawn. Depth meets balance and energy. A thoughtful yet dynamic friendship.",
      "🌠": "Moon meets Comet. Both deep and balanced. Expect meaningful conversations and creative flow.",
      "🌈": "Moon meets Spectrum. Your depth complements their adaptability. Beautifully complex together.",
    },
    "⭐": {
      "☀️": "Balance meets energy. You bring the steady, they bring the spark. Perfect for adventures.",
      "🌙": "Balance meets depth. You bring the steady, they bring the quiet. Great for thoughtful moments.",
      "⭐": "Double the balance! You're both adaptable and steady. Expect harmony and flow.",
      "🌑": "Star meets Eclipse. Balance meets depth and energy. A harmonious and dynamic friendship.",
      "🌞": "Star meets Dawn. Both balanced and energetic. Expect steady adventures and good vibes.",
      "🌠": "Star meets Comet. Both balanced and deep. Perfect for meaningful yet flexible moments.",
      "🌈": "Star meets Spectrum. Your balance complements their adaptability. Pure harmony.",
    },
  };

  return (
    compatibilityMap[yourResult.emoji]?.[theirResult.emoji] ||
    "You're both unique! Your friendship brings something special to each other's lives."
  );
}

