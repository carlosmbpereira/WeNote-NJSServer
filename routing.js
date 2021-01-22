const { LoginManager, FileAccessManager, CPManager } = require("./managers");
const { STATUS, NTF_TYPE } = require("./messages");


// Periodic functions
function periodic_notify(io, logins, cpanels)
{
    logins.dispatch_ntfs(io);
    cpanels.dispatch_ntfs(io);
    setTimeout(periodic_notify, 1000, io, logins, cpanels);
}


// sdata is an object of class ServerData
exports.build_io = function(sdt, io)
{
    //notify_boards = new NList_Generic();
    logins = new LoginManager();
    files = new FileAccessManager();
    cpanels = new CPManager();


    let aux_send_user_ntf = function(user_id, contents)
    {
        let ntf = sdt.new_notification(user_id, contents);
        logins.notify_user(data.user_id, NTF_TYPE.USER_NEW_NTF, ntf);
        cpanels.notify(NTF_TYPE.CP_NEW_NOTIFICATION, {user_id, ntf});
        console.log("Notification sent to user ", user_id);
    }

    
    io.on("connection", (socket) => {
        console.log("Connected");

        socket.on("disconnect", () => {
            logins.logout(socket.id);
            cpanels.unregister(socket.id);
        });

        socket.on("login", data => {
            let user = sdt.get_user_email(data.email);
            if (user === null)
            {
                io.to(socket.id).emit("login_ret", 
                    { status: STATUS.EMAIL_NOT_REGISTERED, data: null });
            }
            else if (user.password != data.password)
            {
                io.to(socket.id).emit("login_ret", 
                    { status: STATUS.WRONG_PASSWORD, data: null });
            }
            else
            {
                console.log("User logged in: " + user.id);
                logins.login(socket.id, user.id);

                user = user.personal_data();
                user.files = sdt.files_of_user(user.id).map(f => f.header());
                io.to(socket.id).emit("login_ret", 
                    {status: STATUS.OK, data: user});
                console.log("Login done!");
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
            console.log("Registered new user: ", user);
        });

        

        
        // User
        socket.on("logout", data => {
            const user = active_users.remove(socket.id);
        });

        socket.on("user_ntf_close", data => {
            sdt.delete_ntf(data.user_id, data.ntf_id);
        });



        // Files
        socket.on("file_create", data => {
            let file = sdt.new_file(data.user_id, data.title);

            cpanels.notify(NTF_TYPE.CP_NEW_FILE, file.header());
        });


        socket.on("file_invite_user", data => {
            let file = sdt.get_file(data.file_id);
            if (!file)
            {
                io.to(socket.id).emit("file_invite_user_done", {status: STATUS.NOT_FOUND, data: null});
            }
            else if (file.user_in(data.user_id))
            {
                io.to(socket.id).emit("file_invite_user_done", {status: STATUS.EXISTS, data: null});
            }
            else
            {
                file.users.push(data.user_id);

                let header = file.header();

                logins.notify_user(data.user_id, NTF_TYPE.FILE_INVITE, header);
                aux_send_user_ntf(data.user_id, "You've been added to '" + file.name + "'.");

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

                let ntf = sdt.new_notification();

                logins.notify_user(data.user_id, NTF_TYPE.FILE_REMOVE, {file_id});
                aux_send_user_ntf(data.user_id, "You've been removed from '" + file.name + "'.");
            }
        });


        socket.on("file_open", data => {
            let file = sdt.get_file(data.file_id);
            if (file === null)
            {
                io.to(socket.id).emit("file_open_done",
                    {status: STATUS.NOT_FOUND, data: null});
            }
            else if (file.users.indexOf(data.user_id))
            {
                io.to(socket.id).emit("file_open_done",
                    {status: STATUS.ACCESS_DENIED, data: null});
            }
            else
            {
                let ret = file.contents;

                io.to(socket.id).emit("file_open_done",
                    {status: STATUS.OK, data: ret});
                files.add_watcher(data.user_id, data.file_id);
            }
        });


        socket.on("file_close", data => {
            files.remove_watcher(data.user_id);
        });


        socket.on("file_edit", data => {
            let ok = files.add_editor(data.file_id);
            if (!ok)
            {
                io.to(socket.id).emit("file_edit_done", 
                    {status: STATUS.IN_USE, data: null});
            }
            else
            {
                io.to(socket.id).emit("file_edit_done",
                    {status: STATUS.OK, data: null});

                let users = sdt.users_of_file(data.file_id);
                logins.notify_users(users, NTF_TYPE.FILE_END_EDIT, data);
            }
        });

        socket.on("file_save", data => {
            files.remove_editor(data.file_id);
            let file = sdt.get_file(data.file_id);
            file.contents = data.contents; 
            
            let users = sdt.users_of_file(data.file_id);
            logins.notify_users(users, NTF_TYPE.FILE_END_EDIT, data);

            users = files.get_watchers(data.file_id);
        });



        // Control panel messages
        socket.on("cpanel_start", data => {
            cpanels.register(socket.id);

            let users = sdt.users.map(u => {
                return {
                    id: u.id,
                    name: u.name,
                    email: u.email,
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
            let ntf = sdt.new_notification(data.user_id, data.contents);
            logins.notify_user(data.user_id, NTF_TYPE.USER_NEW_NTF, ntf);
            ntf.user_id = data.user_id;
            cpanels.notify(NTF_TYPE.CP_NEW_NOTIFICATION, ntf);
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
