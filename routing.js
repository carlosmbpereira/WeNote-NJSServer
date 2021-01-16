const { UserManager } = require("./managers");
const {
    NTF_TYPE,
    UserNtfHandler 
} = require("./notifiers");


// Periodic functions
function periodic_notify(io, users)
{
    users.dispatch(io);
    //boards.dispatch("board_update", io);
    setTimeout(periodic_notify, 1000, io, users);
}


// sdata is an object of class ServerData
exports.build_io = function(sdt, io)
{
    //notify_boards = new NList_Generic();
    active_users = new UserManager();

    io.to("asf").emit("test", null);

    io.on("connection", (socket) => {
        console.log("Connected");

        socket.on("disconnect", () => {
            active_users.pop(socket.id);
        });

        socket.on("login", data => {
            let user = sdt.get_user_email(data.email);
            if (user === null)
            {
                io.to(socket.id).emit("login_ret", { status: 1, data: null });
                return;
            }

            if (user.password != data.password)
            {
                io.to(socket.id).emit("login_ret", { status: 2, data: null });
                return;
            }

            active_users.register(socket.id, user);
            user = user.personal_data();
            user.boards = sdt.boards_of_user(user.id).map(b => b.header());
            io.to(socket.id).emit("login_ret", {status: 0, data: user});
        });

        socket.on("register_user", data => {
            let user = sdt.get_user_email(data.email);
            if (user != null)
            {
                io.to(socket.id).emit("register_user_done", { status: 1 });
                return;
            }
            user = sdt.new_user(data.name, data.email, data.password);
            io.to(socket.id).emit("register_user_done", { status: 0 });
        });

        

        
        // User
        socket.on("logout", data => {
            const user = active_users.remove(socket.id);

        });

        socket.on("user_ntf_close", data => {
            sdt.delete_ntf(data.user_id, data.ntf_id);
        });

        socket.on("user_new_board", data => {

        });


        // Boards
        socket.on("board_enter", data => {

        });

        socket.on("board_leave", data => {

        });

        socket.on("board_quit", data => {

        });

        socket.on("board_new_file", data => {

        });

        socket.on("board_delete_file", data => {

        });

        socket.on("board_add_user", data => {

        });

        socket.on("board_remove_user", data => {

        });


        // Files
        socket.on("file_open", data => {

        });

        socket.on("file_close", data => {

        });

        socket.on("file_edit", data => {

        });


        // Control panel messages
        socket.on("cpanel_issue_ntf", data => {
            let ntf = sdt.new_notification(data.user_id, data.contents);
            notify_users.notify(data.user_id, NTF_TYPE.USER_NEW_NTF, ntf);
            console.log("Issued notification to user " + data.user_id);
        });

        socket.on("cpanel_save", data => {
            sdt.save(() => {
                console.log("Issued save command completed. Database saved.");
                io.to(socket.id).emit("cpanel_save_done", null);
            });
        });
    });

    // Start periodic updates
    //setTimeout(periodic_notify, 1000, io, notify_users);
}
