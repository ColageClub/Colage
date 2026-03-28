package com.colageclub.colage.core.networking

import com.colageclub.colage.BuildConfig
import com.colageclub.colage.data.models.StudentLocation
import com.google.gson.Gson
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import okhttp3.*
import org.json.JSONObject
import java.util.concurrent.TimeUnit
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class WebSocketManager @Inject constructor() {

    private val wsUrl = BuildConfig.WS_BASE_URL
    private val gson = Gson()

    private val _isConnected = MutableStateFlow(false)
    val isConnected: StateFlow<Boolean> = _isConnected.asStateFlow()

    private var webSocket: WebSocket? = null
    private var reconnectAttempts = 0
    private var pingRunnable: Runnable? = null
    private val handler = android.os.Handler(android.os.Looper.getMainLooper())

    var onLocationUpdate: ((List<StudentLocation>) -> Unit)? = null
    var onStudentJoined: ((StudentLocation) -> Unit)? = null
    var onStudentLeft: ((String) -> Unit)? = null
    var onReconnected: (() -> Unit)? = null

    private var hasConnectedBefore = false

    private val client = OkHttpClient.Builder()
        .readTimeout(0, TimeUnit.MILLISECONDS) // No timeout for WebSocket
        .build()

    fun connect(universityDomain: String, userId: String, accessToken: String?) {
        if (BuildConfig.DEV_MODE) {
            _isConnected.value = true
            return
        }

        val urlBuilder = StringBuilder("$wsUrl?domain=$universityDomain&userId=$userId")
        accessToken?.let { urlBuilder.append("&token=$it") }

        val request = Request.Builder()
            .url(urlBuilder.toString())
            .build()

        webSocket = client.newWebSocket(request, object : WebSocketListener() {
            override fun onOpen(webSocket: WebSocket, response: Response) {
                _isConnected.value = true
                if (hasConnectedBefore) {
                    handler.post { onReconnected?.invoke() }
                }
                hasConnectedBefore = true
                reconnectAttempts = 0
                startPing()
            }

            override fun onMessage(webSocket: WebSocket, text: String) {
                handleMessage(text)
            }

            override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
                _isConnected.value = false
                scheduleReconnect(universityDomain, userId, accessToken)
            }

            override fun onClosed(webSocket: WebSocket, code: Int, reason: String) {
                _isConnected.value = false
            }
        })
    }

    fun disconnect() {
        pingRunnable?.let { handler.removeCallbacks(it) }
        webSocket?.close(1000, "Normal closure")
        webSocket = null
        _isConnected.value = false
        reconnectAttempts = 0
    }

    fun sendLocationUpdate(location: StudentLocation) {
        if (BuildConfig.DEV_MODE || webSocket == null) return
        val payload = JSONObject().apply {
            put("action", "location.update")
            put("data", JSONObject(gson.toJson(location)))
        }
        webSocket?.send(payload.toString())
    }

    private fun handleMessage(text: String) {
        try {
            val json = JSONObject(text)
            val action = json.optString("action")
            val data = json.opt("data")

            when (action) {
                "location.update", "student.joined" -> {
                    val dataStr = if (data is JSONObject) data.toString() else data.toString()
                    val location = gson.fromJson(dataStr, StudentLocation::class.java)
                    handler.post { onStudentJoined?.invoke(location) }
                }
                "location.batch" -> {
                    val dataStr = data.toString()
                    val locations = gson.fromJson(dataStr, Array<StudentLocation>::class.java).toList()
                    handler.post { onLocationUpdate?.invoke(locations) }
                }
                "student.left" -> {
                    val userId = (data as? JSONObject)?.optString("userId") ?: return
                    handler.post { onStudentLeft?.invoke(userId) }
                }
            }
        } catch (_: Exception) {}
    }

    private fun startPing() {
        val runnable = object : Runnable {
            override fun run() {
                if (_isConnected.value) {
                    webSocket?.send("{\"action\":\"ping\"}")
                    handler.postDelayed(this, 30_000L)
                }
            }
        }
        pingRunnable = runnable
        handler.postDelayed(runnable, 30_000L)
    }

    private fun scheduleReconnect(domain: String, userId: String, token: String?) {
        if (reconnectAttempts >= 5) return
        val delay = minOf(1000L * (1L shl reconnectAttempts), 30_000L) // exponential backoff, max 30s
        reconnectAttempts++
        handler.postDelayed({ connect(domain, userId, token) }, delay)
    }
}
