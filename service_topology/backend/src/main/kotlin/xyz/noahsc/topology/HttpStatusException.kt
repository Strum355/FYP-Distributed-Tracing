package xyz.noahsc.topology

import io.ktor.http.HttpStatusCode

class HttpStatusException(val statusCode: HttpStatusCode): Exception()