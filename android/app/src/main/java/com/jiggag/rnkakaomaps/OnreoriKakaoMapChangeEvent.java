package com.jiggag.rnkakaomaps;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.events.Event;

public class OnreoriKakaoMapChangeEvent extends Event<OnreoriKakaoMapChangeEvent> {
    private static final String EVENT_NAME = "topChange";

    private final double lat;
    private final double lng;
    private final int zoomLevel;

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
    }

    @NonNull
    @Override
    public String getEventName() {
        return EVENT_NAME;
    }

    @Override
    protected WritableMap getEventData() {
        WritableMap event = Arguments.createMap();
        event.putDouble("lat", lat);
        event.putDouble("lng", lng);
        event.putInt("zoomLevel", zoomLevel);
        return event;
    }
}
