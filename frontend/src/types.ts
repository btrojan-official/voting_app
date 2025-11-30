export type User = {
  name: string;
  surname: string;
  class_name: string;
};

export type Candidate = {
  name: string;
  surname: string;
  postulates: string;
  class: string;
};

export type StatEntry = {
  name: string;
  surname: string;
  grade: string;
  postulates: string;
  number_of_votes: number;
  number_of_votes_per_class: Record<string, number>;
};

export type ViewType = "home" | "vote" | "candidate" | "stats";
