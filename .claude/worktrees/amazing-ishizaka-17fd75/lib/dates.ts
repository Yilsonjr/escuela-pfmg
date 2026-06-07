import { startOfWeek } from "date-fns";

export function weekStartMonday(date: Date) {
  return startOfWeek(date, { weekStartsOn: 1 });
}

