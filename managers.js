const { STATUS, NTF_TYPE } = require("./messages");

/**
 * Manages the logged in users, and is responsible for issuing and sending user
 * update notifications.
 */
function LoginManager()
{
    this.logins = [];

    this.login = function(socket, user_id)
    {
        this.logins.push({socket: socket, user_id: user_id, netntfs: []});
    }

    this.logout = function(socket)
    {
        let index = -1;
        for (let i in this.logins)
            if (this.logins[i].socket === socket)
            {
                index = i;
                break;
            }
        if (index == -1)
            return null;
        let user_id = this.logins[index].user_id;
        this.logins.splice(index, 1);
        return user_id;
    }

    this.logout_uid = function(user_id)
    {
        let index = -1;
        for (let i in this.logins)
            if (this.logins[i].user_id === user_id)
            {
                index = i;
                break;
            }
        if (index == -1)
            return null;
        this.logins.splice(index, 1);
        return user_id;
    }

    this.get_user = function(user_id)
    {
        for (let u of this.logins)
            if (u.user_id == user_id)
                return u;
        return null;
    }

    this.get_user_by_socket = function(socket)
    {
        for (let u of this.logins)
            if (u.socket == socket)
                return u.user_id;
        return null;
    }

    this.notify_user = function(user_id, ntf_type, ntf_data)
    {
        let u = this.get_user(user_id);
        if (u === null)
            return;
        u.netntfs.push({type: ntf_type, data: ntf_data});
    }

    this.notify_users = function(user_ids, ntf_type, ntf_data)
    {
        for (let id of user_ids)
            this.notify_user(id, ntf_type, ntf_data);
    }

    this.dispatch_ntfs = function(io)
    {
        for (let user of this.logins)
        {
            if (user.netntfs.length == 0)
                continue;
            io.to(user.socket).emit("user_update", user.netntfs);
            user.netntfs = [];
        }
    }
}


function FileAccessManager(sdt, logins, cpanels)
{
    this.watchers = [];
    this.edits = [];
    this.sdt = sdt;
    this.logins = logins;
    this.cpanels = cpanels;

    this.add_watcher = function(user_id, file_id)
    {
        this.remove_watcher(user_id);
        this.watchers.push({user_id: user_id, file_id: file_id});
    }

    this.remove_watcher = function(user_id)
    {
        let index = -1;
        for (let i in this.watchers)
            if (this.watchers[i].user_id == user_id)
            {
                index = i;
                break;
            }
        if (index == -1)
            return;
        this.watchers.splice(index, 1);
    }

    this.get_watchers = function(file_id)
    {
        let watchers = [];
        for (let w of this.watchers)
            if (w.file_id == file_id)
                watchers.push(w.user_id);
        return watchers;
    }

    this.get_editor_by_file = function(file_id)
    {
        for (let i in this.edits)
            if (this.edits[i].file_id == file_id)
                return i;
        return -1;
    }

    this.get_editor_by_user = function(user_id)
    {
        for (let i in this.edits)
            if (this.edits[i].user_id == user_id)
                return i;
        return -1;
    }


    // Begins editing a file. Returns false if the file is already being edited.
    this.start_edit = function(user_id, file_id)
    {
        let index = this.get_editor_by_file(file_id);
        if (index != -1)
            return false;
        this.cancel_edit(user_id, file_id);

        this.edits.push({user_id: user_id, file_id: file_id});

        let file = this.sdt.get_file(file_id);
        file.flag_edit = true;

        this.logins.notify_users(file.get_users(), NTF_TYPE.FILE_START_EDIT, 
            {file_id});
        this.cpanels.notify(NTF_TYPE.CP_FILE_START_EDIT, {file_id});

        return true;
    }


    // Finish editing
    this.finish_edit = function(user_id, file_id, contents, time)
    {
        // Check if the given data matches.
        let index = this.get_editor_by_user(user_id);
        if (index == -1)
            return false;
        if (this.edits[index].file_id != file_id)
            return false;

        this.edits.splice(index, 1);
        let file = sdt.get_file(file_id);
        file.flag_edit = false;
        file.time_update = time;
        file.contents = contents;

        // Send notifications
        this.logins.notify_users(file.get_users(), NTF_TYPE.FILE_END_EDIT, 
            { file_id, time });
        this.cpanels.notify(NTF_TYPE.CP_FILE_END_EDIT,
            { file_id, time });
        this.logins.notify_users(this.get_watchers(file_id), 
            NTF_TYPE.FILE_UPDATE_CONTENTS, { file_id, contents });
        
        return true;
    }


    // Cancels an edit, and doesn't update the file.
    this.cancel_edit = function(user_id, file_id)
    {
        // Check if the given data matches.
        let index = this.get_editor_by_user(user_id);
        if (index == -1)
            return false;
        if (this.edits[index].file_id != file_id)
            return false;

        this.edits.splice(index, 1);
        file = sdt.get_file(file_id);
        file.flag_edit = false;

        // Send notifications
        logins.notify_users(file.get_users(), NTF_TYPE.FILE_END_EDIT, 
            {file_id, time: file.time_update});
        cpanels.notify(NTF_TYPE.CP_FILE_END_EDIT, 
            {file_id, time: file.time_update});

        return true;
    }


    // Auxiliary function to cancel a user's edit without knowing the file.
    this.force_cancel_edit = function(user_id)
    {
        let index = this.get_editor_by_user(user_id);
        if (index == -1)
            return;
        this.cancel_edit(this.edits[index].user_id, this.edits[index].file_id);
    }


    // Delete a given file
    this.delete_file = function(user_id, file_id)
    {
        let file = sdt.get_file(file_id);
        if (file == null)
            return false;
        if (file.owner_id != user_id)
            return false;
        this.watchers = this.watchers.filter(w => w.file_id != file_id);
        this.edits = this.edits.filter(e => e.file_id != file_id);
        sdt.delete_file(file_id);

        logins.notify_users(file.get_users(), NTF_TYPE.FILE_REMOVE,
            {file_id});
        cpanels.notify(NTF_TYPE.CP_DEL_FILE, {file_id});
    }
}


