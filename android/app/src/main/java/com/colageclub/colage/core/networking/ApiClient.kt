package com.colageclub.colage.core.networking

import com.colageclub.colage.core.storage.SecureStorage
import com.colageclub.colage.data.models.*
import com.google.gson.Gson
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.logging.HttpLoggingInterceptor
import java.io.IOException
import javax.inject.Inject
import javax.inject.Singleton

class ApiException(val code: Int, message: String) : Exception(message)

@Singleton
class ApiClient @Inject constructor(
    private val secureStorage: SecureStorage
) {
    private val baseUrl = "https://api.colageclub.com"
    private val gson = Gson()
    private val mediaType = "application/json; charset=utf-8".toMediaType()

    private val publicPaths = listOf("/auth/", "/universities/")

    private val httpClient = OkHttpClient.Builder()
        .addInterceptor(HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BODY
        })
        .build()

    private fun isPublicPath(path: String) = publicPaths.any { path.startsWith(it) }

    private fun buildRequest(
        method: String,
        path: String,
        body: Any? = null,
        accessToken: String? = null
    ): Request {
        val url = "$baseUrl$path"
        val requestBody = body?.let {
            gson.toJson(it).toRequestBody(mediaType)
        }

        return Request.Builder()
            .url(url)
            .apply {
                when (method.uppercase()) {
                    "GET" -> get()
                    "POST" -> post(requestBody ?: "{}".toRequestBody(mediaType))
                    "PUT" -> put(requestBody ?: "{}".toRequestBody(mediaType))
                    "DELETE" -> delete(requestBody)
                    "PATCH" -> patch(requestBody ?: "{}".toRequestBody(mediaType))
                }
                header("Content-Type", "application/json")

                val token = accessToken ?: secureStorage.get(SecureStorage.KEY_ACCESS_TOKEN)
                if (!isPublicPath(path) && token != null) {
                    header("Authorization", "Bearer $token")
                }
            }
            .build()
    }

    suspend fun <T> request(
        method: String = "GET",
        path: String,
        body: Any? = null,
        responseClass: Class<T>
    ): T = withContext(Dispatchers.IO) {
        var request = buildRequest(method, path, body)
        var response = httpClient.newCall(request).execute()

        // Auto-refresh on 401
        if (response.code == 401 && !isPublicPath(path)) {
            val refreshToken = secureStorage.get(SecureStorage.KEY_REFRESH_TOKEN)
            if (refreshToken != null) {
                try {
                    val refreshRequest = buildRequest(
                        "POST",
                        "/auth/refresh",
                        RefreshTokenRequest(refreshToken),
                        null
                    )
                    val refreshResponse = httpClient.newCall(refreshRequest).execute()
                    if (refreshResponse.isSuccessful) {
                        val refreshBody = refreshResponse.body?.string()
                        val tokens = gson.fromJson(refreshBody, TokenResponse::class.java)
                        secureStorage.set(SecureStorage.KEY_ACCESS_TOKEN, tokens.accessToken)
                        secureStorage.set(SecureStorage.KEY_ID_TOKEN, tokens.idToken)
                        // Retry original with new token
                        response.close()
                        request = buildRequest(method, path, body, tokens.accessToken)
                        response = httpClient.newCall(request).execute()
                    }
                } catch (_: Exception) {}
            }
        }

        val responseBodyStr = response.body?.string()

        if (!response.isSuccessful) {
            throw ApiException(response.code, responseBodyStr ?: "Unknown error")
        }

        gson.fromJson(responseBodyStr, responseClass)
            ?: throw ApiException(response.code, "Empty response")
    }

    // Typed helpers for common patterns
    suspend fun postEmailVerify(email: String): Map<*, *> =
        request("POST", "/auth/email/verify", EmailVerifyRequest(email), Map::class.java)

    suspend fun postEmailConfirm(email: String, code: String): EmailConfirmResponse =
        request("POST", "/auth/email/confirm", EmailConfirmRequest(email, code), EmailConfirmResponse::class.java)

    suspend fun postPhoneVerify(phone: String, email: String): Map<*, *> =
        request("POST", "/auth/phone/verify", PhoneVerifyRequest(phone, email), Map::class.java)

    suspend fun postPhoneConfirm(phone: String, code: String): PhoneConfirmResponse =
        request("POST", "/auth/phone/confirm", PhoneConfirmRequest(phone, code), PhoneConfirmResponse::class.java)

    suspend fun postLogin(email: String): TokenResponse =
        request("POST", "/auth/login", LoginRequest(email), TokenResponse::class.java)

    suspend fun postRefreshToken(refreshToken: String): TokenResponse =
        request("POST", "/auth/refresh", RefreshTokenRequest(refreshToken), TokenResponse::class.java)

    suspend fun postCreateProfile(req: CreateProfileRequest): CreateProfileResponse =
        request("POST", "/users", req, CreateProfileResponse::class.java)

    suspend fun getUniversity(domain: String): UniversityResponse =
        request("GET", "/universities/$domain", null, UniversityResponse::class.java)
}
