// Status messages

exports.STATUS = {
    OK: 0,

    EXISTS: 402,
    ACCESS_DENIED: 403,
    NOT_FOUND: 404,
    IN_USE: 405,

    // Register
    

    // Login
    EMAIL_NOT_REGISTERED: 201,
    WRONG_PASSWORD: 202
}


// Client notifications

exports.NTF_TYPE = {
    USER_NEW_NTF: 0,

    FILE_UPDATE_CONTENTS: 4,
    FILE_INVITE: 5,
    FILE_REMOVE: 6,
    FILE_START_EDIT: 7,
    FILE_END_EDIT: 8,
    FILE_ADD_USER: 9,
    FILE_REMOVE_USER: 10,

    // Control panel
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

