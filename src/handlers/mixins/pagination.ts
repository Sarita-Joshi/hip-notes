import { z } from "zod";

/**
 * Zod schema for pagination and filtering query parameters
 * Used with sanitizeQueryParams to validate list endpoint requests
 */
export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  sort: z
    .enum(["createdAt", "-createdAt", "title", "-title", "updatedAt", "-updatedAt"])
    .default("-createdAt"),
});

/**
 * Type for validated pagination query parameters
 */
export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;

/**
 * Build a paginated response object
 *
 * @param data - Array of items to return
 * @param total - Total number of items (without pagination)
 * @param page - Current page number
 * @param limit - Items per page
 * @returns Paginated response with data and pagination metadata
 */
export function buildPaginationResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
) {
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
