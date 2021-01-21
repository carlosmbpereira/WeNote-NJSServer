// Constants
const NTF_TYPE = {
    USER_NEW_NTF: 0,

    FILE_UPDATE: 3,
    FILE_UPDATE_CONTENT: 4,
    FILE_INVITE: 5,
    FILE_REMOVE: 6,

    // Control panel
    CP_NEW_USER: 101,
    CP_NEW_NOTIFICATION: 102,
    CP_NEW_FILE: 103,
    CP_DEL_NOTIFICATION: 104,
    CP_DEL_FILE: 105
}


let socket = io();


// Forms

let in_form = document.getElementById("in_form");
let in_user_id = document.getElementById("in_user_id");
let in_text = document.getElementById("in_text");

let reg_form = document.getElementById("reg_form");
let reg_name = document.getElementById("reg_name");
let reg_email = document.getElementById("reg_email");
let reg_password = document.getElementById("reg_password");

let bt_save = document.getElementById("bt_save");



// Data displays

let users_div = document.getElementById("user-display").getElementsByTagName("div")[0];
let ntfs_div = document.getElementById("ntf-display").getElementsByTagName("div")[0];
let files_div = document.getElementById("file-display").getElementsByTagName("div")[0];



// Data storage

let users = [];
let notifications = [];
let files = [];

function render_user(user)
{
    let container = document.createElement("div");
    container.innerHTML = 
        "id: " + user.id + "<br>" +
        "name: " + user.name + "<br>" +
        "password: " + user.password;
    return container;
}

function render_notification(ntf)
{
    let container = document.createElement("div");
    container.innerHTML = 
        "id: " + ntf.id + "<br>" +
        "user_id: " + 
        "name: " + user.name + "<br>" +
        "contents: " + ntf.contents;
    return container;
}

function render_file(file)
{
    let container = document.createElement("div");
    container.innerHTML =
        "id: " + file.id + "<br>" +
        "owner_id: " + file.owner_id;
    return container;
}


function update_users()
{
    users_div.innerHTML = "";
    for (let u of users)
        users_div.appendChild(render_user(u));
}

function update_files()
{
    files_div.innerHTML = "";
    for (let u of files)
        files_div.appendChild(render_file(u));
}

function update_notifications()
{
    ntfs_div.innerHTML = "";
    for (let u of notifications)
        ntfs_div.appendChild(render_notification(u));
}




in_form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (in_user_id.value.length == 0)
        return;
    socket.emit("cpanel_issue_ntf", {
        user_id: parseInt(in_user_id.value),
        contents: in_text.value
    });
    in_form.reset();
});

reg_form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (reg_name.value.length == 0)
        return;
    socket.emit("register_user", {
        name: reg_name.value,
        email: reg_email.value,
        password: reg_password.value
    });
    reg_form.reset();
});

bt_save.addEventListener("click", () => {
    socket.emit("cpanel_save", null);
});


// Returns
socket.on("cpanel_save_done", () => {
    alert("Save done!");
});
socket.on("register_user_done", () => {
    alert("User registered!");
});
socket.on("cpanel_issue_ntf_done", () => {
    alert("Notification issued!");
});

socket.on("cpanel_update", (data) => {
    for (let ntf of data)
    {
        switch (ntf.type)
        {
        case NTF_TYPE.CP_NEW_USER:
            users.push(ntf.data);
        case NTF_TYPE.CP_NEW_NOTIFICATION:
            users.push(ntf.data);
        case NTF_TYPE.CP_NEW_FILE:
            files.push(ntf.data);
        }
    }
});