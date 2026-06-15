package com.jiggag.rnkakaomaps;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.events.Event;

public class OnreoriKakaoMapChangeEvent extends Event<OnreoriKakaoMapChangeEvent> {
    private static final String EVENT_NAME = "topChange";

    @Nullable
    private final Double lat;
    @Nullable
    private final Double lng;
    @Nullable
    private final Integer zoomLevel;
    @Nullable
    private final String status;
    @Nullable
    private final String message;
    @Nullable
    private final String reason;

    public OnreoriKakaoMapChangeEvent(
            int surfaceId,
            int viewTag,
            double lat,
            double lng,
            int zoomLevel
    ) {
        super(surfaceId, viewTag);
        this.lat = lat;
        this.lng = lng;
        this.zoomLevel = zoomLevel;
        this.status = null;
        this.message = null;
        this.reason = null;
    }

    public OnreoriKakaoMapChangeEvent(
            int surfaceId,
            int viewTag,
            @NonNull String status,
            @Nullable String message,
            @Nullable String reason
    ) {
        super(surfaceId, viewTag);
        this.lat = null;
        this.lng = null;
        this.zoomLevel = null;
        this.status = status;
        this.message = message;
        this.reason = reason;
    }

    @NonNull
    @Override
    public String getEventName() {
        return EVENT_NAME;
    }

    @Override
    protected WritableMap getEventData() {
        WritableMap event = Arguments.createMap();

        if (lat != null) {
            event.putDouble("lat", lat);
        }
        if (lng != null) {
            event.putDouble("lng", lng);
        }
        if (zoomLevel != null) {
            event.putInt("zoomLevel", zoomLevel);
        }
        if (status != null) {
            event.putString("status", status);
        }
        if (message != null) {
            event.putString("message", message);
        }
        if (reason != null) {
            event.putString("reason", reason);
        }

        return event;
    }
}
