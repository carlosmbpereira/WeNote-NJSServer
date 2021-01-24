// Constants
const NTF_TYPE = {
    CP_USER_LOGIN: 120,
    CP_USER_LOGOUT: 121,
    CP_NEW_USER: 101,
    CP_NEW_NOTIFICATION: 102,
    CP_NEW_FILE: 103,
    CP_DEL_NOTIFICATION: 104,
    CP_DEL_FILE: 105,
    CP_FILE_START_EDIT: 111,
    CP_FILE_END_EDIT: 112,
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

let file_form = document.getElementById("file_form");
let file_owner = document.getElementById("file_owner");
let file_name = document.getElementById("file_name");

let bt_save = document.getElementById("bt_save");



// Data displays

let users_div = document.getElementById("user-display").getElementsByTagName("div")[0];
let ntfs_div = document.getElementById("ntf-display").getElementsByTagName("div")[0];
let files_div = document.getElementById("file-display").getElementsByTagName("div")[0];



function time_to_readable(time)
{
    let date = new Date(time);

    let day = date.getDate();
    let month = date.getMonth() + 1;
    let year = date.getFullYear();
    let hours = date.getHours();
    let mins = date.getMinutes();

    let str = "" + (day>9 ? '' : '0') + day + "/" + (month>9 ? '' : '0') + month + "/" +
                year + " " + (hours>9 ? '' : '0') + hours + ":" + (mins>9 ? '' : '0') + mins;

    return str;
}



// Data storage

let users = []
let notifications = [];
let files = [];

function find_user(id)
{
    for (let u of users)
        if (u.id == id)
            return u;
    return null;
}

function find_ntf(id)
{
    for (let u of users)
        if (u.id == id)
            return u;
    return null;
}

function find_file(id)
{
    for (let f of files)
        if (f.id == id)
            return f;
    return null;
}



function render_user(user)
{
    let container = document.createElement("div");
    container.id = "user_" + user.id;
    container.classList.add("data-block");

    let head = document.createElement("p");
    head.classList.add("tx_large", "bold");
    head.innerText = "" + user.id + " - " + user.name;

    let login_info = document.createElement("p");
    login_info.innerText = user.email + " : " + user.password;

    container.appendChild(head);
    container.appendChild(login_info);

    if (user.flag_online)
    {
        let marker = document.createElement("div");
        marker.classList.add("online-indicator");
        container.appendChild(marker);
    }
    return container;
}

function render_notification(ntf)
{
    let container = document.createElement("div");
    container.id = "ntf_" + ntf.id;
    container.classList.add("data-block");

    let head = document.createElement("p");
    head.classList.add("bold");
    head.innerText = "" + ntf.id + " - " + ntf.contents;

    let user_id = document.createElement("p");
    user_id.innerText = "User id: " + ntf.user_id + 
        " - " + time_to_readable(ntf.time);

    container.appendChild(head);
    container.appendChild(user_id);

    return container;
}

function render_file(file)
{
    let container = document.createElement("div");
    container.id = "file_" + file.id;
    container.classList.add("data-block");

    let head = document.createElement("p");
    head.classList.add("tx-large", "bold");
    head.innerText = "" + file.id + " - " + file.name;

    let creation = document.createElement("p");
    creation.classList.add("tx-small");
    creation.innerText = "User: " + file.owner_id + 
        " - " + time_to_readable(file.time_create);

    let update = document.createElement("p");
    update.innerText = "Last update: " + time_to_readable(file.time_update);

    container.appendChild(head);
    container.appendChild(creation);
    container.appendChild(update);

    if (file.flag_edit)
    {
        let marker = document.createElement("div");
        marker.classList.add("online-indicator");
        container.appendChild(marker);
    }
    return container;
}


function update_user(user)
{
    let elem = document.getElementById("user_" + user.id);
    users_div.replaceChild(render_user(user), elem);
}

function update_file(file)
{
    let elem = document.getElementById("file_" + file.id);
    files_div.replaceChild(render_file(file), elem);
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

file_form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (file_name.value.length == 0)
        return;
    socket.emit("file_create", {
        user_id: file_owner.value,
        title: file_name.value
    });
    file_form.reset();
});

bt_save.addEventListener("click", () => {
    socket.emit("cpanel_save", null);
});


// Returns
socket.on("cpanel_save_done", () => {
});
socket.on("register_user_done", () => {
});
socket.on("cpanel_issue_ntf_done", () => {
});
socket.on("cpanel_start_done", (data) => {
    users = data.users;
    notifications = data.ntfs;
    files = data.files;
    update_users();
    update_files();
    update_notifications();
});

socket.on("cpanel_update", (data) => {
    
    for (let ntf of data)
    {
        switch (ntf.type)
        {
        case NTF_TYPE.CP_USER_LOGIN:
            {
                let user = find_user(ntf.data.user_id);
                if (user === null)
                    break;
                user.flag_online = true;
                update_user(user);
                break;
            }

        case NTF_TYPE.CP_USER_LOGOUT:
            {
                let user = find_user(ntf.data.user_id);
                if (user === null)
                    break;
                user.flag_online = false;
                update_user(user);
                break;
            }
            
        case NTF_TYPE.CP_NEW_USER:
            users.push(ntf.data);
            users_div.appendChild(render_user(ntf.data));
            break;

        case NTF_TYPE.CP_NEW_NOTIFICATION:
            console.log(ntf.data);
            ntfs_div.appendChild(render_notification(ntf.data));
            break;

        case NTF_TYPE.CP_DEL_NOTIFICATION:
            ntfs_div.removeChild(document.getElementById("ntf_" + ntf.data.ntf_id));
            break;

        case NTF_TYPE.CP_FILE_START_EDIT:
            {
                let file = find_file(ntf.data.file_id);
                file.flag_edit = true;
                update_file(file);
                break;
            }

        case NTF_TYPE.CP_FILE_END_EDIT:
            {
                let file = find_file(ntf.data.file_id);
                file.flag_edit = false;
                file.time_update = ntf.data.time;
                update_file(file);
                break;
            }

        case NTF_TYPE.CP_NEW_FILE:
            files.push(ntf.data);
            files_div.appendChild(render_file(ntf.data));
            break;

        case NTF_TYPE.CP_DEL_FILE:
            for (let i in files)
                if (files[i].id == ntf.data.file_id)
                {
                    files.splice(i, 1);
                    break;
                }
            files_div.removeChild(document.getElementById("file_" + ntf.data.file_id));
            break;
        }
    }
});

socket.emit("cpanel_start", null);