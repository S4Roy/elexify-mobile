package com.elexify

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.os.Build

/**
 * Android notification channels, created at startup so every push lands in
 * a named category the customer can control in system settings — e.g. mute
 * offers without losing delivery alerts. IDs must match what the backend
 * sends as android.notification.channel_id (elexify-backend
 * services/notification/push/fcm.js). A channel's importance can't be raised
 * after creation, so changing it means shipping a new channel ID.
 */
object NotificationChannels {
  const val ORDERS = "orders"
  const val ACCOUNT = "account"
  const val OFFERS = "offers"

  fun register(context: Context) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    val manager = context.getSystemService(NotificationManager::class.java) ?: return
    manager.createNotificationChannels(
        listOf(
            channel(
                ORDERS, "Order updates",
                "Confirmations, shipping, delivery, payments, refunds and returns",
                NotificationManager.IMPORTANCE_HIGH, Notification.VISIBILITY_PUBLIC),
            channel(
                ACCOUNT, "Account & security",
                "Sign-ins and changes to your account details",
                NotificationManager.IMPORTANCE_HIGH, Notification.VISIBILITY_PRIVATE),
            channel(
                OFFERS, "Offers & promotions",
                "Deals, price drops and products back in stock",
                NotificationManager.IMPORTANCE_DEFAULT, Notification.VISIBILITY_PUBLIC),
        ))
  }

  private fun channel(
      id: String,
      name: String,
      description: String,
      importance: Int,
      visibility: Int,
  ) =
      NotificationChannel(id, name, importance).apply {
        this.description = description
        lockscreenVisibility = visibility
        enableVibration(importance >= NotificationManager.IMPORTANCE_HIGH)
        setShowBadge(true)
      }
}
