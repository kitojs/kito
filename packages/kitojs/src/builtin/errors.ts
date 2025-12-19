import { error } from "../errors/builder";

export const KitoErrors = {
  RouteNotFound: error("ROUTE_NOT_FOUND")
    .status(404)
    .message("Route not found")
    .build(),

  MethodNotAllowed: error("METHOD_NOT_ALLOWED")
    .status(405)
    .data<{ allowed: string[] }>()
    .message(
      (data) =>
        `Method not allowed. Allowed methods: ${data.allowed.join(", ")}`,
    )
    .build(),

  PayloadTooLarge: error("PAYLOAD_TOO_LARGE")
    .status(413)
    .data<{ limit: string }>()
    .message((data) => `Payload too large. Limit: ${data.limit}`)
    .build(),

  InternalServerError: error("INTERNAL_SERVER_ERROR")
    .status(500)
    .message("Internal Server Error")
    .build(),

  BadRequest: error("BAD_REQUEST").status(400).message("Bad Request").build(),
};
