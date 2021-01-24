const fs = require("fs");
const { User, File, Board, Notification } = require("./types");

const udelim = "---af9whf0193h4f9hf913098fh---"



// Loading data from files

class NavContext
{
    constructor(data, ptr = 0)
    {
        this.data = data;
        this.ptr = ptr;
    }

    peek()
    {
        return this.data[this.ptr];
    }

    eob()
    {
        return this.ptr >= this.data.length
    }
}

const TYPE_INTEGER = 0
const TYPE_STRING = 1

function extract(nav_ctx, type)
{
    const { data, ptr } = nav_ctx;
    let end = 0;

    if (type == TYPE_INTEGER)
    {
        let end = data.indexOf(" ", ptr);
        if (end == -1)
            return null;
        let value = parseInt(data.substring(ptr, end));
        nav_ctx.ptr = end + 1;
        return value;
    }
    if (type == TYPE_STRING)
    {
        let end = data.indexOf(udelim, ptr);
        if (end == -1)
            return null;
        let value = data.substring(ptr, end);
        nav_ctx.ptr = end + udelim.length;
        return value;
    }
    return null;
}



// Loaders

function load_user(nav_ctx)
{
    let id = extract(nav_ctx, TYPE_INTEGER);
    let name = extract(nav_ctx, TYPE_STRING);
    let email = extract(nav_ctx, TYPE_STRING);
    let password = extract(nav_ctx, TYPE_STRING);
    let notifications = [];
    while (nav_ctx.peek() != "]")
        notifications.push(load_notification(id, nav_ctx));
    nav_ctx.ptr += 1;
    return new User(id, name, email, password, notifications);
}

function load_file(nav_ctx)
{
    let id = extract(nav_ctx, TYPE_INTEGER);
    let owner_id = extract(nav_ctx, TYPE_INTEGER);
    let name = extract(nav_ctx, TYPE_STRING);
    let time_create = extract(nav_ctx, TYPE_INTEGER);
    let time_update = extract(nav_ctx, TYPE_INTEGER);
    let users = [];
    while (nav_ctx.peek() != "]")
        users.push(extract(nav_ctx, TYPE_INTEGER));
    nav_ctx.ptr += 1;
    let contents = extract(nav_ctx, TYPE_STRING);
    return new File(id, owner_id, name, time_create, time_update, users, contents);
}

function load_board(nav_ctx)
{
    let id = extract(nav_ctx, TYPE_INTEGER);
    let owner_id = extract(nav_ctx, TYPE_INTEGER);
    let name = extract(nav_ctx, TYPE_STRING);
    let users = [];
    let files = [];
    while (nav_ctx.peek() != "]")
        users.push(extract(nav_ctx, TYPE_INTEGER));
    nav_ctx.ptr += 1;
    while (nav_ctx.peek() != "]")
        files.push(load_file(nav_ctx));
    nav_ctx.ptr += 1;
    return new Board(id, owner_id, name, users, files);
}

function load_notification(user_id, nav_ctx)
{
    let id = extract(nav_ctx, TYPE_INTEGER);
    let time = extract(nav_ctx, TYPE_INTEGER);
    let contents = extract(nav_ctx, TYPE_STRING);
    return new Notification(id, user_id, time, contents);
}

function load_ids(nav_ctx)
{
    let obj = {};
    obj.last_user_id = extract(nav_ctx, TYPE_INTEGER);
    obj.last_board_id = extract(nav_ctx, TYPE_INTEGER);
    obj.last_file_id = extract(nav_ctx, TYPE_INTEGER);
    obj.last_ntf_id = extract(nav_ctx, TYPE_INTEGER);
    return obj;
}



// Serialization

function serialize_user(user)
{
    let arr = [];
    arr.push(user.id + " ");
    arr.push(user.name + udelim);
    arr.push(user.email + udelim);
    arr.push(user.password + udelim);
    for (const n of user.notifications)
        arr.push(serialize_notification(n));
    arr.push("]");
    return arr.join("");
}

function serialize_board(board)
{
    let arr = [];
    arr.push(board.id + " ");
    arr.push(board.owner_id + " ");
    arr.push(board.name + udelim);

    for (const i in board.users)
        arr.push(board.users[i] + " ");
    arr.push("]");

    for (const i in board.files)
        arr.push(serialize_file(board.files[i]));
    arr.push("]");

    return arr.join("");
}

function serialize_file(file)
{
    let arr = [];
    arr.push(file.id + " ");
    arr.push(file.owner_id + " ");
    arr.push(file.name + udelim);
    arr.push(file.time_create + " ");
    arr.push(file.time_update + " ");
    for (const n of file.users)
        arr.push(n + " ");
    arr.push("]");
    arr.push(file.contents + udelim);
    return arr.join("");
}

function serialize_notification(notification)
{
    let arr = [];
    arr.push(notification.id + " ");
    arr.push(notification.time + " ");
    arr.push(notification.contents + udelim);
    return arr.join("");
}

function serialize_ids(ids)
{
    let arr = [];
    arr.push(ids.last_user_id + " ");
    arr.push(ids.last_board_id + " ");
    arr.push(ids.last_file_id + " ");
    arr.push(ids.last_ntf_id + " ");
    return arr.join("");
}



// File interaction

function save_data(data, fn_converter)
{
    let arr = [];
    for (const i in data)
        arr.push(fn_converter(data[i]));
    return arr.join("");
}

function load_data(file_data, fn_load)
{
    let nav_ctx = new NavContext(file_data);
    let users = [];
    while (!nav_ctx.eob())
        users.push(fn_load(nav_ctx));
    return users;
}



exports.bulk = {};
exports.bulk.save = save_data;
exports.bulk.load = load_data;

exports.load = {};
exports.load.user = load_user;
exports.load.file = load_file;
exports.load.board = load_board;
exports.load.notifications = load_notification;
exports.load.ids = load_ids;
exports.serialize = {};
exports.serialize.user = serialize_user;
exports.serialize.file = serialize_file;
exports.serialize.board = serialize_board;
exports.serialize.notifications = serialize_notification;
exports.serialize.ids = serialize_ids;
