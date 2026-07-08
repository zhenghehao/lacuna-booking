export interface BookingSlot {
  id: string;
  label: string;
  capacity: number;
}

export const BOOKING_SLOTS: BookingSlot[] = [
  {
    id: "july_31",
    label: "July 31st; Kerry Hotel Pudong Shanghai, 3rd Floor, Office Building Function Room 4",
    capacity: 10, // Max bookings for slot 1
  },
  {
    id: "aug_1",
    label: "August 1st; The BREW Restaurant, 1st Floor, Kerry Hotel Pudong, Shanghai",
    capacity: 10, // Max bookings for slot 2
  },
];
