package com.colageclub.colage

import android.app.Application
import com.mapbox.common.MapboxOptions
import dagger.hilt.android.HiltAndroidApp

@HiltAndroidApp
class ColageApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        // Initialize Mapbox — token from local.properties via BuildConfig
        if (BuildConfig.MAPBOX_ACCESS_TOKEN.isNotEmpty()) {
            MapboxOptions.accessToken = BuildConfig.MAPBOX_ACCESS_TOKEN
        }
    }
}
