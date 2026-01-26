import { Types } from 'mongoose';
import { Query } from 'mongoose';
import { decodeCursor, isValidCursor } from './cursorUtils';

interface QueryString {
  limit?: string;
  sort?: string;
  page?: string;
  fields?: string;
  search?: string;
  reverse?: string;
  cursor?: string;
  direction?: 'before' | 'after';
  [key: string]: any;
}

/**
 * API Features class for building MongoDB queries with filtering, sorting, pagination, and cursor-based pagination
 */
class APIFeatures {
  query: Query<any[], any>;
  queryString: QueryString;

  constructor(query: Query<any[], any>, queryString: QueryString) {
    this.query = query;
    this.queryString = queryString;
  }

  /**
   * Apply filters from query string, excluding pagination and sorting fields
   */
  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = [
      'limit',
      'sort',
      'page',
      'fields',
      'search',
      'reverse',
      'cursor',
      'direction',
    ];
    excludedFields.forEach((el) => delete queryObj[el]);

    // Advanced filtering with operators (gt, gte, lt, lte, ne)
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(
      /\b(gt|gte|lt|lte|ne)\b/gi,
      (match) => `$${match}`
    );
    this.query = this.query.find(JSON.parse(queryStr));
    return this;
  }

  /**
   * Apply sorting to the query
   */
  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  /**
   * Limit fields returned in the query
   */
  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }

  /**
   * Apply offset-based pagination (legacy support)
   */
  paginate() {
    const page = Number(this.queryString.page) || 1;
    const limit = Number(this.queryString.limit) || 100;
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);
    return this;
  }

  /**
   * Cursor-based pagination for bidirectional loading
   * - 'before': Load messages older than cursor (for scrolling up)
   * - 'after': Load messages newer than cursor (for scrolling down)
   * Messages are always returned in chronological order (oldest first)
   * Uses cursor encoding/decoding for stable ordering with createdAt + id
   */
  cursorPaginate() {
    const limit = Number(this.queryString.limit) || 20;
    const cursor = this.queryString.cursor;
    const direction = this.queryString.direction || 'before';

    if (cursor) {
      let cursorObjectId: Types.ObjectId | null = null;
      let cursorCreatedAt: Date | null = null;

      // Try to decode cursor if it's base64 encoded
      try {
        if (isValidCursor(cursor)) {
          const decoded = decodeCursor(cursor);
          if (Types.ObjectId.isValid(decoded.id)) {
            cursorObjectId = new Types.ObjectId(decoded.id);
            cursorCreatedAt = new Date(decoded.createdAt);
          }
        } else if (Types.ObjectId.isValid(cursor)) {
          // Fallback: treat as ObjectId (for backward compatibility)
          cursorObjectId = new Types.ObjectId(cursor);
        }
      } catch {
        // Invalid cursor, will proceed without it
      }

      if (cursorObjectId && cursorCreatedAt) {
        // Use createdAt + id for stable ordering
        if (direction === 'before') {
          // Load messages older than cursor (scroll up to see older messages)
          // Sort by createdAt descending, then _id descending
          this.query = this.query
            .find({
              $or: [
                { createdAt: { $lt: cursorCreatedAt } },
                {
                  createdAt: cursorCreatedAt,
                  _id: { $lt: cursorObjectId },
                },
              ],
            })
            .sort({ createdAt: -1, _id: -1 })
            .limit(limit + 1);
        } else if (direction === 'after') {
          // Load messages newer than cursor (scroll down to see newer messages)
          // Sort by createdAt ascending, then _id ascending
          this.query = this.query
            .find({
              $or: [
                { createdAt: { $gt: cursorCreatedAt } },
                {
                  createdAt: cursorCreatedAt,
                  _id: { $gt: cursorObjectId },
                },
              ],
            })
            .sort({ createdAt: 1, _id: 1 })
            .limit(limit + 1);
        }
      } else if (cursorObjectId) {
        // Fallback: use only _id (backward compatibility)
        if (direction === 'before') {
          this.query = this.query
            .find({ _id: { $lt: cursorObjectId } })
            .sort({ _id: -1 })
            .limit(limit + 1);
        } else if (direction === 'after') {
          this.query = this.query
            .find({ _id: { $gt: cursorObjectId } })
            .sort({ _id: 1 })
            .limit(limit + 1);
        }
      }
    } else {
      // No cursor: initial load
      if (direction === 'after') {
        // Get oldest messages first
        this.query = this.query.sort({ createdAt: 1, _id: 1 }).limit(limit + 1);
      } else {
        // Get newest messages first (default)
        this.query = this.query.sort({ createdAt: -1, _id: -1 }).limit(limit + 1);
      }
    }

    return this;
  }

  /**
   * Apply search filter
   */
  search(query: Record<string, any>) {
    if (this.queryString.search) {
      this.query = this.query.find(query);
    }
    return this;
  }
}

export default APIFeatures;