function CPManager()
{
    this.cps = [];

    this.register = function(socket)
    {
        this.cps.push({socket: socket, notifications: []});
    }

    this.unregister = function(socket)
    {
        let index = -1;
        for (let i in this.cps)
            if (this.cps[i].socket === socket)
            {
                this.cps.splice(index, 1);
                return;
            }
    }

    this.notify = function(ntf_type, ntf_data)
    {
        for (let cp of this.cps)
        {
            cp.notifications.push({type: ntf_type, data: ntf_data});
        }
    }

    this.dispatch_ntfs = function(io)
    {
        for (let user of this.cps)
        {
            if (user.notifications.length == 0)
                continue;
            io.to(user.socket).emit("cpanel_update", user.notifications);
            user.notifications = [];
        }
    }
}












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

function FileManager()
{
    this.files = [];

    // Gets the index of the file with the given id.
    this.get_index = function(file_id)
    {
        for (let i in this.files)
            if (this.files[i].file_id == file_id)
                return i;
        return -1;
    }

    this.register_file(file)
    {

    }

    this.register_user(file_id, user)
}





/*function UserManager()
{
    this.users = [];
    this.files = [];

    this.register_user = function(socket, user)
    {
        console.log("adding: ", user.id);
        let u = {
            socket: socket,
            user_id: user.id,
            user_data: user,
            notifications: [],
            files: [],
            file_watcher: null
        }
        this.users.push(u);
    }

    this.add_file_user = function(file, socket)
    {

    }

    this.register_file = function(socket, file)
    {
        console.log("Adding: ", user.id);
        let f = {
            file_id: file.id,
            users: [],
            watchers: [],
            editor: null
        };
        this.files.push(f);
        return f;
    }


    this.unregister_socket = function(socket)
    {
        let user_index = this.get_by_socket(socket);
        if (user_index == -1)
            return;
        let user = this.users[user_index];
        for (let i of user.files)
            this.remove_file_user(i, user.user_id);
    }



    // Returns the index of the file with the given id.
    this.get_file = function(id)
    {
        for (let f in this.files)
            if (files[f].file_id == id)
                return f;
        return -1;
    }

    // Returns the index of the user with the given socket.
    this.get_by_socket = function(socket)
    {
        for (let u in this.users)
            if (this.users[u].socket == socket)
                return u;
        return -1;
    }

    // Returns the index of the user with the given id.
    this.get_user = function(user_id)
    {
        for (const u in this.users)
            if (this.users[u].user_id = user_id)
                return u;
        return -1;
    }



    this.remove_file_user = function(file_id, user_id)
    {
        let file_index = this.get_file(file_id);
        let file = this.files[file_index];
        file.users = file.users.filter(uid => uid != user_id);
        file.watchers = file.watchers.filter(uid => uid != user_id);
        if (file.editor == user_id)
            file.editor = null;
        if (file.users.length == 0)
            this.files.splice(file_index, 1);
    }

    this.remove_file_watcher = function(file_id, user_id)
    {
        let file_index = this.get_file(file_id);
        let file = this.files[file_index];
        file.users = file.users.filter(uid => uid != user_id);
        file.watchers = file.watchers.filter(uid => uid != user_id);
        if (file.editor == user_id)
            file.editor = null;
    }

    this.set_file_editor = function(file_id, user_id)
    {
        let file_index = this.get_file(file_id);
        let file = this.files[file_index];
        if (file.editor !== null)
            return false;
        file.editor = user_id;
        return true;
    }

    this.remove_file_editor = function(file_id, user_id)
    {
        let file_index = this.get_file(file_id);
        let file = this.files[file_index];
        if (file.editor != user_id)
            return false;
        file.editor = null;
        return true;
    }

    



    this.issue_ntf_watchers(file_id, type, data)
    {
        let file_index = this.get_file(file_id);
        if (file_index == -1)
            return;
        let file = this.files[file_index];
        for (let u of file.users)
            this.issue_ntf_user(u, type, data);
    }

    this.issue_ntf_users(file_id, type, data)
    {
        let file_index = this.get_file(file_id);
        if (file_index == -1)
            return;
        let file = this.files[file_index];
        for (let u of file.users)
            this.issue_ntf_user(u, type, data);
    }

    this.issue_ntf_user = function(user_id, ntf_type, ntf_data)
    {
        const user = this.get_by_user_id(user_id);
        if (user !== null)
        {
            let ntf = {type: ntf_type, data: ntf_data};
            user.notifications.push(ntf);
        }
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
}*/


exports.LoginManager = LoginManager;
exports.FileAccessManager = FileAccessManager;
exports.CPManager = CPManager;
