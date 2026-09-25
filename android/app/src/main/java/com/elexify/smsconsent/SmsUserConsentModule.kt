package com.elexify.smsconsent

import android.app.Activity
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Build
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.ActivityEventListener
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.google.android.gms.auth.api.phone.SmsRetriever
import com.google.android.gms.common.api.CommonStatusCodes
import com.google.android.gms.common.api.Status

/**
 * Google SMS User Consent API: when the OTP SMS arrives, Android shows a
 * one-tap "Allow Elexify to read this message?" sheet and, on approval,
 * hands the message body to the app. Unlike the SMS Retriever API it needs
 * no app hash in the SMS, so it works with our fixed DLT templates, and it
 * needs no SMS permission.
 *
 * JS: startListening() → "SmsUserConsent:message" { message } or
 * "SmsUserConsent:done" { reason }. A listen lasts until one SMS arrives or
 * five minutes pass (Play Services' own timeout).
 */
class SmsUserConsentModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext), ActivityEventListener {

  private var receiver: BroadcastReceiver? = null

  init {
    reactContext.addActivityEventListener(this)
  }

  override fun getName() = NAME

  @ReactMethod
  fun startListening(promise: Promise) {
    unregister()
    val filter = IntentFilter(SmsRetriever.SMS_RETRIEVED_ACTION)
    val r = object : BroadcastReceiver() {
      override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != SmsRetriever.SMS_RETRIEVED_ACTION) return
        val status = intent.extras?.let {
          if (Build.VERSION.SDK_INT >= 33) it.getParcelable(SmsRetriever.EXTRA_STATUS, Status::class.java)
          else @Suppress("DEPRECATION") (it.get(SmsRetriever.EXTRA_STATUS) as? Status)
        }
        when (status?.statusCode) {
          CommonStatusCodes.SUCCESS -> {
            val consent = intent.extras?.let {
              if (Build.VERSION.SDK_INT >= 33) it.getParcelable(SmsRetriever.EXTRA_CONSENT_INTENT, Intent::class.java)
              else @Suppress("DEPRECATION") it.getParcelable(SmsRetriever.EXTRA_CONSENT_INTENT)
            }
            val activity = reactContext.currentActivity
            if (consent == null || activity == null) {
              emitDone("unavailable")
              return
            }
            try {
              activity.startActivityForResult(consent, REQUEST_CODE)
            } catch (e: Exception) {
              emitDone("unavailable")
            }
          }
          CommonStatusCodes.TIMEOUT -> emitDone("timeout")
          else -> emitDone("error")
        }
        unregister()
      }
    }
    // Only Play Services may send this broadcast (SEND_PERMISSION); it has
    // to be exported for Play Services to reach it.
    ContextCompat.registerReceiver(
      reactContext, r, filter, SmsRetriever.SEND_PERMISSION, null,
      ContextCompat.RECEIVER_EXPORTED,
    )
    receiver = r
    SmsRetriever.getClient(reactContext).startSmsUserConsent(null)
      .addOnSuccessListener { promise.resolve(true) }
      .addOnFailureListener { e ->
        unregister()
        promise.reject("E_SMS_CONSENT", e.message, e)
      }
  }

  @ReactMethod
  fun stopListening() = unregister()

  // Required by NativeEventEmitter.
  @ReactMethod fun addListener(eventName: String) {}
  @ReactMethod fun removeListeners(count: Double) {}

  override fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, data: Intent?) {
    if (requestCode != REQUEST_CODE) return
    val message = data?.getStringExtra(SmsRetriever.EXTRA_SMS_MESSAGE)
    if (resultCode == Activity.RESULT_OK && message != null) {
      emit("SmsUserConsent:message", Arguments.createMap().apply { putString("message", message) })
    } else {
      emitDone("denied")
    }
  }

  override fun onNewIntent(intent: Intent) {}

  override fun invalidate() {
    unregister()
    reactContext.removeActivityEventListener(this)
    super.invalidate()
  }

  private fun unregister() {
    receiver?.let {
      try { reactContext.unregisterReceiver(it) } catch (_: IllegalArgumentException) {}
    }
    receiver = null
  }

  private fun emitDone(reason: String) =
    emit("SmsUserConsent:done", Arguments.createMap().apply { putString("reason", reason) })

  private fun emit(event: String, payload: Any) {
    if (!reactContext.hasActiveReactInstance()) return
    reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java).emit(event, payload)
  }

  companion object {
    const val NAME = "SmsUserConsent"
    private const val REQUEST_CODE = 0x5C0D
  }
}
