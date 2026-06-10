package com.jiggag.rnkakaomaps;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.ViewGroupManager;
import com.facebook.react.uimanager.annotations.ReactProp;

import java.util.Map;

public class OnreoriAndroidKakaoMapManager extends ViewGroupManager<OnreoriAndroidKakaoMapView> {
    public static final String REACT_CLASS = "OnreoriAndroidKakaoMapView";

    @NonNull
    @Override
    public String getName() {
        return REACT_CLASS;
    }

    @NonNull
    @Override
    protected OnreoriAndroidKakaoMapView createViewInstance(@NonNull ThemedReactContext reactContext) {
        return new OnreoriAndroidKakaoMapView(reactContext);
    }

    @Nullable
    @Override
    public Map<String, Object> getExportedCustomBubblingEventTypeConstants() {
        Map<String, Object> event = MapBuilder.of(
                "phasedRegistrationNames",
                MapBuilder.of("bubbled", "onChange")
        );
        return MapBuilder.of("topChange", event);
    }

    @Override
    public void onDropViewInstance(@NonNull OnreoriAndroidKakaoMapView root) {
        root.dispose();
        super.onDropViewInstance(root);
    }

    @ReactProp(name = "markerList")
    public void setMarkerList(OnreoriAndroidKakaoMapView view, @Nullable ReadableArray markerList) {
        view.setMarkerList(markerList);
    }

    @ReactProp(name = "centerPoint")
    public void setCenterPoint(OnreoriAndroidKakaoMapView view, @Nullable ReadableMap centerPoint) {
        view.setCenterPoint(centerPoint);
    }

    @ReactProp(name = "markerImageName")
    public void setMarkerImageName(OnreoriAndroidKakaoMapView view, @Nullable String markerImageName) {
        view.setMarkerImageName(markerImageName);
    }

    @ReactProp(name = "markerImageUrl")
    public void setMarkerImageUrl(OnreoriAndroidKakaoMapView view, @Nullable String markerImageUrl) {
        view.setMarkerImageUrl(markerImageUrl);
    }
}
