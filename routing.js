const { LoginManager, FileAccessManager, CPManager } = require("./managers");
const { STATUS, NTF_TYPE } = require("./messages");


// Periodic functions
function periodic_notify(io, logins, cpanels)
{
    logins.dispatch_ntfs(io);
    cpanels.dispatch_ntfs(io);
    setTimeout(periodic_notify, 500, io, logins, cpanels);
}


// sdata is an object of class ServerData
exports.build_io = function(sdt, io)
{
    //notify_boards = new NList_Generic();
    logins = new LoginManager();
    cpanels = new CPManager();
    files = new FileAccessManager(sdt, logins, cpanels);


    let aux_send_user_ntf = function(user_id, contents)
    {
        let ntf = sdt.new_notification(user_id, contents);
        logins.notify_user(user_id, NTF_TYPE.USER_NEW_NTF, ntf);
        cpanels.notify(NTF_TYPE.CP_NEW_NOTIFICATION, ntf);
    }

    let aux_logout_user = function(user_id)
    {
        let status = logins.logout_uid(user_id);
        if (status === null)
            return;
        let user = sdt.get_user(user_id);
        files.force_cancel_edit(user.id);
        files.remove_watcher(user.id);
        user.flag_online = false;
        cpanels.notify(NTF_TYPE.CP_USER_LOGOUT, {user_id});
    }

    
    io.on("connection", (socket) => {
        console.log("Connected");

        socket.on("disconnect", () => {
            let uid = logins.get_user_by_socket(socket.id);
            if (uid !== null)
                aux_logout_user(uid);
            cpanels.unregister(socket.id);
        });


        socket.on("login", data => {
            let user = sdt.get_user_email(data.email);
            if (user === null)
            {
                io.to(socket.id).emit("login_done", 
                    { status: STATUS.EMAIL_NOT_REGISTERED, data: null });
            }
            else if (user.password != data.password)
            {
                io.to(socket.id).emit("login_done", 
                    { status: STATUS.WRONG_PASSWORD, data: null });
            }
            else
            {
                // Logout the user if it's already online:
                aux_logout_user(user.id);
                user.flag_online = true;

                logins.login(socket.id, user.id);

                let ret = user.personal_data();
                ret.files = sdt.files_of_user(user.id).map(f => f.header());
                io.to(socket.id).emit("login_done", 
                    {status: STATUS.OK, data: ret});
                
                cpanels.notify(NTF_TYPE.CP_USER_LOGIN, {user_id: user.id});
            }
        });


        socket.on("register_user", data => {
            let user = sdt.get_user_email(data.email);
            if (user != null)
            {
                io.to(socket.id).emit("register_user_done", { status: STATUS.EXISTS });
                return;
            }
            user = sdt.new_user(data.name, data.email, data.password);
            io.to(socket.id).emit("register_user_done", { status: STATUS.OK });

            cpanels.notify(NTF_TYPE.CP_NEW_USER, user);
        });

        

        
        // User
        socket.on("logout", data => {
            aux_logout_user(data.user_id);
        });

        socket.on("user_ntf_close", data => {
            sdt.delete_ntf(data.user_id, data.ntf_id);

            cpanels.notify(NTF_TYPE.CP_DEL_NOTIFICATION, {ntf_id: data.ntf_id});
        });



        // Files
        socket.on("file_create", data => {
            let file = sdt.new_file(data.user_id, data.title);
            io.to(socket.id).emit("file_create_done", 
                {status: STATUS.OK, data: file.header()});

            cpanels.notify(NTF_TYPE.CP_NEW_FILE, file.header());
        });


        socket.on("file_delete", data => {
            files.delete_file(data.user_id, data.file_id);
        })


        socket.on("file_invite_user", data => {
            let file = sdt.get_file(data.file_id);
            let user = sdt.get_user_email(data.user_email);
            if (file == null || user == null)
            {
                io.to(socket.id).emit("file_invite_user_done", {status: STATUS.NOT_FOUND, data: null});
            }
            else if (file.user_in(user.id))
            {
                io.to(socket.id).emit("file_invite_user_done", {status: STATUS.EXISTS, data: null});
            }
            else
            {
                file.users.push(user.id);

                let header = file.header();

                logins.notify_user(user.id, NTF_TYPE.FILE_INVITE, header);
                aux_send_user_ntf(user.id, "You've been added to '" + file.name + "'.");

                let users = files.get_watchers(data.file_id);
                logins.notify_users(users, NTF_TYPE.FILE_ADD_USER, 
                    {file_id: data.file_id, user: user.public_data()});

                io.to(socket.id).emit("file_invite_user_done", {status: STATUS.OK, data: null});
            }
        });


        socket.on("file_remove_user", data => {
            let file = sdt.get_file(data.file_id);
            if (!file)
            {
                io.to(socket.id).emit("file_remove_user_done",
                    {status: STATUS.NOT_FOUND, data: null});
            }
            else if (!file.user_in(data.user_id))
            {
                io.to(socket.io).emit("file_remove_user_done",
                    {status: STATUS.NOT_FOUND, data: null});
            }
            else
            {
                file.users = file.users.filter(u => u !== data.user_id);

                logins.notify_user(data.user_id, NTF_TYPE.FILE_REMOVE, {file_id: data.file_id});
                aux_send_user_ntf(data.user_id, "You've been removed from '" + file.name + "'.");

                let users = files.get_watchers(data.file_id);
                logins.notify_users(users, NTF_TYPE.FILE_REMOVE_USER, 
                    {file_id: data.file_id, user_id: data.user_id});
            }
        });


        socket.on("file_open", data => {
            let file = sdt.get_file(data.file_id);
            if (file === null)
            {
                io.to(socket.id).emit("file_open_done",
                    {status: STATUS.NOT_FOUND, data: null});
            }
            else if (!file.user_in(data.user_id))
            {
                io.to(socket.id).emit("file_open_done",
                    {status: STATUS.ACCESS_DENIED, data: null});
            }
            else
            {
                file = {...file};
                file.users = file.users.map(uid => 
                    sdt.get_user(uid).public_data());
                file.users.push(sdt.get_user(file.owner_id).public_data());

                io.to(socket.id).emit("file_open_done",
                    {status: STATUS.OK, data: file});
                files.add_watcher(data.user_id, data.file_id);
            }
        });


        socket.on("file_close", data => {
            files.remove_watcher(data.user_id);
        });


        socket.on("file_edit", data => {
            let ok = files.start_edit(data.user_id, data.file_id);
            if (!ok)
            {
                io.to(socket.id).emit("file_edit_done", 
                    {status: STATUS.IN_USE, data: null});
            }
            else
            {
                io.to(socket.id).emit("file_edit_done",
                    {status: STATUS.OK, data: null});
            }
        });

        socket.on("file_edit_end", data => {
            files.finish_edit(data.user_id, data.file_id, data.contents, Date.now());
        });

        socket.on("file_edit_cancel", data => {
            files.force_cancel_edit(data.user_id);
        });



        // Control panel messages
        socket.on("cpanel_start", data => {
            cpanels.register(socket.id);

            let users = sdt.users.map(u => {
                return {
                    id: u.id,
                    name: u.name,
                    email: u.email,
                    flag_online: u.flag_online,
                    password: u.password
                }
            });
            let ntfs = [];
            for (let u of sdt.users)
                for (let n of u.notifications)
                    ntfs.push(n);
            let files = sdt.files.map(f => f.header());

            let ret = {users: users, ntfs: ntfs, files: files};
            io.to(socket.id).emit("cpanel_start_done", ret);
        });

        socket.on("cpanel_issue_ntf", data => {
            let user = sdt.get_user(data.user_id);
            aux_send_user_ntf(data.user_id, data.contents);
            io.to(socket.id).emit("cpanel_issue_ntf_done", {status: STATUS.OK, data: null});
        });

        socket.on("cpanel_save", data => {
            sdt.save(() => {
                console.log("Issued save command completed. Database saved.");
                io.to(socket.id).emit("cpanel_save_done", {status: STATUS.OK, data: null});
            });
        });
    });

    // Start periodic updates
    setTimeout(periodic_notify, 1000, io, logins, cpanels);
}
