import java.util.Properties

plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.hilt)
    alias(libs.plugins.ksp)
}

// Read local.properties for tokens
val localProperties = Properties()
val localPropertiesFile = rootProject.file("local.properties")
if (localPropertiesFile.exists()) {
    localPropertiesFile.inputStream().use { localProperties.load(it) }
}
val mapboxToken: String = localProperties.getProperty("MAPBOX_ACCESS_TOKEN") ?: ""

android {
    namespace = "com.colageclub.colage"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.colageclub.colage"
        minSdk = 26
        targetSdk = 34
        versionCode = 1
        versionName = "1.0"
        buildConfigField("String", "MAPBOX_ACCESS_TOKEN", "\"$mapboxToken\"")
        manifestPlaceholders["MAPBOX_ACCESS_TOKEN"] = mapboxToken
    }

    buildTypes {
        debug {
            buildConfigField("boolean", "DEV_MODE", "false") // Set to true for mock data, false for real backend
            buildConfigField("String", "API_BASE_URL", "\"https://wn7mxcdxca.execute-api.us-east-2.amazonaws.com/dev\"")
            buildConfigField("String", "WS_BASE_URL", "\"wss://w0m7jw00ak.execute-api.us-east-2.amazonaws.com/dev\"")
            buildConfigField("String", "AD_BASE_URL", "\"https://main.dcinq8hq6li09.amplifyapp.com\"")
        }
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            buildConfigField("boolean", "DEV_MODE", "false")
            buildConfigField("String", "API_BASE_URL", "\"https://wn7mxcdxca.execute-api.us-east-2.amazonaws.com/dev\"")
            buildConfigField("String", "WS_BASE_URL", "\"wss://w0m7jw00ak.execute-api.us-east-2.amazonaws.com/dev\"")
            buildConfigField("String", "AD_BASE_URL", "\"https://main.dcinq8hq6li09.amplifyapp.com\"")
        }
    }

    buildFeatures {
        compose = true
        buildConfig = true
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.lifecycle.viewmodel.compose)
    implementation(libs.androidx.activity.compose)
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.ui)
    implementation(libs.androidx.ui.graphics)
    implementation(libs.androidx.ui.tooling.preview)
    implementation(libs.androidx.material3)
    implementation(libs.androidx.material.icons)
    implementation(libs.androidx.navigation.compose)
    implementation(libs.hilt.android)
    ksp(libs.hilt.compiler)
    implementation(libs.hilt.navigation.compose)
    implementation(libs.okhttp)
    implementation(libs.okhttp.logging)
    implementation(libs.coil.compose)
    implementation(libs.datastore.preferences)
    implementation(libs.security.crypto)
    implementation(libs.gson)
    implementation(libs.kotlinx.coroutines.android)
    implementation(libs.accompanist.permissions)
    implementation(libs.mapbox.maps)
    implementation(libs.arcore)
    implementation(libs.arsceneview)
    implementation(libs.play.services.location)
    implementation(libs.lifecycle.process)
    debugImplementation(libs.androidx.ui.tooling)
}
