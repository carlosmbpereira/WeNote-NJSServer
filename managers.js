

function ControlPanelManager()
{
    this.cps = [];

    this.register = function(socket)
    {
        const cp = this.get(socket);
        if (cp != null)
            return cp;
        let new_cp = {
            socket: socket,
            notifications: []
        };
        this.cps.push(new_cp);
        return new_cp;
    }

    this.get = function(socket)
    {
        for (const cp of this.cps)
            if (cp.socket == socket)
                return cp;
        return null;
    }

    this.notify = function(socket, ntf_type, ntf_data)
    {
        const cp = this.get(socket);
        cp.notifications.push({
            type: ntf_type,
            data: ntf_data
        });
    }

    this.notify_all = function(ntf_type, ntf_data)
    {
        let ntf = {
            type: ntf_type,
            data: ntf_data
        };

        for (const cp of cps)
            cp.notifications.push(ntf);
    }

    this.dispatch_ntfs = function(io)
    {
        for (const cp of cps)
        {
            if (cp.notifications.length == 0)
                continue;
            io.to(cp.socket).emit("cpanel_update", cp.notifications);
            cp.notifications = [];
        }
    }
}



function UserManager()
{
    this.users = [];

    this.register = function(socket, user)
    {
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
        for (const u in this.users)
            if (u.socket == socket)
                return u;
        return null;
    }

    this.get_by_user_id = function(user_id)
    {
        for (const u in this.users)
            if (u.user_id = user_id)
                return u;
        return null;
    }

    this.notify = function(user_id, ntf_type, ntf_data)
    {
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


}
