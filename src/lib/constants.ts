export interface DatePlace {
  id: string;
  label: string;
}

export interface TimeSlot {
  time: string;
}

export const DATE_PLACES: DatePlace[] = [
  {
    id: "july_31",
    label: "July 31st; Kerry Hotel Pudong Shanghai, 3rd Floor, Office Building Function Room 4",
  },
  {
    id: "aug_1",
    label: "August 1st; The BREW Restaurant, 1st Floor, Kerry Hotel Pudong, Shanghai",
  },
];

export const TIME_SLOTS_BY_DATE: Record<string, string[]> = {
  july_31: [
    "10:30-11:00",
    "11:15-11:45",
    "13:00-13:30",
    "13:45-14:15",
    "14:30-15:00",
    "15:15-15:45",
    "16:00-16:30",
    "16:45-17:15",
  ],
  aug_1: [
    "10:30-11:00",
    "11:10-11:40",
    "13:00-13:30",
    "13:40-14:10",
    "14:20-14:50",
    "15:00-15:30",
  ],
};
