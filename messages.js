// Status messages

exports.STATUS = {
    OK: 0,

    EXISTS: 402,
    ACCESS_DENIED: 403,
    NOT_FOUND: 404,

    // Register
    

    // Login
    EMAIL_NOT_REGISTERED: 201,
    WRONG_PASSWORD: 202
}


// Client notifications

exports.NTF_TYPE = {
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

