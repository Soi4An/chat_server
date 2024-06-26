"use strict";

const { ErrorApi } = require("../exceptions/ErrorApi");
const { chatsService } = require("../services/chatsService");
const { userService } = require("../services/userService");
const { sockets } = require("../exceptions/SocketManager");

const usersLogining = new Set();

async function login(req, res) {
  const { name } = req.body;

  if (!name) {
    throw ErrorApi.BadRequest("User name mustn't be empty");
  }

  if (sockets.isOnline(name)) {
    throw ErrorApi.Conflict();
  }

  const foundUser = await userService.getByName(name);
  const userIsLoading = usersLogining.has(name);

  if (userIsLoading) {
    throw ErrorApi.Conflict();
  }

  if (!foundUser) {
    usersLogining.add(name);

    const newUser = await userService.createByName(name);
    const normalizedNewUser = userService.normalize(newUser);

    usersLogining.delete(name);

    return res.status(201).send({
      ...normalizedNewUser,
      chats: [],
    });
  }

  const normalizedUser = userService.normalize(foundUser);
  const userChats = await chatsService.getByUser(name);

  if (!userChats) {
    throw ErrorApi.NotFound("chats of the user");
  }

  return res.status(200).send({
    ...normalizedUser,
    chats: userChats,
  });
}

async function getAllNames(req, res) {
  const names = await userService.getAllNames();

  res.status(200).send(names);
}

const userController = {
  login,
  getAllNames,
};

module.exports = { userController };
