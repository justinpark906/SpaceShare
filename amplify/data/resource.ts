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
      geofenceId: a.string(), // Links to Amazon Location Service geofence
      isUnlocked: a.boolean().default(false), // "Hack" shortcut for frontend polling
      lastUnlockTime: a.datetime(),
      // Owner relationship
      ownerId: a.id().required(),
      owner: a.belongsTo("Profile", "ownerId"),
      // Bookings for this space
      bookings: a.hasMany("Booking", "spaceId"),
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
      // Spaces owned by this user (for Listers)
      spaces: a.hasMany("Space", "ownerId"),
      // Bookings made by this user (for Renters)
      bookings: a.hasMany("Booking", "renterId"),
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
