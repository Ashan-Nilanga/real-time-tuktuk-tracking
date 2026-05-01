export default {
  "openapi": "3.0.0",
  "info": {
    "title": "TukTuk Tracking API",
    "description": "Real-Time Three-Wheeler (Tuk-Tuk) Tracking & Movement Logging System for Sri Lanka Law Enforcement. Provides GPS tracking, movement history, province/district filtering, and role-based access control.",
    "version": "1.0.0",
    "contact": {
      "name": "API Support"
    }
  },
  "servers": [
    {
      "url": "/api",
      "description": "API Base URL"
    }
  ],
  "components": {
    "securitySchemes": {
      "BearerAuth": {
        "type": "http",
        "scheme": "bearer",
        "bearerFormat": "JWT",
        "description": "JWT token obtained from /api/auth/login"
      }
    },
    "schemas": {
      "SuccessResponse": {
        "type": "object",
        "properties": {
          "success": { "type": "boolean", "example": true },
          "message": { "type": "string", "example": "Operation successful" },
          "data": { "type": "object" }
        }
      },
      "ErrorResponse": {
        "type": "object",
        "properties": {
          "success": { "type": "boolean", "example": false },
          "message": { "type": "string", "example": "Error occurred" },
          "error": { "type": "string" }
        }
      },
      "PaginatedResponse": {
        "type": "object",
        "properties": {
          "success": { "type": "boolean", "example": true },
          "message": { "type": "string" },
          "data": { "type": "array", "items": {} },
          "meta": {
            "type": "object",
            "properties": {
              "total": { "type": "integer", "example": 100 },
              "page": { "type": "integer", "example": 1 },
              "pages": { "type": "integer", "example": 5 },
              "limit": { "type": "integer", "example": 20 }
            }
          }
        }
      },
      "LoginRequest": {
        "type": "object",
        "required": ["username", "password"],
        "properties": {
          "username": { "type": "string", "example": "superadmin" },
          "password": { "type": "string", "example": "admin123" }
        }
      },
      "RegisterRequest": {
        "type": "object",
        "required": ["username", "password", "role"],
        "properties": {
          "username": { "type": "string", "example": "new_officer", "minLength": 3 },
          "password": { "type": "string", "example": "securePass123", "minLength": 6 },
          "role": { "type": "string", "enum": ["SUPER_ADMIN", "PROVINCIAL_ADMIN", "STATION_OFFICER", "DEVICE"] },
          "assignedProvinceId": { "type": "integer", "example": 1, "nullable": true },
          "assignedDistrictId": { "type": "integer", "example": 1, "nullable": true },
          "assignedStationId": { "type": "integer", "example": 1, "nullable": true },
          "assignedVehicleId": { "type": "integer", "example": 1, "nullable": true }
        }
      },
      "Province": {
        "type": "object",
        "properties": {
          "id": { "type": "integer", "example": 1 },
          "name": { "type": "string", "example": "Western" },
          "code": { "type": "string", "example": "WP" },
          "created_at": { "type": "string", "format": "date-time" }
        }
      },
      "District": {
        "type": "object",
        "properties": {
          "id": { "type": "integer", "example": 1 },
          "name": { "type": "string", "example": "Colombo" },
          "province_id": { "type": "integer", "example": 1 },
          "province_name": { "type": "string", "example": "Western" },
          "created_at": { "type": "string", "format": "date-time" }
        }
      },
      "PoliceStation": {
        "type": "object",
        "properties": {
          "id": { "type": "integer", "example": 1 },
          "name": { "type": "string", "example": "Colombo Fort Police Station" },
          "district_id": { "type": "integer", "example": 1 },
          "district_name": { "type": "string", "example": "Colombo" },
          "province_name": { "type": "string", "example": "Western" },
          "address": { "type": "string", "example": "Colombo area, Sri Lanka" },
          "phone": { "type": "string", "example": "+94112345678" }
        }
      },
      "CreateStationRequest": {
        "type": "object",
        "required": ["name", "districtId"],
        "properties": {
          "name": { "type": "string", "example": "New Police Station" },
          "districtId": { "type": "integer", "example": 1 },
          "address": { "type": "string", "example": "123 Main Street" },
          "phone": { "type": "string", "example": "+94112345678" }
        }
      },
      "Vehicle": {
        "type": "object",
        "properties": {
          "id": { "type": "integer", "example": 1 },
          "registration_number": { "type": "string", "example": "WP CAB-0001" },
          "driver_name": { "type": "string", "example": "Kasun Perera" },
          "device_id": { "type": "string", "example": "DEVICE-001" },
          "province_id": { "type": "integer" },
          "district_id": { "type": "integer" },
          "status": { "type": "string", "enum": ["active", "inactive"] },
          "last_latitude": { "type": "number", "example": 6.9271 },
          "last_longitude": { "type": "number", "example": 79.8612 },
          "last_speed": { "type": "number", "example": 25.5 },
          "last_ping_at": { "type": "string", "format": "date-time" },
          "province_name": { "type": "string", "example": "Western" },
          "district_name": { "type": "string", "example": "Colombo" }
        }
      },
      "CreateVehicleRequest": {
        "type": "object",
        "required": ["registrationNumber", "driverName", "deviceId", "provinceId", "districtId"],
        "properties": {
          "registrationNumber": { "type": "string", "example": "WP CAB-9999" },
          "driverName": { "type": "string", "example": "Nuwan Silva" },
          "deviceId": { "type": "string", "example": "DEVICE-NEW-001" },
          "provinceId": { "type": "integer", "example": 1 },
          "districtId": { "type": "integer", "example": 1 },
          "status": { "type": "string", "enum": ["active", "inactive"], "default": "active" }
        }
      },
      "UpdateVehicleRequest": {
        "type": "object",
        "properties": {
          "registrationNumber": { "type": "string" },
          "driverName": { "type": "string" },
          "deviceId": { "type": "string" },
          "provinceId": { "type": "integer" },
          "districtId": { "type": "integer" },
          "status": { "type": "string", "enum": ["active", "inactive"] }
        }
      },
      "LocationPingRequest": {
        "type": "object",
        "required": ["deviceId", "latitude", "longitude"],
        "properties": {
          "deviceId": { "type": "string", "example": "DEVICE-001" },
          "latitude": { "type": "number", "example": 6.9271, "minimum": 5.9, "maximum": 9.9 },
          "longitude": { "type": "number", "example": 79.8612, "minimum": 79.4, "maximum": 82.0 },
          "timestamp": { "type": "string", "format": "date-time" },
          "speed": { "type": "number", "example": 35.5, "minimum": 0 },
          "accuracy": { "type": "number", "example": 10.0, "minimum": 0 }
        }
      },
      "LocationPing": {
        "type": "object",
        "properties": {
          "id": { "type": "integer" },
          "vehicle_id": { "type": "integer" },
          "latitude": { "type": "number", "example": 6.9271 },
          "longitude": { "type": "number", "example": 79.8612 },
          "speed": { "type": "number", "example": 35.5 },
          "accuracy": { "type": "number", "example": 10.0 },
          "timestamp": { "type": "string", "format": "date-time" },
          "registration_number": { "type": "string" },
          "province_name": { "type": "string" },
          "district_name": { "type": "string" }
        }
      }
    }
  },
  "paths": {
    "/auth/register": {
      "post": {
        "tags": ["Auth"],
        "summary": "Register a new user",
        "description": "Admin creates a new user account. Requires SUPER_ADMIN role.",
        "security": [{ "BearerAuth": [] }],
        "requestBody": {
          "required": true,
          "content": { "application/json": { "schema": { "$ref": "#/components/schemas/RegisterRequest" } } }
        },
        "responses": {
          "201": { "description": "User registered successfully", "content": { "application/json": { "schema": { "$ref": "#/components/schemas/SuccessResponse" } } } },
          "400": { "description": "Validation error", "content": { "application/json": { "schema": { "$ref": "#/components/schemas/ErrorResponse" } } } },
          "401": { "description": "Not authenticated" },
          "403": { "description": "Insufficient permissions" },
          "409": { "description": "Username already exists" }
        }
      }
    },
    "/auth/login": {
      "post": {
        "tags": ["Auth"],
        "summary": "Login and get JWT token",
        "description": "Authenticates user and returns JWT. Token expires in 24h for users, 7d for DEVICE role.",
        "requestBody": {
          "required": true,
          "content": { "application/json": { "schema": { "$ref": "#/components/schemas/LoginRequest" } } }
        },
        "responses": {
          "200": { "description": "Login successful, JWT returned", "content": { "application/json": { "schema": { "$ref": "#/components/schemas/SuccessResponse" } } } },
          "401": { "description": "Invalid credentials", "content": { "application/json": { "schema": { "$ref": "#/components/schemas/ErrorResponse" } } } }
        }
      }
    },
    "/auth/me": {
      "get": {
        "tags": ["Auth"],
        "summary": "Get current user profile",
        "security": [{ "BearerAuth": [] }],
        "responses": {
          "200": { "description": "User profile", "content": { "application/json": { "schema": { "$ref": "#/components/schemas/SuccessResponse" } } } },
          "401": { "description": "Not authenticated" }
        }
      }
    },
    "/provinces": {
      "get": {
        "tags": ["Provinces & Districts"],
        "summary": "List all 9 provinces",
        "security": [{ "BearerAuth": [] }],
        "responses": {
          "200": { "description": "List of provinces", "content": { "application/json": { "schema": { "allOf": [{ "$ref": "#/components/schemas/SuccessResponse" }, { "properties": { "data": { "type": "array", "items": { "$ref": "#/components/schemas/Province" } } } }] } } } }
        }
      }
    },
    "/provinces/{id}/districts": {
      "get": {
        "tags": ["Provinces & Districts"],
        "summary": "List districts in a province",
        "security": [{ "BearerAuth": [] }],
        "parameters": [
          { "name": "id", "in": "path", "required": true, "schema": { "type": "integer" }, "example": 1 }
        ],
        "responses": {
          "200": { "description": "Province with its districts" },
          "404": { "description": "Province not found" }
        }
      }
    },
    "/districts": {
      "get": {
        "tags": ["Provinces & Districts"],
        "summary": "List all 25 districts",
        "security": [{ "BearerAuth": [] }],
        "responses": {
          "200": { "description": "List of all districts with province info", "content": { "application/json": { "schema": { "allOf": [{ "$ref": "#/components/schemas/SuccessResponse" }, { "properties": { "data": { "type": "array", "items": { "$ref": "#/components/schemas/District" } } } }] } } } }
        }
      }
    },
    "/stations": {
      "get": {
        "tags": ["Police Stations"],
        "summary": "List police stations",
        "description": "List all stations with optional province/district filtering. Paginated.",
        "security": [{ "BearerAuth": [] }],
        "parameters": [
          { "name": "province", "in": "query", "schema": { "type": "string" }, "example": "Western" },
          { "name": "district", "in": "query", "schema": { "type": "string" }, "example": "Colombo" },
          { "name": "page", "in": "query", "schema": { "type": "integer", "default": 1 } },
          { "name": "limit", "in": "query", "schema": { "type": "integer", "default": 20 } }
        ],
        "responses": {
          "200": { "description": "Paginated list of stations", "content": { "application/json": { "schema": { "$ref": "#/components/schemas/PaginatedResponse" } } } }
        }
      },
      "post": {
        "tags": ["Police Stations"],
        "summary": "Create a police station",
        "description": "SUPER_ADMIN only.",
        "security": [{ "BearerAuth": [] }],
        "requestBody": {
          "required": true,
          "content": { "application/json": { "schema": { "$ref": "#/components/schemas/CreateStationRequest" } } }
        },
        "responses": {
          "201": { "description": "Station created" },
          "400": { "description": "Validation error" },
          "403": { "description": "Insufficient permissions" }
        }
      }
    },
    "/stations/{id}": {
      "get": {
        "tags": ["Police Stations"],
        "summary": "Get a single police station",
        "security": [{ "BearerAuth": [] }],
        "parameters": [{ "name": "id", "in": "path", "required": true, "schema": { "type": "integer" } }],
        "responses": {
          "200": { "description": "Station details" },
          "404": { "description": "Station not found" }
        }
      }
    },
    "/vehicles": {
      "get": {
        "tags": ["Vehicles"],
        "summary": "List all vehicles",
        "description": "Filter by province, district, status. Paginated. Scoped by user role.",
        "security": [{ "BearerAuth": [] }],
        "parameters": [
          { "name": "province", "in": "query", "schema": { "type": "string" }, "example": "Western" },
          { "name": "district", "in": "query", "schema": { "type": "string" }, "example": "Colombo" },
          { "name": "status", "in": "query", "schema": { "type": "string", "enum": ["active", "inactive"] } },
          { "name": "page", "in": "query", "schema": { "type": "integer", "default": 1 } },
          { "name": "limit", "in": "query", "schema": { "type": "integer", "default": 20 } }
        ],
        "responses": {
          "200": { "description": "Paginated list of vehicles", "content": { "application/json": { "schema": { "$ref": "#/components/schemas/PaginatedResponse" } } } }
        }
      },
      "post": {
        "tags": ["Vehicles"],
        "summary": "Register a new vehicle",
        "description": "SUPER_ADMIN only.",
        "security": [{ "BearerAuth": [] }],
        "requestBody": {
          "required": true,
          "content": { "application/json": { "schema": { "$ref": "#/components/schemas/CreateVehicleRequest" } } }
        },
        "responses": {
          "201": { "description": "Vehicle registered" },
          "400": { "description": "Validation error" },
          "403": { "description": "Insufficient permissions" }
        }
      }
    },
    "/vehicles/{id}": {
      "get": {
        "tags": ["Vehicles"],
        "summary": "Get vehicle details",
        "security": [{ "BearerAuth": [] }],
        "parameters": [{ "name": "id", "in": "path", "required": true, "schema": { "type": "integer" } }],
        "responses": { "200": { "description": "Vehicle details" }, "404": { "description": "Vehicle not found" } }
      },
      "put": {
        "tags": ["Vehicles"],
        "summary": "Update vehicle info",
        "description": "SUPER_ADMIN only.",
        "security": [{ "BearerAuth": [] }],
        "parameters": [{ "name": "id", "in": "path", "required": true, "schema": { "type": "integer" } }],
        "requestBody": { "required": true, "content": { "application/json": { "schema": { "$ref": "#/components/schemas/UpdateVehicleRequest" } } } },
        "responses": { "200": { "description": "Vehicle updated" }, "404": { "description": "Vehicle not found" } }
      },
      "delete": {
        "tags": ["Vehicles"],
        "summary": "Deactivate vehicle",
        "description": "Soft delete — sets status to inactive. SUPER_ADMIN only.",
        "security": [{ "BearerAuth": [] }],
        "parameters": [{ "name": "id", "in": "path", "required": true, "schema": { "type": "integer" } }],
        "responses": { "200": { "description": "Vehicle deactivated" }, "404": { "description": "Vehicle not found" } }
      }
    },
    "/vehicles/{id}/location": {
      "get": {
        "tags": ["Vehicles"],
        "summary": "Get last known location",
        "security": [{ "BearerAuth": [] }],
        "parameters": [{ "name": "id", "in": "path", "required": true, "schema": { "type": "integer" } }],
        "responses": { "200": { "description": "Last known location data" }, "404": { "description": "Vehicle or location not found" } }
      }
    },
    "/vehicles/{id}/history": {
      "get": {
        "tags": ["Vehicles"],
        "summary": "Vehicle location history",
        "description": "Query movement history for a vehicle. Supports ISO8601 datetime filtering.",
        "security": [{ "BearerAuth": [] }],
        "parameters": [
          { "name": "id", "in": "path", "required": true, "schema": { "type": "integer" } },
          { "name": "from", "in": "query", "schema": { "type": "string", "format": "date-time" }, "example": "2026-04-25T00:00:00Z" },
          { "name": "to", "in": "query", "schema": { "type": "string", "format": "date-time" }, "example": "2026-05-01T23:59:59Z" },
          { "name": "page", "in": "query", "schema": { "type": "integer", "default": 1 } },
          { "name": "limit", "in": "query", "schema": { "type": "integer", "default": 20 } }
        ],
        "responses": { "200": { "description": "Paginated location history" } }
      }
    },
    "/location/ping": {
      "post": {
        "tags": ["Location"],
        "summary": "Device posts GPS ping",
        "description": "DEVICE role only. Rate limited to 60 req/min. Atomically updates location_pings table and vehicle's last known location.",
        "security": [{ "BearerAuth": [] }],
        "requestBody": {
          "required": true,
          "content": { "application/json": { "schema": { "$ref": "#/components/schemas/LocationPingRequest" } } }
        },
        "responses": {
          "201": { "description": "Location ping recorded" },
          "400": { "description": "Validation error" },
          "403": { "description": "Not authorized / not own vehicle" },
          "404": { "description": "Vehicle not found for device" },
          "429": { "description": "Rate limit exceeded" }
        }
      }
    },
    "/location/live": {
      "get": {
        "tags": ["Location"],
        "summary": "All vehicles' last known locations",
        "description": "Returns latest position for all vehicles. Supports province/district filtering.",
        "security": [{ "BearerAuth": [] }],
        "parameters": [
          { "name": "province", "in": "query", "schema": { "type": "string" }, "example": "Western" },
          { "name": "district", "in": "query", "schema": { "type": "string" }, "example": "Colombo" },
          { "name": "page", "in": "query", "schema": { "type": "integer", "default": 1 } },
          { "name": "limit", "in": "query", "schema": { "type": "integer", "default": 20 } }
        ],
        "responses": { "200": { "description": "Paginated live locations" } }
      }
    },
    "/location/history": {
      "get": {
        "tags": ["Location"],
        "summary": "Bulk location history",
        "description": "Query location history across vehicles. Supports filtering by vehicleId, time window, province, district.",
        "security": [{ "BearerAuth": [] }],
        "parameters": [
          { "name": "vehicleId", "in": "query", "schema": { "type": "integer" } },
          { "name": "from", "in": "query", "schema": { "type": "string", "format": "date-time" } },
          { "name": "to", "in": "query", "schema": { "type": "string", "format": "date-time" } },
          { "name": "province", "in": "query", "schema": { "type": "string" } },
          { "name": "district", "in": "query", "schema": { "type": "string" } },
          { "name": "page", "in": "query", "schema": { "type": "integer", "default": 1 } },
          { "name": "limit", "in": "query", "schema": { "type": "integer", "default": 20 } }
        ],
        "responses": { "200": { "description": "Paginated location history" } }
      }
    },
    "/stats/overview": {
      "get": {
        "tags": ["Dashboard / Analytics"],
        "summary": "Dashboard overview",
        "description": "Total vehicles, currently active, counts by province and status.",
        "security": [{ "BearerAuth": [] }],
        "responses": { "200": { "description": "Overview statistics" } }
      }
    },
    "/stats/province/{id}": {
      "get": {
        "tags": ["Dashboard / Analytics"],
        "summary": "Province-level statistics",
        "description": "Vehicle counts, activity, and district breakdown for a specific province.",
        "security": [{ "BearerAuth": [] }],
        "parameters": [{ "name": "id", "in": "path", "required": true, "schema": { "type": "integer" } }],
        "responses": { "200": { "description": "Province statistics" }, "404": { "description": "Province not found" } }
      }
    }
  }
};