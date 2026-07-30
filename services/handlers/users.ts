import type { User } from "@/types/session";

export const FAKE_USERS: User[] = [
  {
    id: "u_001",
    name: "Aarav Sharma",
    email: "aarav.sharma@example.com",
    role: "admin",
  },
  {
    id: "u_002",
    name: "Priya Iyer",
    email: "priya.iyer@example.com",
    role: "instructor",
  },
  {
    id: "u_003",
    name: "Rohan Mehta",
    email: "rohan.mehta@example.com",
    role: "student",
  },
  {
    id: "u_004",
    name: "Sara Khan",
    email: "sara.khan@example.com",
    role: "student",
  },
  {
    id: "u_005",
    name: "Vikram Patel",
    email: "vikram.patel@example.com",
    role: "instructor",
  },
  {
    id: "u_006",
    name: "Ananya Reddy",
    email: "ananya.reddy@example.com",
    role: "student",
  },
  {
    id: "u_007",
    name: "Karan Singh",
    email: "karan.singh@example.com",
    role: "admin",
  },
  {
    id: "u_008",
    name: "Meera Nair",
    email: "meera.nair@example.com",
    role: "student",
  },
];

export const FAKE_CURRENT_USER: User = FAKE_USERS[0];
