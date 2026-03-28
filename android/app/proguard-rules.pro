# Add project specific ProGuard rules here.
-keep class com.colageclub.colage.data.models.** { *; }
-keepattributes Signature
-keepattributes *Annotation*
-keepclassmembers class * { @com.google.gson.annotations.SerializedName <fields>; }
-keep class com.mapbox.** { *; }
