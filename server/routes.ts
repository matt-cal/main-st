import { ObjectId } from "mongodb";

import { Router, getExpressRouter } from "./framework/router";

import { Favorite, Friend, Like, Post, User, WebSession } from "./app";
import { LikeType } from "./concepts/like";
import { PostDoc, PostOptions } from "./concepts/post";
import { TagType } from "./concepts/tag";
import { UserDoc } from "./concepts/user";
import { WebSessionDoc } from "./concepts/websession";
import Responses from "./responses";

class Routes {
  @Router.get("/session")
  async getSessionUser(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    return await User.getUserById(user);
  }

  @Router.get("/users")
  async getUsers() {
    return await User.getUsers();
  }

  @Router.get("/users/:username")
  async getUser(username: string) {
    return await User.getUserByUsername(username);
  }

  @Router.post("/users")
  async createUser(session: WebSessionDoc, username: string, password: string) {
    WebSession.isLoggedOut(session);
    return await User.create(username, password);
  }

  @Router.patch("/users")
  async updateUser(session: WebSessionDoc, update: Partial<UserDoc>) {
    const user = WebSession.getUser(session);
    return await User.update(user, update);
  }

  @Router.delete("/users")
  async deleteUser(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    WebSession.end(session);
    return await User.delete(user);
  }

  @Router.post("/login")
  async logIn(session: WebSessionDoc, username: string, password: string) {
    const u = await User.authenticate(username, password);
    WebSession.start(session, u._id);
    return { msg: "Logged in!" };
  }

  @Router.post("/logout")
  async logOut(session: WebSessionDoc) {
    WebSession.end(session);
    return { msg: "Logged out!" };
  }

  @Router.get("/posts")
  async getPosts(author?: string) {
    let posts;
    if (author) {
      const id = (await User.getUserByUsername(author))._id;
      posts = await Post.getByAuthor(id);
    } else {
      posts = await Post.getPosts({});
    }
    return Responses.posts(posts);
  }

  @Router.post("/posts")
  async createPost(session: WebSessionDoc, content: string, options?: PostOptions) {
    const user = WebSession.getUser(session);
    const created = await Post.create(user, content, options);
    return { msg: created.msg, post: await Responses.post(created.post) };
  }

  @Router.patch("/posts/:_id")
  async updatePost(session: WebSessionDoc, _id: ObjectId, update: Partial<PostDoc>) {
    const user = WebSession.getUser(session);
    await Post.isAuthor(user, _id);
    return await Post.update(_id, update);
  }

  @Router.delete("/posts/:_id")
  async deletePost(session: WebSessionDoc, _id: ObjectId) {
    const user = WebSession.getUser(session);
    await Post.isAuthor(user, _id);
    return Post.delete(_id);
  }

  @Router.get("/friends")
  async getFriends(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    return await User.idsToUsernames(await Friend.getFriends(user));
  }

  @Router.delete("/friends/:friend")
  async removeFriend(session: WebSessionDoc, friend: string) {
    const user = WebSession.getUser(session);
    const friendId = (await User.getUserByUsername(friend))._id;
    return await Friend.removeFriend(user, friendId);
  }

  @Router.get("/friend/requests")
  async getRequests(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    return await Responses.friendRequests(await Friend.getRequests(user));
  }

  @Router.post("/friend/requests/:to")
  async sendFriendRequest(session: WebSessionDoc, to: string) {
    const user = WebSession.getUser(session);
    const toId = (await User.getUserByUsername(to))._id;
    return await Friend.sendRequest(user, toId);
  }

  @Router.delete("/friend/requests/:to")
  async removeFriendRequest(session: WebSessionDoc, to: string) {
    const user = WebSession.getUser(session);
    const toId = (await User.getUserByUsername(to))._id;
    return await Friend.removeRequest(user, toId);
  }

  @Router.put("/friend/accept/:from")
  async acceptFriendRequest(session: WebSessionDoc, from: string) {
    const user = WebSession.getUser(session);
    const fromId = (await User.getUserByUsername(from))._id;
    return await Friend.acceptRequest(fromId, user);
  }

  @Router.put("/friend/reject/:from")
  async rejectFriendRequest(session: WebSessionDoc, from: string) {
    const user = WebSession.getUser(session);
    const fromId = (await User.getUserByUsername(from))._id;
    return await Friend.rejectRequest(fromId, user);
  }

  @Router.get("/favorites")
  async getFavorites(owner?: string) {
    let favorites;
    if (owner) {
      const id = (await User.getUserByUsername(owner))._id;
      favorites = await Favorite.getByOwner(id);
    } else {
      favorites = await Favorite.getFavorites({});
    }
    return Responses.favorites(favorites);
  }

  @Router.post("/favorites")
  async createFavorite(session: WebSessionDoc, target: string) {
    const user = WebSession.getUser(session);
    const targetId = (await User.getUserByUsername(target))._id;
    const created = await Favorite.create(user, targetId);
    return { msg: created.msg, favorite: await Responses.favorite(created.favorite) };
  }

  @Router.delete("/favorites/:_id")
  async deleteFavorite(session: WebSessionDoc, _id: ObjectId) {
    const user = WebSession.getUser(session);
    await Favorite.isOwner(user, _id);
    return Favorite.delete(_id);
  }

  @Router.get("/likes/:username")
  async getUserLikes(type: LikeType, username: string) {
    const id = (await User.getUserByUsername(username))._id;
    const likes = await Like.getByOwner(id, type);
    return Responses.likes(likes);
  }

  @Router.get("/post/likes/:_id")
  async getPostLikes(type: LikeType, _id: ObjectId) {
    const id = (await Post.getPosts({ _id }))[0]._id;
    const likes = await Like.getByPost(id, type);
    return Responses.likes(likes);
  }

  // see if logged in user has liked given post
  @Router.get("/user/liked/:_id")
  async didUserLike(session: WebSessionDoc, type: LikeType, _id: ObjectId) {
    const user = WebSession.getUser(session);
    const postId = (await Post.getPosts({ _id }))[0]._id;
    return await Like.didUserLike(postId, user, type);
  }

  @Router.post("/likes/:_id")
  async createLike(session: WebSessionDoc, _id: ObjectId, type: LikeType) {
    const user = WebSession.getUser(session);
    const post = (await Post.getPosts({ _id }))[0]._id;
    const created = await Like.create(user, post, type);
    return { msg: created.msg, like: await Responses.like(created.like) };
  }

  @Router.delete("/likes/:_id")
  async deleteLike(session: WebSessionDoc, _id: ObjectId) {
    const user = WebSession.getUser(session);
    await Like.isOwner(user, _id);
    return Like.delete(_id);
  }

  @Router.patch("/likes/:_id")
  async updateLike(session: WebSessionDoc, _id: ObjectId, type: LikeType) {
    const user = WebSession.getUser(session);
    await Like.isOwner(user, _id);
    return Like.update(_id, type);
  }

  @Router.get("/tags")
  async getTags(target?: string, name?: string, type?: TagType) {}

  @Router.post("/tags/:_id")
  async createTag(session: WebSessionDoc, _id: ObjectId, type: TagType) {}

  @Router.delete("/tags/:_id")
  async deleteTag(session: WebSessionDoc, _id: ObjectId) {}
}

export default getExpressRouter(new Routes());
