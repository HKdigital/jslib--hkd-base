
/* generic */

export class TypeOrValueError extends Error {}

export class InternalError extends Error {}

export class InternalEventOrLogError extends Error {}

/* api */

export class ResponseError extends Error {}

export class AuthenticationError extends Error {}

export class BadRequestError extends Error {}

export class AbortError extends Error {}

export class TimeoutError extends Error {}

/* jwt */

export class SecretKeyError extends Error {}
export class TokenExpiredError extends Error {}

export class JsonWebTokenError extends Error {}
export class InvalidSignatureError extends Error {}
