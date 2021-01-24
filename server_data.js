const { file_head, User, Notification, File } = require("./types");
const { bulk, serialize, load } = require("./serialization");
const fs = require("fs");


exports.ServerData = function()
{
    // Constructor
    this.users = null;
    this.files = null;
    this.ids = null;



    this.load = function()
    {
        if (fs.existsSync("database/users"))
        {
            const user_file_data = fs.readFileSync("database/users", "utf-8");
            this.users = bulk.load(user_file_data, load.user);
        }
        else
            this.users = [];

        if (fs.existsSync("database/files"))
        {
            const file_file_data = fs.readFileSync("database/files", "utf-8");
            this.files = bulk.load(file_file_data, load.file);
        }
        else
            this.files = [];

        if (fs.existsSync("database/ids"))
        {
            const ids_file_data = fs.readFileSync("database/ids", "utf-8");
            this.ids = bulk.load(ids_file_data, load.ids)[0];
        }
        else
            this.ids = {
                last_user_id: 0, last_file_id: 0, last_ntf_id: 0
            };
    }

    this.save = function(callback)
    {
        let files_written = 0;
        const user_data = bulk.save(this.users, serialize.user);
        const file_data = bulk.save(this.files, serialize.file);
        const ids_data = serialize.ids(this.ids);

        let end_fn = () => {
            files_written += 1;
            if (files_written >= 3)
                callback();
        }

        if (!fs.existsSync("database"))
            fs.mkdirSync("database");
        fs.writeFile("database/users", user_data, end_fn);
        fs.writeFile("database/files", file_data, end_fn);
        fs.writeFile("database/ids", ids_data, end_fn);
    }



    // Data creation
    this.new_user = function(name, email, password)
    {
        let id = this.ids.last_user_id + 1;
        this.ids.last_user_id = id;
        let user = new User(id, name, email, password, []);
        this.users.push(user);
        return user;
    }

    this.new_notification = function(user_id, contents)
    {
        let id = this.ids.last_ntf_id + 1;
        this.ids.last_ntf_id = id;
        let user = this.get_user(user_id);
        let not = new Notification(id, user_id, Date.now(), contents);
        user.notifications.push(not);
        return not;
    }

    this.new_file = function(owner_id, title)
    {
        let id = this.ids.last_file_id + 1;
        this.ids.last_file_id = id;

        let time = Date.now();
        let new_file = new File(id, owner_id, title, time, time);
        this.files.push(new_file);
        return new_file;
    }


    this.delete_ntf = function(user_id, ntf_id)
    {
        const user = this.get_user(user_id);
        user.notifications = user.notifications.filter(ntf => ntf.id !== ntf_id);
    }

    this.delete_file = function(file_id)
    {
        let file = this.get_file(file_id);
        if (file == null)
            return null;
        this.files = this.files.filter(f => f.id !== file_id);
        return file;
    }
    




    this.get_user_login = function(email, password)
    {
        const user = this.get_user_email(email);
        if (user === null)
            return null;
        if (user.password != password)
            return null;
        return user;
    }

    this.get_user = function(id)
    {
        for (const i in this.users)
        {
            if (this.users[i].id == id)
                return this.users[i];
        }
        return null;
    }

    this.get_user_email = function(email)
    {
        for (const i in this.users)
        {
            if (this.users[i].email == email)
                return this.users[i];
        }
        return null;
    }

    this.get_file = function(file_id)
    {
        for (const i in this.files)
            if (this.files[i].id == file_id)
                return this.files[i];
        return null;
    }

    this.files_of_user = function(user_id)
    {
        let files = [];
        for (const f of this.files)
            if (f.user_in(user_id))
                files.push(f);
        return files;
    }

    this.users_of_file = function(file_id)
    {
        let file = this.get_file(file_id);
        if (file === null)
            return null;
        return file.users;
    }



    this.update_file_contents = function(file_id, contents)
    {
        let file = this.get_file(file_id);
        if (file === null)
            return null;
        file.time_update = Date.now();
        file.contents = contents;
        return file;
    }

    this.update_file_name = function(file_id, name)
    {
        let file = this.get_file(file_id);
        if (file === null)
            return null;
        file.name = name;
        return file;
    }
}
