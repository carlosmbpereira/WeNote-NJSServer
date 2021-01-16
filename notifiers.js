exports.NTF_TYPE = {
    BOARD_NEW_FILE: 0,
    BOARD_NEW_USER: 1,
    BOARD_DEL_FILE: 2,
    BOARD_UPDATE_FILE: 3,
    
    USER_NEW_NTF: 0,
    USER_BOARD_ADD: 1,
    USER_BOARD_REMOVE: 2,
}


function NetNtf(type, data)
{
    this.type = type;
    this.data = data;
}



function N_Generic(id)
{
    this.id = id;
    this.users = [];
    this.notifications = [];


    this.add = function(socket)
    {
        this.users.push(socket);
    }

    this.remove = function(socket)
    {
        this.users = this.users.filter(v => v !== socket);
    }

    this.notify = function(type, data)
    {
        this.notifications.push({
            type: type,
            data: data
        });
    }

    // Send all messages and clear the message buffer
    this.dispatch = function(message, io)
    {
        if (this.notifications.length == 0)
            return;
        for (const n of this.notifications)
            for (const u of this.users)
                io.to(u).emit(message, n);
        this.notifications = [];
    }
}

// Manages several notifiers
function NList_Generic()
{
    this.notifiers = [];

    this.add = function(socket, id)
    {
        this.get_notifier(id).add(socket);
    }

    this.remove = function(socket, id)
    {
        this.get_notifier(id).remove(socket);
    }

    this.remove_all = function(socket)
    {
        for (const n of this.notifiers)
            n.remove(socket);
    }

    this.notify = function(id, type, data)
    {
        this.get_notifier(id).notify(type, data);
    }

    this.dispatch = function(message, io)
    {
        this.notifiers.forEach(notifier => {
            notifier.dispatch(message, io);
        });
    }


    this.get_notifier = function(id)
    {
        let index = -1;
        for (const i in this.notifiers)
        {
            if (this.notifiers[i].id == id)
            {
                index = i;
                break;
            }
        }

        if (index != -1)
            return this.notifiers[index];
        
        let new_notifier = new N_Generic(id);
        this.notifiers.push(new_notifier);
        return new_notifier;
    }
}

function UserNtfHandler()
{
    this.users = [];

    this.register = function(socket, user_id)
    {
        const u = this.get_by_socket(socket);
        if (u !== null)
            return;
        this.users.push({
            socket: socket,
            user_id: user_id,
            notifications: []
        });
    }

    this.unregister = function(socket)
    {
        this.users = this.users.filter(u => u.socket !== socket);
    }

    this.get_by_socket = function(socket)
    {
        for (const u of this.users)
            if (u.socket == socket)
                return u;
        return null;
    }

    this.get_by_id = function(user_id)
    {
        for (const u of this.users)
            if (u.user_id == user_id)
                return u;
        return null;
    }

    this.notify = function(user_id, ntf_type, data)
    {
        const user = this.get_by_id(user_id);
        if (user == null)
            return;
        user.notifications.push({ type: ntf_type, data:data });
    }

    this.dispatch = function(io)
    {
        for (const u of this.users)
        {
            if (u.notifications.length == 0)
                continue;
            io.to(u.socket).emit("user_update", u.notifications);
            u.notifications = [];
        }
    }
}


function BoardNtfHandler()
{
    this.boards = [];

    this.register = function(board_id, socket)
    {
        let board = this.ensure_board(board_id);
        for (const s of board.clients)
            if (s == socket)
                return;
        board.clients.push(socket);
    }

    this.unregister = function(board_id, socket)
    {
        let board = this.get_board(board_id);
        board.clients = board.clients.filter(c => c !== socket);
        if (board.clients.length == 0)
            this.boards = this.boards.filter(board => board.board_id !== board_id);
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
        const board = this.get_board(board_id);
        if (board !== null)
            return board;
        let new_board = {
            board_id: board_id,
            clients: [],
            notifications: []
        };
        this.boards.push(new_board);
        return new_board;
    }

    this.notify = function(board_id, ntf_type, data)
    {
        let board = this.get_board(board_id);
        if (board === null)
            return;
        board.notifications.push({type: ntf_type, data: data});
    }

    this.dispatch = function(io)
    {
        for (const b of this.boards)
        {
            if (b.notifications.length == 0)
                continue;
            for (const client of b.clients)
                io.to(client).emit("board_update", b.notifications);
            b.notifications = [];
        }
    }
}


exports.UserNtfHandler = UserNtfHandler;
exports.BoardNtfHandler = BoardNtfHandler;
