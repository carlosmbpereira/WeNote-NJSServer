
function User(
    id,
    name,
    email,
    password,
    notifications = []
) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.password = password;
    this.notifications = notifications;

    this.public_data = function()
    {
        return {
            id: this.id,
            name: this.name,
            email: this.email
        };
    }

    this.personal_data = function()
    {
        return {
            id: this.id,
            name: this.name,
            email: this.email,
            notifications: this.notifications
        };
    }
}



function File(
    id,
    name,
    time_create = Date.now(),
    time_update = Date.now(),
    contents = ""
) {
    this.id = id;
    this.name = name;
    this.time_create = time_create;
    this.time_update = time_update;
    this.contents = contents;

    this.header = function()
    {
        return {
            id: this.id,
            name: this.name,
            time_create: this.create,
            time_update: this.update
        };
    }
}



function Board(
    id,
    owner_id,
    name,
    users = [],
    files = []
) {
    this.id = id;
    this.owner_id = owner_id;
    this.name = name;
    this.users = users;
    this.files = files;

    this.header = function()
    {
        return {
            id: this.id,
            owner_id: this.owner_id,
            name: this.name
        };
    }
}



function Notification(
    id,
    time,
    contents
) {
    this.id = id;
    this.time = time;
    this.contents = contents;
}



exports.User = User;
exports.Board = Board;
exports.File = File;
exports.Notification = Notification;