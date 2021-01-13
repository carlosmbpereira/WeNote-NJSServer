const { file_head } = require("./types");



exports.ServerData = function()
{
    // Constructor
    this.users = null;
    this.boards = null;
    this.ids = null;


    this.used_files = [];

    this.notifiers = {
        boards: [],
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
        return {
            id: id,
            name: name,
            email: email,
            password: password,
            notifications: []
        };
    }

    this.new_board = function(name)
    {
        let id = this.last_board_id + 1;
        this.last_board_id = id;
        return {
            id: id,
            name: name,
            users: [],
            files: []
        };
    }

    this.new_notification = function(user_id, contents)
    {
        let id = this.last_notification_id + 1;
        this.last_notification_id = id;
        let user = this.get_user(user_id);
        let not = {
            id: user_id,
            time: Date.now(),
            contents: contents,
        };
        user.notifications.push(not);
        return not;
    }


    this.delete_ntf = function(user_id, ntf_id)
    {
        const user = get_user(user_id);
        user.notifications = user.notifications.filter(ntf => ntf.id !== ntf_id);
    }
    

    

    this.save = function()
    {
        
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
