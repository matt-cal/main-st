import { Filter, ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";

export interface FavoriteDoc extends BaseDoc {
  owner: ObjectId;
  target: ObjectId;
}

export default class FavoriteConcept {
  public readonly favorites = new DocCollection<FavoriteDoc>("favorites");

  async create(owner: ObjectId, target: ObjectId) {
    if (owner.toString() == target.toString()) {
      throw new NotAllowedError("Cannot favorite your own account!");
    }
    const _id = await this.favorites.createOne({ owner, target });
    return { msg: "Favorited successfully!", favorite: await this.favorites.readOne({ _id }) };
  }

  async getFavorites(query: Filter<FavoriteDoc>) {
    const favorites = await this.favorites.readMany(query, {
      sort: { dateUpdated: -1 },
    });
    return favorites;
  }

  async getByOwner(owner: ObjectId) {
    return await this.getFavorites({ owner });
  }

  async delete(_id: ObjectId) {
    await this.favorites.deleteOne({ _id });
    return { msg: "Favorite deleted successfully!" };
  }

  // assert favorite with given id exists and the owner is given user
  async isOwner(user: ObjectId, _id: ObjectId) {
    const favorite = await this.favorites.readOne({ _id });
    if (!favorite) {
      throw new NotFoundError(`Favorite ${_id} does not exist!`);
    }
    if (favorite.owner.toString() !== user.toString()) {
      throw new FavoriteOwnerNotMatchError(user, _id);
    }
  }
}

export class FavoriteOwnerNotMatchError extends NotAllowedError {
  constructor(
    public readonly owner: ObjectId,
    public readonly _id: ObjectId,
  ) {
    super("{0} is not the owner of favorite {1}!", owner, _id);
  }
}
