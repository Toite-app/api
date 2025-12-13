import { WorkshiftPaymentType } from "src/@base/drizzle/schema/workshift-enums";

// Realistic workshift payment category names organized by type
export const WORKSHIFT_PAYMENT_CATEGORY_NAMES = {
  [WorkshiftPaymentType.INCOME]: [
    "Cash Sales",
    "Card Sales",
    "Bank Transfers",
    "Mobile Payments",
    "Gift Card Sales",
    "Tips",
    "Service Charge",
    "Online Orders",
    "Delivery Sales",
    "Catering Sales",
    "Table Sales",
    "Bar Sales",
  ],
  [WorkshiftPaymentType.EXPENSE]: [
    "Supplies",
    "Utilities",
    "Staff Meals",
    "Maintenance",
    "Cleaning Supplies",
    "Office Expenses",
    "Cash Withdrawals",
    "Petty Cash",
    "Vendor Payments",
    "Repairs",
    "Equipment",
    "Marketing",
  ],
  [WorkshiftPaymentType.CASHLESS]: [
    "Online Orders",
    "Delivery Platform",
    "Bank Transfers",
    "Digital Wallets",
    "Corporate Accounts",
    "QR Payments",
    "Mobile App",
    "Credit Accounts",
    "Loyalty Points",
    "Gift Cards",
  ],
} as const;

// Child category specifiers for generating nested categories
export const CHILD_CATEGORY_SPECIFIERS = [
  "Morning",
  "Evening",
  "Weekend",
  "Weekday",
  "Kitchen",
  "Bar",
  "Takeout",
  "Dine-in",
  "Delivery",
  "Small",
  "Large",
  "Regular",
];

// Realistic payment amount ranges by type (in base currency units)
export const PAYMENT_AMOUNT_RANGES = {
  [WorkshiftPaymentType.INCOME]: { min: 50, max: 500 },
  [WorkshiftPaymentType.EXPENSE]: { min: 10, max: 150 },
  [WorkshiftPaymentType.CASHLESS]: { min: 100, max: 800 },
} as const;
