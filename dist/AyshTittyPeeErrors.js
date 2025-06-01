export class ErrorBadRequest400 extends Error {
    constructor(message) {
        super(message);
        this.name = "ErrorBadRequest400";
    }
}
export class ErrorUnauthorized401 extends Error {
    constructor(message) {
        super(message);
        this.name = "ErrorUnauthorized401";
    }
}
export class ErrorForbidden403 extends Error {
    constructor(message) {
        super(message);
        this.name = "ErrorForbidden403";
    }
}
export class ErrorNotFound404 extends Error {
    constructor(message) {
        super(message);
        this.name = "ErrorNotFound404";
    }
}
