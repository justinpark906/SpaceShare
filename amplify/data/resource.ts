import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

// EcoSquare Data Schema - "City Data" for shared spaces

const schema = a.schema({
  // Space Model - represents rentable spaces (parking, storage, gardens)
  Space: a
    .model({
      name: a.string().required(),
      description: a.string(),
      type: a.enum(["PARKING", "STORAGE", "GARDEN"]),
      pricePerHour: a.float().required(),
      latitude: a.float().required(),
      longitude: a.float().required(),
      address: a.string(),
      status: a.enum(["AVAILABLE", "BOOKED", "OCCUPIED"]),
      imageUrl: a.string(),
      // IoT Digital Twin fields
      geofenceId: a.string(),
      isUnlocked: a.boolean().default(false),
      lastUnlockTime: a.datetime(),
      // Owner relationship
      ownerId: a.id().required(),
      owner: a.belongsTo("Profile", "ownerId"),
      // Bookings for this space
      bookings: a.hasMany("Booking", "spaceId"),
      // Transactions for this space
      transactions: a.hasMany("Transaction", "spaceId"),
    })
    .authorization((allow) => [
      allow.authenticated().to(["read"]),
      allow.owner().to(["create", "update", "delete"]),
    ]),

  // Profile Model - user profiles with role (Lister or Renter)
  Profile: a
    .model({
      userId: a.id().required(),
      email: a.string().required(),
      displayName: a.string(),
      userType: a.enum(["LISTER", "RENTER"]),
      phoneNumber: a.string(),
      // Financial fields for Listers
      totalEarnings: a.float().default(0),
      totalSavedForTaxes: a.float().default(0),
      visaCardToken: a.string(), // Tokenized card for Visa Direct payouts
      capitalOneAccountId: a.string(), // For savings sweep
      // Impact metrics
      totalRentalsHosted: a.integer().default(0),
      co2Saved: a.float().default(0), // in pounds
      // Spaces owned by this user (for Listers)
      spaces: a.hasMany("Space", "ownerId"),
      // Bookings made by this user (for Renters)
      bookings: a.hasMany("Booking", "renterId"),
      // Transactions as lister
      listerTransactions: a.hasMany("Transaction", "listerId"),
      // Transactions as renter
      renterTransactions: a.hasMany("Transaction", "renterId"),
    })
    .authorization((allow) => [
      allow.owner().to(["create", "read", "update", "delete"]),
      allow.authenticated().to(["read"]),
    ]),

  // Booking Model - tracks reservations
  Booking: a
    .model({
      spaceId: a.id().required(),
      space: a.belongsTo("Space", "spaceId"),
      renterId: a.id().required(),
      renter: a.belongsTo("Profile", "renterId"),
      startTime: a.datetime().required(),
      endTime: a.datetime().required(),
      totalPrice: a.float().required(),
      status: a.enum([
        "PENDING",
        "CONFIRMED",
        "ACTIVE",
        "COMPLETED",
        "CANCELLED",
      ]),
      // Link to transaction
      transactionId: a.id(),
      transaction: a.belongsTo("Transaction", "transactionId"),
    })
    .authorization((allow) => [
      allow.authenticated().to(["read"]),
      allow.owner().to(["create", "update"]),
    ]),

  // Transaction Model - Escrow for payments
  Transaction: a
    .model({
      // Amount details
      amount: a.float().required(), // Total amount from renter
      platformFee: a.float().required(), // 2% city improvement fee
      listerPayout: a.float().required(), // 80% to lister
      taxSweep: a.float().required(), // 20% of lister payout to savings

      // Status tracking
      status: a.enum([
        "PENDING", // Payment initiated, funds held
        "COMPLETED", // Session ended, ready for disbursement
        "DISBURSED", // Funds sent to lister via Visa Direct
        "SWEPT", // Tax savings transferred via Capital One
        "FAILED", // Something went wrong
        "REFUNDED", // Refunded to renter
      ]),

      // Parties involved
      renterId: a.id().required(),
      renter: a.belongsTo("Profile", "renterId"),
      listerId: a.id().required(),
      lister: a.belongsTo("Profile", "listerId"),
      spaceId: a.id().required(),
      space: a.belongsTo("Space", "spaceId"),

      // Booking reference
      bookings: a.hasMany("Booking", "transactionId"),

      // External references
      visaTransactionId: a.string(), // Visa Direct reference
      capitalOneTransferId: a.string(), // Capital One transfer reference

      // Timestamps
      initiatedAt: a.datetime(),
      completedAt: a.datetime(),
      disbursedAt: a.datetime(),
      sweptAt: a.datetime(),
    })
    .authorization((allow) => [
      allow.authenticated().to(["read"]),
      allow.owner().to(["create", "update"]),
    ]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool",
  },
});
