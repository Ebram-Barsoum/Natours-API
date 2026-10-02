import { Query } from "mongoose";

class APIFeatures<T> {
  private DBQuery: Query<T[], T>; // mongoDB query
  private queryObject: Record<string, any> = {}; // raw query object
  private filterObject: Record<string, unknown> = {};

  constructor(DBQuery: Query<T[], T>, query: Record<string, any>) {
    let queryString = JSON.stringify(query);
    queryString = queryString.replace(
      /\b(gte|gt|lte|lt)\b/g,
      (matched) => `$${matched}`,
    );

    this.DBQuery = DBQuery;
    this.queryObject = JSON.parse(queryString);
  }

  private escapeRegex(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  private applyFilters(): void {
    this.DBQuery = this.DBQuery.find(this.filterObject);
  }

  public filter(filterBy: string[]): APIFeatures<T> {
    filterBy.forEach((filter) => {
      const providedFilterValue = this.queryObject[filter];

      if (providedFilterValue) {
        this.filterObject[filter] = providedFilterValue;
      }
    });

    return this; // to allow chaining
  }

  public search(applyOn: string[]): APIFeatures<T> {
    const search = this.queryObject.search;

    if (search) {
      const searchFilter = {
        $or: applyOn.map((field) => ({
          [field]: {
            $regex: this.escapeRegex(search),
            $options: "i", // case-insensitive
          },
        })),
      };

      Object.assign(this.filterObject, searchFilter);
    }

    return this; // to allow chaining
  }

  public sort(): APIFeatures<T> {
    if (this.queryObject.sort) {
      // Prevent parameter pollution by converting array to string

      const sortBy = Array.isArray(this.queryObject.sort)
        ? this.queryObject.sort.join(" ")
        : this.queryObject.sort.split(",").join(" ");

      this.DBQuery = this.DBQuery.sort(sortBy);
    } else {
      this.DBQuery = this.DBQuery.sort("-createdAt");
    }

    return this; // to allow chaining
  }

  public limitFields(): APIFeatures<T> {
    if (this.queryObject.fields) {
      const fields = this.queryObject.fields.split(",").join(" ");
      this.DBQuery = this.DBQuery.select(fields);
    } else {
      this.DBQuery = this.DBQuery.select("-__v");
    }

    return this; // to allow chaining
  }

  public paginate(): APIFeatures<T> {
    const page = +(this.queryObject.page || "1") * 1;
    const limit = +(this.queryObject.limit || "100") * 1;
    const skip = (page - 1) * limit;

    this.DBQuery = this.DBQuery.skip(skip).limit(limit);

    return this; // to allow chaining
  }

  public async executeQuery(): Promise<any> {
    // explain() will return the query analysis
    // const results = await this.DBQuery.explain();

    this.applyFilters();
    const results = await this.DBQuery;

    return results; // to allow chaining
  }

  public async getDocumentsCount(): Promise<number> {
    return this.DBQuery.model.countDocuments(this.filterObject);
  }
}

export default APIFeatures;
