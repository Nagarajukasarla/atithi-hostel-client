import type { Hostel } from "@/types";

/**
 * Returns the short location of a hostel for sidebar/headers:
 * Format: (hostel?.address_lane_2 || hostel?.address_lane_1), hostel.city
 * Supports both camelCase and snake_case properties.
 */
export const formatHostelShortLocation = (hostel?: Hostel | null): string => {
    if (!hostel) return "No address configured";
    const primaryLane = hostel.address_lane_2 || hostel.addressLane2 || hostel.address_lane_1 || hostel.addressLane1;
    const city = hostel.city;

    return [primaryLane, city].filter(Boolean).join(", ") || "No address configured";
};

/**
 * Formats the full address string of a hostel.
 */
export const formatHostelAddress = (hostel?: Hostel | null): string => {
    if (!hostel) return "No address configured yet";
    const lane1 = hostel.address_lane_1 || hostel.addressLane1;
    const city = hostel.city;
    const state = hostel.state;
    const zipcode = hostel.zipcode;

    return [lane1, city, state, zipcode].filter(Boolean).join(", ") || "No address configured yet";
};
