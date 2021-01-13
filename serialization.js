const fs = require("fs");

const udelim = "---af9whf0193h4f9hf913098fh---"

// Data creation helpers




sample_board = {
    id: 1,
    name: "Hello world!",
    users: [1, 2, 3],
    files: [
        {
            id: 1,
            creation_date: 10010203,
            update_date: 102301402,
            name: "Sample file!",
            contents: "This is a sample file\nand stuff.",
        },
        {
            id: 2,
            creation_date: 12994123,
            update_date: 120831084,
            name: "Sample file 2!",
            contents: "This is a sample file\nand stuff.",
        }
    ]
}

sample_user = {
    id: 1,
    name: "Alexandre",
    email: "alexandre@test.org",
    password: "1234",
    notifications: [
        {
            time: 19240123,
            message: "You have a new file!",
        },
    ]
}

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
        return this.data[ptr];
    }

    eob()
    {
        return this.ptr >= this.data.length
    }
}

const TYPE_INTEGER = 1
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



// Users

function load_user(nav_ctx)
{
    let obj = {};

    obj.id = extract(nav_ctx, TYPE_INTEGER);
    obj.name = extract(nav_ctx, TYPE_STRING);
    obj.email = extract(nav_ctx, TYPE_STRING);
    obj.password = extract(nav_ctx, TYPE_STRING);
    obj.notifications = [];
    while (true)
    {
        if (data[nav_ctx.ptr] == "]")
            break;
        let n = {};
        n.id = extract(nav_ctx, TYPE_INTEGER);
        n.time = extract(nav_ctx, TYPE_INTEGER);
        n.contents = extract(nav_ctx, TYPE_STRING);
        obj.notifications.push(n);
    }

    return obj;
}

function load_file(nav_ctx)
{
    const { data, ptr } = nav_ctx;
    let obj = {};
    obj.id = extract(nav_ctx, TYPE_INTEGER);
    obj.name = extract(nav_ctx, TYPE_STRING);
    obj.time_create = extract(nav_ctx, TYPE_INTEGER);
    obj.time_update = extract(nav_ctx, TYPE_INTEGER);
    obj.contents = extract(nav_ctx, TYPE_STRING);
    return obj;
}

function load_board(nav_ctx)
{
    let obj = {};
    obj.id = extract(nav_ctx, TYPE_INTEGER);
    obj.owner_id = extract(nav_ctx, TYPE_INTEGER);
    obj.name = extract(nav_ctx, TYPE_STRING);
    obj.users = [];
    while (true)
    {
        if (nav_ctx.peek() == "]")
            break;
        obj.users.push(extract(nav_ctx, TYPE_INTEGER));
    }

    obj.files = [];
    while (true)
    {
        if (nav_ctx.peek() == "]")
            break;
        obj.files.push(load_file(nav_ctx));
    }

    return obj;
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



// Conversions to storable data

function serialize_user(user)
{
    let arr = [];
    arr.push(user.id + " ");
    arr.push(user.name + udelim);
    arr.push(user.email + udelim);
    arr.push(user.password + udelim);
    for (const i in user.notifications)
    {
        arr.push(user.notifications[i].id + " ");
        arr.push(user.notifications[i].time + " ");
        arr.push(user.notifications[i].contents + udelim);
    }
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
    arr.push(file.name + udelim);
    arr.push(file.time_create + " ");
    arr.push(file.time_update + " ");
    arr.push(file.text + udelim);
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
        arr.push(fn_converter(boards[i]));
    return arr.join("");
}

function load_data(file_data, fn_load)
{
    let nav_ctx = new NavContext(file_data);
    let users = [];
    while (true)
    {
        if (nav_ctx.eob())
            return users;
        users.push(fn_load(nav_ctx));
    }
}



exports.save_data = save_data;
exports.load_data = load_data;

// Loaders
exports.load_ids = load_ids;

exports.create_user = create_user;
exports.create_file = create_file;
exports.create_group = create_group;
