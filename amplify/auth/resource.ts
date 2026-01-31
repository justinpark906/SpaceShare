import { defineAuth } from "@aws-amplify/backend";

/**
 * EcoSquare Auth Configuration
 * - Email-based login
 * - Custom attribute: userType (LISTER or RENTER)
 */
export const auth = defineAuth({
  loginWith: {
    email: true,
  },
  userAttributes: {
    // Custom attribute to distinguish between Listers (Sarah) and Renters (Marcus)
    "custom:userType": {
      dataType: "String",
      mutable: true,
    },
    // Display name for the user
    preferredUsername: {
      required: false,
      mutable: true,
    },
    phoneNumber: {
      required: false,
      mutable: true,
    },
  },
});
