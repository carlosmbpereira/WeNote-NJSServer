const { file_head, User, Board } = require("./types");
const { bulk, serialize, load } = require("./serialization");
const fs = require("fs");


exports.ServerData = function()
{
    // Constructor
    this.users = null;
    this.boards = null;
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

        if (fs.existsSync("database/boards"))
        {
            const board_file_data = fs.readFileSync("database/boards", "utf-8");
            this.boards = bulk.load(board_file_data, load.board);
        }
        else
            this.boards = [];

        if (fs.existsSync("database/ids"))
        {
            const ids_file_data = fs.readFileSync("database/ids", "utf-8");
            this.ids = bulk.load(ids_file_data, load.ids)[0];
        }
        else
            this.ids = {
                last_user_id: 0, last_board_id: 0, last_file_id: 0, last_ntf_id: 0
            };
    }

    this.save = function(callback)
    {
        let files_written = 0;
        const user_data = bulk.save(this.users, serialize.user);
        const board_data = bulk.save(this.boards, serialize.boards);
        const ids_data = serialize.ids(this.ids);

        let end_fn = () => {
            files_written += 1;
            if (files_written >= 3)
                callback();
        }

        fs.writeFile("database/users", user_data, end_fn);
        fs.writeFile("database/boards", board_data, end_fn);
        fs.writeFile("database/ids", ids_data, end_fn);
    }

    // Indicates if the database has been fully loaded.
    this.ready = function()
    {
        return this.users !== null && this.groups !== null && this.ids !== null;
    }


    // Data creation
    this.new_user = function(name, email, password)
    {
        let id = this.last_user_id + 1;
        this.last_user_id = id;
        let user = new User(id, name, email, password, []);
        this.users.push(user);
        return user;
    }

    this.new_board = function(owner_id, name)
    {
        let id = this.last_board_id + 1;
        this.last_board_id = id;
        let board = new Board(id, owner_id, name, [owner_id], []);
        this.boards.push(board);
        return board;
    }

    this.new_notification = function(user_id, contents)
    {
        let id = this.last_notification_id + 1;
        this.last_notification_id = id;
        let user = this.get_user(user_id);
        let not = new Notification(id, Date.now(), contents);
        user.notifications.push(not);
        return not;
    }


    this.delete_ntf = function(user_id, ntf_id)
    {
        const user = get_user(user_id);
        user.notifications = user.notifications.filter(ntf => ntf.id !== ntf_id);
    }
    


    this.board_new_file = function(socket, board_id, file_name)
    {
        let board = get_board(board_id);
        let new_file = {
            id: 0,
            name: file_name,
            time_create: Date.now(),
            time_update: Date.not(),
            contents: ""
        };
        board.files.add(new_file);

        for (const i in this.notifiers.boards)
        {
            if (this.notifiers.boards[i].id == board_id)
                this.notifiers.boards[i].notifications.push(
                    { 
                        type: NOTIF_BOARD_NEW_FILE, 
                        data: file_head(new_file)
                    });
        }
    }



    // Data queries
    this.user_public_data = function(user)
    {
        if (user === null)
            return null;
        return {
            id: user.id,
            name: user.name,
            email: user.email
        };
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

    this.boards_of_user = function(user_id)
    {
        let boards = [];
        for (const b of this.boards)
            if (b.users.indexOf(user_id) != -1)
                boards.push(b);
    }


    this.board_data = function(board)
    {
        if (board === null)
            return null;
        return {
            id: board.id,
            name: board.name,
        };
    }

    this.get_board = function(id)
    {
        for (const i in this.boards)
        {
            if (this.boards[i].id == id)
                return this.boards[i];
        }
        return null;
    }
}
