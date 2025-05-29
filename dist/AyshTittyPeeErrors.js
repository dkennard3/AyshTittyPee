class ErrorBadRequest400 extends Error {
    constructor(message) {
        super(message);
    }
}
class ErrorUnauthorized401 extends Error {
    constructor(message) {
        super(message);
    }
}
class ErrorForbidden403 extends Error {
    constructor(message) {
        super(message);
    }
}
class ErrorNotFound404 extends Error {
    constructor(message) {
        super(message);
    }
}
export { ErrorBadRequest400, ErrorUnauthorized401, ErrorForbidden403, ErrorNotFound404 };
