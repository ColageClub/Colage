package com.colageclub.colage.di

import android.content.Context
import android.content.SharedPreferences
import com.colageclub.colage.core.networking.ApiClient
import com.colageclub.colage.core.storage.SecureStorage
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object AppModule {

    @Provides
    @Singleton
    fun provideSharedPreferences(@ApplicationContext context: Context): SharedPreferences =
        context.getSharedPreferences("colage_prefs", Context.MODE_PRIVATE)
}
