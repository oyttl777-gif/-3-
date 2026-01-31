
export interface QuestionChoice {
  id: number;
  text: string;
}

export interface DialogueTurn {
  speaker: 'Man' | 'Woman';
  text: string;
}

export interface EnglishQuestion {
  id: string;
  date: string;
  question: string;
  dialogue: DialogueTurn[];
  choices: QuestionChoice[];
  correctAnswer: number;
  explanation: string;
  transcript: string;
}

export interface AppState {
  loading: boolean;
  question: EnglishQuestion | null;
  selectedChoice: number | null;
  isSubmitted: boolean;
  audioUrl: string | null;
  error: string | null;
}
