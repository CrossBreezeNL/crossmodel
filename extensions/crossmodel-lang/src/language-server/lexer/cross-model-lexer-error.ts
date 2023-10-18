/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
export class IndentationError extends Error {
    constructor(message: string) {
        super(message);
    }
}

export class IndentStackError extends Error {
    constructor(message: string) {
        super(message);
    }
}
