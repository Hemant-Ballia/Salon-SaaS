/**
 * src/utils/pagination.js
 *
 * Reusable pagination utilities for Prisma queries.
 *
 * Usage in a service:
 *   const { skip, take, orderBy, meta } = parsePagination(req.query, total);
 *   const records = await prisma.model.findMany({ skip, take, orderBy });
 *   return sendPaginated(res, "Fetched", records, meta(records.length, total));
 */

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const SORT_ORDERS = ["asc", "desc"];

/**
 * Parse and sanitize pagination/sort parameters from request query.
 *
 * @param {object} query - req.query object
 * @param {string[]} [allowedSortFields=[]] - Fields allowed in sortBy
 * @returns {object} { page, limit, skip, take, sortBy, sortOrder, orderBy }
 */
export const parsePagination = (query = {}, allowedSortFields = []) => {
  // Page
  let page = parseInt(query.page, 10);
  if (!Number.isFinite(page) || page < 1) page = DEFAULT_PAGE;

  // Limit
  let limit = parseInt(query.limit, 10);
  if (!Number.isFinite(limit) || limit < 1) limit = DEFAULT_LIMIT;
  if (limit > MAX_LIMIT) limit = MAX_LIMIT;

  const skip = (page - 1) * limit;
  const take = limit;

  // Sort
  const rawSortBy = query.sortBy || "createdAt";
  const sortBy =
    allowedSortFields.length === 0 || allowedSortFields.includes(rawSortBy)
      ? rawSortBy
      : "createdAt";

  const rawSortOrder = (query.sortOrder || "desc").toLowerCase();
  const sortOrder = SORT_ORDERS.includes(rawSortOrder) ? rawSortOrder : "desc";

  const orderBy = { [sortBy]: sortOrder };

  return { page, limit, skip, take, sortBy, sortOrder, orderBy };
};

/**
 * Build the pagination metadata object for API responses.
 *
 * @param {number} total - Total number of matching records
 * @param {number} page - Current page
 * @param {number} limit - Page size
 * @returns {object} Pagination metadata
 */
export const buildPaginationMeta = (total, page, limit) => {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};

/**
 * Convenience: parse query params AND return metadata builder together.
 * The caller supplies `total` once it's known after the DB count query.
 *
 * @param {object} query - req.query
 * @param {string[]} [allowedSortFields=[]]
 * @returns {{ skip, take, orderBy, page, limit, sortBy, sortOrder, meta }}
 *   where meta(total) returns the pagination metadata object.
 */
export const paginate = (query = {}, allowedSortFields = []) => {
  const parsed = parsePagination(query, allowedSortFields);
  const meta = (total) => buildPaginationMeta(total, parsed.page, parsed.limit);
  return { ...parsed, meta };
};
