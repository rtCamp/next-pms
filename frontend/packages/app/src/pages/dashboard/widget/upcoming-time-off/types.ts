export interface TimeOffPerson {
  employee: string;
  name: string;
  image: string | null;
}

export interface TimeOffGroup {
  key: string;
  label: string;
  people: TimeOffPerson[];
}
