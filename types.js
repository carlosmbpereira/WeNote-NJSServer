
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
    this.flag_online = false;

    this.public_data = function()
    {
        return {
            id: this.id,
            name: this.name,
            email: this.email,
            flag_online: this.flag_online,
        };
    }

    this.personal_data = function()
    {
        return {
            id: this.id,
            name: this.name,
            email: this.email,
            notifications: this.notifications,
            flag_online: this.flag_online,
        };
    }
}



function File(
    id,
    owner_id,
    name,
    time_create = Date.now(),
    time_update = Date.now(),
    users = [],
    contents = ""
) {
    this.id = id;
    this.owner_id = owner_id;
    this.name = name;
    this.time_create = time_create;
    this.time_update = time_update;
    this.users = users;
    this.contents = contents;
    this.flag_edit = false;

    this.header = function()
    {
        return {
            id: this.id,
            owner_id: this.owner_id,
            name: this.name,
            time_create: this.time_create,
            time_update: this.time_update,
            flag_edit: this.flag_edit,
        };
    }

    // Returns true if the given user has access to the file.
    this.user_in = function(user_id)
    {
        if (owner_id == user_id)
            return true;
        for (let u of this.users)
            if (u == user_id)
                return true;
        return false;
    }

    // Returns a list of user ids associated with this file. This is not the 
    // same as querying the 'user' field, because the owner will be added.
    this.get_users = function()
    {
        let users = [...this.users];
        users.push(this.owner_id);
        return users;
    }
}



/** Unused **/
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
            name: this.name,
        };
    }
}



function Notification(
    id,
    user_id,
    time,
    contents
) {
    this.id = id;
    this.user_id = user_id;
    this.time = time;
    this.contents = contents;
}



exports.User = User;
exports.Board = Board;
exports.File = File;
exports.Notification = Notification;
