
function Client(socket)
{
    this.socket = socket;
    this.net_ntfs = [];

    this.notify = function(net_ntf)
    {
        this.net_ntfs.push(net_ntf);
    }

    this.dispatch = function(io, message)
    {
        if (this.net_ntfs.length == 0)
            return;
        io.to(this.socket).emit(message, this.net_ntfs);
        this.net_ntfs = [];
    }
}


function ControlPanelManager()
{
    this.cps = [];

    this.register = function(socket)
    {
        const cp = this.get(socket);
        if (cp != null)
            return cp;
        let new_cp = new Client(socket);
        this.cps.push(new_cp);
        return new_cp;
    }

    this.pop = function(socket)
    {
        let index = this.cps.findIndex(cp => cp.socket == socket);
        if (index == -1)
            return null;
        const cp = this.cps[index];
        this.cps.splice(index, 1);
        return cp;
    }

    this.get = function(socket)
    {
        for (const cp of this.cps)
            if (cp.socket == socket)
                return cp;
        return null;
    }

    this.notify = function(socket, net_ntf)
    {
        const cp = this.get(socket);
        cp.notify(net_ntf);
    }

    this.notify_all = function(net_ntf)
    {
        for (const cp of cps)
            cp.notifications.push(net_ntf);
    }

    this.dispatch = function(io)
    {
        for (const cp of cps)
            cp.dispatch(io, "cpanel_update");
    }
}



function UserManager()
{
    this.users = [];

    this.register = function(socket, user)
    {
        console.log("adding: ", user.id);
        let u = {
            socket: socket,
            user_id: user.id,
            user_data: user,
            notifications: [],
            using: {
                board_id: null,
                file_read_id: null,
                file_edit_id: null
            }
        }
        this.users.push(u);
    }


    this.pop = function(socket)
    {
        for (const index in this.users)
        {
            if (this.users[index].socket == socket)
            {
                const user = this.users[index];
                this.users.splice(index, 1);
                return user;
            }
        }
        return null;
    }

    this.get_by_socket = function(socket)
    {
        for (const u of this.users)
            if (u.socket == socket)
                return u;
        return null;
    }

    this.get_by_user_id = function(user_id)
    {
        for (const u of this.users)
            if (u.id = user_id)
                return u;
        return null;
    }

    this.notify = function(user_id, ntf_type, ntf_data)
    {
        console.log(user_id);
        const user = this.get_by_user_id(user_id);
        let ntf = {type: ntf_type, data: ntf_data};
        user.notifications.push(ntf);
    }

    this.dispatch_ntfs = function(io)
    {
        for (const user of this.users)
        {
            if (user.notifications.length == 0)
                continue;
            io.to(user.socket).emit("user_update", user.notifications);
            user.notifications = [];
        }
    }
}



function BoardManager()
{
    this.boards = [];

    this.register = function(board_id, socket)
    {
        const board = this.ensure_board(board_id);
        board.clients.push(socket);
        return board;
    }

    this.unregister = function(board, socket)
    {
        for (const i in board.clients)
            if (board.clients[i] == socket)
            {
                board.clients.splice(i, 1);
                return;
            }
    }

    this.get_board = function(board_id)
    {
        for (const b of this.boards)
            if (b.board_id == board_id)
                return b;
        return null;
    }

    this.ensure_board = function(board_id)
    {
        const b = get_board(board_id);
        if (b !== null)
            return b;
        let new_board = {
            board_id: board_id,
            clients: [],
            notifications: []
        };
        this.boards.push(new_board);
        return new_board;
    }

    this.notify = function(board_id, ntf_type, ntf_data)
    {
        const board = this.get_board(board_id);
        if (board === null)
            return;
        board.notifications.push({type: ntf_type, data: ntf_data});
    }
}



function FileManager()
{
    this.files = [];

    /*this.sample = {
        file: file,
        clients: []
    }*/
}


exports.UserManager = UserManager;
exports.BoardManager = BoardManager;
